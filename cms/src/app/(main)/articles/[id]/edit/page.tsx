'use client';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Select from "react-select";
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";

import { deleteLocale, getCategories, updateArticle, getArticleById } from "@/app/lib/api";
import { Article, ArticleTranslation } from "@/app/types/article";
import MediaBlock from "@/app/(main)/components/mediaBlock";
import TextEditor from "@/app/(main)/components/editor/textEditor";
import { Struct } from "next/dist/compiled/superstruct";
import { Category } from "@/app/types/category";



export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedLocale, setSelectedLocale] = useState("om");
  const [newLocale, setNewLocale] = useState("om");
  const [changingLocale, setChangingLocale] = useState(false);
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tag: "primary",
    category_ids: [] as string[],
    media: {
      mediaType: "image",
      url: "",
    },
    translations: {} as Record<string, Partial<ArticleTranslation>>,
  });

  // 1. Fetch initial data (Categories & Article)
  useEffect(() => {
    if (!articleId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const catRes = await getCategories();
        if (catRes?.data) {
          setCategories(catRes.data);
        }

        // Fetch target article (uses API function with mock fallback)
        let articleData: Article;
        try {
          const apiRes = await getArticleById(articleId);
          articleData = apiRes.data;
        } catch {
          console.warn("API fetch failed, utilizing mock fallback data.");
          articleData = (await getArticleById(articleId)).data;
        }

        setArticle(articleData);

        // Populate Form State
        const initialTranslations: Record<string, Partial<ArticleTranslation>> = {};
        articleData.translations?.forEach((t) => {
          if (t.locale) {
            initialTranslations[t.locale] = {
              id: t.id,
              locale: t.locale,
              title: t.title || "",
              slug: t.slug || "",
              description: t.description || "",
              content: t.content || { type: "doc", content: [] },
            };
          }
        });

        const defaultLocale = articleData.translations?.[0]?.locale || "om";
        setSelectedLocale(defaultLocale);

        setFormData({
          tag: articleData.tag || "primary",
          category_ids: articleData.categories?.map((c) => c.id) || [],
          media: articleData.media || { mediaType: "image", url: "" },
          translations: initialTranslations,
        });

      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load article details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [articleId]);

  const updateTranslation = (locale: string, updates: Partial<ArticleTranslation>) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          ...updates,
        },
      },
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value.slice(0, 250);
    const slug = title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^፡-፯\u1200-\u137F\w\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
      
    updateTranslation(selectedLocale, { title, slug });
  };

  const handleDeleteTranslation = async (id?: number) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this translation locale?")) return;

    try {
      await deleteLocale(id);
      setFormData((prev) => {
        const { [selectedLocale]: _, ...restTranslations } = prev.translations;
        return { ...prev, translations: restTranslations };
      });

      const remainingLocales = Object.keys(formData.translations).filter(
        (l) => l !== selectedLocale
      );
      setSelectedLocale(remainingLocales[0] || "om");
      setSuccess(true);
    } catch (err) {
      setError("Failed to delete translation");
    }
  };

  const handleContentChange = useCallback(
    (json: any) => {
      updateTranslation(selectedLocale, { content: json });
    },
    [selectedLocale]
  );

  const handleSubmit = async () => {
    if (!articleId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const translationData = formData.translations[selectedLocale];

      const translationPatch = translationData
        ? {
            id: translationData.id || undefined,
            locale: translationData.locale || selectedLocale,
            title: translationData.title || undefined,
            slug: translationData.slug || undefined,
            description: translationData.description || undefined,
            content: translationData.content || {},
          }
        : undefined;

      const payload = {
        tag: formData.tag || undefined,
        media: formData.media || {},
        categories_ids: formData.category_ids,
        translation: translationPatch,
      };

      // Strip potential circular prototypes prior to sending
      await updateArticle(articleId, JSON.parse(JSON.stringify(payload)));
      setSuccess(true);
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update article");
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const t = formData.translations[selectedLocale] || {};

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500 font-medium">
        Loading article editor...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
            title="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">
              Edit Article
            </h1>
            <p className="text-xs text-gray-500">ID: {articleId}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/articles/${articleId}/locale`)}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            + Add New Locale
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Editor Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Locale Selector Toolbar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Editing Locale:
              </label>
              <select
                value={selectedLocale}
                onChange={(e) => setSelectedLocale(e.target.value)}
                className="border border-gray-300 bg-white text-gray-800 font-semibold text-sm px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {Object.keys(formData.translations).map((locale) => (
                  <option key={locale} value={locale}>
                    {locale.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              {changingLocale ? (
                <div className="flex items-center space-x-2">
                  <select
                    value={newLocale}
                    onChange={(e) => setNewLocale(e.target.value)}
                    className="border border-gray-300 bg-white text-xs p-1.5 rounded-md"
                  >
                    <option value="om">OM</option>
                    <option value="am">AM</option>
                    <option value="en">EN</option>
                    <option value="sw">SW</option>
                  </select>
                  <button
                    onClick={() => {
                      if (newLocale === selectedLocale) {
                        setChangingLocale(false);
                        return;
                      }
                      const currentTranslation = formData.translations[selectedLocale];
                      if (!currentTranslation) return;

                      setFormData((prev) => {
                        const { [selectedLocale]: _removed, ...rest } = prev.translations;
                        return {
                          ...prev,
                          translations: {
                            ...rest,
                            [newLocale]: {
                              ...currentTranslation,
                              locale: newLocale,
                            },
                          },
                        };
                      });
                      setSelectedLocale(newLocale);
                      setChangingLocale(false);
                    }}
                    className="bg-emerald-600 text-white text-xs px-2.5 py-1.5 rounded-md hover:bg-emerald-700"
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setChangingLocale(true)}
                  className="text-xs font-medium text-gray-600 hover:text-indigo-600 px-2 py-1 border border-gray-200 rounded-lg"
                >
                  Change Code
                </button>
              )}

              <button
                onClick={() => handleDeleteTranslation(t.id)}
                disabled={!t.id}
                className="inline-flex items-center text-xs font-medium text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition disabled:opacity-40"
                title="Delete this locale translation"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Delete Locale
              </button>
            </div>
          </div>

          {/* Main Title & Description Fields */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Headline Title ({selectedLocale.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder="Enter headline..."
                value={t.title || ""}
                onChange={handleTitleChange}
                className="w-full text-lg font-semibold border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Short Description Summary
              </label>
              <textarea
                placeholder="Enter brief description..."
                value={t.description || ""}
                onChange={(e) =>
                  updateTranslation(selectedLocale, { description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
          </div>

          {/* Featured Media */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Article Featured Media
            </label>
            <MediaBlock
              data={formData.media}
              onChange={(updated) => setFormData({ ...formData, media: updated })}
            />
          </div>

          {/* Body Content Rich Editor */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Body Content ({selectedLocale.toUpperCase()})
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <TextEditor
                key={`${articleId}-${selectedLocale}`}
                initialValue={t.content}
                onChange={handleContentChange}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Settings Side Panel (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Metadata & Attributes
            </h3>

            {/* Tag Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Article Tag
              </label>
              <select
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full border border-gray-300 bg-white text-gray-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="primary">primary</option>
                <option value="secondary">secondary</option>
                <option value="breaking news">breaking news</option>
                <option value="trending">trending</option>
                <option value="morestories">morestories</option>
              </select>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categories
              </label>
              <Select
                isMulti
                options={categoryOptions}
                value={categoryOptions.filter((opt) =>
                  formData.category_ids.includes(opt.value)
                )}
                onChange={(selected) =>
                  setFormData({
                    ...formData,
                    category_ids: selected ? selected.map((opt) => opt.value) : [],
                  })
                }
                className="text-sm text-black"
                classNamePrefix="react-select"
                placeholder="Select categories..."
              />
            </div>

            {/* Slug (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                URL Slug ({selectedLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={t.slug || ""}
                readOnly
                className="w-full bg-gray-50 border border-gray-200 text-gray-500 text-xs font-mono rounded-xl px-3 py-2 select-all cursor-not-allowed"
              />
            </div>
          </div>

          {/* Form Status Messages */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium text-center">
              Changes updated successfully!
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}