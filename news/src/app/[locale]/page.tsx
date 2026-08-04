import Primary from '../components/Primary';
import Secondary from '../components/Secondary';
import MoreStories from '../components/MoreStories';
import { fetchArticles } from '../lib/fetch';
import { Article, Story } from '@/types/article';

// 1. Define Props Interface for Next.js App Router Page
export interface HomePageProps {
  params: Promise<{
    locale?: string;
  }>;
}

export default async function Home({ params }: HomePageProps) {
  // Await Next.js async params object safely
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'om';

  // Fetch articles based on resolved locale
  const articles = (await fetchArticles(locale))?.data || [];

  // Filter articles based on tag metadata
  const primaryStories = articles.filter(
    (article) =>
      typeof article.tag === 'string' &&
      ['breaking news', 'trending', 'primary'].includes(article.tag.toLowerCase())
  );

  const secondaryStories = articles.filter(
    (article) =>
      typeof article.tag === 'string' &&
      article.tag.toLowerCase() === 'secondary'
  );

  const moreStories = articles.filter(
    (article) =>
      typeof article.tag === 'string' &&
      article.tag.toLowerCase() === 'morestories'
  );

  return (
    <>
      <section className="max-w-6xl mx-auto md:px-3 py-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Primary stories={primaryStories} />
        <Secondary stories={secondaryStories} />
      </section>
      <MoreStories stories={moreStories} />
    </>
  );
}