'use client';

import { NewsArticle } from '@/types';
import NewsCard from './NewsCard';

interface NewsGridProps {
  articles: NewsArticle[];
}

export default function NewsGrid({ articles }: NewsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
        />
      ))}
    </div>
  );
}