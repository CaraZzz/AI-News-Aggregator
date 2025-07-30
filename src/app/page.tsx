'use client';

import { useState, useEffect } from 'react';
import { NewsArticle, NewsCategory, SortOption, CustomSource, ChatMessage } from '@/types';
import { NewsService } from '@/lib/newsService';
import { AIService } from '@/lib/aiService';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import SortSelector from '@/components/SortSelector';
import NewsGrid from '@/components/NewsGrid';
import ChatBot from '@/components/ChatBot';
import CustomSourceManager from '@/components/CustomSourceManager';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.LATEST);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showCustomSources, setShowCustomSources] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const newsService = NewsService.getInstance();
  const aiService = AIService.getInstance();

  useEffect(() => {
    loadNews();
    loadCustomSources();
  }, []);

  useEffect(() => {
    filterAndSortArticles();
  }, [articles, selectedCategory, sortBy, searchQuery]);

  const loadNews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newsArticles = await newsService.fetchNewsFromAPI();
      const rssArticles = await newsService.fetchFromRSSFeeds();
      
      // Combine and deduplicate articles
      const allArticles = [...newsArticles, ...rssArticles];
      const uniqueArticles = allArticles.filter((article, index, self) => 
        self.findIndex(a => a.url === article.url) === index
      );

      // Generate AI summaries for first few articles
      const articlesWithSummaries = await Promise.all(
        uniqueArticles.slice(0, 10).map(async (article) => {
          try {
            const summary = await aiService.summarizeArticle(article);
            return { ...article, aiSummary: summary };
          } catch {
            return article;
          }
        })
      );

      // Add remaining articles without summaries
      const finalArticles = [
        ...articlesWithSummaries,
        ...uniqueArticles.slice(10)
      ];

      setArticles(finalArticles);
    } catch (err) {
      setError('Failed to load news. Please try again later.');
      console.error('Error loading news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomSources = () => {
    const saved = localStorage.getItem('customSources');
    if (saved) {
      setCustomSources(JSON.parse(saved));
    }
  };

  const saveCustomSources = (sources: CustomSource[]) => {
    setCustomSources(sources);
    localStorage.setItem('customSources', JSON.stringify(sources));
  };

  const filterAndSortArticles = () => {
    let filtered = articles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.source.name.toLowerCase().includes(query)
      );
    }

    // Sort articles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case SortOption.LATEST:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case SortOption.POPULARITY:
          return (b.popularity || 0) - (a.popularity || 0);
        default:
          return 0;
      }
    });

    setFilteredArticles(filtered);
  };

  const handleChatMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);

    try {
      const response = await aiService.chatWithAI(updatedMessages, filteredArticles.slice(0, 5));
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setChatMessages([...updatedMessages, aiMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
    }
  };

  const refreshNews = () => {
    loadNews();
  };

  if (isLoading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onRefresh={refreshNews}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleCustomSources={() => setShowCustomSources(!showCustomSources)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
      />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Filters and Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
                <SortSelector
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            </div>

            {/* News Grid */}
            {filteredArticles.length > 0 ? (
              <NewsGrid articles={filteredArticles} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'No articles found matching your criteria.' 
                    : 'No articles available.'}
                </p>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          {isChatOpen && (
            <div className="lg:w-96">
              <ChatBot
                messages={chatMessages}
                onSendMessage={handleChatMessage}
                isAIAvailable={aiService.isAvailable()}
              />
            </div>
          )}
        </div>
      </main>

      {/* Custom Sources Modal */}
      {showCustomSources && (
        <CustomSourceManager
          customSources={customSources}
          onSave={saveCustomSources}
          onClose={() => setShowCustomSources(false)}
        />
      )}
    </div>
  );
}