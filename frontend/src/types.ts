export type Category =
  | 'civic'
  | 'traffic'
  | 'politics'
  | 'weather'
  | 'business'
  | 'crime'
  | 'culture';

export interface DigestItem {
  title: string;
  summary: string;
  category: Category;
  source_name: string;
  source_url: string;
  city_slug: string;
  relevance_score: number;
  area?: string | null;  // most specific neighbourhood mentioned, null = city-wide
}

export interface City {
  slug: string;
  display_name: string;
}

export interface DigestResponse {
  city: string;        // city_slug
  date: string;        // YYYY-MM-DD
  generated_at: string;
  items: DigestItem[];
}

export interface SearchResultItem {
  item: DigestItem;
  date: string;        // YYYY-MM-DD
  city_slug: string;
}
