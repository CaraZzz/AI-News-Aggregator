const express = require('express');
const router = express.Router();
const NewsArticle = require('../models/NewsArticle');
const cacheManager = require('../utils/cache');
const newsFetcher = require('../utils/newsFetcher');
const aiService = require('../utils/aiService');

// Get news articles with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      category,
      source,
      page = 1,
      limit = 20,
      sort = 'latest', // latest, popular, trending
      search,
      startDate,
      endDate
    } = req.query;

    // Check cache first
    const cacheKey = cacheManager.newsKey({ category, source, page, limit, sort });
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Build query
    const query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (source) {
      query['source.name'] = source;
    }
    if (search) {
      query.$text = { $search: search };
    }
    if (startDate || endDate) {
      query.publishedAt = {};
      if (startDate) query.publishedAt.$gte = new Date(startDate);
      if (endDate) query.publishedAt.$lte = new Date(endDate);
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'popular':
        sortOptions = { 'popularity.score': -1, publishedAt: -1 };
        break;
      case 'trending':
        // Get articles from last 24 hours sorted by popularity
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        query.publishedAt = { $gte: twentyFourHoursAgo };
        sortOptions = { 'popularity.score': -1 };
        break;
      case 'latest':
      default:
        sortOptions = { publishedAt: -1 };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const articles = await NewsArticle
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await NewsArticle.countDocuments(query);

    const response = {
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache the response
    await cacheManager.set(cacheKey, response, 300); // Cache for 5 minutes

    res.json(response);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news articles' });
  }
});

// Get trending articles by category
router.get('/trending', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    // Check cache
    const cacheKey = cacheManager.trendingKey(category);
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const articles = await NewsArticle.findTrending(limit, category);
    
    // Cache for 15 minutes
    await cacheManager.set(cacheKey, articles, 900);

    res.json(articles);
  } catch (error) {
    console.error('Error fetching trending news:', error);
    res.status(500).json({ error: 'Failed to fetch trending articles' });
  }
});

// Get article by ID
router.get('/article/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache
    const cacheKey = cacheManager.articleKey(id);
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const article = await NewsArticle.findById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment view count
    article.popularity.views += 1;
    article.calculatePopularityScore();
    await article.save();

    // Cache for 1 hour
    await cacheManager.set(cacheKey, article, 3600);

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Get available categories with article counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await NewsArticle.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          latestArticle: { $max: '$publishedAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const formattedCategories = categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      latestArticle: cat.latestArticle
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get available news sources
router.get('/sources', async (req, res) => {
  try {
    const sources = await NewsArticle.aggregate([
      {
        $group: {
          _id: '$source.name',
          count: { $sum: 1 },
          type: { $first: '$source.type' },
          latestArticle: { $max: '$publishedAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const formattedSources = sources.map(source => ({
      name: source._id,
      count: source.count,
      type: source.type,
      latestArticle: source.latestArticle
    }));

    res.json(formattedSources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Share article (increment share count)
router.post('/article/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await NewsArticle.findById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    article.popularity.shares += 1;
    article.calculatePopularityScore();
    await article.save();

    // Clear cache
    await cacheManager.del(cacheManager.articleKey(id));

    res.json({ success: true, shares: article.popularity.shares });
  } catch (error) {
    console.error('Error sharing article:', error);
    res.status(500).json({ error: 'Failed to share article' });
  }
});

// Manually trigger news fetch (admin endpoint)
router.post('/fetch', async (req, res) => {
  try {
    // In production, this should be protected by authentication
    const { source, category } = req.body;

    // Run fetch in background
    newsFetcher.fetchAllSources().catch(console.error);

    res.json({ message: 'News fetch initiated' });
  } catch (error) {
    console.error('Error initiating fetch:', error);
    res.status(500).json({ error: 'Failed to initiate news fetch' });
  }
});

// Get article summary (generate if not exists)
router.get('/article/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await NewsArticle.findById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // If summary doesn't exist, generate it
    if (!article.aiSummary || !article.aiSummary.summary) {
      const summary = await aiService.generateSummary(article);
      article.aiSummary = {
        ...summary,
        generatedAt: new Date()
      };
      article.sentiment = summary.sentiment;
      await article.save();
    }

    res.json(article.aiSummary);
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get article summary' });
  }
});

module.exports = router;