import { fetchArticlesByCategory } from "@/app/lib/fetch";
import CategoryArticleList from "./catList";
import { CategoryArticle } from "@/types/category";


// Optional: Enable ISR (e.g., revalidate data every 60 seconds)
export const revalidate = 60; 

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function CategoryPage({ params }:PageProps) {
  const { slug, locale } = await params;

  const  initialArticles = (await fetchArticlesByCategory(slug, locale))?.data;
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-6 capitalize text-gray-900">
        {slug}
      </h1>
      
      {/* Pass SSR-fetched articles as initial props to Client Component */}
      <CategoryArticleList 
        slug={slug} 
        locale={locale} 
        initialArticles={initialArticles} 
      />
    </main>
  );
}