import React, { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { 
  Filter, 
  ChevronDown, 
  Loader, 
  RefreshCw,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

import NewsCard from '../components/NewsCard';
import { usePreferences } from '../contexts/PreferencesContext';
import { useInView } from 'react-intersection-observer';

const HomePage: React.FC = () => {
  const { preferences, updatePreferences } = usePreferences();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { ref, inView } = useInView();

  const fetchNews = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: pageParam.toString(),
      limit: '20',
      sort: preferences.sortBy,
      ...(selectedCategory !== 'all' && { category: selectedCategory }),
      ...(preferences.categories.length > 0 && selectedCategory === 'all' && { 
        category: preferences.categories.join(',') 
      }),
    });

    const response = await axios.get(`/api/news?${params}`);
    return response.data;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery(
    ['news', selectedCategory, preferences.sortBy],
    fetchNews,
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.page < lastPage.pagination.pages) {
          return lastPage.pagination.page + 1;
        }
        return undefined;
      },
    }
  );

  // Fetch categories
  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/news/categories');
    return response.data;
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = () => {
    refetch();
    toast.success('News refreshed!');
  };

  const sortOptions = [
    { value: 'latest', label: 'Latest', icon: Clock },
    { value: 'popular', label: 'Popular', icon: Sparkles },
    { value: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  const allArticles = data?.pages.flatMap(page => page.articles) || [];

  return (
    <>
      <Helmet>
        <title>NewsHub - AI-Powered News Aggregator</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {selectedCategory === 'all' ? 'Latest News' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </h1>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Filters</span>
            </div>
            <ChevronDown 
              className={`h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform ${
                showFilters ? 'rotate-180' : ''
              }`} 
            />
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-4 overflow-hidden"
              >
                {/* Categories */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {categories?.map((cat: any) => (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === cat.name
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                        <span className="ml-1 text-xs opacity-60">({cat.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Sort By
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updatePreferences({ sortBy: option.value as any })}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          preferences.sortBy === option.value
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* View Options */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.compactView}
                      onChange={(e) => updatePreferences({ compactView: e.target.checked })}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Compact View</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.showSummaries}
                      onChange={(e) => updatePreferences({ showSummaries: e.target.checked })}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Show AI Summaries</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* News Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">Failed to load news. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className={preferences.compactView ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
              {allArticles.map((article: any) => (
                <NewsCard
                  key={article._id}
                  article={article}
                  compact={preferences.compactView}
                  showSummary={preferences.showSummaries}
                />
              ))}
            </div>

            {/* Load More */}
            <div ref={ref} className="flex justify-center py-8">
              {isFetchingNextPage ? (
                <Loader className="h-6 w-6 animate-spin text-gray-400" />
              ) : hasNextPage ? (
                <button
                  onClick={() => fetchNextPage()}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Load More
                </button>
              ) : allArticles.length > 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No more articles</p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default HomePage;