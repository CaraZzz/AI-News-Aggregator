import React from 'react';
import { useParams } from 'react-router-dom';
import { useInfiniteQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { Loader } from 'lucide-react';
import axios from 'axios';
import NewsCard from '../components/NewsCard';
import { useInView } from 'react-intersection-observer';
import { usePreferences } from '../contexts/PreferencesContext';

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const { preferences } = usePreferences();
  const { ref, inView } = useInView();

  const fetchCategoryNews = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: pageParam.toString(),
      limit: '20',
      sort: preferences.sortBy,
      category: category || '',
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
  } = useInfiniteQuery(
    ['categoryNews', category, preferences.sortBy],
    fetchCategoryNews,
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.page < lastPage.pagination.pages) {
          return lastPage.pagination.page + 1;
        }
        return undefined;
      },
    }
  );

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allArticles = data?.pages.flatMap(page => page.articles) || [];

  return (
    <>
      <Helmet>
        <title>{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Category'} News - NewsHub</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
          {category} News
        </h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
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
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No articles in this category</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CategoryPage;