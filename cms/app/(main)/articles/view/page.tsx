"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import Select from "react-select";
import { useAuth } from "@/app/components/AuthContext";
import MediaBlock from "../../components/mediaBlock";
import MediaRenderer from "../../components/mediaRenderer";
import {
  Article,
  Category,
  ArticleTranslation,
  Media,
  ArticleUpdate,
} from "@/app/types/types";
import Link from "next/link";
import { addLocale, deleteArticle, deleteLocale, getArticles, getCategories, updateArticle } from "@/app/lib/api";

import TextEditor, { TextEditorRef } from "../../components/editor/textEditor";

import {
  EllipsisVerticalIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function Articles() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogPos, setDialogPos] = useState({ x: 0, y: 0 });
  const [lan, setLan] = useState("am");

  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchArticles();
  }, [lan]);

  // Handle click outside context menu to close automatically
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeDialog();
      }
    };
    if (selectedArticle) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedArticle]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await getArticles(lan);
      if (res.data) {
        setArticles(res.data);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;
    try {
      await deleteArticle(selectedArticle.id);
      setArticles((prev) => prev.filter((art) => art.id !== selectedArticle.id));
      closeDialog();
    } catch (err) {
      setError("Failed to delete article");
    }
  };

  const openDialog = (article: Article, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // Calculate positioning to keep popover inside screen bounds
    setDialogPos({
      x: Math.min(rect.right - 180, window.innerWidth - 200),
      y: rect.bottom + 8,
    });
    setSelectedArticle(article);
  };

  const closeDialog = () => {
    setSelectedArticle(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Articles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage article translations, categories, and published content.
          </p>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Language Selector */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <GlobeAltIcon className="w-4 h-4 text-gray-500 mr-2" />
            <select
              value={lan}
              onChange={(e) => setLan(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="om">Oromo (om)</option>
              <option value="am">Amharic (am)</option>
              <option value="en">English (en)</option>
              <option value="sw">Swahili (sw)</option>
            </select>
          </div>

          {/* Write Button */}
          <Link
            href="/articles/write"
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition duration-150 shadow-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Write Article
          </Link>
        </div>
      </div>

      {/* Main Grid / Skeleton State */}
      {loading ? (
        <div className="grid md:grid-cols-3 grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-100 animate-pulse h-80 rounded-2xl border border-gray-200"
            />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid md:grid-cols-3 grid-cols-1 gap-6">
          {articles.map((article) => {
            // Find locale match for current selected language
            const localeData = article.translations?.find((tr) => tr.locale === lan);

            return (
              <div
                key={article.id}
                className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* Options Menu Toggle */}
                <button
                  onClick={(e) => openDialog(article, e)}
                  className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-2 hover:bg-white hover:text-black shadow-sm transition"
                  aria-label="Open options"
                >
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>

                {/* Media Section */}
                <div className="relative w-full h-48 bg-gray-50 overflow-hidden border-b border-gray-100">
                  {article.media ? (
                    <MediaRenderer
                      media={
                        typeof article.media === "string"
                          ? JSON.parse(article.media)
                          : article.media
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                      No Media Attached
                    </div>
                  )}

                  {article.tag && (
                    <span className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {article.tag}
                    </span>
                  )}
                </div>

                {/* Article Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-indigo-600">
                      {article.categories?.map((cat) => cat.name).join(", ") || "General"}
                    </p>

                    <h2 className="text-lg font-serif font-bold text-gray-900 line-clamp-2 leading-snug">
                      {localeData?.title || (
                        <span className="text-gray-400 italic">
                          Untranslated ({lan})
                        </span>
                      )}
                    </h2>

                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {localeData?.description ||
                        "No summary available for this language translation."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500 text-sm">No articles found in current language ({lan}).</p>
        </div>
      )}

      {/* Floating Context Action Menu */}
      {selectedArticle && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-48 py-1.5 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: dialogPos.y, left: dialogPos.x }}
        >
          <div className="px-3 py-1.5 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Manage Article
            </p>
          </div>

          <div className="p-1 space-y-0.5">
            {/* Route directly to page for Adding Locale */}
            <button
              onClick={() => {
                closeDialog();
                router.push(`/articles/${selectedArticle.id}/locale`);
              }}
              className="w-full flex items-center text-left text-xs font-medium text-gray-700 px-2.5 py-2 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition"
            >
              <PlusIcon className="w-4 h-4 mr-2 text-gray-500" />
              Add Locale
            </button>

            {/* Route directly to page for Editing Article */}
            <button
              onClick={() => {
                closeDialog();
                router.push(`/articles/${selectedArticle.id}/edit`);
              }}
              className="w-full flex items-center text-left text-xs font-medium text-gray-700 px-2.5 py-2 rounded-lg hover:bg-gray-50 hover:text-amber-600 transition"
            >
              <PencilSquareIcon className="w-4 h-4 mr-2 text-gray-500" />
              Edit Article
            </button>

            {/* Trigger Delete Action */}
            <button
              onClick={handleDelete}
              className="w-full flex items-center text-left text-xs font-medium text-rose-600 px-2.5 py-2 rounded-lg hover:bg-rose-50 transition"
            >
              <TrashIcon className="w-4 h-4 mr-2 text-rose-500" />
              Delete
            </button>
          </div>

          {error && <p className="text-xs text-rose-600 px-3 py-1 mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}