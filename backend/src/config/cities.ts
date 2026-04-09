import type { CityConfig } from '../types.js';

const cities: CityConfig[] = [
  {
    slug: 'bangalore',
    display_name: 'Bangalore',
    sources: [
      { type: 'newsapi', query: 'Bangalore city news', language: 'en' },
      { type: 'rss', url: 'https://bangaloremirror.indiatimes.com/rss.cms', name: 'Bangalore Mirror' },
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
];

export default cities;
