const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const router = express.Router();

// Enhanced RSS parser with custom fields for podcasts
const parser = new Parser({
  customFields: {
    feed: ['language', 'copyright', 'managingEditor', 'webMaster', ['itunes:author', 'itunesAuthor'], ['itunes:summary', 'itunesSummary'], ['itunes:owner', 'itunesOwner'], ['itunes:image', 'itunesImage'], ['itunes:category', 'itunesCategory'], ['itunes:explicit', 'itunesExplicit']],
    item: ['author', 'comments', ['itunes:author', 'itunesAuthor'], ['itunes:summary', 'itunesSummary'], ['itunes:explicit', 'itunesExplicit'], ['itunes:duration', 'itunesDuration'], ['itunes:image', 'itunesImage'], ['itunes:episode', 'itunesEpisode'], ['itunes:season', 'itunesSeason'], ['enclosure', 'enclosure']]
  }
});

// In-memory storage for custom sources (in production, use a database)
let customSources = [];

// Supported source types with detailed capabilities
const sourceTypes = {
  rss: {
    name: 'RSS Feed',
    description: 'Standard RSS/Atom news feeds',
    examples: ['https://feeds.npr.org/1001/rss.xml', 'https://rss.cnn.com/rss/edition.rss']
  },
  website: {
    name: 'Website Scraping',
    description: 'Extract articles from website HTML',
    examples: ['https://techcrunch.com', 'https://www.bbc.com/news']
  },
  podcast: {
    name: 'Podcast Feed',
    description: 'Podcast RSS feeds with episode information',
    examples: ['https://feeds.simplecast.com/54nAGcIl', 'https://rss.art19.com/the-daily']
  },
  newsletter: {
    name: 'Newsletter Archive',
    description: 'Newsletter archives and RSS feeds',
    examples: ['https://stratechery.com/feed/', 'https://feeds.feedburner.com/venturebeat']
  }
};

