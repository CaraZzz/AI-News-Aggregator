export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id?: string;
    name: string;
  };
  author?: string;
  category?: string;
  aiSummary?: string;
  popularity?: number;
}

export interface NewsSource {
  id: string;
  name: string;
  type: 'api' | 'rss' | 'custom' | 'podcast' | 'newsletter';
  url: string;
  apiKey?: string;
  isActive: boolean;
  addedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export type SortOption = 'latest' | 'popular';