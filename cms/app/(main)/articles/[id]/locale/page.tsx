"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Article } from "@/app/types/article";
import { useAuth } from "@/app/components/AuthContext";
import TextEditor from "@/app/(main)/components/editor/textEditor";
import { addLocale, getArticleLocales } from "@/app/lib/api";
import { getMissingLocales, LOCALE_LABELS, Locale } from "@/app/types/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AddLocalePage({ params }: PageProps) {
  const router = useRouter();
  const { id: articleId } = use(params);

  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    locale: "" as Locale | "",
    title: "",
    slug: "",
    description: "",
    content: null as any,
  });

  // Load Article Data
  useEffect(() => {
    async function loadArticle() {
      try {
        setLoading(true);
        const res = await getArticleLocales(articleId);
        
        if (res?.data) {
          const articleData: Article = res.data;
          setArticle(articleData);

          // Find available (missing) locales
          const existingLocales = articleData.translations?.map((t) => t.locale) || [];
          const missingLocales = getMissingLocales(existingLocales);

          // Get default content from existing base translation
          const baseContent = articleData.translations?.[0]?.content || null;

          // Pre-fill form with the first available missing locale
          setFormData((prev) => ({
            ...prev,
            locale: missingLocales[0] || "",
            content: baseContent,
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

  // Compute available missing locales safely
  const missingLocales = article
    ? getMissingLocales(article.translations?.map((t) => t.locale) || [])
    : [];

  // Handle Ethiopic & Standard Slug Generation
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
    if (!article || !formData.locale) return;

    setSubmitting(true);
    setError(null);

    try {
      const cleanContent = formData.content
        ? JSON.parse(JSON.stringify(formData.content))
        : [];

      await addLocale({
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

  // 1. Loading State
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">
        <p className="animate-pulse">Loading article details...</p>
      </div>
    );
  }

  // 2. Not Found State
  if (!article) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-600 font-medium">Article not found.</p>
        <Link
          href="/articles"
          className="text-indigo-600 underline mt-2 inline-block text-sm"
        >
          Return to articles
        </Link>
      </div>
    );
  }

  // 3. All Locales Added State
  if (missingLocales.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center bg-white border border-gray-200 rounded-2xl my-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">All Locales Complete</h2>
        <p className="text-sm text-gray-500 mb-6">
          This article already has translations for all supported languages.
        </p>
        <Link
          href="/articles"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Back to Articles
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
        {/* Main Content & Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Article Info Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Translated Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter translated headline..."
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full text-xl font-medium border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
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
                className="w-full border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-y"
                rows={3}
              />
            </div>
          </div>

          {/* Text Editor Container */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Translated Content
            </label>
            <div className="border border-gray-200 rounded-xl">
              <TextEditor
                content={formData.content}
                onChange={(json) => setFormData({ ...formData, content: json })}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Options */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Translation Options
            </h3>

            {/* Dynamic Target Language Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target Language
              </label>
              <select
                value={formData.locale}
                onChange={(e) =>
                  setFormData({ ...formData, locale: e.target.value as Locale })
                }
                className="w-full border border-gray-300 bg-white text-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              >
                {missingLocales.map((code) => (
                  <option key={code} value={code}>
                    {LOCALE_LABELS[code].name} ({LOCALE_LABELS[code].nativeName})
                  </option>
                ))}
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !formData.locale}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition duration-200 shadow-md disabled:opacity-50"
              >
                {submitting ? "Saving Translation..." : "Add Translation"}
              </button>
            </div>
          </div>

          {/* Messages */}
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