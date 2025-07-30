'use client';

import { useState } from 'react';
import { NewsArticle } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Clock, User, Sparkles, Eye, EyeOff } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  const handleCardClick = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'business': 'bg-green-100 text-green-800',
      'technology': 'bg-blue-100 text-blue-800',
      'entertainment': 'bg-purple-100 text-purple-800',
      'health': 'bg-red-100 text-red-800',
      'science': 'bg-indigo-100 text-indigo-800',
      'sports': 'bg-orange-100 text-orange-800',
      'politics': 'bg-yellow-100 text-yellow-800',
      'world': 'bg-gray-100 text-gray-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['general'];
  };

  return (
    <div className="news-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Image */}
      {article.urlToImage && !imageError && (
        <div className="relative h-48 bg-gray-200">
          <img
            src={article.urlToImage}
            alt={article.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-300 w-full h-full"></div>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Category and Time */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(article.category)}`}>
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </span>
          <div className="flex items-center text-gray-500 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo}
          </div>
        </div>

        {/* Title */}
        <h3 
          className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={handleCardClick}
        >
          {article.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {article.description}
        </p>

        {/* AI Summary Toggle */}
        {article.aiSummary && (
          <div className="mb-3">
            <button
              onClick={() => setShowAISummary(!showAISummary)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Summary
              {showAISummary ? (
                <EyeOff className="h-4 w-4 ml-1" />
              ) : (
                <Eye className="h-4 w-4 ml-1" />
              )}
            </button>
            
            {showAISummary && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-gray-700 italic">
                  {article.aiSummary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-gray-500 text-xs">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[120px]">
              {article.source.name}
            </span>
            {article.author && (
              <>
                <span className="mx-1">•</span>
                <span className="truncate max-w-[100px]">
                  {article.author}
                </span>
              </>
            )}
          </div>
          
          <button
            onClick={handleCardClick}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Read More
            <ExternalLink className="h-3 w-3 ml-1" />
          </button>
        </div>

        {/* Popularity Indicator */}
        {article.popularity && article.popularity > 70 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Trending
          </div>
        )}
      </div>
    </div>
  );
}