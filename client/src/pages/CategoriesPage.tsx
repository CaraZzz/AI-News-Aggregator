import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { 
  Cpu, 
  Briefcase, 
  Film, 
  Heart, 
  Microscope, 
  Trophy, 
  Landmark, 
  Globe, 
  Coffee,
  Grid3X3,
  Loader
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const CategoriesPage: React.FC = () => {
  const { data: categories, isLoading } = useQuery('categories', async () => {
    const response = await axios.get('/api/news/categories');
    return response.data;
  });

  const categoryIcons: Record<string, any> = {
    technology: Cpu,
    business: Briefcase,
    entertainment: Film,
    health: Heart,
    science: Microscope,
    sports: Trophy,
    politics: Landmark,
    world: Globe,
    lifestyle: Coffee,
    other: Grid3X3,
  };

  const categoryColors: Record<string, string> = {
    technology: 'bg-blue-500',
    business: 'bg-green-500',
    entertainment: 'bg-purple-500',
    health: 'bg-red-500',
    science: 'bg-indigo-500',
    sports: 'bg-orange-500',
    politics: 'bg-gray-600',
    world: 'bg-teal-500',
    lifestyle: 'bg-pink-500',
    other: 'bg-gray-500',
  };

  return (
    <>
      <Helmet>
        <title>Categories - NewsHub</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">News Categories</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories?.map((category: any, index: number) => {
              const Icon = categoryIcons[category.name] || Grid3X3;
              const colorClass = categoryColors[category.name] || 'bg-gray-500';
              
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/category/${category.name}`}
                    className="block bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all group"
                  >
                    <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 capitalize">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.count} articles
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default CategoriesPage;