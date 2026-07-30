"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Article } from "@/app/types/types";
import { useAuth } from "@/app/components/AuthContext";
import TextEditor from "@/app/(main)/components/editor/textEditor";

// --- Mock API Functions (Replace with your actual API calls/imports) ---
async function mockGetArticleById(id: string): Promise<Article> {
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    id,
    tag: "primary",
    media: {},
    categories: [{ id: "1", name: "News" }],
    translations: [],
  };
}

async function mockAddLocale(payload: {
  editor_id: number;
  article_id: string;
  locale: string;
  title: string;
  slug: string;
  description: string;
  content: any;
}) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  console.log("Submitted locale payload:", payload);
  return { success: true };
}
// ----------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AddLocalePage({ params }: PageProps) {
  const router = useRouter();
  const { id: articleId } = use(params);

  const { user } = useAuth(); // Your existing Auth hook
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    locale: "am",
    title: "",
    slug: "",
    description: "",
    content: null as any,
  });

  // Fetch article data on load
  useEffect(() => {
    async function loadArticle() {
      try {
        setLoading(true);
        // Replace with your real function: e.g. const data = await getArticleById(articleId);
        const data = await mockGetArticleById(articleId);
        setArticle(data);

        // Pre-fill editor content with default translation's content if available
        const defaultTranslation = data.translations?.[0];
        if (defaultTranslation?.content) {
          setFormData((prev) => ({
            ...prev,
            content: defaultTranslation.content,
          }));
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load article details.");
      } finally {
        setLoading(false);
      }
    }

    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  // Slug auto-generation handling (Supports Ethiopic script)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value.slice(0, 250);
    const slug = title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^፡-፯\u1200-\u137F\w\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    setFormData((prev) => ({ ...prev, title, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;

    setSubmitting(true);
    setError(null);

    try {
      // Deep clone payload to avoid Next.js Server Action / RPC serialization issues
      const cleanContent = formData.content
        ? JSON.parse(JSON.stringify(formData.content))
        : [];

      // Replace with your real Server Action / API call: e.g. await addLocale(...)
      await mockAddLocale({
        editor_id: user?.id || 0,
        article_id: article.id,
        locale: formData.locale,
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        content: cleanContent,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/articles");
      }, 1000);
    } catch (err) {
      console.error("Error adding locale:", err);
      setError("Failed to add locale translation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading article information...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 font-medium">Article not found.</p>
        <Link
          href="/articles"
          className="text-indigo-600 underline mt-2 inline-block text-sm"
        >
          Return to articles
        </Link>
      </div>
    );
  }

  const baseTitle = article.translations?.[0]?.title || "Untitled Article";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Header Navigation */}
      <div className="mb-6">
        <Link
          href="/articles"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition mb-3"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
          Back to Articles
        </Link>
        <h1 className="text-3xl font-serif font-bold text-gray-900">
          Add Translation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Adding new language locale for base article:{" "}
          <span className="font-semibold text-indigo-600">{baseTitle}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content & Form Inputs (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Article Info Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Translated Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter translated headline..."
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full text-xl font-medium border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Translated Description
              </label>
              <textarea
                placeholder="Short summary in target language..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-y"
                rows={3}
              />
            </div>
          </div>

          {/* Text Editor Container */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Translated Content
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <TextEditor
                content={formData.content}
                onChange={(json) => setFormData({ ...formData, content: json })}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Configuration (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Translation Options
            </h3>

            {/* Target Language Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target Language
              </label>
              <select
                value={formData.locale}
                onChange={(e) =>
                  setFormData({ ...formData, locale: e.target.value })
                }
                className="w-full border border-gray-300 bg-white text-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              >
                <option value="am">Amharic (am)</option>
                <option value="en">English (en)</option>
                <option value="sw">Swahili (sw)</option>
                <option value="om">Afan Oromo (om)</option>
              </select>
            </div>

            {/* Generated Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Generated Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                readOnly
                placeholder="auto-generated-slug"
                className="w-full bg-gray-50 text-gray-500 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono select-all cursor-not-allowed"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl transition duration-200 shadow-md disabled:opacity-50"
              >
                {submitting ? "Saving Translation..." : "Add Translation"}
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium text-center">
              Translation added successfully! Redirecting...
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium text-center">
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}