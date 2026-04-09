import type { CityConfig } from '../types.js';

const cities: CityConfig[] = [
  // ─── Original cities (tier 1) ──────────────────────────────────────────────
  {
    slug: 'bangalore',
    display_name: 'Bangalore',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Bangalore city news', language: 'en' },
      { type: 'rss', url: 'https://www.thehindu.com/news/cities/bangalore/feeder/default.rss', name: 'The Hindu Blr' },
    ],
  },
  {
    slug: 'delhi',
    display_name: 'Delhi',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Delhi city news', language: 'en' },
      { type: 'rss', url: 'https://timesofindia.indiatimes.com/rssfeeds/2647163.cms', name: 'TOI Delhi' },
    ],
  },
  {
    slug: 'mumbai',
    display_name: 'Mumbai',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Mumbai city news', language: 'en' },
      { type: 'rss', url: 'https://www.mid-day.com/rss/news', name: 'Mid-Day' },
    ],
  },
  {
    slug: 'chennai',
    display_name: 'Chennai',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Chennai city news', language: 'en' },
      { type: 'rss', url: '', name: 'Chennai Local News' },
    ],
  },
  {
    slug: 'hyderabad',
    display_name: 'Hyderabad',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Hyderabad city news', language: 'en' },
      { type: 'rss', url: '', name: 'Hyderabad Local News' },
    ],
  },

  // ─── Original cities (tier 3) ──────────────────────────────────────────────
  {
    slug: 'mysuru',
    display_name: 'Mysuru',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Mysuru city news', language: 'en' },
    ],
  },
  {
    slug: 'mangaluru',
    display_name: 'Mangaluru',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Mangaluru city news', language: 'en' },
    ],
  },
  {
    slug: 'hubli-dharwad',
    display_name: 'Hubli-Dharwad',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Hubli-Dharwad city news', language: 'en' },
    ],
  },

  // ─── South India ───────────────────────────────────────────────────────────
  {
    slug: 'coimbatore',
    display_name: 'Coimbatore',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Coimbatore city news', language: 'en' },
      { type: 'rss', url: '', name: 'Coimbatore Local News' },
    ],
  },
  {
    slug: 'kochi',
    display_name: 'Kochi',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Kochi city news', language: 'en' },
      { type: 'rss', url: '', name: 'Kochi Local News' },
    ],
  },
  {
    slug: 'thiruvananthapuram',
    display_name: 'Thiruvananthapuram',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Thiruvananthapuram city news', language: 'en' },
      { type: 'rss', url: '', name: 'Thiruvananthapuram Local News' },
    ],
  },
  {
    slug: 'visakhapatnam',
    display_name: 'Visakhapatnam',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Visakhapatnam city news', language: 'en' },
      { type: 'rss', url: '', name: 'Visakhapatnam Local News' },
    ],
  },
  {
    slug: 'madurai',
    display_name: 'Madurai',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Madurai city news', language: 'en' },
    ],
  },
  {
    slug: 'vijayawada',
    display_name: 'Vijayawada',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Vijayawada city news', language: 'en' },
    ],
  },

  // ─── West India ────────────────────────────────────────────────────────────
  {
    slug: 'pune',
    display_name: 'Pune',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Pune city news', language: 'en' },
      { type: 'rss', url: '', name: 'Pune Local News' },
    ],
  },
  {
    slug: 'ahmedabad',
    display_name: 'Ahmedabad',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Ahmedabad city news', language: 'en' },
      { type: 'rss', url: '', name: 'Ahmedabad Local News' },
    ],
  },
  {
    slug: 'surat',
    display_name: 'Surat',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Surat city news', language: 'en' },
      { type: 'rss', url: '', name: 'Surat Local News' },
    ],
  },
  {
    slug: 'nagpur',
    display_name: 'Nagpur',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Nagpur city news', language: 'en' },
      { type: 'rss', url: '', name: 'Nagpur Local News' },
    ],
  },
  {
    slug: 'nashik',
    display_name: 'Nashik',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Nashik city news', language: 'en' },
      { type: 'rss', url: '', name: 'Nashik Local News' },
    ],
  },
  {
    slug: 'vadodara',
    display_name: 'Vadodara',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Vadodara city news', language: 'en' },
      { type: 'rss', url: '', name: 'Vadodara Local News' },
    ],
  },
  {
    slug: 'rajkot',
    display_name: 'Rajkot',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Rajkot city news', language: 'en' },
    ],
  },
  {
    slug: 'aurangabad',
    display_name: 'Aurangabad',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Aurangabad city news', language: 'en' },
    ],
  },

  // ─── North India ───────────────────────────────────────────────────────────
  {
    slug: 'lucknow',
    display_name: 'Lucknow',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Lucknow city news', language: 'en' },
      { type: 'rss', url: '', name: 'Lucknow Local News' },
    ],
  },
  {
    slug: 'jaipur',
    display_name: 'Jaipur',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Jaipur city news', language: 'en' },
      { type: 'rss', url: '', name: 'Jaipur Local News' },
    ],
  },
  {
    slug: 'kanpur',
    display_name: 'Kanpur',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Kanpur city news', language: 'en' },
      { type: 'rss', url: '', name: 'Kanpur Local News' },
    ],
  },
  {
    slug: 'varanasi',
    display_name: 'Varanasi',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Varanasi city news', language: 'en' },
      { type: 'rss', url: '', name: 'Varanasi Local News' },
    ],
  },
  {
    slug: 'agra',
    display_name: 'Agra',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Agra city news', language: 'en' },
      { type: 'rss', url: '', name: 'Agra Local News' },
    ],
  },
  {
    slug: 'chandigarh',
    display_name: 'Chandigarh',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Chandigarh city news', language: 'en' },
      { type: 'rss', url: '', name: 'Chandigarh Local News' },
    ],
  },
  {
    slug: 'jodhpur',
    display_name: 'Jodhpur',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Jodhpur city news', language: 'en' },
    ],
  },
  {
    slug: 'amritsar',
    display_name: 'Amritsar',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Amritsar city news', language: 'en' },
    ],
  },

  // ─── East India ────────────────────────────────────────────────────────────
  {
    slug: 'kolkata',
    display_name: 'Kolkata',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Kolkata city news', language: 'en' },
      { type: 'rss', url: '', name: 'Kolkata Local News' },
    ],
  },
  {
    slug: 'bhubaneswar',
    display_name: 'Bhubaneswar',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Bhubaneswar city news', language: 'en' },
      { type: 'rss', url: '', name: 'Bhubaneswar Local News' },
    ],
  },
  {
    slug: 'patna',
    display_name: 'Patna',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Patna city news', language: 'en' },
      { type: 'rss', url: '', name: 'Patna Local News' },
    ],
  },
  {
    slug: 'ranchi',
    display_name: 'Ranchi',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Ranchi city news', language: 'en' },
      { type: 'rss', url: '', name: 'Ranchi Local News' },
    ],
  },
  {
    slug: 'guwahati',
    display_name: 'Guwahati',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Guwahati city news', language: 'en' },
      { type: 'rss', url: '', name: 'Guwahati Local News' },
    ],
  },

  // ─── Central India ─────────────────────────────────────────────────────────
  {
    slug: 'indore',
    display_name: 'Indore',
    tier: 1,
    sources: [
      { type: 'newsapi', query: 'Indore city news', language: 'en' },
      { type: 'rss', url: '', name: 'Indore Local News' },
    ],
  },
  {
    slug: 'bhopal',
    display_name: 'Bhopal',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Bhopal city news', language: 'en' },
      { type: 'rss', url: '', name: 'Bhopal Local News' },
    ],
  },
  {
    slug: 'raipur',
    display_name: 'Raipur',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Raipur city news', language: 'en' },
      { type: 'rss', url: '', name: 'Raipur Local News' },
    ],
  },
  {
    slug: 'jabalpur',
    display_name: 'Jabalpur',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Jabalpur city news', language: 'en' },
    ],
  },

  // ─── NCR & Satellite ───────────────────────────────────────────────────────
  {
    slug: 'noida',
    display_name: 'Noida',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Noida city news', language: 'en' },
      { type: 'rss', url: '', name: 'Noida Local News' },
    ],
  },
  {
    slug: 'gurgaon',
    display_name: 'Gurgaon',
    tier: 2,
    sources: [
      { type: 'newsapi', query: 'Gurgaon city news', language: 'en' },
      { type: 'rss', url: '', name: 'Gurgaon Local News' },
    ],
  },
  {
    slug: 'faridabad',
    display_name: 'Faridabad',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Faridabad city news', language: 'en' },
    ],
  },
  {
    slug: 'ghaziabad',
    display_name: 'Ghaziabad',
    tier: 3,
    sources: [
      { type: 'newsapi', query: 'Ghaziabad city news', language: 'en' },
    ],
  },
];

export default cities;