// Add custom news source
router.post('/', async (req, res) => {
  try {
    const { name, url, type, category = 'general', metadata = {} } = req.body;
    
    if (!name || !url || !type) {
      return res.status(400).json({ 
        error: 'Name, URL, and type are required',
        supportedTypes: Object.keys(sourceTypes)
      });
    }
    
    // Validate source type
    if (!sourceTypes[type]) {
      return res.status(400).json({ 
        error: `Invalid source type. Supported types: ${Object.keys(sourceTypes).join(', ')}`,
        supportedTypes: sourceTypes
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
      source.url === url || (source.name.toLowerCase() === name.toLowerCase())
    );
    
    if (existingSource) {
      return res.status(409).json({ 
        error: 'Source already exists',
        existingSource: {
          id: existingSource.id,
          name: existingSource.name,
          url: existingSource.url,
          type: existingSource.type
        }
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
      }
    } catch (error) {
      return res.status(400).json({ 
        error: `Failed to validate source: ${error.message}`,
        suggestion: `Please ensure the URL is accessible and contains ${type} content`
      });
    }
    
    const newSource = {
      id: Date.now().toString(),
      name,
      url,
      type,
      category,
      metadata: {
        ...metadata,
        ...testResult.metadata
      },
      status: 'active',
      lastChecked: new Date().toISOString(),
      testResult,
      stats: {
        fetchCount: 0,
        lastFetchSuccess: null,
        averageArticles: 0
      },
      createdAt: new Date().toISOString()
    };
    
    customSources.push(newSource);
    
    res.status(201).json({
      message: 'Custom source added successfully',
      source: newSource,
      nextSteps: {
        fetchContent: `/api/custom-sources/${newSource.id}/content`,
        updateSource: `/api/custom-sources/${newSource.id}`,
        deleteSource: `/api/custom-sources/${newSource.id}`
      }
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
  
  // Sort by creation date (newest first)
  filteredSources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({
    sources: filteredSources,
    count: filteredSources.length,
    supportedTypes: sourceTypes,
    filters: { type, category, status }
  });
});

// Get source types and examples
router.get('/types', (req, res) => {
  res.json({
    supportedTypes: sourceTypes,
    categories: ['general', 'technology', 'business', 'science', 'sports', 'entertainment', 'health', 'politics']
  });
});

// Get single custom source
router.get('/:id', (req, res) => {
  const source = customSources.find(s => s.id === req.params.id);
  
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }
  
  res.json(source);
});

// Update custom source
router.put('/:id', async (req, res) => {
  try {
    const sourceIndex = customSources.findIndex(s => s.id === req.params.id);
    
    if (sourceIndex === -1) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    const { name, category, status, metadata } = req.body;
    const source = customSources[sourceIndex];
    
    // Update allowed fields
    if (name) source.name = name;
    if (category) source.category = category;
    if (status && ['active', 'paused', 'error'].includes(status)) {
      source.status = status;
    }
    if (metadata) {
      source.metadata = { ...source.metadata, ...metadata };
    }
    
    source.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Source updated successfully',
      source
    });
    
  } catch (error) {
    console.error('Error updating source:', error);
    res.status(500).json({ 
      error: 'Failed to update source',
      message: error.message 
    });
  }
});

// Delete custom source
router.delete('/:id', (req, res) => {
  const sourceIndex = customSources.findIndex(s => s.id === req.params.id);
  
  if (sourceIndex === -1) {
    return res.status(404).json({ error: 'Source not found' });
  }
  
  const deletedSource = customSources.splice(sourceIndex, 1)[0];
  
  res.json({
    message: 'Source deleted successfully',
    deletedSource: {
      id: deletedSource.id,
      name: deletedSource.name,
      type: deletedSource.type
    }
  });
});

// Fetch content from custom source
router.get('/:id/content', async (req, res) => {
  try {
    const source = customSources.find(s => s.id === req.params.id);
    
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    if (source.status !== 'active') {
      return res.status(400).json({ 
        error: 'Source is not active',
        status: source.status 
      });
    }
    
    const limit = parseInt(req.query.limit) || 10;
    let articles = [];
    
    try {
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
          articles = await fetchNewsletterContent(source.url, limit, source.metadata);
          break;
        default:
          return res.status(400).json({ error: 'Unsupported source type' });
      }
      
      // Update stats
      source.stats.fetchCount++;
      source.stats.lastFetchSuccess = new Date().toISOString();
      source.stats.averageArticles = Math.round(
        (source.stats.averageArticles * (source.stats.fetchCount - 1) + articles.length) / source.stats.fetchCount
      );
      source.lastChecked = new Date().toISOString();
      
      res.json({
        source: {
          id: source.id,
          name: source.name,
          type: source.type,
          category: source.category
        },
        articles,
        metadata: {
          fetchedAt: new Date().toISOString(),
          articleCount: articles.length,
          limit,
          hasMore: articles.length === limit
        }
      });
      
    } catch (fetchError) {
      source.status = 'error';
      source.lastError = {
        message: fetchError.message,
        timestamp: new Date().toISOString()
      };
      
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Error fetching from custom source:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content',
      message: error.message 
    });
  }
});

// Enhanced test functions

// Test RSS source
async function testRSSSource(url) {
  try {
    const feed = await parser.parseURL(url);
    return {
      valid: true,
      title: feed.title,
      description: feed.description,
      itemCount: feed.items?.length || 0,
      language: feed.language,
      lastUpdated: feed.lastBuildDate,
      metadata: {
        feedType: 'rss',
        hasImages: feed.items?.some(item => item.enclosure?.type?.startsWith('image/')) || false,
        updateFrequency: 'unknown'
      }
    };
  } catch (error) {
    throw new Error(`Invalid RSS feed: ${error.message}`);
  }
}

// Test website source
async function testWebsiteSource(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
      },
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    const title = $('title').text() || $('h1').first().text();
    
    // Detect if it's likely a news site
    const newsIndicators = [
      $('article').length,
      $('.article').length,
      $('.post').length,
      $('.entry').length,
      $('[class*="news"]').length,
      $('[class*="article"]').length
    ];
    
    const hasNewsContent = newsIndicators.some(count => count > 0);
    
    return {
      valid: true,
      title: title.substring(0, 100),
      status: response.status,
      contentType: response.headers['content-type'],
      hasNewsContent,
      metadata: {
        articleCount: Math.max(...newsIndicators),
        hasRSSFeed: $('link[type="application/rss+xml"]').length > 0,
        language: $('html').attr('lang') || 'unknown'
      }
    };
  } catch (error) {
    throw new Error(`Website not accessible: ${error.message}`);
  }
}

