import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  TrendingUp, 
  Filter, 
  Sparkles,
  ExternalLink,
  Share2,
  Bookmark
} from 'lucide-react';
import { useNews } from '../contexts/NewsContext';
import { useChat } from '../contexts/ChatContext';
import { NewsArticle } from '../types';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NewsFeed: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const { articles, loading, error, filters, setFilters, fetchNews } = useNews();
  const { generateSummary, analyzeArticle } = useChat();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFilters({ ...filters, category, page: 1 });
    } else {
      setFilters({ ...filters, category: undefined, page: 1 });
    }
  }, [category]);

  const handleSortChange = (sort: 'latest' | 'popularity') => {
    setFilters({ ...filters, sort, page: 1 });
  };

  const handleLoadMore = () => {
    setFilters({ ...filters, page: (filters.page || 1) + 1 });
  };

  const handleGenerateSummary = async (article: NewsArticle) => {
    setSummaryLoading(true);
    try {
      const summary = await generateSummary(article);
      setSelectedArticle({ ...article, summary: summary.summary });
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
      setSelectedArticle({ ...article, analysis: analysis.analysis });
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

  const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="news-card"
    >
      {/* Image */}
      {article.urlToImage && (
        <div className="relative">
          <img
            src={article.urlToImage}
            alt={article.title}
            className="news-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute top-2 right-2 flex space-x-1">
            <button
              onClick={() => handleShare(article)}
              className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <Share2 className="w-3 h-3" />
            </button>
            <button className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors">
              <Bookmark className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        {/* Category and Source */}
        <div className="flex items-center justify-between">
          <span className={`category-badge ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          <span className="text-xs text-gray-500">{article.source}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
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

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
          </div>
          {article.author && (
            <span>by {article.author}</span>
          )}
        </div>

        {/* AI Actions */}
        <div className="flex space-x-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => handleGenerateSummary(article)}
            disabled={summaryLoading}
            className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            <span>Summarize</span>
          </button>
          <button
            onClick={() => handleAnalyzeArticle(article)}
            disabled={analysisLoading}
            className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Analyze</span>
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 ml-auto"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Read</span>
          </a>
        </div>

        {/* AI Summary */}
        {article.summary && (
          <div className="bg-primary-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-primary-800 mb-1">AI Summary</h4>
            <p className="text-sm text-primary-700">{article.summary}</p>
          </div>
        )}

        {/* AI Analysis */}
        {article.analysis && (
          <div className="bg-accent-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-accent-800 mb-1">AI Analysis</h4>
            <p className="text-sm text-accent-700">{article.analysis}</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading News</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => fetchNews()}
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} News` : 'Latest News'}
        </h1>
        <p className="text-gray-600">
          Stay informed with the latest {category ? category : 'news'} from trusted sources
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleSortChange('latest')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filters.sort === 'latest'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            Latest
          </button>
          <button
            onClick={() => handleSortChange('popularity')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filters.sort === 'popularity'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Popular
          </button>
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <NewsCard key={`${article.url}-${index}`} article={article} />
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading news...</p>
        </div>
      )}

      {/* Load More */}
      {articles.length > 0 && !loading && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="btn-outline"
          >
            Load More Articles
          </button>
        </div>
      )}

      {/* Empty State */}
      {articles.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
          <p className="text-gray-600">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;