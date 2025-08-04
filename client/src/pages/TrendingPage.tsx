import React from 'react';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Loader } from 'lucide-react';
import axios from 'axios';
import NewsCard from '../components/NewsCard';

const TrendingPage: React.FC = () => {
  const { data: trending, isLoading } = useQuery('trending', async () => {
    const response = await axios.get('/api/news/trending?limit=20');
    return response.data;
  });

  return (
    <>
      <Helmet>
        <title>Trending News - NewsHub</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trending News</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending?.map((article: any) => (
              <NewsCard key={article._id} article={article} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TrendingPage;