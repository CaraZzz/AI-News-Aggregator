const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate AI summary for news article
router.post('/summarize', async (req, res) => {
  try {
    const { title, content, url } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const prompt = `Please provide a comprehensive analysis of the following news article:

Title: ${title}
Content: ${content.substring(0, 2000)}...

Please provide:
1. A concise 2-3 sentence summary
2. Key takeaways (3-4 bullet points)
3. Potential implications or significance

Summary:`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional news analyst. Provide clear, concise summaries that capture the essence of news articles with key implications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });
    
    const summary = completion.choices[0].message.content.trim();
    
    res.json({
      summary,
      originalTitle: title,
      url,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      message: error.message 
    });
  }
});

// Enhanced news impact analysis
router.post('/analyze-impact', async (req, res) => {
  try {
    const { title, content, category, sector } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const prompt = `Analyze the potential impact of this news article:

Title: ${title}
Category: ${category || 'General'}
Content: ${content.substring(0, 1500)}...

Please provide a comprehensive impact analysis including:

1. **Market Impact**: How might this affect relevant markets/sectors?
2. **Economic Implications**: Broader economic consequences
3. **Social/Political Impact**: Effects on society or policy
4. **Timeline**: Short-term vs long-term effects
5. **Stakeholders**: Who is most affected?
6. **Risk Assessment**: Potential risks or opportunities
7. **Sentiment**: Overall positive, negative, or neutral outlook

${sector ? `Focus particularly on impact for the ${sector} sector.` : ''}

Analysis:`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert financial and news analyst. Provide detailed, structured impact analysis of news events covering economic, social, and market implications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.4,
    });
    
    const analysis = completion.choices[0].message.content.trim();
    
    res.json({
      analysis,
      category,
      sector,
      title,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing impact:', error);
    res.status(500).json({ 
      error: 'Failed to analyze impact',
      message: error.message 
    });
  }
});

// Enhanced chatbot with better context awareness
router.post('/chat', async (req, res) => {
  try {
    const { message, context = [], newsContext = [], userIntent } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Build enhanced context from recent news
    let newsContextText = '';
    if (newsContext.length > 0) {
      const recentNews = newsContext.slice(0, 5);
      newsContextText = `\n\nCurrent news context (last 5 articles):\n${recentNews.map((article, idx) => 
        `${idx + 1}. ${article.title} [${article.category || 'General'}]
   Summary: ${article.description?.substring(0, 150)}...
   Source: ${article.source || 'Unknown'}`
      ).join('\n\n')}`;
    }

    // Detect user intent for better responses
    const intentPrompts = {
      impact: "Focus on analyzing potential impacts and implications of the news discussed.",
      summary: "Provide clear, concise summaries and explanations.",
      trends: "Identify and explain relevant trends and patterns in the news.",
      comparison: "Compare and contrast different aspects or viewpoints.",
      prediction: "Offer thoughtful analysis about potential future developments.",
      explanation: "Explain complex topics in simple, understandable terms."
    };

    const intentGuidance = userIntent && intentPrompts[userIntent] 
      ? `\n\nUser Intent: ${intentPrompts[userIntent]}` 
      : '';
    
    const systemPrompt = `You are an advanced AI news assistant with expertise in:

🔍 **Core Capabilities:**
- News impact analysis across multiple sectors (finance, tech, politics, healthcare, etc.)
- Market implications and economic analysis
- Trend identification and pattern recognition
- Complex topic explanation in accessible language
- Multi-perspective analysis of news events
- Real-time context awareness

📊 **Analysis Framework:**
- Always consider both immediate and long-term implications
- Provide balanced perspectives when discussing controversial topics
- Use specific examples and data points when available
- Consider global vs local impact
- Identify key stakeholders and affected parties

🎯 **Response Style:**
- Be conversational yet informative
- Use structured formatting (bullet points, sections) for complex topics
- Provide actionable insights when relevant
- Acknowledge uncertainty when appropriate
- Ask clarifying questions to better assist the user

${newsContextText}${intentGuidance}

Remember: You're helping users navigate and understand the complex world of news and current events.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...context.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 700,
      temperature: 0.7,
    });
    
    const response = completion.choices[0].message.content.trim();
    
    res.json({
      response,
      timestamp: new Date().toISOString(),
      messageId: Date.now().toString(),
      contextUsed: newsContext.length > 0,
      intent: userIntent
    });
    
  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      message: error.message 
    });
  }
});

// Sentiment analysis for news articles
router.post('/sentiment', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const prompt = `Analyze the sentiment and tone of this news article:

Title: ${title}
Content: ${content.substring(0, 1000)}...

Provide a JSON response with:
- overall_sentiment: "positive", "negative", or "neutral"
- confidence: 0-100 (how confident you are in the sentiment)
- emotional_tone: array of emotions detected
- key_phrases: important phrases that influence sentiment
- bias_indicators: any potential bias detected

Response (JSON only):`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze news articles for sentiment, emotional tone, and potential bias. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.2,
    });
    
    try {
      const sentimentData = JSON.parse(completion.choices[0].message.content.trim());
      res.json({
        ...sentimentData,
        title,
        analyzedAt: new Date().toISOString()
      });
    } catch (parseError) {
      res.json({
        overall_sentiment: "neutral",
        confidence: 50,
        emotional_tone: ["informational"],
        key_phrases: [],
        bias_indicators: [],
        title,
        analyzedAt: new Date().toISOString(),
        note: "Could not parse detailed analysis"
      });
    }
    
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ 
      error: 'Failed to analyze sentiment',
      message: error.message 
    });
  }
});

// Quick AI insights for trending topics
router.post('/trending-insights', async (req, res) => {
  try {
    const { articles } = req.body;
    
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Articles array is required' });
    }
    
    const articleSummaries = articles.slice(0, 10).map((article, idx) => 
      `${idx + 1}. ${article.title} [${article.category || 'General'}]`
    ).join('\n');
    
    const prompt = `Analyze these trending news articles and provide insights:

${articleSummaries}

Provide:
1. **Major Themes**: What are the dominant topics?
2. **Interconnections**: How do these stories relate to each other?
3. **Market Implications**: Potential economic/financial impacts
4. **Global vs Local**: Which stories have broader implications?
5. **Key Takeaways**: 3-4 main insights for news consumers

Analysis:`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a news trends analyst. Identify patterns, connections, and implications across multiple news stories."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.6,
    });
    
    const insights = completion.choices[0].message.content.trim();
    
    res.json({
      insights,
      articleCount: articles.length,
      analyzedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating trending insights:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      message: error.message 
    });
  }
});

// Generate quick action suggestions based on news
router.post('/action-suggestions', async (req, res) => {
  try {
    const { title, content, category, userProfile = {} } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const userContext = userProfile.interests 
      ? `User interests: ${userProfile.interests.join(', ')}` 
      : '';
    
    const prompt = `Based on this news article, suggest actionable insights:

Title: ${title}
Category: ${category || 'General'}
Content: ${content.substring(0, 800)}...
${userContext}

Provide actionable suggestions in these categories:
1. **For Investors**: Financial/investment considerations
2. **For Consumers**: How this might affect everyday life
3. **For Professionals**: Career or business implications
4. **For Citizens**: Civic or social actions to consider
5. **Follow-up**: What to monitor or research further

Keep suggestions practical and specific.

Suggestions:`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a practical advice assistant. Provide actionable, specific suggestions based on news events."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.5,
    });
    
    const suggestions = completion.choices[0].message.content.trim();
    
    res.json({
      suggestions,
      category,
      title,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating action suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      message: error.message 
    });
  }
});

module.exports = router;