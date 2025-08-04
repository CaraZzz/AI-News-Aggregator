const axios = require('axios');
const Parser = require('rss-parser');
const cheerio = require('cheerio');
const NewsArticle = require('../models/NewsArticle');
const CustomSource = require('../models/CustomSource');
const aiService = require('./aiService');
const sanitizeHtml = require('sanitize-html');

class NewsFetcher {
  constructor() {
    this.rssParser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media'],
          ['media:thumbnail', 'mediaThumbnail'],
          ['enclosure', 'enclosure'],
          ['dc:creator', 'creator'],
          ['content:encoded', 'contentEncoded']
        ]
      }
    });
  }

  // Fetch from NewsAPI.org
  async fetchFromNewsAPI(params = {}) {
    try {
      const { category = 'general', country = 'us', pageSize = 20, page = 1 } = params;
      const apiKey = process.env.NEWS_API_KEY;
      
      if (!apiKey) {
        console.error('NewsAPI key not configured');
        return [];
      }

      const url = `https://newsapi.org/v2/top-headlines`;
      const response = await axios.get(url, {
        params: {
          apiKey,
          category,
          country,
          pageSize,
          page
        }
      });

      return this.normalizeArticles(response.data.articles, 'NewsAPI', category);
    } catch (error) {
      console.error('Error fetching from NewsAPI:', error.message);
      return [];
    }
  }

  // Fetch from The Guardian
  async fetchFromGuardian(params = {}) {
    try {
      const { section = 'world', pageSize = 20, page = 1 } = params;
      const apiKey = process.env.GUARDIAN_API_KEY;
      
      if (!apiKey) {
        console.error('Guardian API key not configured');
        return [];
      }

      const url = `https://content.guardianapis.com/search`;
      const response = await axios.get(url, {
        params: {
          'api-key': apiKey,
          section,
          'page-size': pageSize,
          page,
          'show-fields': 'all',
          'show-tags': 'all'
        }
      });

      const articles = response.data.response.results.map(article => ({
        title: article.webTitle,
        description: article.fields?.trailText || article.fields?.bodyText?.substring(0, 200),
        url: article.webUrl,
        urlToImage: article.fields?.thumbnail,
        publishedAt: article.webPublicationDate,
        author: article.tags?.[0]?.webTitle,
        content: article.fields?.bodyText
      }));

      return this.normalizeArticles(articles, 'The Guardian', this.mapGuardianCategory(section));
    } catch (error) {
      console.error('Error fetching from Guardian:', error.message);
      return [];
    }
  }

  // Fetch from RSS feeds
  async fetchFromRSS(feedUrl, sourceName, category = 'other') {
    try {
      const feed = await this.rssParser.parseURL(feedUrl);
      
      const articles = feed.items.map(item => ({
        title: item.title,
        description: item.contentSnippet || item.content || item.summary,
        url: item.link,
        urlToImage: this.extractImageFromRSS(item),
        publishedAt: item.pubDate || item.isoDate,
        author: item.creator || item.author || feed.title,
        content: item.contentEncoded || item.content
      }));

      return this.normalizeArticles(articles, sourceName, category);
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error.message);
      return [];
    }
  }

  // Fetch from custom API sources
  async fetchFromCustomAPI(source) {
    try {
      const { url, apiConfig } = source;
      const requestConfig = {
        method: apiConfig.method || 'GET',
        url,
        headers: apiConfig.headers ? Object.fromEntries(apiConfig.headers) : {},
        params: apiConfig.params ? Object.fromEntries(apiConfig.params) : {}
      };

      const response = await axios(requestConfig);
      const articles = this.extractArticlesFromResponse(response.data, apiConfig.responseMapping);
      
      return this.normalizeArticles(articles, source.name, source.category);
    } catch (error) {
      console.error(`Error fetching from custom API ${source.name}:`, error.message);
      await source.recordError(error);
      return [];
    }
  }

  // Fetch from all configured sources
  async fetchAllSources() {
    const results = [];
    
    // Fetch from built-in news APIs
    const newsAPIPromises = [
      this.fetchFromNewsAPI({ category: 'technology' }),
      this.fetchFromNewsAPI({ category: 'business' }),
      this.fetchFromNewsAPI({ category: 'health' }),
      this.fetchFromNewsAPI({ category: 'science' }),
      this.fetchFromNewsAPI({ category: 'sports' }),
      this.fetchFromNewsAPI({ category: 'entertainment' })
    ];

    const guardianPromises = [
      this.fetchFromGuardian({ section: 'technology' }),
      this.fetchFromGuardian({ section: 'business' }),
      this.fetchFromGuardian({ section: 'world' })
    ];

    // Fetch from custom sources
    const customSources = await CustomSource.find({ isActive: true });
    const customPromises = customSources.map(source => {
      if (source.needsFetching()) {
        switch (source.type) {
          case 'rss':
            return this.fetchFromRSS(source.url, source.name, source.category);
          case 'api':
            return this.fetchFromCustomAPI(source);
          case 'podcast':
            return this.fetchFromPodcast(source);
          default:
            return Promise.resolve([]);
        }
      }
      return Promise.resolve([]);
    });

    // Execute all fetches in parallel
    const allPromises = [...newsAPIPromises, ...guardianPromises, ...customPromises];
    const allResults = await Promise.allSettled(allPromises);
    
    // Collect successful results
    allResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        results.push(...result.value);
      }
    });

    // Save to database
    await this.saveArticles(results);
    
    return results;
  }

  // Normalize articles to consistent format
  normalizeArticles(articles, sourceName, category) {
    return articles.map(article => ({
      title: this.cleanText(article.title),
      description: this.cleanText(article.description),
      content: this.cleanText(article.content),
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: new Date(article.publishedAt),
      source: {
        name: sourceName,
        type: 'api'
      },
      author: article.author,
      category: category || 'other'
    })).filter(article => article.title && article.url);
  }

  // Save articles to database
  async saveArticles(articles) {
    const savedArticles = [];
    
    for (const article of articles) {
      try {
        // Check if article already exists
        const existing = await NewsArticle.findOne({ url: article.url });
        if (existing) continue;

        // Auto-categorize if needed
        if (article.category === 'other') {
          article.category = await aiService.categorizeArticle(article);
        }

        // Create new article
        const newArticle = new NewsArticle(article);
        await newArticle.save();
        savedArticles.push(newArticle);

        // Generate AI summary in background
        this.generateSummaryInBackground(newArticle);
      } catch (error) {
        console.error('Error saving article:', error.message);
      }
    }

    console.log(`Saved ${savedArticles.length} new articles`);
    return savedArticles;
  }

  // Generate AI summary in background
  async generateSummaryInBackground(article) {
    try {
      const summary = await aiService.generateSummary(article);
      article.aiSummary = {
        ...summary,
        generatedAt: new Date()
      };
      article.sentiment = summary.sentiment;
      await article.save();
    } catch (error) {
      console.error('Error generating summary:', error.message);
    }
  }

  // Helper methods
  extractImageFromRSS(item) {
    if (item.enclosure?.url) return item.enclosure.url;
    if (item.media?.url) return item.media.url;
    if (item.mediaThumbnail?.url) return item.mediaThumbnail.url;
    
    // Try to extract from content
    if (item.content || item.contentEncoded) {
      const $ = cheerio.load(item.content || item.contentEncoded);
      const img = $('img').first();
      if (img.attr('src')) return img.attr('src');
    }
    
    return null;
  }

  extractArticlesFromResponse(data, mapping) {
    // Navigate to articles array using dot notation
    let articles = data;
    if (mapping.articles) {
      const path = mapping.articles.split('.');
      for (const key of path) {
        articles = articles[key];
        if (!articles) return [];
      }
    }

    if (!Array.isArray(articles)) return [];

    return articles.map(item => {
      const article = {};
      Object.entries(mapping).forEach(([field, path]) => {
        if (field !== 'articles' && path) {
          article[field] = this.getNestedValue(item, path);
        }
      });
      return article;
    });
  }

  getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      value = value[key];
      if (value === undefined) return null;
    }
    return value;
  }

  cleanText(text) {
    if (!text) return '';
    return sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {}
    }).trim();
  }

  mapGuardianCategory(section) {
    const categoryMap = {
      'technology': 'technology',
      'business': 'business',
      'sport': 'sports',
      'science': 'science',
      'lifeandstyle': 'lifestyle',
      'world': 'world',
      'politics': 'politics',
      'culture': 'entertainment',
      'film': 'entertainment',
      'music': 'entertainment',
      'health': 'health'
    };
    return categoryMap[section] || 'other';
  }

  // Fetch podcasts (basic implementation)
  async fetchFromPodcast(source) {
    try {
      // Podcasts are typically RSS feeds with enclosures
      const feed = await this.rssParser.parseURL(source.url);
      
      const episodes = feed.items.map(item => ({
        title: item.title,
        description: item.contentSnippet || item.content,
        url: item.enclosure?.url || item.link,
        urlToImage: item.itunes?.image || feed.image?.url,
        publishedAt: item.pubDate || item.isoDate,
        author: item.creator || feed.title,
        content: item.content,
        isPodcast: true,
        duration: item.itunes?.duration
      }));

      return this.normalizeArticles(episodes, source.name, source.category);
    } catch (error) {
      console.error(`Error fetching podcast ${source.name}:`, error.message);
      return [];
    }
  }
}

// Create singleton instance
const newsFetcher = new NewsFetcher();

module.exports = newsFetcher;