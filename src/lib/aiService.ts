import OpenAI from 'openai';
import { NewsArticle, ChatMessage } from '@/types';

export class AIService {
  private static instance: AIService;
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
      });
    }
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async summarizeArticle(article: NewsArticle): Promise<string> {
    if (!this.openai) {
      return this.generateFallbackSummary(article);
    }

    try {
      const prompt = `Please provide a concise 2-3 sentence summary of this news article:

Title: ${article.title}
Description: ${article.description}
Content: ${article.content || article.description}

Summary:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || this.generateFallbackSummary(article);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return this.generateFallbackSummary(article);
    }
  }

  async chatWithAI(messages: ChatMessage[], context?: NewsArticle[]): Promise<string> {
    if (!this.openai) {
      return "I'm sorry, but the AI chatbot is currently unavailable. Please check your OpenAI API configuration.";
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: chatMessages,
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this time.";
    } catch (error) {
      console.error('Error in AI chat:', error);
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }

  async analyzeNewsImpact(query: string, articles: NewsArticle[]): Promise<string> {
    if (!this.openai) {
      return "AI analysis is currently unavailable. Please check your OpenAI API configuration.";
    }

    try {
      const relevantArticles = articles.slice(0, 5); // Limit context
      const articlesContext = relevantArticles.map(article => 
        `Title: ${article.title}\nDescription: ${article.description}\nSource: ${article.source.name}\n`
      ).join('\n---\n');

      const prompt = `Based on the following recent news articles, please analyze the potential impact of "${query}":

Recent News Context:
${articlesContext}

Query: ${query}

Please provide a comprehensive analysis of the potential impacts, considering economic, social, and other relevant factors. Be specific and reference the news context where applicable.

Analysis:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.6
      });

      return response.choices[0]?.message?.content || "I couldn't generate an analysis at this time.";
    } catch (error) {
      console.error('Error analyzing news impact:', error);
      return "I'm experiencing technical difficulties analyzing the impact. Please try again later.";
    }
  }

  private buildSystemPrompt(context?: NewsArticle[]): string {
    let prompt = `You are a helpful news assistant AI. You can help users understand news articles, analyze trends, and discuss current events. 

Your capabilities include:
- Summarizing news articles
- Analyzing the impact of news events
- Answering questions about current events
- Providing context and background information
- Discussing implications of news on various sectors

Be informative, objective, and helpful. Cite specific news articles when relevant.`;

    if (context && context.length > 0) {
      prompt += `\n\nCurrent news context:\n`;
      context.slice(0, 3).forEach((article, index) => {
        prompt += `${index + 1}. ${article.title} (${article.source.name})\n   ${article.description}\n\n`;
      });
    }

    return prompt;
  }

  private generateFallbackSummary(article: NewsArticle): string {
    const description = article.description || '';
    if (description.length <= 200) {
      return description;
    }
    
    // Simple extractive summary - take first two sentences
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }
}