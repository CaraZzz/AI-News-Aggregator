'use client';

import { SortOption } from '@/types';
import { ChevronDown } from 'lucide-react';

interface SortSelectorProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortLabels: Record<SortOption, string> = {
  [SortOption.LATEST]: 'Latest',
  [SortOption.POPULARITY]: 'Popular',
  [SortOption.RELEVANCY]: 'Relevant'
};

export default function SortSelector({ sortBy, onSortChange }: SortSelectorProps) {
  return (
    <div className="relative">
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {Object.entries(sortLabels).map(([value, label]) => (
          <option key={value} value={value}>
            Sort by {label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}