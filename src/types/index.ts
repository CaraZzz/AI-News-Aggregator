export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: NewsSource;
  category: NewsCategory;
  author?: string;
  aiSummary?: string;
  popularity?: number;
}

export interface NewsSource {
  id: string;
  name: string;
  description?: string;
  url: string;
  category?: string;
  language?: string;
  country?: string;
  isCustom?: boolean;
  type: 'api' | 'rss' | 'podcast' | 'newsletter';
  apiKey?: string;
  rssUrl?: string;
}

export enum NewsCategory {
  GENERAL = 'general',
  BUSINESS = 'business',
  ENTERTAINMENT = 'entertainment',
  HEALTH = 'health',
  SCIENCE = 'science',
  SPORTS = 'sports',
  TECHNOLOGY = 'technology',
  POLITICS = 'politics',
  WORLD = 'world'
}

export enum SortOption {
  POPULARITY = 'popularity',
  LATEST = 'publishedAt',
  RELEVANCY = 'relevancy'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CustomSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'podcast' | 'newsletter';
  apiKey?: string;
  headers?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  lastFetched?: Date;
}

export interface AppState {
  articles: NewsArticle[];
  sources: NewsSource[];
  customSources: CustomSource[];
  selectedCategory: NewsCategory | 'all';
  sortBy: SortOption;
  isLoading: boolean;
  error?: string;
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
}