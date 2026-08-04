'use client';

import { Story } from '@/types/article';
import { useTranslation } from 'react-i18next';
import { useLocale } from './TranslationProvider';
import Link from 'next/link';

export default function MoreStories({ stories }: { stories: Story[] }) {
  const { t } = useTranslation();
  const lan = useLocale();

  if (!stories || stories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 mt-8 border-t border-border">
      {/* Section Header with Brand Accent */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-5 w-1 bg-west rounded-full" />
        <h3 className="text-xl font-serif font-bold text-ink uppercase tracking-wider">
          {t('more')}
        </h3>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {stories.map((story) => (
          <article
            key={story.id}
            className="flex flex-col justify-between p-4 rounded-lg border border-border bg-surface hover:border-east-muted transition-all duration-200 group"
          >
            <div className="space-y-2">
              {/* Category Badge */}
              {story.categories && story.categories.length > 0 && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-east">
                  {story.categories
                    .filter((cat) => cat?.name)
                    .map((cat) => cat.name)
                    .join(' • ')}
                </span>
              )}

              {/* Title */}
              <h4 className="font-serif font-bold text-base md:text-lg text-ink group-hover:text-east transition-colors leading-snug line-clamp-2">
                <Link href={`/${lan}/article/${story.slug || story.id}`}>
                  {story.title || 'Untitled'}
                </Link>
              </h4>

              {/* Description */}
              {story.description && (
                <p className="text-xs md:text-sm text-muted leading-relaxed line-clamp-3">
                  {story.description}
                </p>
              )}
            </div>

            {/* Read More Indicator */}
            <div className="pt-3 mt-3 border-t border-border/50 flex items-center text-xs font-semibold text-west group-hover:text-west-hover">
              <span>Read story</span>
              <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
} 