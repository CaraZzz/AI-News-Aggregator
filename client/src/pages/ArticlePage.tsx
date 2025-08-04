import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { 
  Loader, 
  ArrowLeft, 
  ExternalLink, 
  Share2, 
  Calendar,
  User,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: article, isLoading } = useQuery(
    ['article', id],
    async () => {
      const response = await axios.get(`/api/news/article/${id}`);
      return response.data;
    }
  );

  const handleShare = async () => {
    if (!article) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleAskAI = () => {
    // This would open the chat widget with context about this article
    const event = new CustomEvent('openChatWithContext', { 
      detail: { articleId: article._id } 
    });
    window.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Article not found</p>
        <Link 
          to="/" 
          className="mt-4 inline-flex items-center space-x-2 text-gray-900 dark:text-white hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} - NewsHub</title>
        <meta name="description" content={article.description} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        {article.urlToImage && <meta property="og:image" content={article.urlToImage} />}
      </Helmet>

      <article className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
              {article.category}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {article.source.name}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <time dateTime={article.publishedAt}>
                  {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                </time>
              </div>
              {article.author && (
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{article.author}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Read Original</span>
              </a>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.urlToImage && (
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-auto rounded-xl mb-8"
          />
        )}

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p className="lead text-xl text-gray-700 dark:text-gray-300">
            {article.description}
          </p>

          {article.content && (
            <div className="mt-6 whitespace-pre-wrap">
              {article.content}
            </div>
          )}
        </div>

        {/* AI Summary */}
        {article.aiSummary && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Summary</h2>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {article.aiSummary.summary}
            </p>

            {article.aiSummary.keyPoints.length > 0 && (
              <>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Key Points:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {article.aiSummary.keyPoints.map((point, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">
                      {point}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleAskAI}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Ask AI about this article</span>
              </button>
            </div>
          </div>
        )}

        {/* Article Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <span>{article.popularity.views} views</span>
          <span>{article.popularity.shares} shares</span>
          <span>Sentiment: {article.sentiment || 'neutral'}</span>
        </div>
      </article>
    </>
  );
};

export default ArticlePage;