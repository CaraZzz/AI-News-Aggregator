const mongoose = require('mongoose');

const customSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['rss', 'api', 'podcast', 'newsletter', 'website'],
    required: true
  },
  category: {
    type: String,
    enum: ['technology', 'business', 'entertainment', 'health', 'science', 'sports', 'politics', 'world', 'lifestyle', 'other'],
    default: 'other'
  },
  description: String,
  logo: String,
  apiConfig: {
    method: {
      type: String,
      enum: ['GET', 'POST'],
      default: 'GET'
    },
    headers: {
      type: Map,
      of: String
    },
    params: {
      type: Map,
      of: String
    },
    responseMapping: {
      articles: String, // JSON path to articles array
      title: String,    // JSON path to title within article
      description: String,
      url: String,
      publishedAt: String,
      author: String,
      image: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastFetchedAt: Date,
  fetchInterval: {
    type: Number,
    default: 3600000 // 1 hour in milliseconds
  },
  errorCount: {
    type: Number,
    default: 0
  },
  lastError: {
    message: String,
    occurredAt: Date
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  metadata: {
    language: {
      type: String,
      default: 'en'
    },
    country: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Index for efficient querying
customSourceSchema.index({ type: 1, isActive: 1 });
customSourceSchema.index({ userId: 1 });
customSourceSchema.index({ category: 1, isPublic: 1 });

// Method to check if source needs fetching
customSourceSchema.methods.needsFetching = function() {
  if (!this.isActive) return false;
  if (!this.lastFetchedAt) return true;
  
  const timeSinceLastFetch = Date.now() - this.lastFetchedAt.getTime();
  return timeSinceLastFetch >= this.fetchInterval;
};

// Method to record fetch error
customSourceSchema.methods.recordError = function(error) {
  this.errorCount += 1;
  this.lastError = {
    message: error.message,
    occurredAt: new Date()
  };
  
  // Disable source after 5 consecutive errors
  if (this.errorCount >= 5) {
    this.isActive = false;
  }
  
  return this.save();
};

// Method to record successful fetch
customSourceSchema.methods.recordSuccess = function() {
  this.errorCount = 0;
  this.lastFetchedAt = new Date();
  this.lastError = null;
  return this.save();
};

module.exports = mongoose.model('CustomSource', customSourceSchema);