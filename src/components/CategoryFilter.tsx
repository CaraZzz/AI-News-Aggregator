'use client';

import { NewsCategory } from '@/types';

interface CategoryFilterProps {
  selectedCategory: NewsCategory | 'all';
  onCategoryChange: (category: NewsCategory | 'all') => void;
}

const categoryLabels: Record<NewsCategory | 'all', string> = {
  'all': 'All News',
  [NewsCategory.GENERAL]: 'General',
  [NewsCategory.BUSINESS]: 'Business',
  [NewsCategory.TECHNOLOGY]: 'Technology',
  [NewsCategory.ENTERTAINMENT]: 'Entertainment',
  [NewsCategory.HEALTH]: 'Health',
  [NewsCategory.SCIENCE]: 'Science',
  [NewsCategory.SPORTS]: 'Sports',
  [NewsCategory.POLITICS]: 'Politics',
  [NewsCategory.WORLD]: 'World'
};

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const categories: (NewsCategory | 'all')[] = [
    'all',
    NewsCategory.GENERAL,
    NewsCategory.BUSINESS,
    NewsCategory.TECHNOLOGY,
    NewsCategory.ENTERTAINMENT,
    NewsCategory.HEALTH,
    NewsCategory.SCIENCE,
    NewsCategory.SPORTS,
    NewsCategory.POLITICS,
    NewsCategory.WORLD
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            selectedCategory === category
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {categoryLabels[category]}
        </button>
      ))}
    </div>
  );
}