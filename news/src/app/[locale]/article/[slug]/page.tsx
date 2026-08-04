import MediaRenderer from '@/app/components/MediaRenderer';
import { fetchArticleById, fetchArticles } from '@/app/lib/fetch';
import { notFound } from 'next/navigation';
import ArticleContent from './content';

interface PageProps {
  params: Promise<{
    slug: string;
    locale?: string;
  }>;
}

// 1. Static Paths Generation
export async function generateStaticParams() {
  try {
    const articles = await fetchArticles();
    return (articles.data || []).map((article: any) => ({
      slug: article.slug || article.id,
    }));
  } catch (err) {
    console.error('Failed to generate static params:', err);
    return [];
  }
}

// 2. SEO Metadata Generation
export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  
  try {
    const res = await fetchArticleById(slug, locale);
    const article = res.data;

    if (!article) {
      return { title: 'Article Not Found' };
    }

    return {
      title: `${article.title} | News Portal`,
      description: article.description,
      openGraph: {
        title: article.title,
        description: article.description,
        type: 'article',
        publishedTime: article.published_at,
      },
    };
  } catch (error) {
    return { title: 'Article Not Found' };
  }
}

// 3. Server Component Page Render
export default async function ArticlePage({ params }: PageProps) {
  const { slug, locale } = await params;

  let article = null;
  try {
    const res = await fetchArticleById(slug, locale);
    article = res?.data;
  } catch (error) {
    console.error('Failed to fetch article details:', error);
  }

  // Automatically trigger Next.js 404 handler if missing
  if (!article) {
    notFound();
  }

  // Parse Media safely on the server
  let parsedMedia = article.media || null;
  if (typeof article.media === 'string') {
    try {
      parsedMedia = JSON.parse(article.media);
    } catch {
      parsedMedia = null;
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <article className="space-y-8">
        {/* Article Header */}
        <header className="space-y-4 text-center">
          {article.tag && (
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {article.tag}
            </span>
          )}

          {/* <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
            {article.title}
          </h1>

          {article.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {article.description}
            </p>
          )} */}

          {article.published_at && (
            <time className="block text-xs text-gray-400 font-mono">
              Published on {new Date(article.published_at).toLocaleDateString()}
            </time>
          )}
        </header>

        {/* Featured Media Container
        {parsedMedia && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md">
            <MediaRenderer
              media={parsedMedia}
              className="w-full h-auto max-h-[500px] object-cover"
              autoPlay
            />
          </div>
        )} */}

        {/* Main Body Content - Handled via Client Component wrapper */}
        <section className="pt-6 border-t border-gray-100">
          <ArticleContent content={article.content} />
        </section>
      </article>
    </main>
  );
}