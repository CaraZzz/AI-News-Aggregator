const express = require('express');
const router = express.Router();
const aiService = require('../utils/aiService');
const NewsArticle = require('../models/NewsArticle');

// Chat endpoint for GPT-based chatbot
router.post('/chat', async (req, res) => {
  try {
    const { messages, articleId, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // If articleId is provided, include article context
    let enrichedContext = context || {};
    if (articleId) {
      const article = await NewsArticle.findById(articleId);
      if (article) {
        enrichedContext = {
          ...enrichedContext,
          article: {
            title: article.title,
            description: article.description,
            summary: article.aiSummary?.summary,
            category: article.category,
            source: article.source.name,
            publishedAt: article.publishedAt
          }
        };
      }
    }

    const response = await aiService.chatWithNews(messages, enrichedContext);
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Analyze news impact on a specific topic
router.post('/analyze-impact', async (req, res) => {
  try {
    const { articleId, topic } = req.body;

    if (!articleId || !topic) {
      return res.status(400).json({ error: 'Article ID and topic are required' });
    }

    const article = await NewsArticle.findById(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const analysis = await aiService.analyzeNewsImpact(article, topic);
    res.json(analysis);
  } catch (error) {
    console.error('Impact analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze news impact' });
  }
});

// Generate summary for an article
router.post('/summarize', async (req, res) => {
  try {
    const { articleId, content, title } = req.body;

    let article;
    if (articleId) {
      article = await NewsArticle.findById(articleId);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
    } else if (content && title) {
      // Allow summarizing custom content
      article = { title, content, description: content.substring(0, 200) };
    } else {
      return res.status(400).json({ error: 'Article ID or content with title is required' });
    }

    const summary = await aiService.generateSummary(article);
    
    // Save summary if it's a database article
    if (articleId && article._id) {
      article.aiSummary = {
        ...summary,
        generatedAt: new Date()
      };
      article.sentiment = summary.sentiment;
      await article.save();
    }

    res.json(summary);
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Extract entities from text
router.post('/extract-entities', async (req, res) => {
  try {
    const { text, articleId } = req.body;

    let textToAnalyze = text;
    if (articleId && !text) {
      const article = await NewsArticle.findById(articleId);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      textToAnalyze = `${article.title} ${article.description} ${article.content || ''}`;
    }

    if (!textToAnalyze) {
      return res.status(400).json({ error: 'Text or article ID is required' });
    }

    const entities = await aiService.extractEntities(textToAnalyze);
    res.json(entities);
  } catch (error) {
    console.error('Entity extraction error:', error);
    res.status(500).json({ error: 'Failed to extract entities' });
  }
});

// Get AI-powered news recommendations based on reading history
router.post('/recommendations', async (req, res) => {
  try {
    const { viewedArticleIds = [], preferences = {} } = req.body;

    // Get viewed articles
    const viewedArticles = await NewsArticle.find({
      _id: { $in: viewedArticleIds }
    }).lean();

    if (viewedArticles.length === 0) {
      // Return popular articles if no history
      const popularArticles = await NewsArticle
        .find({})
        .sort({ 'popularity.score': -1 })
        .limit(10)
        .lean();
      
      return res.json(popularArticles);
    }

    // Analyze user preferences from viewed articles
    const categoryCount = {};
    const sourceCount = {};
    const keywords = new Set();

    viewedArticles.forEach(article => {
      categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
      sourceCount[article.source.name] = (sourceCount[article.source.name] || 0) + 1;
      
      // Extract keywords from titles
      const titleWords = article.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 4) keywords.add(word);
      });
    });

    // Get top categories and sources
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const topSources = Object.entries(sourceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([source]) => source);

    // Build recommendation query
    const recommendationQuery = {
      _id: { $nin: viewedArticleIds },
      $or: [
        { category: { $in: topCategories } },
        { 'source.name': { $in: topSources } },
        { $text: { $search: Array.from(keywords).slice(0, 5).join(' ') } }
      ]
    };

    // Apply user preferences
    if (preferences.categories?.length > 0) {
      recommendationQuery.category = { $in: preferences.categories };
    }

    const recommendations = await NewsArticle
      .find(recommendationQuery)
      .sort({ publishedAt: -1, 'popularity.score': -1 })
      .limit(20)
      .lean();

    res.json({
      recommendations,
      basedOn: {
        categories: topCategories,
        sources: topSources,
        keywords: Array.from(keywords).slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Batch generate summaries for multiple articles
router.post('/batch-summarize', async (req, res) => {
  try {
    const { articleIds, limit = 10 } = req.body;

    if (!articleIds || !Array.isArray(articleIds)) {
      return res.status(400).json({ error: 'Article IDs array is required' });
    }

    const limitedIds = articleIds.slice(0, Math.min(limit, 20)); // Max 20 at a time
    
    const articles = await NewsArticle.find({
      _id: { $in: limitedIds },
      'aiSummary.summary': { $exists: false }
    });

    const summaryPromises = articles.map(article => 
      aiService.generateSummary(article)
        .then(summary => ({
          articleId: article._id,
          summary,
          success: true
        }))
        .catch(error => ({
          articleId: article._id,
          error: error.message,
          success: false
        }))
    );

    const results = await Promise.all(summaryPromises);

    // Save successful summaries
    for (const result of results) {
      if (result.success) {
        await NewsArticle.findByIdAndUpdate(result.articleId, {
          aiSummary: {
            ...result.summary,
            generatedAt: new Date()
          },
          sentiment: result.summary.sentiment
        });
      }
    }

    res.json({
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Batch summarization error:', error);
    res.status(500).json({ error: 'Failed to batch summarize articles' });
  }
});

module.exports = router;