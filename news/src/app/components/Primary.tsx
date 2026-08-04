'use client';

import MediaRenderer from './MediaRenderer';
import { useTranslation } from 'react-i18next';
import { useLocale } from './TranslationProvider';
import { Story } from '@/types/article';
import { Media } from '@/types/media';

export interface PrimaryProps {
  stories: Story[];
}

export default function Primary({ stories }: PrimaryProps) {
  const lan = useLocale();
  const { t } = useTranslation();

  // Define story order priority map
  const orderPriority: Record<string, number> = {
    'breaking news': 1,
    trending: 2,
    primary: 3,
  };

  // Filter and sort top articles based on defined priorities
  const topArticles = stories
    .filter((article) =>
      ['breaking news', 'trending', 'primary'].includes(article.tag?.toLowerCase())
    )
    .sort((a, b) => {
      const priorityA = orderPriority[a.tag?.toLowerCase()] ?? 99;
      const priorityB = orderPriority[b.tag?.toLowerCase()] ?? 99;
      return priorityA - priorityB;
    });

  /**
   * Helper to safely format media object/JSON string
   */
  const parseMedia = (mediaData: Media | string | undefined): Media | undefined => {
    if (!mediaData) return undefined;
    if (typeof mediaData === 'string') {
      try {
        return JSON.parse(mediaData) as Media;
      } catch {
        return undefined;
      }
    }
    return mediaData;
  };

  return (
    <div className="md:col-span-3 md:order-2 space-y-6">
      {topArticles.map((story) => {
        const parsedMedia = parseMedia(story.media);
        const isBreaking = story.tag?.toLowerCase() === 'breaking news';
        const isTrending = story.tag?.toLowerCase() === 'trending';

        return (
          <article
            key={story.id}
            className={`flex flex-col md:grid md:grid-cols-2 justify-center gap-6 p-4 rounded-xl relative transition-all bg-canvas ${
              isBreaking
                ? 'border-t-4 border-south shadow-md bg-south-light/20'
                : 'border-b border-border hover:bg-surface/50'
            }`}
          >
            {/* Tag Badges */}
            {isTrending && (
              <div className="absolute top-3 right-3 bg-west text-canvas text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
                {t('trending')}
              </div>
            )}
            {isBreaking && (
              <div className="absolute top-3 right-3 bg-south text-canvas text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full z-10 shadow-sm animate-pulse">
                {t('breaking_news')}
              </div>
            )}

            {/* Media Renderer Container */}
            {parsedMedia && (
              <div className="overflow-hidden rounded-lg border border-border/60 bg-surface">
                <MediaRenderer
                  media={parsedMedia}
                  className="w-full h-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-300"
                  autoPlay
                />
              </div>
            )}

            {/* Content Details */}
            <div className="flex flex-col justify-center gap-2.5">
              {/* Category list */}
              {story.categories && story.categories.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-east">
                  {story.categories
                    .filter((cat) => cat?.name)
                    .map((cat) => cat.name)
                    .join(' • ')}
                </div>
              )}

              {/* Title */}
              <h2 className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-ink leading-tight">
                <a
                  href={`/${lan}/article/${story?.slug || story.id}`}
                  className="hover:text-east transition-colors"
                >
                  {story?.title || 'Untitled'}
                </a>
              </h2>

              {/* Description / Content snippet */}
              {story?.description && (
                <p className="text-sm md:text-base text-muted leading-relaxed line-clamp-3">
                  {story.description}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}