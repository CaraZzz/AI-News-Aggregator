const redis = require('redis');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Too many reconnection attempts');
              return new Error('Too many retries');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis connection failed:', error);
      // Continue without cache if Redis fails
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, expirationInSeconds = 3600) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.setEx(key, expirationInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async clear(pattern = '*') {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Cache key generators
  newsKey(params = {}) {
    const { category, source, page = 1, limit = 20, sort = 'latest' } = params;
    return `news:${category || 'all'}:${source || 'all'}:${page}:${limit}:${sort}`;
  }

  articleKey(articleId) {
    return `article:${articleId}`;
  }

  summaryKey(articleId) {
    return `summary:${articleId}`;
  }

  trendingKey(category = 'all') {
    return `trending:${category}`;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;