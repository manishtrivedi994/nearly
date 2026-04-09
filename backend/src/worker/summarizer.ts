import OpenAI from 'openai';
import type { RawItem, DigestItem, CityConfig, Category } from '../types.js';

// Exact system prompt from CLAUDE.md — do not shorten or paraphrase.
const SYSTEM_PROMPT = [
  'You are a local news editor. Given raw news items for a city, return a clean daily digest.',
  'Output ONLY a valid JSON array. No markdown, no explanation, no preamble.',
  'Each item must have: title (string), summary (5 sentences max), category (one of: civic/traffic/politics/weather/business/crime/culture), source_name (string), source_url (string), city_slug (string), relevance_score (float 0-1), area (string — a specific neighbourhood, locality, or district WITHIN the city (e.g. Connaught Place, Dwarka, Lajpat Nagar for Delhi). Set to null if no specific intra-city area is named, or if the place mentioned is outside the city such as another state, city, or country).',
  'Remove duplicates, promotional content, and national news not relevant to the city.',
  'Sort by relevance_score descending. Return 5-8 items maximum.',
].join('\n');

const VALID_CATEGORIES = new Set<Category>([
  'civic', 'traffic', 'politics', 'weather', 'business', 'crime', 'culture',
]);

const MAX_ITEMS_PER_CALL = 30;
const MAX_TOKENS = 1500;
const RETRY_DELAY_MS = 60_000;

function todayIST(): string {
  // en-CA locale produces YYYY-MM-DD without any string manipulation
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function buildUserPrompt(city: CityConfig, items: RawItem[], date: string): string {
  return (
    `City: ${city.display_name}\n` +
    `Date: ${date}\n` +
    `Raw items:\n${JSON.stringify(items.slice(0, MAX_ITEMS_PER_CALL))}`
  );
}

function validateItem(obj: unknown): obj is DigestItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const item = obj as Record<string, unknown>;
  const areaOk = !('area' in item) || item.area === null || typeof item.area === 'string';
  return (
    typeof item.title === 'string' && item.title.trim() !== '' &&
    typeof item.summary === 'string' && item.summary.trim() !== '' &&
    typeof item.category === 'string' && VALID_CATEGORIES.has(item.category as Category) &&
    typeof item.source_name === 'string' && item.source_name.trim() !== '' &&
    typeof item.source_url === 'string' &&
    typeof item.city_slug === 'string' && item.city_slug.trim() !== '' &&
    typeof item.relevance_score === 'number' &&
    item.relevance_score >= 0 &&
    item.relevance_score <= 1 &&
    areaOk
  );
}

async function callCerebras(city: CityConfig, batch: RawItem[], date: string): Promise<DigestItem[]> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) throw new Error('CEREBRAS_API_KEY env var is not set');

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.cerebras.ai/v1',
  });

  const response = await client.chat.completions.create({
    model: 'llama3.1-8b',
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(city, batch, date) },
    ],
  });

  const rawText = response.choices[0]?.message?.content ?? '';

  // Tolerate any preamble/postamble the model adds around the array
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Cerebras response contained no JSON array:\n${rawText}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Failed to parse Cerebras JSON:\n${jsonMatch[0]}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Parsed Cerebras response is not an array`);
  }

  const valid = parsed.filter(validateItem);
  const dropped = parsed.length - valid.length;
  if (dropped > 0) {
    console.warn(`[WARN] summarizeForCity ${city.slug}: dropped ${dropped} malformed item(s)`);
  }

  if (valid.length === 0) {
    throw new Error(`All ${parsed.length} item(s) from Cerebras failed field validation`);
  }

  return valid;
}

// Summarizes raw items for one city into a DigestItem[].
// Batches at MAX_ITEMS_PER_CALL. On failure retries once after 60s, then returns [].
export async function summarizeForCity(
  rawItems: RawItem[],
  city: CityConfig,
): Promise<DigestItem[]> {
  if (rawItems.length === 0) return [];

  const date = todayIST();

  const batches: RawItem[][] = [];
  for (let i = 0; i < rawItems.length; i += MAX_ITEMS_PER_CALL) {
    batches.push(rawItems.slice(i, i + MAX_ITEMS_PER_CALL));
  }

  const allItems: DigestItem[] = [];

  for (const batch of batches) {
    let items: DigestItem[];

    try {
      items = await callCerebras(city, batch, date);
    } catch (err) {
      const message = (err as Error).message;
      console.error(`[ERROR] summarizeForCity ${city.slug} first attempt:`, message);

      // 429: rate limit — retrying after 60s won't help if quota is daily
      if (message.includes('429') || message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota')) {
        console.error(`[ERROR] summarizeForCity ${city.slug}: rate limit hit, skipping`);
        return [];
      }

      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

      try {
        items = await callCerebras(city, batch, date);
      } catch (retryErr) {
        console.error(
          `[ERROR] summarizeForCity ${city.slug} retry failed:`,
          (retryErr as Error).message,
        );
        return []; // Save nothing for this run per CLAUDE.md
      }
    }

    allItems.push(...items);
  }

  // Multiple batches: re-sort merged results and cap at 8
  if (batches.length > 1) {
    return allItems.sort((a, b) => b.relevance_score - a.relevance_score).slice(0, 8);
  }

  return allItems;
}
