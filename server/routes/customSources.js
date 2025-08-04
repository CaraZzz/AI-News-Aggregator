const express = require('express');
const router = express.Router();
const CustomSource = require('../models/CustomSource');
const newsFetcher = require('../utils/newsFetcher');
const { v4: uuidv4 } = require('uuid');

// Get all custom sources
router.get('/', async (req, res) => {
  try {
    const { type, category, isPublic, isActive } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const sources = await CustomSource.find(query).sort({ createdAt: -1 });
    res.json(sources);
  } catch (error) {
    console.error('Error fetching custom sources:', error);
    res.status(500).json({ error: 'Failed to fetch custom sources' });
  }
});

// Get a single custom source
router.get('/:id', async (req, res) => {
  try {
    const source = await CustomSource.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json(source);
  } catch (error) {
    console.error('Error fetching source:', error);
    res.status(500).json({ error: 'Failed to fetch source' });
  }
});

// Create a new custom source
router.post('/', async (req, res) => {
  try {
    const {
      name,
      url,
      type,
      category = 'other',
      description,
      logo,
      apiConfig,
      fetchInterval,
      isPublic = false,
      metadata
    } = req.body;

    // Validate required fields
    if (!name || !url || !type) {
      return res.status(400).json({ error: 'Name, URL, and type are required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if source already exists
    const existing = await CustomSource.findOne({ url });
    if (existing) {
      return res.status(409).json({ error: 'Source with this URL already exists' });
    }

    // Create new source
    const newSource = new CustomSource({
      name,
      url,
      type,
      category,
      description,
      logo,
      apiConfig,
      fetchInterval,
      isPublic,
      metadata,
      userId: req.user?.id || null // If you have authentication
    });

    await newSource.save();

    // Test fetch the source
    testFetchSource(newSource);

    res.status(201).json(newSource);
  } catch (error) {
    console.error('Error creating custom source:', error);
    res.status(500).json({ error: 'Failed to create custom source' });
  }
});

// Update a custom source
router.put('/:id', async (req, res) => {
  try {
    const source = await CustomSource.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'logo', 'category', 
      'apiConfig', 'fetchInterval', 'isActive', 
      'isPublic', 'metadata'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        source[field] = req.body[field];
      }
    });

    await source.save();
    res.json(source);
  } catch (error) {
    console.error('Error updating source:', error);
    res.status(500).json({ error: 'Failed to update source' });
  }
});

