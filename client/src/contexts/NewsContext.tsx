import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { NewsContextType, NewsArticle, NewsFilters, SearchFilters, NewsResponse, TrendingNews, SearchResults } from '../types';

interface NewsState {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  filters: NewsFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

type NewsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ARTICLES'; payload: NewsArticle[] }
  | { type: 'SET_FILTERS'; payload: NewsFilters }
  | { type: 'SET_PAGINATION'; payload: any }
  | { type: 'ADD_ARTICLES'; payload: NewsArticle[] }
  | { type: 'CLEAR_ERROR' };

const initialState: NewsState = {
  articles: [],
  loading: false,
  error: null,
  filters: {
    category: undefined,
    sort: 'latest',
    page: 1,
    limit: 20,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  },
};

const newsReducer = (state: NewsState, action: NewsAction): NewsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ARTICLES':
      return { ...state, articles: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload };
    case 'ADD_ARTICLES':
      return { ...state, articles: [...state.articles, ...action.payload] };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

interface NewsProviderProps {
  children: React.ReactNode;
}

export const NewsProvider: React.FC<NewsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(newsReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch news articles
  const fetchNews = async (filters?: NewsFilters) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get<NewsResponse>(`/api/news?${params.toString()}`);
      
      dispatch({ type: 'SET_ARTICLES', payload: response.data.news });
      dispatch({ type: 'SET_PAGINATION', payload: response.data.pagination });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch news';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fetch trending news
  const fetchTrending = async (): Promise<NewsArticle[]> => {
    try {
      const response = await axios.get<TrendingNews>('/api/news/trending');
      return response.data.trending;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch trending news');
    }
  };

  // Search news
  const searchNews = async (query: string, filters?: SearchFilters): Promise<NewsArticle[]> => {
    try {
      const params = new URLSearchParams({ q: query });
      if (filters?.category) params.append('category', filters.category);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);

      const response = await axios.get<SearchResults>(`/api/news/search?${params.toString()}`);
      return response.data.results;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to search news');
    }
  };

  // Set filters
  const setFilters = (filters: NewsFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  // Use React Query for caching
  const { data: categories } = useQuery(
    'categories',
    async () => {
      const response = await axios.get('/api/news/categories');
      return response.data.categories;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Fetch news when filters change
  useEffect(() => {
    fetchNews(state.filters);
  }, [state.filters.category, state.filters.sort, state.filters.page]);

  const value: NewsContextType = {
    articles: state.articles,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    setFilters,
    fetchNews,
    fetchTrending,
    searchNews,
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};