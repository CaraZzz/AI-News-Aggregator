import axios from 'axios';
import Parser from 'rss-parser';
import { NewsArticle, NewsSource, NewsCategory, CustomSource } from '@/types';

const parser = new Parser({
  customFields: {
    item: ['pubDate', 'dc:creator', 'author']
  }
});

export class NewsService {
  private static instance: NewsService;
  private readonly NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  private readonly NEWS_API_URL = 'https://newsapi.org/v2';

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  // Default news sources (major RSS feeds as fallbacks)
  private defaultRSSFeeds: NewsSource[] = [
    {
      id: 'bbc-news',
      name: 'BBC News',
      url: 'https://www.bbc.com',
      type: 'rss',
      rssUrl: 'http://feeds.bbci.co.uk/news/rss.xml'
    },
    {
      id: 'cnn',
      name: 'CNN',
      url: 'https://www.cnn.com',
      type: 'rss',
      rssUrl: 'http://rss.cnn.com/rss/edition.rss'
    },
    {
      id: 'reuters',
      name: 'Reuters',
      url: 'https://www.reuters.com',
      type: 'rss',
      rssUrl: 'https://feeds.reuters.com/reuters/topNews'
    },
    {
      id: 'techcrunch',
      name: 'TechCrunch',
      url: 'https://techcrunch.com',
      type: 'rss',
      rssUrl: 'https://techcrunch.com/feed/',
      category: 'technology'
    },
    {
      id: 'hacker-news',
      name: 'Hacker News',
      url: 'https://news.ycombinator.com',
      type: 'rss',
      rssUrl: 'https://hnrss.org/frontpage',
      category: 'technology'
    }
  ];

  async fetchNewsFromAPI(category?: NewsCategory, pageSize: number = 20): Promise<NewsArticle[]> {
    if (!this.NEWS_API_KEY) {
      console.warn('News API key not found, falling back to RSS feeds');
      return this.fetchFromRSSFeeds(category);
    }

    try {
      const url = category && category !== 'general' 
        ? `${this.NEWS_API_URL}/top-headlines`
        : `${this.NEWS_API_URL}/everything`;
      
      const params: any = {
        apiKey: this.NEWS_API_KEY,
        pageSize,
        language: 'en'
      };

      if (category && category !== 'general') {
        params.category = category;
        params.country = 'us';
      } else {
        params.q = 'latest news';
        params.sortBy = 'publishedAt';
      }

      const response = await axios.get(url, { params });
      
      return response.data.articles.map((article: any) => ({
        id: this.generateId(article.url),
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        author: article.author,
        source: {
          id: article.source.id || 'unknown',
          name: article.source.name,
          url: article.url,
          type: 'api' as const
        },
        category: this.mapToCategory(category || article.category),
        popularity: Math.floor(Math.random() * 100) // Simulated popularity score
      }));
    } catch (error) {
      console.error('Error fetching from News API:', error);
      return this.fetchFromRSSFeeds(category);
    }
  }

  async fetchFromRSSFeeds(category?: NewsCategory): Promise<NewsArticle[]> {
    const relevantFeeds = category 
      ? this.defaultRSSFeeds.filter(feed => !feed.category || feed.category === category)
      : this.defaultRSSFeeds;

    const allArticles: NewsArticle[] = [];

    await Promise.all(relevantFeeds.map(async (feed) => {
      try {
        const corsProxy = 'https://cors-anywhere.herokuapp.com/';
        const feedData = await parser.parseURL(corsProxy + feed.rssUrl);
        
        const articles = feedData.items.slice(0, 10).map(item => ({
          id: this.generateId(item.link || ''),
          title: item.title || '',
          description: item.contentSnippet || item.summary || '',
          content: item.content,
          url: item.link || '',
          urlToImage: this.extractImageFromContent(item.content || item.contentSnippet || ''),
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          author: item.creator || item.author,
          source: feed,
          category: this.mapToCategory(feed.category || 'general'),
          popularity: Math.floor(Math.random() * 100)
        }));

        allArticles.push(...articles);
      } catch (error) {
        console.error(`Error fetching RSS feed ${feed.name}:`, error);
      }
    }));

    return allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  async fetchFromCustomSource(source: CustomSource): Promise<NewsArticle[]> {
    try {
      if (source.type === 'rss') {
        const corsProxy = 'https://cors-anywhere.herokuapp.com/';
        const feedData = await parser.parseURL(corsProxy + source.url);
        
        return feedData.items.slice(0, 20).map(item => ({
          id: this.generateId(item.link || ''),
          title: item.title || '',
          description: item.contentSnippet || item.summary || '',
          content: item.content,
          url: item.link || '',
          urlToImage: this.extractImageFromContent(item.content || ''),
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          author: item.creator || item.author,
          source: {
            id: source.id,
            name: source.name,
            url: source.url,
            type: source.type,
            isCustom: true
          },
          category: NewsCategory.GENERAL,
          popularity: Math.floor(Math.random() * 100)
        }));
      } else if (source.type === 'api') {
        const headers = source.headers || {};
        if (source.apiKey) {
          headers['Authorization'] = `Bearer ${source.apiKey}`;
        }

        const response = await axios.get(source.url, { headers });
        // This would need to be customized based on the API structure
        return this.parseCustomAPIResponse(response.data, source);
      }
    } catch (error) {
      console.error(`Error fetching from custom source ${source.name}:`, error);
    }
    
    return [];
  }

  private parseCustomAPIResponse(data: any, source: CustomSource): NewsArticle[] {
    // This is a generic parser - would need customization for different APIs
    const articles = Array.isArray(data) ? data : data.articles || data.items || [];
    
    return articles.slice(0, 20).map((item: any, index: number) => ({
      id: this.generateId(item.url || item.link || `${source.id}-${index}`),
      title: item.title || item.headline || 'No title',
      description: item.description || item.summary || item.excerpt || '',
      url: item.url || item.link || '',
      urlToImage: item.image || item.thumbnail || item.urlToImage,
      publishedAt: item.publishedAt || item.published || item.date || new Date().toISOString(),
      author: item.author || item.creator,
      source: {
        id: source.id,
        name: source.name,
        url: source.url,
        type: source.type,
        isCustom: true
      },
      category: NewsCategory.GENERAL,
      popularity: Math.floor(Math.random() * 100)
    }));
  }

  private generateId(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private mapToCategory(category?: string): NewsCategory {
    if (!category) return NewsCategory.GENERAL;
    
    const categoryMap: Record<string, NewsCategory> = {
      'business': NewsCategory.BUSINESS,
      'entertainment': NewsCategory.ENTERTAINMENT,
      'health': NewsCategory.HEALTH,
      'science': NewsCategory.SCIENCE,
      'sports': NewsCategory.SPORTS,
      'technology': NewsCategory.TECHNOLOGY,
      'politics': NewsCategory.POLITICS,
      'world': NewsCategory.WORLD
    };

    return categoryMap[category.toLowerCase()] || NewsCategory.GENERAL;
  }

  private extractImageFromContent(content: string): string | undefined {
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : undefined;
  }

  getDefaultSources(): NewsSource[] {
    return this.defaultRSSFeeds;
  }
}