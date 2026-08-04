'use client';

import { Story } from "@/types/article";
import { Media } from "@/types/media";
import MediaRenderer from "./MediaRenderer";
import { useLocale } from "./TranslationProvider";

export default function Secondary({ stories }: { stories: Story[] }) {
  const lan = useLocale();

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
    <div className="md:col-span-1 md:order-1 md:border-r md:border-border pr-0 md:pr-6 space-y-6">
      {stories.map((story) => {
        const parsedMedia = parseMedia(story.media);

        return (
          <article 
            key={story.id} 
            className="flex flex-col gap-3 group pb-6 border-b border-border last:border-b-0 last:pb-0"
          >
            {/* Media Renderer Container */}
            {parsedMedia && (
              <div className="overflow-hidden rounded-lg border border-border/60 bg-surface">
                <MediaRenderer 
                  media={parsedMedia} 
                  className="w-full h-auto object-cover aspect-video group-hover:scale-[1.02] transition-transform duration-300" 
                  autoPlay  
                />
              </div>
            )}

            {/* Content Details */}
            <div className="flex flex-col gap-2">
              {/* Categories */}
              {story.categories && story.categories.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-east">
                  {story.categories
                    ?.filter(cat => cat?.name)
                    .map(cat => cat.name)
                    .join(' • ')}
                </div>
              )}

              {/* Title */}
              <h2 className="text-base md:text-lg font-serif font-bold text-ink leading-snug">
                <a 
                  href={`/${lan}/article/${story.slug || story.id}`}
                  className="hover:text-east transition-colors"
                >
                  {story.title || 'Untitled'}
                </a>
              </h2>

              {/* Description */}
              {story.description && (
                <p className="text-xs md:text-sm text-muted leading-relaxed line-clamp-2">
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