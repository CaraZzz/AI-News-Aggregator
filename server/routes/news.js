const express = require('express');
const axios = require('axios');
const router = express.Router();

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'demo';
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || 'demo';
const NYT_API_KEY = process.env.NYT_API_KEY || 'demo';

// News sources configuration
const newsSources = {
  general: [
    { name: 'NewsAPI', url: 'https://newsapi.org/v2/top-headlines', apiKey: NEWS_API_KEY },
    { name: 'Guardian', url: 'https://content.guardianapis.com/search', apiKey: GUARDIAN_API_KEY },
    { name: 'NYT', url: 'https://api.nytimes.com/svc/news/v3/content/all/all.json', apiKey: NYT_API_KEY }
  ],
  categories: {
    technology: [
      { name: 'TechCrunch', url: 'https://newsapi.org/v2/top-headlines', category: 'technology' },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' }
    ],
    business: [
      { name: 'Bloomberg', url: 'https://newsapi.org/v2/top-headlines', category: 'business' },
      { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' }
    ],
    science: [
      { name: 'Nature', url: 'https://www.nature.com/nature.rss' },
      { name: 'Science', url: 'https://www.science.org/rss/news_current.xml' }
    ],
    sports: [
      { name: 'ESPN', url: 'https://newsapi.org/v2/top-headlines', category: 'sports' }
    ],
    entertainment: [
      { name: 'Variety', url: 'https://variety.com/feed' },
      { name: 'Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed' }
    ]
  }
};

// Helper function to fetch news from NewsAPI
async function fetchFromNewsAPI(category = 'general', country = 'us') {
  try {
    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: {
        country,
        category,
        apiKey: NEWS_API_KEY,
        pageSize: 20
      }
    });
    return response.data.articles.map(article => ({
      ...article,
      source: 'NewsAPI',
      category: category,
      publishedAt: new Date(article.publishedAt),
      popularity: Math.floor(Math.random() * 100) // Placeholder for popularity score
    }));
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error.message);
    return [];
  }
}

// Helper function to fetch from Guardian API
async function fetchFromGuardian(section = 'news') {
  try {
    const response = await axios.get('https://content.guardianapis.com/search', {
      params: {
        'api-key': GUARDIAN_API_KEY,
        'section': section,
        'show-fields': 'headline,trailText,thumbnail,lastModified',
        'page-size': 20
      }
    });
    return response.data.response.results.map(article => ({
      title: article.webTitle,
      description: article.fields?.trailText || '',
      url: article.webUrl,
      urlToImage: article.fields?.thumbnail || '',
      source: 'Guardian',
      category: section,
      publishedAt: new Date(article.webPublicationDate),
      popularity: Math.floor(Math.random() * 100)
    }));
  } catch (error) {
    console.error('Error fetching from Guardian:', error.message);
    return [];
  }
}

// Helper function to fetch from NYT API
async function fetchFromNYT() {
  try {
    const response = await axios.get('https://api.nytimes.com/svc/news/v3/content/all/all.json', {
      params: {
        'api-key': NYT_API_KEY
      }
    });
    return response.data.results.map(article => ({
      title: article.title,
      description: article.abstract,
      url: article.url,
      urlToImage: article.multimedia?.[0]?.url ? `https://www.nytimes.com/${article.multimedia[0].url}` : '',
      source: 'NYT',
      category: article.section,
      publishedAt: new Date(article.published_date),
      popularity: Math.floor(Math.random() * 100)
    }));
  } catch (error) {
    console.error('Error fetching from NYT:', error.message);
    return [];
  }
}

// Get all news with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { category, sort = 'latest', page = 1, limit = 20 } = req.query;
    
    let allNews = [];
    
    // Fetch from different sources based on category
    if (category && newsSources.categories[category]) {
      // Fetch category-specific news
      const categoryNews = await fetchFromNewsAPI(category);
      allNews = [...categoryNews];
    } else {
      // Fetch general news from all sources
      const [newsAPI, guardian, nyt] = await Promise.all([
        fetchFromNewsAPI(),
        fetchFromGuardian(),
        fetchFromNYT()
      ]);
      allNews = [...newsAPI, ...guardian, ...nyt];
    }
    
    // Sort news based on parameter
    if (sort === 'popularity') {
      allNews.sort((a, b) => b.popularity - a.popularity);
    } else {
      allNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNews = allNews.slice(startIndex, endIndex);
    
    res.json({
      news: paginatedNews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allNews.length / limit),
        totalItems: allNews.length,
        hasNext: endIndex < allNews.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Get news categories
router.get('/categories', (req, res) => {
  const categories = Object.keys(newsSources.categories).map(category => ({
    id: category,
    name: category.charAt(0).toUpperCase() + category.slice(1),
    description: `Latest ${category} news and updates`
  }));
  
  res.json({ categories });
});

// Get trending news (most popular in last 24 hours)
router.get('/trending', async (req, res) => {
  try {
    const [newsAPI, guardian, nyt] = await Promise.all([
      fetchFromNewsAPI(),
      fetchFromGuardian(),
      fetchFromNYT()
    ]);
    
    const allNews = [...newsAPI, ...guardian, ...nyt];
    
    // Filter for last 24 hours and sort by popularity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNews = allNews.filter(article => 
      new Date(article.publishedAt) > oneDayAgo
    );
    
    const trendingNews = recentNews
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
    
    res.json({ trending: trendingNews });
  } catch (error) {
    console.error('Error fetching trending news:', error);
    res.status(500).json({ error: 'Failed to fetch trending news' });
  }
});

// Search news
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    let searchResults = [];
    
    // Search in NewsAPI
    try {
      const newsAPIResponse = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q,
          apiKey: NEWS_API_KEY,
          sortBy: 'relevancy',
          pageSize: 20
        }
      });
      searchResults = [...searchResults, ...newsAPIResponse.data.articles];
    } catch (error) {
      console.error('NewsAPI search error:', error.message);
    }
    
    // Filter by category if specified
    if (category) {
      searchResults = searchResults.filter(article => 
        article.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    res.json({ 
      results: searchResults,
      query: q,
      totalResults: searchResults.length
    });
  } catch (error) {
    console.error('Error searching news:', error);
    res.status(500).json({ error: 'Failed to search news' });
  }
});

module.exports = router;