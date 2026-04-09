import type { CityConfig } from '../types.js';

const cities: CityConfig[] = [
  {
    slug: 'bangalore',
    display_name: 'Bangalore',
    sources: [
      { type: 'newsapi', query: 'Bangalore city news', language: 'en' },
      { type: 'rss', url: 'https://www.thehindu.com/news/cities/bangalore/feeder/default.rss', name: 'The Hindu Blr' },
    ],
  },
  {
    slug: 'delhi',
    display_name: 'Delhi',
    sources: [
      { type: 'newsapi', query: 'Delhi city news', language: 'en' },
      { type: 'rss', url: 'https://timesofindia.indiatimes.com/rssfeeds/2647163.cms', name: 'TOI Delhi' },
    ],
  },
  {
    slug: 'mumbai',
    display_name: 'Mumbai',
    sources: [
      { type: 'newsapi', query: 'Mumbai city news', language: 'en' },
      { type: 'rss', url: 'https://www.mid-day.com/rss/news', name: 'Mid-Day' },
    ],
  },
  {
    slug: 'chennai',
    display_name: 'Chennai',
    sources: [
      { type: 'newsapi', query: 'Chennai city news', language: 'en' },
      { type: 'rss', url: 'TBD', name: 'Hindu Chennai' },
      { type: 'rss', url: 'TBD', name: 'Times of India' },
    ],
  },
  {
    slug: 'hyderabad',
    display_name: 'Hyderabad',
    sources: [
      { type: 'newsapi', query: 'Hyderabad city news', language: 'en' },
      { type: 'rss', url: 'TBD', name: 'Deccan Chronicle' },
      { type: 'rss', url: 'TBD', name: 'Hans India' },
    ],
  },
  {
    slug: 'mysuru',
    display_name: 'Mysuru',
    sources: [
      { type: 'newsapi', query: 'Mysuru city news', language: 'en' },
      { type: 'rss', url: 'TBD', name: 'Star of Mysore RSS' },
      { type: 'rss', url: 'TBD', name: 'Mysuru Today' },
    ],
  },
  {
    slug: 'mangaluru',
    display_name: 'Mangaluru',
    sources: [
      { type: 'newsapi', query: 'Mangaluru city news', language: 'en' },
      { type: 'rss', url: 'TBD', name: 'Daijiworld RSS' },
      { type: 'rss', url: 'TBD', name: 'Udayavani' },
    ],
  },
];

export default cities;
