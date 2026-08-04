import { fetchSearch } from "../../../lib/fetch";

interface PageProps {
  params: Promise<{
    locale: string;
    q: string;
  }>;
}

export default async function SearchResults({ params }: PageProps) {
  // Await params per Next.js 15 App Router spec
  const { locale, q } = await params;

  // Safely decode the search query for UI rendering
  const decodedQ = q ? decodeURIComponent(q) : "";

  try {
    const articles = (await fetchSearch(locale, q)).data;

    // Standardize null to empty array for safe checking
    const results = articles ?? [];

    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Search Results for &quot;{decodedQ}&quot;
        </h1>

        {results.length > 0 ? (
          <ul className="space-y-6">
            {results.map((article) => (
              <li
                key={`${article.article_id}-${article.locale}`}
                className="border-b border-gray-200 pb-4 transition-colors hover:bg-gray-50/50"
              >
                <a
                  href={`/${article.locale}/article/${article.slug}`}
                  className="block group"
                >
                  <h3 className="text-xl font-semibold text-blue-700 group-hover:underline mb-2">
                    {/* Render Title Highlight if available, otherwise regular Title */}
                    {article.highlights?.title?.[0] ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: article.highlights.title[0],
                        }}
                      />
                    ) : (
                      article.title
                    )}
                  </h3>

                  <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed mb-2">
                    {article.description}
                  </p>

                  {/* Render snippet context from content if matched */}
                  {article.highlights?.content_text?.[0] && (
                    <p
                      className="text-xs text-gray-500 bg-gray-100 p-2 rounded italic"
                      dangerouslySetInnerHTML={{
                        __html: `...${article.highlights.content_text[0]}...`,
                      }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center border rounded-lg bg-gray-50">
            <p className="text-lg font-medium text-gray-600">
              No results found for &quot;{decodedQ}&quot;
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try checking for spelling errors or using different keywords.
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch search results:", error);
    return (
      <main className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 font-medium">
          Failed to load search results. Please try again later.
        </p>
      </main>
    );
  }
}
