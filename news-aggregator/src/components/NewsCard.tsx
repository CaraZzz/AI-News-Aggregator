import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { format } from 'date-fns';
import { Clock, ExternalLink, Sparkles, TrendingUp } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
  onGenerateSummary?: (article: NewsArticle) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onGenerateSummary }) => {
  const [showSummary, setShowSummary] = useState(false);
  
  const handleSummaryClick = () => {
    if (!article.aiSummary && onGenerateSummary) {
      onGenerateSummary(article);
    }
    setShowSummary(!showSummary);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {article.urlToImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=News+Image';
            }}
          />
          {article.popularity && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md flex items-center gap-1 text-sm">
              <TrendingUp size={14} />
              {article.popularity}%
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{article.source.name}</span>
          {article.category && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {article.category}
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{article.title}</h3>
        
        {article.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.description}</p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
          </div>
          {article.author && (
            <span className="truncate max-w-[150px]">by {article.author}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handleSummaryClick}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Sparkles size={16} />
            <span className="text-sm font-medium">
              {showSummary ? 'Hide' : 'Show'} AI Summary
            </span>
          </button>
          
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span className="text-sm font-medium">Read More</span>
            <ExternalLink size={14} />
          </a>
        </div>
        
        {showSummary && article.aiSummary && (
          <div className="mt-3 p-3 bg-purple-50 rounded-md">
            <p className="text-sm text-gray-700">{article.aiSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
};