const { OpenAI } = require('openai');
const cacheManager = require('./cache');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSummary(article) {
    try {
      // Check cache first
      const cacheKey = cacheManager.summaryKey(article._id || article.url);
      const cached = await cacheManager.get(cacheKey);
      if (cached) return cached;

      const prompt = `Please provide a concise summary of the following news article. Include:
1. A brief 2-3 sentence summary
2. 3-5 key points or takeaways
3. The overall sentiment (positive, negative, or neutral)

Article Title: ${article.title}
Article Content: ${article.content || article.description}

Format the response as JSON with the following structure:
{
  "summary": "Brief summary here",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "sentiment": "positive/negative/neutral"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful news analyst that provides concise, accurate summaries of news articles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // Cache the result for 24 hours
      await cacheManager.set(cacheKey, result, 86400);
      
      return result;
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        summary: article.description || 'Summary generation failed',
        keyPoints: [],
        sentiment: 'neutral'
      };
    }
  }

  async categorizeArticle(article) {
    try {
      const prompt = `Categorize the following news article into one of these categories:
      - technology
      - business
      - entertainment
      - health
      - science
      - sports
      - politics
      - world
      - lifestyle
      - other

      Article Title: ${article.title}
      Article Description: ${article.description}

      Respond with only the category name.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a news categorization expert. Respond with only the category name.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      const category = response.choices[0].message.content.trim().toLowerCase();
      const validCategories = ['technology', 'business', 'entertainment', 'health', 'science', 'sports', 'politics', 'world', 'lifestyle'];
      
      return validCategories.includes(category) ? category : 'other';
    } catch (error) {
      console.error('Error categorizing article:', error);
      return 'other';
    }
  }

  async chatWithNews(messages, context = null) {
    try {
      const systemMessage = {
        role: 'system',
        content: `You are a knowledgeable news analyst assistant. You help users understand news articles, their implications, and answer questions about current events. 
        ${context ? `Context: ${JSON.stringify(context)}` : ''}
        Be informative, balanced, and cite sources when possible.`
      };

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message;
    } catch (error) {
      console.error('Error in chat:', error);
      throw new Error('Failed to process chat request');
    }
  }

  async analyzeNewsImpact(article, topic) {
    try {
      const prompt = `Analyze the potential impact of this news on ${topic}:

      News Title: ${article.title}
      News Summary: ${article.description}
      ${article.aiSummary?.summary ? `AI Summary: ${article.aiSummary.summary}` : ''}

      Please provide:
      1. Direct impacts on ${topic}
      2. Potential indirect effects
      3. Short-term vs long-term implications
      4. Confidence level in the analysis (low/medium/high)

      Format as JSON.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert analyst who provides balanced, thoughtful analysis of news impacts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing impact:', error);
      throw new Error('Failed to analyze news impact');
    }
  }

  async extractEntities(text) {
    try {
      const prompt = `Extract key entities from this text:
      "${text}"
      
      Return JSON with: { "people": [], "organizations": [], "locations": [], "topics": [] }`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error extracting entities:', error);
      return { people: [], organizations: [], locations: [], topics: [] };
    }
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService;