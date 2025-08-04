const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  urlToImage: String,
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  source: {
    id: String,
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['api', 'rss', 'custom', 'podcast', 'newsletter'],
      default: 'api'
    }
  },
  author: String,
  category: {
    type: String,
    enum: ['technology', 'business', 'entertainment', 'health', 'science', 'sports', 'politics', 'world', 'lifestyle', 'other'],
    default: 'other',
    index: true
  },
  tags: [{
    type: String
  }],
  aiSummary: {
    summary: String,
    keyPoints: [String],
    generatedAt: Date
  },
  popularity: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0,
      index: true
    }
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  language: {
    type: String,
    default: 'en'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
newsArticleSchema.index({ publishedAt: -1, 'popularity.score': -1 });
newsArticleSchema.index({ category: 1, publishedAt: -1 });
newsArticleSchema.index({ 'source.name': 1, publishedAt: -1 });
newsArticleSchema.index({ title: 'text', description: 'text' });

// Method to calculate popularity score
newsArticleSchema.methods.calculatePopularityScore = function() {
  const ageInHours = (Date.now() - this.publishedAt) / (1000 * 60 * 60);
  const timeFactor = Math.max(1, 24 / (ageInHours + 1)); // Newer articles get higher score
  this.popularity.score = (this.popularity.views * 0.3 + this.popularity.shares * 0.7) * timeFactor;
  return this.popularity.score;
};

// Static method to find trending articles
newsArticleSchema.statics.findTrending = function(limit = 10, category = null) {
  const query = category ? { category } : {};
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.find({
    ...query,
    publishedAt: { $gte: twentyFourHoursAgo }
  })
  .sort({ 'popularity.score': -1 })
  .limit(limit);
};

module.exports = mongoose.model('NewsArticle', newsArticleSchema);