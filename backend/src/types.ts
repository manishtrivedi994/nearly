export type Category = 'civic' | 'traffic' | 'politics' | 'weather' | 'business' | 'crime' | 'culture';

export interface DigestItem {
  title: string;
  summary: string;
  category: Category;
  source_name: string;
  source_url: string;
  city_slug: string;
  relevance_score: number;
}

export interface NewsApiSourceConfig {
  type: 'newsapi';
  query: string;
  language: string;
}

export interface RssSourceConfig {
  type: 'rss';
  url: string;
  name: string;
}

export type SourceConfig = NewsApiSourceConfig | RssSourceConfig;

export interface CityConfig {
  slug: string;
  display_name: string;
  sources: SourceConfig[];
}

export interface RawItem {
  city_slug: string;
  source_type: 'newsapi' | 'rss' | 'twitter';
  source_name: string;
  title: string;
  url: string | null;
  raw_text: string | null;
  content_hash: string;
}