// Delete a custom source
router.delete('/:id', async (req, res) => {
  try {
    const source = await CustomSource.findByIdAndDelete(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json({ message: 'Source deleted successfully' });
  } catch (error) {
    console.error('Error deleting source:', error);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

// Test a custom source
router.post('/:id/test', async (req, res) => {
  try {
    const source = await CustomSource.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    let articles = [];
    let error = null;

    try {
      switch (source.type) {
        case 'rss':
          articles = await newsFetcher.fetchFromRSS(source.url, source.name, source.category);
          break;
        case 'api':
          articles = await newsFetcher.fetchFromCustomAPI(source);
          break;
        case 'podcast':
          articles = await newsFetcher.fetchFromPodcast(source);
          break;
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      // Record success
      await source.recordSuccess();
    } catch (fetchError) {
      error = fetchError.message;
      await source.recordError(fetchError);
    }

    res.json({
      success: !error,
      articlesFound: articles.length,
      sampleArticles: articles.slice(0, 3),
      error,
      source: {
        name: source.name,
        type: source.type,
        isActive: source.isActive
      }
    });
  } catch (error) {
    console.error('Error testing source:', error);
    res.status(500).json({ error: 'Failed to test source' });
  }
});

// Validate a source URL/configuration before saving
router.post('/validate', async (req, res) => {
  try {
    const { url, type, apiConfig } = req.body;

    if (!url || !type) {
      return res.status(400).json({ error: 'URL and type are required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid URL format' 
      });
    }

    // Check if already exists
    const existing = await CustomSource.findOne({ url });
    if (existing) {
      return res.json({
        valid: false,
        error: 'Source already exists',
        existingSource: {
          id: existing._id,
          name: existing.name,
          type: existing.type
        }
      });
    }

    // Test fetch based on type
    let testResult = { valid: true };
    
    try {
      switch (type) {
        case 'rss':
          const articles = await newsFetcher.fetchFromRSS(url, 'Test Source');
          testResult.articlesFound = articles.length;
          testResult.sampleArticle = articles[0] || null;
          break;
          
        case 'api':
          if (!apiConfig) {
            testResult.valid = false;
            testResult.error = 'API configuration is required for API sources';
          } else {
            // Basic API validation
            const response = await axios({
              method: apiConfig.method || 'GET',
              url,
              headers: apiConfig.headers ? Object.fromEntries(apiConfig.headers) : {},
              params: apiConfig.params ? Object.fromEntries(apiConfig.params) : {},
              timeout: 10000
            });
            testResult.statusCode = response.status;
            testResult.hasData = !!response.data;
          }
          break;
          
        case 'podcast':
          // Podcasts are RSS feeds with enclosures
          const episodes = await newsFetcher.fetchFromPodcast({ url });
          testResult.episodesFound = episodes.length;
          testResult.sampleEpisode = episodes[0] || null;
          break;
          
        default:
          testResult.valid = false;
          testResult.error = `Unsupported source type: ${type}`;
      }
    } catch (error) {
      testResult.valid = false;
      testResult.error = error.message;
    }

    res.json(testResult);
  } catch (error) {
    console.error('Error validating source:', error);
    res.status(500).json({ error: 'Failed to validate source' });
  }
});

// Get suggested sources based on category
router.get('/suggestions/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const suggestions = {
      technology: [
        {
          name: 'TechCrunch',
          url: 'https://techcrunch.com/feed/',
          type: 'rss',
          description: 'Latest technology news and analysis'
        },
        {
          name: 'The Verge',
          url: 'https://www.theverge.com/rss/index.xml',
          type: 'rss',
          description: 'Technology, science, art, and culture'
        },
        {
          name: 'Ars Technica',
          url: 'https://feeds.arstechnica.com/arstechnica/index',
          type: 'rss',
          description: 'Original news and reviews'
        }
      ],
      business: [
        {
          name: 'Reuters Business',
          url: 'https://feeds.reuters.com/reuters/businessNews',
          type: 'rss',
          description: 'Breaking business news'
        },
        {
          name: 'Bloomberg',
          url: 'https://feeds.bloomberg.com/markets/news.rss',
          type: 'rss',
          description: 'Global business and financial news'
        }
      ],
      science: [
        {
          name: 'Nature News',
          url: 'https://www.nature.com/nature.rss',
          type: 'rss',
          description: 'Latest research from Nature'
        },
        {
          name: 'Science Daily',
          url: 'https://www.sciencedaily.com/rss/all.xml',
          type: 'rss',
          description: 'Breaking science news'
        }
      ],
      podcasts: [
        {
          name: 'The Daily',
          url: 'https://feeds.simplecast.com/54nAGcIl',
          type: 'podcast',
          description: 'Daily news podcast from The New York Times'
        },
        {
          name: 'NPR News Now',
          url: 'https://feeds.npr.org/500005/podcast.xml',
          type: 'podcast',
          description: 'NPR news updates every hour'
        }
      ]
    };

    const categorySuggestions = suggestions[category] || [];
    const podcastSuggestions = category !== 'podcasts' ? suggestions.podcasts.slice(0, 2) : [];

    res.json({
      category,
      suggestions: [...categorySuggestions, ...podcastSuggestions]
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Helper function to test fetch a source in the background
async function testFetchSource(source) {
  try {
    let articles = [];
    
    switch (source.type) {
      case 'rss':
        articles = await newsFetcher.fetchFromRSS(source.url, source.name, source.category);
        break;
      case 'api':
        articles = await newsFetcher.fetchFromCustomAPI(source);
        break;
      case 'podcast':
        articles = await newsFetcher.fetchFromPodcast(source);
        break;
    }

    if (articles.length > 0) {
      await source.recordSuccess();
      await newsFetcher.saveArticles(articles);
    } else {
      throw new Error('No articles found');
    }
  } catch (error) {
    console.error(`Error test fetching source ${source.name}:`, error);
    await source.recordError(error);
  }
}

module.exports = router;