// Enhanced test podcast source
async function testPodcastSource(url) {
  try {
    // First try to parse as RSS (most podcasts use RSS)
    try {
      const feed = await parser.parseURL(url);
      
      // Check for podcast-specific elements
      const isPodcast = feed.items?.some(item => 
        item.enclosure?.type?.startsWith('audio/') || 
        item.itunesAuthor ||
        item.itunesDuration
      ) || feed.itunesAuthor || feed.itunesCategory;
      
      if (!isPodcast) {
        throw new Error('Feed does not appear to contain podcast content');
      }
      
      return {
        valid: true,
        title: feed.title,
        description: feed.description || feed.itunesSummary,
        episodeCount: feed.items?.length || 0,
        author: feed.itunesAuthor || feed.managingEditor,
        explicit: feed.itunesExplicit === 'yes',
        metadata: {
          feedType: 'podcast',
          language: feed.language,
          categories: feed.itunesCategory ? [feed.itunesCategory] : [],
          hasAudioEnclosures: feed.items?.some(item => item.enclosure?.type?.startsWith('audio/')) || false,
          averageEpisodeDuration: calculateAverageDuration(feed.items),
          lastEpisode: feed.items?.[0]?.pubDate
        }
      };
    } catch (rssError) {
      // If RSS parsing fails, check if it's a podcast platform page
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      // Look for podcast platform indicators
      const podcastPlatforms = [
        'spotify.com', 'apple.com/podcast', 'podcasts.google.com',
        'overcast.fm', 'pocketcasts.com', 'castbox.fm'
      ];
      
      const isPodcastPlatform = podcastPlatforms.some(platform => url.includes(platform));
      const hasPodcastMetadata = $('meta[property*="podcast"], meta[name*="podcast"]').length > 0;
      
      if (!isPodcastPlatform && !hasPodcastMetadata) {
        throw new Error('URL does not appear to be a valid podcast source');
      }
      
      return {
        valid: true,
        title: $('title').text(),
        isPlatformPage: true,
        platform: podcastPlatforms.find(platform => url.includes(platform)) || 'unknown',
        metadata: {
          feedType: 'podcast-platform',
          requiresDirectFeed: true,
          note: 'This appears to be a podcast platform page. For best results, use the direct RSS feed URL.'
        }
      };
    }
  } catch (error) {
    throw new Error(`Podcast source validation failed: ${error.message}`);
  }
}

// Enhanced test newsletter source
async function testNewsletterSource(url) {
  try {
    // First try RSS (many newsletters have RSS feeds)
    try {
      const feed = await parser.parseURL(url);
      return {
        valid: true,
        title: feed.title,
        description: feed.description,
        itemCount: feed.items?.length || 0,
        type: 'newsletter-rss',
        metadata: {
          feedType: 'newsletter',
          hasArchive: true,
          updateFrequency: estimateUpdateFrequency(feed.items),
          contentType: 'rss'
        }
      };
    } catch (rssError) {
      // If not RSS, check for newsletter platform
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      // Newsletter platform detection
      const newsletterPlatforms = [
        'substack.com', 'buttondown.email', 'convertkit.com',
        'mailchimp.com', 'beehiiv.com', 'ghost.org'
      ];
      
      const platform = newsletterPlatforms.find(p => url.includes(p) || response.data.includes(p));
      
      // Look for newsletter-specific elements
      const hasNewsletterElements = 
        $('form[action*="subscribe"], .newsletter, [class*="newsletter"], [class*="subscribe"]').length > 0 ||
        $('input[type="email"]').length > 0 ||
        $('[class*="signup"], [class*="subscribe"]').length > 0;
      
      // Look for archive/feed links
      const archiveLinks = $('a[href*="rss"], a[href*="feed"], a[href*="archive"]');
      const hasArchive = archiveLinks.length > 0;
      
      return {
        valid: hasNewsletterElements || platform || hasArchive,
        title: $('title').text(),
        platform: platform || 'unknown',
        hasSubscribeForm: hasNewsletterElements,
        hasArchive,
        archiveLinks: archiveLinks.map((i, el) => $(el).attr('href')).get(),
        metadata: {
          feedType: 'newsletter-web',
          platform,
          contentType: 'html',
          integrationRequired: !hasArchive,
          suggestedFeeds: archiveLinks.map((i, el) => ({
            url: $(el).attr('href'),
            text: $(el).text()
          })).get()
        }
      };
    }
  } catch (error) {
    throw new Error(`Newsletter source validation failed: ${error.message}`);
  }
}

// Enhanced content fetching functions

// Fetch RSS content (unchanged)
async function fetchRSSContent(url, limit) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, limit).map(item => ({
      title: item.title,
      description: item.contentSnippet || item.content || item.summary,
      url: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      author: item.creator || item.author || item.itunesAuthor,
      source: 'RSS',
      category: item.categories?.[0] || 'general'
    }));
  } catch (error) {
    throw new Error(`Failed to fetch RSS content: ${error.message}`);
  }
}

