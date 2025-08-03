import axios from 'axios';
import { NewsArticle, NewsSource } from '../types';

// Default News API key - in production, this should be in environment variables
const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY || 'demo_key';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Mock data for demo purposes
const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    title: 'Breaking: Major Tech Company Announces Revolutionary AI Product',
    description: 'A leading technology company has unveiled a groundbreaking artificial intelligence system that promises to transform how we interact with computers.',
    url: 'https://example.com/tech-ai-announcement',
    urlToImage: 'https://picsum.photos/800/400?random=1',
    publishedAt: new Date().toISOString(),
    source: { name: 'Tech News Daily' },
    author: 'Jane Smith',
    category: 'technology',
    popularity: 95,
    aiSummary: 'Major tech company launches revolutionary AI product with advanced capabilities for natural language processing and computer vision.'
  },
  {
    id: '2',
    title: 'Global Climate Summit Reaches Historic Agreement',
    description: 'World leaders have agreed on unprecedented measures to combat climate change at the annual summit.',
    url: 'https://example.com/climate-summit',
    urlToImage: 'https://picsum.photos/800/400?random=2',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: 'Environmental Times' },
    author: 'John Doe',
    category: 'environment',
    popularity: 88,
    aiSummary: 'Historic climate agreement reached with commitments from major nations to reduce emissions by 50% by 2030.'
  },
  {
    id: '3',
    title: 'Stock Market Hits Record High Amid Economic Recovery',
    description: 'Major indices reach all-time highs as investors show confidence in economic recovery prospects.',
    url: 'https://example.com/stock-market-high',
    urlToImage: 'https://picsum.photos/800/400?random=3',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: 'Financial Daily' },
    author: 'Mike Johnson',
    category: 'business',
    popularity: 82,
    aiSummary: 'Stock market reaches record levels driven by strong corporate earnings and positive economic indicators.'
  },
  {
    id: '4',
    title: 'Scientists Discover Potential Cure for Rare Disease',
    description: 'Breakthrough research shows promising results in treating a previously incurable genetic condition.',
    url: 'https://example.com/medical-breakthrough',
    urlToImage: 'https://picsum.photos/800/400?random=4',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: 'Medical Journal' },
    author: 'Dr. Sarah Lee',
    category: 'health',
    popularity: 76,
    aiSummary: 'Scientists achieve breakthrough in treating rare genetic disease using innovative gene therapy approach.'
  },
  {
    id: '5',
    title: 'Championship Finals: Underdog Team Claims Victory',
    description: 'In a stunning upset, the underdog team defeats the defending champions in the championship finals.',
    url: 'https://example.com/sports-championship',
    urlToImage: 'https://picsum.photos/800/400?random=5',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: 'Sports Weekly' },
    author: 'Tom Wilson',
    category: 'sports',
    popularity: 70,
    aiSummary: 'Underdog team wins championship in dramatic fashion, ending defending champions\' three-year streak.'
  }
];

export class NewsService {
  static async fetchNews(
    category?: string,
    sources?: NewsSource[],
    sortBy: 'latest' | 'popular' = 'latest'
  ): Promise<NewsArticle[]> {
    try {
      // For demo, return mock data
      let articles = [...MOCK_ARTICLES];
      
      // Filter by category if provided
      if (category && category !== 'all') {
        articles = articles.filter(article => article.category === category);
      }
      
      // Sort articles
      if (sortBy === 'popular') {
        articles.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      } else {
        articles.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      }
      
      return articles;
      
      // Real implementation would fetch from News API:
      /*
      const endpoint = category ? 'top-headlines' : 'everything';
      const params = {
        apiKey: NEWS_API_KEY,
        category: category || undefined,
        sortBy: sortBy === 'popular' ? 'popularity' : 'publishedAt',
        language: 'en',
        pageSize: 20
      };
      
      const response = await axios.get(`${NEWS_API_BASE_URL}/${endpoint}`, { params });
      
      return response.data.articles.map((article: any, index: number) => ({
        id: `${article.source.id || article.source.name}-${index}`,
        ...article,
        category: category || 'general',
        popularity: Math.floor(Math.random() * 100)
      }));
      */
    } catch (error) {
      console.error('Error fetching news:', error);
      // Return mock data as fallback
      return MOCK_ARTICLES;
    }
  }
  
  static async fetchFromCustomSource(source: NewsSource): Promise<NewsArticle[]> {
    // Implementation for fetching from custom sources
    // This would handle RSS feeds, custom APIs, etc.
    return [];
  }
  
  static async generateAISummary(article: NewsArticle): Promise<string> {
    // Mock AI summary generation
    // In production, this would call OpenAI API
    return article.aiSummary || `AI-generated summary: ${article.description?.substring(0, 100)}...`;
  }
}