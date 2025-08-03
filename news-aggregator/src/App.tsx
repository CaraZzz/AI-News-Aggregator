import React, { useState, useEffect } from 'react';
import { NewsCard } from './components/NewsCard';
import { CategoryFilter } from './components/CategoryFilter';
import { SourceManager } from './components/SourceManager';
import { ChatBot } from './components/ChatBot';
import { NewsArticle, NewsSource, Category, SortOption } from './types';
import { NewsService } from './services/newsService';
import { Newspaper, TrendingUp, Clock, Menu, X } from 'lucide-react';

const categories: Category[] = [
  { id: 'all', name: 'All News' },
  { id: 'technology', name: 'Technology' },
  { id: 'business', name: 'Business' },
  { id: 'health', name: 'Health' },
  { id: 'sports', name: 'Sports' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'environment', name: 'Environment' }
];

function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [customSources, setCustomSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSourceManager, setShowSourceManager] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, sortBy]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const news = await NewsService.fetchNews(
        selectedCategory === 'all' ? undefined : selectedCategory,
        customSources.filter(s => s.isActive),
        sortBy
      );
      setArticles(news);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = (source: Omit<NewsSource, 'id' | 'addedAt'>) => {
    const newSource: NewsSource = {
      ...source,
      id: Date.now().toString(),
      addedAt: new Date().toISOString()
    };
    setCustomSources([...customSources, newSource]);
  };

  const handleRemoveSource = (id: string) => {
    setCustomSources(customSources.filter(s => s.id !== id));
  };

  const handleToggleSource = (id: string) => {
    setCustomSources(customSources.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const handleGenerateSummary = async (article: NewsArticle) => {
    const summary = await NewsService.generateAISummary(article);
    setArticles(articles.map(a => 
      a.id === article.id ? { ...a, aiSummary: summary } : a
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Newspaper className="text-blue-600" size={28} />
              <h1 className="text-xl font-bold text-gray-900">NewsHub</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setShowSourceManager(!showSourceManager)}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Sources
              </button>
              <div className="flex items-center gap-4 border-l pl-6">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                    sortBy === 'latest' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Clock size={16} />
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                    sortBy === 'popular' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <TrendingUp size={16} />
                  Popular
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => {
                  setShowSourceManager(!showSourceManager);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium"
              >
                Manage Sources
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md ${
                    sortBy === 'latest' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 bg-gray-100'
                  }`}
                >
                  <Clock size={16} />
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md ${
                    sortBy === 'popular' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 bg-gray-100'
                  }`}
                >
                  <TrendingUp size={16} />
                  Popular
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Source Manager */}
        {showSourceManager && (
          <div className="mb-8">
            <SourceManager
              sources={customSources}
              onAddSource={handleAddSource}
              onRemoveSource={handleRemoveSource}
              onToggleSource={handleToggleSource}
            />
          </div>
        )}

        {/* News Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No articles found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onGenerateSummary={handleGenerateSummary}
              />
            ))}
          </div>
        )}
      </main>

      {/* Chat Bot */}
      <ChatBot />
    </div>
  );
}

export default App;
