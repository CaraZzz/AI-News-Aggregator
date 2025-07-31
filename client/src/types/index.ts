export interface NewsArticle {
  id?: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source: string;
  category: string;
  publishedAt: Date;
  author?: string;
  content?: string;
  popularity?: number;
  summary?: string;
  analysis?: string;
}

export interface NewsResponse {
  news: NewsArticle[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface CustomSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'website' | 'podcast' | 'newsletter';
  category: string;
  status: 'active' | 'inactive' | 'error';
  lastChecked: string;
  testResult?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AISummary {
  summary: string;
  originalTitle: string;
  url: string;
  generatedAt: string;
}

export interface AIAnalysis {
  analysis: string;
  originalTitle: string;
  category: string;
  analyzedAt: string;
}

export interface SearchFilters {
  category?: string;
  dateRange?: string;
  source?: string;
  sortBy?: 'relevance' | 'date' | 'popularity';
}

export interface NewsFilters {
  category?: string;
  sort?: 'latest' | 'popularity';
  page?: number;
  limit?: number;
}

export interface TrendingNews {
  trending: NewsArticle[];
}

export interface SearchResults {
  results: NewsArticle[];
  query: string;
  totalResults: number;
}

export interface NewsContextType {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  filters: NewsFilters;
  setFilters: (filters: NewsFilters) => void;
  fetchNews: (filters?: NewsFilters) => Promise<void>;
  fetchTrending: () => Promise<NewsArticle[]>;
  searchNews: (query: string, filters?: SearchFilters) => Promise<NewsArticle[]>;
}

export interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  generateSummary: (article: NewsArticle) => Promise<AISummary>;
  analyzeArticle: (article: NewsArticle) => Promise<AIAnalysis>;
}

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NewsSource {
  name: string;
  url: string;
  apiKey?: string;
  category?: string;
}

export interface NewsSources {
  general: NewsSource[];
  categories: {
    [key: string]: NewsSource[];
  };
}