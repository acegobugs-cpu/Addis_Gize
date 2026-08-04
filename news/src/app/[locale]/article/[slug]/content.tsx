'use client';

// import TipTapRenderer from "@/app/components/TipTapRenderer";

import dynamic from 'next/dynamic';

// Dynamic import prevents TipTap SSR window/hydration errors
const TipTapRenderer = dynamic(() => import('@/app/components/TipTapRenderer'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  ),
});

interface ArticleContentProps {
  content: any;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  if (!content) return null;

  return (
    <div className="prose prose-lg max-w-none prose-headings:font-serif prose-indigo">
      <TipTapRenderer content={content} />
    </div>
  );
}