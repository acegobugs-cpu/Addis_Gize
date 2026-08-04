'use client';

import { useTranslation } from 'react-i18next';
import { useLocale } from './TranslationProvider';
import { CategoryArticle } from '@/types/category';
import Link from 'next/link';

export default function CategoryGrid({ categories }: { categories: CategoryArticle[] }) {
  const { t } = useTranslation();
  const lan = useLocale();

  if (!categories || categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 border-t border-border">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-1 bg-east rounded-full" />
        <h2 className="text-2xl font-serif font-bold text-ink uppercase tracking-wider">
          {t('categories')}
        </h2>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryArticles =
            typeof category.articles === 'string'
              ? JSON.parse(category.articles)
              : category.articles;
          const articles = categoryArticles?.slice(0, 3) || [];

          return (
            <div
              key={category.id}
              className="flex flex-col p-4 rounded-xl border border-border bg-surface shadow-sm hover:border-east-muted transition-all duration-200"
            >
              {/* Category Title */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-west">
                <h3 className="font-serif font-bold text-lg text-ink hover:text-west transition-colors">
                  <Link href={`/${lan}/section/${category.slug}`}>
                    {category.name}
                  </Link>
                </h3>
                <Link
                  href={`/${lan}/section/${category.slug}`}
                  className="text-xs font-semibold text-east hover:text-east-hover transition-colors"
                >
                  View all →
                </Link>
              </div>

              {/* Category Articles */}
              {articles.length > 0 ? (
                <ul className="space-y-2.5">
                  {articles.map((article: any, index: number) => {
                    // Match locale translation or default fallback
                    const translation =
                      article?.translations?.find((tr: any) => tr.locale === lan) ||
                      article?.translations?.[0];

                    const title = translation?.title || article?.title || 'Untitled';
                    const slug = translation?.slug || article?.slug || article?.id;

                    return (
                      <li
                        key={slug || index}
                        className="text-xs md:text-sm text-muted hover:text-east transition-colors flex items-start gap-2"
                      >
                        <span className="text-west font-bold select-none">•</span>
                        <Link
                          href={`/${lan}/article/${slug}`}
                          className="hover:underline leading-snug line-clamp-2"
                        >
                          {title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted italic py-2">No articles available</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}