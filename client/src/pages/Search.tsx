import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  ExternalLink, 
  Share2,
  Sparkles,
  Target
} from 'lucide-react';
import { useNews } from '../contexts/NewsContext';
import { useChat } from '../contexts/ChatContext';
import { NewsArticle } from '../types';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NewsArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'relevance' as 'relevance' | 'date' | 'popularity',
  });
  
  const { searchNews } = useNews();
  const { generateSummary, analyzeArticle } = useChat();
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchNews(query, filters);
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (query) {
      performSearch(query);
    }
  };

  const handleGenerateSummary = async (article: NewsArticle) => {
    setSummaryLoading(true);
    try {
      const summary = await generateSummary(article);
      toast.success('Summary generated successfully!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAnalyzeArticle = async (article: NewsArticle) => {
    setAnalysisLoading(true);
    try {
      const analysis = await analyzeArticle(article);
      toast.success('Analysis completed!');
    } catch (error) {
      toast.error('Failed to analyze article');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleShare = async (article: NewsArticle) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url,
        });
      } else {
        await navigator.clipboard.writeText(article.url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share article');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      technology: 'category-tech',
      business: 'category-business',
      science: 'category-science',
      sports: 'category-sports',
      entertainment: 'category-entertainment',
      general: 'category-general',
    };
    return colors[category.toLowerCase()] || 'category-general';
  };

  const SearchResultCard: React.FC<{ article: NewsArticle; index: number }> = ({ article, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-hover p-6"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image */}
        {article.urlToImage && (
          <div className="lg:w-1/4">
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-48 lg:h-32 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Category and Source */}
          <div className="flex items-center justify-between">
            <span className={`category-badge ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
            <span className="text-xs text-gray-500">{article.source}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600 transition-colors"
            >
              {article.title}
            </a>
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-3">
            {article.description}
          </p>

          {/* Meta and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
              </div>
              {article.author && (
                <span>by {article.author}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleGenerateSummary(article)}
                disabled={summaryLoading}
                className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50 px-3 py-1 rounded-lg hover:bg-primary-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>Summarize</span>
              </button>
              <button
                onClick={() => handleAnalyzeArticle(article)}
                disabled={analysisLoading}
                className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50 px-3 py-1 rounded-lg hover:bg-primary-50"
              >
                <Target className="w-3 h-3" />
                <span>Analyze</span>
              </button>
              <button
                onClick={() => handleShare(article)}
                className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-50"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Read</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search News</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for news articles..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary py-2 px-4"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            <option value="technology">Technology</option>
            <option value="business">Business</option>
            <option value="science">Science</option>
            <option value="sports">Sports</option>
            <option value="entertainment">Entertainment</option>
            <option value="general">General</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="popularity">Popularity</option>
          </select>
        </div>
      </div>

      {/* Search Results */}
      {query && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Search Results for "{query}"
          </h2>
          <p className="text-gray-600">
            Found {searchResults.length} article{searchResults.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Searching...</p>
        </div>
      )}

      {/* Results */}
      {!isSearching && query && (
        <div className="space-y-6">
          {searchResults.map((article, index) => (
            <SearchResultCard key={`${article.url}-${index}`} article={article} index={index} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isSearching && query && searchResults.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!query && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
          <p className="text-gray-600">
            Enter keywords to search through millions of news articles from trusted sources.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;