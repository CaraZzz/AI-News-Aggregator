import React from 'react';
import { Category } from '../types';
import { 
  Newspaper, 
  Cpu, 
  TrendingUp, 
  Heart, 
  Trophy, 
  Film, 
  Leaf,
  Globe
} from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
  all: <Globe size={18} />,
  technology: <Cpu size={18} />,
  business: <TrendingUp size={18} />,
  health: <Heart size={18} />,
  sports: <Trophy size={18} />,
  entertainment: <Film size={18} />,
  environment: <Leaf size={18} />,
  general: <Newspaper size={18} />
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200 
            ${selectedCategory === category.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {categoryIcons[category.id] || <Newspaper size={18} />}
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
};