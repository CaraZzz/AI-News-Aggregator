import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Share2, 
  Eye, 
  TrendingUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

interface NewsArticle {
  _id: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    name: string;
    type: string;
  };
  category: string;
  aiSummary?: {
    summary: string;
    keyPoints: string[];
    sentiment: string;
  };
  popularity: {
    views: number;
    shares: number;
    score: number;
  };
}

interface NewsCardProps {
  article: NewsArticle;
  compact?: boolean;
  showSummary?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, compact = false, showSummary = true }) => {
  const [imageError, setImageError] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSharing(true);

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

      // Track share
      await axios.post(`/api/news/article/${article._id}/share`);
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg transition-all"
      >
        <Link to={`/article/${article._id}`} className="block">
          <div className="flex items-start space-x-3">
            {article.urlToImage && !imageError && (
              <img
                src={article.urlToImage}
                alt={article.title}
                onError={() => setImageError(true)}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                {article.title}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{article.source.name}</span>
                <span>•</span>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden"
    >
      <Link to={`/article/${article._id}`} className="block">
        {article.urlToImage && !imageError && (
          <div className="relative h-48 md:h-56 overflow-hidden">
            <img
              src={article.urlToImage}
              alt={article.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-900 dark:text-white">
                {article.category}
              </span>
            </div>
          </div>
        )}
        
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">{article.source.name}</span>
              <span>•</span>
              <time dateTime={article.publishedAt}>{timeAgo}</time>
            </div>
            {article.popularity.score > 50 && (
              <TrendingUp className="h-4 w-4 text-orange-500" />
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {article.title}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
            {article.description}
          </p>

          {showSummary && article.aiSummary && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-1 mb-1">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Summary</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {article.aiSummary.summary}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{article.popularity.views}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Share2 className="h-4 w-4" />
                <span>{article.popularity.shares}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default NewsCard;