// Enhanced website content fetching
async function fetchWebsiteContent(url, limit) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Enhanced selectors for better article detection
    const selectors = [
      'article',
      '.article',
      '.post',
      '.entry',
      '.story',
      '.news-item',
      '[class*="article"]',
      '[class*="post"]',
      '[class*="story"]',
      '[itemtype*="Article"]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector).slice(0, limit * 2); // Get more to filter better
      
      elements.each((i, element) => {
        const $el = $(element);
        
        // Try multiple ways to find title
        const title = 
          $el.find('h1, h2, h3, h4').first().text().trim() ||
          $el.find('.title, .headline, [class*="title"], [class*="headline"]').first().text().trim() ||
          $el.find('a').first().text().trim();
        
        // Try multiple ways to find description
        const description = 
          $el.find('p').first().text().trim() ||
          $el.find('.excerpt, .summary, [class*="excerpt"], [class*="summary"]').first().text().trim();
        
        // Try multiple ways to find link
        let link = 
          $el.find('a').first().attr('href') ||
          $el.find('h1 a, h2 a, h3 a').attr('href') ||
          $el.attr('href');
        
        // Find publication date
        const dateText = 
          $el.find('time').attr('datetime') ||
          $el.find('time').text() ||
          $el.find('.date, [class*="date"]').text() ||
          $el.find('.published, [class*="published"]').text();
        
        let publishedAt = new Date();
        if (dateText) {
          const parsedDate = new Date(dateText);
          if (!isNaN(parsedDate.getTime())) {
            publishedAt = parsedDate;
          }
        }
        
        if (title && title.length > 10 && link) {
          try {
            const fullUrl = new URL(link, url).href;
            articles.push({
              title: title.substring(0, 200),
              description: description.substring(0, 300),
              url: fullUrl,
              publishedAt,
              source: 'Website',
              category: 'general'
            });
          } catch (urlError) {
            // Skip invalid URLs
          }
        }
      });
      
      if (articles.length >= limit) break;
    }
    
    // Remove duplicates and return limited results
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex(a => a.url === article.url || a.title === article.title)
    );
    
    return uniqueArticles.slice(0, limit);
  } catch (error) {
    throw new Error(`Failed to fetch website content: ${error.message}`);
  }
}

// Enhanced podcast content fetching
async function fetchPodcastContent(url, limit) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, limit).map(item => ({
      title: item.title,
      description: item.contentSnippet || item.content || item.itunesSummary,
      url: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      author: item.itunesAuthor || item.author || feed.itunesAuthor,
      duration: item.itunesDuration,
      audioUrl: item.enclosure?.url,
      audioType: item.enclosure?.type,
      audioLength: item.enclosure?.length,
      episode: item.itunesEpisode,
      season: item.itunesSeason,
      source: 'Podcast',
      category: 'podcast',
      explicit: item.itunesExplicit === 'yes'
    }));
  } catch (error) {
    throw new Error(`Failed to fetch podcast content: ${error.message}`);
  }
}

// Enhanced newsletter content fetching
async function fetchNewsletterContent(url, limit, metadata = {}) {
  try {
    if (metadata.contentType === 'rss' || url.includes('/rss') || url.includes('/feed')) {
      // Try RSS first
      const feed = await parser.parseURL(url);
      return feed.items.slice(0, limit).map(item => ({
        title: item.title,
        description: item.contentSnippet || item.content || item.summary,
        url: item.link,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        author: item.creator || item.author,
        source: 'Newsletter',
        category: 'newsletter'
      }));
    } else {
      // For non-RSS newsletter sources, return placeholder
      return [{
        title: 'Newsletter Integration Required',
        description: 'This newsletter source requires integration with the newsletter platform. Consider adding the RSS feed URL if available, or check the platform documentation for API access.',
        url,
        publishedAt: new Date(),
        source: 'Newsletter',
        category: 'newsletter',
        integration: {
          required: true,
          platform: metadata.platform,
          suggestedFeeds: metadata.suggestedFeeds || []
        }
      }];
    }
  } catch (error) {
    throw new Error(`Failed to fetch newsletter content: ${error.message}`);
  }
}

// Helper functions

function calculateAverageDuration(items) {
  if (!items || items.length === 0) return null;
  
  const durations = items
    .map(item => item.itunesDuration)
    .filter(duration => duration)
    .map(duration => {
      // Convert duration to seconds
      if (typeof duration === 'string') {
        const parts = duration.split(':').map(Number);
        if (parts.length === 3) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          return parts[0] * 60 + parts[1];
        }
      }
      return parseInt(duration) || 0;
    })
    .filter(duration => duration > 0);
  
  if (durations.length === 0) return null;
  
  const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  return Math.round(average);
}

function estimateUpdateFrequency(items) {
  if (!items || items.length < 2) return 'unknown';
  
  const dates = items
    .map(item => item.pubDate ? new Date(item.pubDate) : null)
    .filter(date => date && !isNaN(date.getTime()))
    .sort((a, b) => b - a);
  
  if (dates.length < 2) return 'unknown';
  
  const intervals = [];
  for (let i = 0; i < Math.min(dates.length - 1, 5); i++) {
    intervals.push(dates[i] - dates[i + 1]);
  }
  
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const days = averageInterval / (1000 * 60 * 60 * 24);
  
  if (days <= 1) return 'daily';
  if (days <= 7) return 'weekly';
  if (days <= 14) return 'bi-weekly';
  if (days <= 31) return 'monthly';
  return 'irregular';
}

module.exports = router;