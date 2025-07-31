import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  TrendingUp, 
  FlaskConical, 
  Trophy, 
  Film, 
  Globe,
  ArrowRight
} from 'lucide-react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Category } from '../types';

const Categories: React.FC = () => {
  const { data: categories, isLoading, error } = useQuery(
    'categories',
    async () => {
      const response = await axios.get('/api/news/categories');
      return response.data.categories;
    }
  );

  const categoryIcons: { [key: string]: any } = {
    technology: Monitor,
    business: TrendingUp,
    science: FlaskConical,
    sports: Trophy,
    entertainment: Film,
    general: Globe,
  };

  const categoryColors: { [key: string]: string } = {
    technology: 'bg-blue-500',
    business: 'bg-green-500',
    science: 'bg-purple-500',
    sports: 'bg-orange-500',
    entertainment: 'bg-pink-500',
    general: 'bg-gray-500',
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Categories</h2>
          <p className="text-gray-600">Failed to load news categories</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">News Categories</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore news by category to find exactly what interests you
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category: Category, index: number) => {
          const Icon = categoryIcons[category.id] || Globe;
          const bgColor = categoryColors[category.id] || 'bg-gray-500';
          
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Link
                to={`/categories/${category.id}`}
                className="block card-hover p-6 group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {category.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Featured Categories */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Featured Categories</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Trending Now</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Discover the most popular and trending stories across all categories, 
              curated based on reader engagement and social media activity.
            </p>
            <Link
              to="/trending"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              View Trending
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Custom Sources</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Add your own news sources, RSS feeds, podcasts, and newsletters 
              to create a personalized news experience tailored to your interests.
            </p>
            <Link
              to="/custom-sources"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage Sources
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Categories;