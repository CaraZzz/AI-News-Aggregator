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
    
    const prompt = `Please provide a concise summary of the following news article in 2-3 sentences. Focus on the key points and main implications:

Title: ${title}
Content: ${content.substring(0, 1000)}...

Summary:`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional news summarizer. Provide clear, concise summaries that capture the essence of news articles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
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

// Chatbot for news-related questions
router.post('/chat', async (req, res) => {
  try {
    const { message, context = [], newsContext = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Build context from recent news
    let newsContextText = '';
    if (newsContext.length > 0) {
      newsContextText = `\n\nRecent news context:\n${newsContext.slice(0, 3).map(article => 
        `- ${article.title}: ${article.description?.substring(0, 200)}...`
      ).join('\n')}`;
    }
    
    const systemPrompt = `You are an AI news assistant. You help users understand news, analyze trends, and answer questions about current events. 

Key capabilities:
- Analyze news impact on various sectors
- Explain complex news topics in simple terms
- Provide context and background information
- Answer questions about market implications
- Help users understand the significance of news events

${newsContextText}

Please provide helpful, accurate, and informative responses. If you're not sure about something, say so.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...context.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const response = completion.choices[0].message.content.trim();
    
    res.json({
      response,
      timestamp: new Date().toISOString(),
      messageId: Date.now().toString()
    });
    
  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      message: error.message 
    });
  }
});

// Analyze news sentiment and impact
router.post('/analyze', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const prompt = `Analyze the following news article and provide insights on:

1. Sentiment (positive/negative/neutral)
2. Potential impact on relevant sectors
3. Key stakeholders affected
4. Market implications (if applicable)
5. Broader societal impact

Article:
Title: ${title}
Category: ${category || 'General'}
Content: ${content.substring(0, 800)}...

Please provide a structured analysis:`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a news analyst specializing in impact assessment and sentiment analysis. Provide structured, insightful analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.4,
    });
    
    const analysis = completion.choices[0].message.content.trim();
    
    res.json({
      analysis,
      originalTitle: title,
      category,
      analyzedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing news:', error);
    res.status(500).json({ 
      error: 'Failed to analyze news',
      message: error.message 
    });
  }
});

// Generate news insights and trends
router.post('/insights', async (req, res) => {
  try {
    const { articles } = req.body;
    
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Articles array is required' });
    }
    
    const articlesText = articles.slice(0, 5).map((article, index) => 
      `${index + 1}. ${article.title}: ${article.description?.substring(0, 150)}...`
    ).join('\n');
    
    const prompt = `Based on the following recent news articles, provide insights on:

1. Emerging trends
2. Common themes
3. Potential implications
4. What to watch for next

Recent Articles:
${articlesText}

Please provide concise, actionable insights:`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a news trend analyst. Identify patterns, trends, and insights from news articles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.6,
    });
    
    const insights = completion.choices[0].message.content.trim();
    
    res.json({
      insights,
      articlesAnalyzed: articles.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      message: error.message 
    });
  }
});

module.exports = router;