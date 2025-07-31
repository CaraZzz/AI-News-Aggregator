import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  Share2, 
  Bookmark,
  Sparkles,
  Target
} from 'lucide-react';
import { useQuery } from 'react-query';
import { useChat } from '../contexts/ChatContext';
import { NewsArticle } from '../types';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const Trending: React.FC = () => {
  const { generateSummary, analyzeArticle } = useChat();
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const { data: trendingData, isLoading, error } = useQuery(
    'trending',
    async () => {
      const response = await axios.get('/api/news/trending');
      return response.data;
    },
    {
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trending news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Trending News</h2>
          <p className="text-gray-600">Failed to load trending articles</p>
        </div>
      </div>
    );
  }

  const trendingArticles = trendingData?.trending || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Trending Now</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The most popular and engaging stories that everyone is talking about right now
        </p>
      </div>

      {/* Trending Articles */}
      <div className="space-y-8">
        {trendingArticles.map((article: NewsArticle, index: number) => (
          <motion.div
            key={`${article.url}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-hover p-6"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Image */}
              {article.urlToImage && (
                <div className="lg:w-1/3">
                  <div className="relative">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-full h-48 lg:h-32 object-cover rounded-lg"
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
                </div>
              )}

              {/* Content */}
              <div className="flex-1 space-y-4">
                {/* Rank and Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <span className={`category-badge ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{article.source}</span>
                </div>

                {/* Title */}
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 transition-colors"
                  >
                    {article.title}
                  </a>
                </h2>

                {/* Description */}
                <p className="text-gray-600 line-clamp-3">
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
                    {article.popularity && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{article.popularity}% trending</span>
                      </div>
                    )}
                  </div>

                  {/* AI Actions */}
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
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-50"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Read Full</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {trendingArticles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trending articles</h3>
          <p className="text-gray-600">Check back later for the latest trending stories.</p>
        </div>
      )}

      {/* Update Info */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Trending data updates every 5 minutes • Based on reader engagement and social activity
        </p>
      </div>
    </div>
  );
};

export default Trending;