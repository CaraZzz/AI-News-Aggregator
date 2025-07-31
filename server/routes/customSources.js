const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const router = express.Router();

const parser = new Parser();

// In-memory storage for custom sources (in production, use a database)
let customSources = [];

// Add custom news source
router.post('/', async (req, res) => {
  try {
    const { name, url, type, category = 'general' } = req.body;
    
    if (!name || !url || !type) {
      return res.status(400).json({ 
        error: 'Name, URL, and type are required' 
      });
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Check if source already exists
    const existingSource = customSources.find(source => 
      source.url === url || source.name === name
    );
    
    if (existingSource) {
      return res.status(409).json({ 
        error: 'Source already exists' 
      });
    }
    
    // Test the source based on type
    let testResult = null;
    try {
      switch (type) {
        case 'rss':
          testResult = await testRSSSource(url);
          break;
        case 'website':
          testResult = await testWebsiteSource(url);
          break;
        case 'podcast':
          testResult = await testPodcastSource(url);
          break;
        case 'newsletter':
          testResult = await testNewsletterSource(url);
          break;
        default:
          return res.status(400).json({ 
            error: 'Invalid source type. Must be: rss, website, podcast, or newsletter' 
          });
      }
    } catch (error) {
      return res.status(400).json({ 
        error: `Failed to validate source: ${error.message}` 
      });
    }
    
    const newSource = {
      id: Date.now().toString(),
      name,
      url,
      type,
      category,
      status: 'active',
      lastChecked: new Date().toISOString(),
      testResult,
      createdAt: new Date().toISOString()
    };
    
    customSources.push(newSource);
    
    res.status(201).json({
      message: 'Custom source added successfully',
      source: newSource
    });
    
  } catch (error) {
    console.error('Error adding custom source:', error);
    res.status(500).json({ 
      error: 'Failed to add custom source',
      message: error.message 
    });
  }
});

// Get all custom sources
router.get('/', (req, res) => {
  const { type, category, status } = req.query;
  
  let filteredSources = [...customSources];
  
  if (type) {
    filteredSources = filteredSources.filter(source => source.type === type);
  }
  
  if (category) {
    filteredSources = filteredSources.filter(source => source.category === category);
  }
  
  if (status) {
    filteredSources = filteredSources.filter(source => source.status === status);
  }
  
  res.json({
    sources: filteredSources,
    total: filteredSources.length
  });
});

// Get custom source by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const source = customSources.find(s => s.id === id);
  
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }
  
  res.json({ source });
});

// Update custom source
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, type, category, status } = req.body;
    
    const sourceIndex = customSources.findIndex(s => s.id === id);
    
    if (sourceIndex === -1) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    const updatedSource = {
      ...customSources[sourceIndex],
      ...(name && { name }),
      ...(url && { url }),
      ...(type && { type }),
      ...(category && { category }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };
    
    customSources[sourceIndex] = updatedSource;
    
    res.json({
      message: 'Source updated successfully',
      source: updatedSource
    });
    
  } catch (error) {
    console.error('Error updating custom source:', error);
    res.status(500).json({ 
      error: 'Failed to update custom source',
      message: error.message 
    });
  }
});

// Delete custom source
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sourceIndex = customSources.findIndex(s => s.id === id);
  
  if (sourceIndex === -1) {
    return res.status(404).json({ error: 'Source not found' });
  }
  
  customSources.splice(sourceIndex, 1);
  
  res.json({ message: 'Source deleted successfully' });
});

// Fetch content from custom sources
router.get('/:id/fetch', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    
    const source = customSources.find(s => s.id === id);
    
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    let articles = [];
    
    switch (source.type) {
      case 'rss':
        articles = await fetchRSSContent(source.url, limit);
        break;
      case 'website':
        articles = await fetchWebsiteContent(source.url, limit);
        break;
      case 'podcast':
        articles = await fetchPodcastContent(source.url, limit);
        break;
      case 'newsletter':
        articles = await fetchNewsletterContent(source.url, limit);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported source type' });
    }
    
    // Update last checked time
    source.lastChecked = new Date().toISOString();
    
    res.json({
      source: source.name,
      articles,
      fetchedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching from custom source:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content',
      message: error.message 
    });
  }
});

// Test RSS source
async function testRSSSource(url) {
  try {
    const feed = await parser.parseURL(url);
    return {
      valid: true,
      title: feed.title,
      description: feed.description,
      itemCount: feed.items?.length || 0
    };
  } catch (error) {
    throw new Error(`Invalid RSS feed: ${error.message}`);
  }
}

// Test website source
async function testWebsiteSource(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data);
    const title = $('title').text() || $('h1').first().text();
    
    return {
      valid: true,
      title: title.substring(0, 100),
      status: response.status
    };
  } catch (error) {
    throw new Error(`Website not accessible: ${error.message}`);
  }
}

// Test podcast source
async function testPodcastSource(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    // Look for podcast-specific elements
    const hasPodcastElements = $('rss, [type="application/rss+xml"], [type="application/atom+xml"]').length > 0;
    
    return {
      valid: hasPodcastElements,
      type: 'podcast',
      status: response.status
    };
  } catch (error) {
    throw new Error(`Podcast source not accessible: ${error.message}`);
  }
}

// Test newsletter source
async function testNewsletterSource(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    // Look for newsletter-specific elements
    const hasNewsletterElements = $('form[action*="subscribe"], .newsletter, [class*="newsletter"]').length > 0;
    
    return {
      valid: hasNewsletterElements,
      type: 'newsletter',
      status: response.status
    };
  } catch (error) {
    throw new Error(`Newsletter source not accessible: ${error.message}`);
  }
}

// Fetch RSS content
async function fetchRSSContent(url, limit) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, limit).map(item => ({
      title: item.title,
      description: item.contentSnippet || item.content,
      url: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      author: item.creator || item.author,
      source: 'RSS'
    }));
  } catch (error) {
    throw new Error(`Failed to fetch RSS content: ${error.message}`);
  }
}

// Fetch website content
async function fetchWebsiteContent(url, limit) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Common selectors for news articles
    const selectors = [
      'article',
      '.article',
      '.post',
      '.entry',
      '[class*="article"]',
      '[class*="post"]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector).slice(0, limit);
      
      elements.each((i, element) => {
        const $el = $(element);
        const title = $el.find('h1, h2, h3').first().text().trim();
        const description = $el.find('p').first().text().trim();
        const link = $el.find('a').first().attr('href');
        
        if (title && link) {
          articles.push({
            title,
            description,
            url: new URL(link, url).href,
            publishedAt: new Date(),
            source: 'Website'
          });
        }
      });
      
      if (articles.length >= limit) break;
    }
    
    return articles.slice(0, limit);
  } catch (error) {
    throw new Error(`Failed to fetch website content: ${error.message}`);
  }
}

// Fetch podcast content
async function fetchPodcastContent(url, limit) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, limit).map(item => ({
      title: item.title,
      description: item.contentSnippet || item.content,
      url: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      duration: item.itunes?.duration,
      source: 'Podcast'
    }));
  } catch (error) {
    throw new Error(`Failed to fetch podcast content: ${error.message}`);
  }
}

// Fetch newsletter content
async function fetchNewsletterContent(url, limit) {
  // For newsletters, we typically can't scrape content directly
  // This would require integration with newsletter services
  return [{
    title: 'Newsletter Content',
    description: 'Newsletter content requires integration with newsletter services',
    url,
    publishedAt: new Date(),
    source: 'Newsletter'
  }];
}

module.exports = router;