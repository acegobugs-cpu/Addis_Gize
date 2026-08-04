'use client';

import MediaRenderer from '@/app/components/MediaRenderer';
import { CategoryArticle } from '@/types/category';
import { useEffect, useState } from 'react';

interface CategoryArticleListProps {
  slug: string;
  locale: string;
  initialArticles: CategoryArticle | null;
}

export default function CategoryArticleList({
  slug,
  locale,
  initialArticles,
}: CategoryArticleListProps) {
  const [category, setCategory] = useState<CategoryArticle | null>(initialArticles);
  const [loading, setLoading] = useState(!initialArticles);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 grid-cols-1 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 animate-pulse h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center col-span-1 md:col-span-3 text-red-600">
        {error}
      </p>
    );
  }

  if (!category) {
    return (
      <p className="text-center col-span-1 md:col-span-3 text-gray-700 py-12">
        No stories found for {slug}.
      </p>
    );
  }

  return (
    <div className="grid md:grid-cols-3 grid-cols-1 gap-6">
      {category.articles?.map((article) => {
        const parsedCategory =
          typeof article.categories === 'string'
            ? JSON.parse(article.categories)
            : article.categories;

        const mediaData =
          typeof article.media === 'string'
            ? JSON.parse(article.media)
            : article.media;

        return (
          <article
            key={article.id}
            className="flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {article.media && (
              <div className="relative aspect-video bg-gray-100">
                <MediaRenderer
                  media={mediaData}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
              <p className="text-xs md:text-sm text-indigo-600 font-medium">
                {Array.isArray(parsedCategory)
                  ? parsedCategory.map((cat: any) => cat.name).join(' | ')
                  : ''}
              </p>
              <h2 className="text-base md:text-xl font-serif font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                <a href={`/${locale}/article/${article?.slug}`}>
                  {article?.title}
                </a>
              </h2>
              <p className="text-sm text-gray-600 line-clamp-3">
                {article?.description}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}