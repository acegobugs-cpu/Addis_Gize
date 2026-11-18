"use client";

import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { useAuth } from "@/app/components/AuthContext";
import { Cat, CategoryLocale, Translation } from "@/app/types/category";
import MediaBlock from "../../components/mediaBlock";
import TextEditor, { TextEditorRef } from "../../components/editor/textEditor";
import { createArticle, getCategories } from "@/app/lib/api";
import MediaRenderer from "../../components/mediaRenderer";
import { Media } from "@/app/types/media";
import { Locale } from "@/app/types/locale";

export default function ArticleForm() {
  const editorRef = useRef<TextEditorRef>(null);

  const [formData, setFormData] = useState({
    locale: "am" as Locale,
    title: "",
    slug: "",
    tag: "primary",
    description: "",
    media: {
      mediaType: "image" as const,
      source: "external" as const,
      url: "",
    } as Media,
    category_ids: [] as string[],
  });

  const [bodyContent, setBodyContent] = useState<any>(null);
  const [cat, setCat] = useState<Cat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories();
        if (categoriesData.data) setCat(categoriesData.data);
      } catch {
        setError("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const editorHelpers = editorRef.current;
    if (!editorHelpers) return;

    const bodyJson = editorHelpers.getContent();

    const titleText = formData.title.trim();
    if (!titleText) {
      alert("Title is required");
      return;
    }

    const payload = {
      tag: formData.tag,
      category_ids: formData.category_ids,
      media: formData.media || null,
      translations: [
        {
          locale: formData.locale,
          title: titleText,
          slug: formData.slug,
          description: formData.description.trim(),
          content: bodyJson,                    // Main body from editor
          // published_at: new Date().toISOString(),
          // updated_at: new Date().toISOString(),
        },
      ],
    };

    try {
      await createArticle(payload);
      setSuccess(true);
      setError(null);

      // Reset form
      setFormData({
        locale: "am",
        title: "",
        slug: "",
        tag: "primary",
        description: "",
        media: { mediaType: "image" as const, source: "external" as const, url: "" } as Media,
        category_ids: [],
      });
      setBodyContent(null);
    } catch (err) {
      console.error(err);
      setError("Failed to create article");
      setSuccess(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value.slice(0, 250);
    const slug = title
      .normalize("NFKD")
      .replace(/[^\u1200-\u137F\w\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    setFormData({ ...formData, title, slug });
  };

  const categoryOptions = cat.map((category: Cat) => {
    const translation = category[formData.locale];

    return {
      value: category.id,
      label: translation?.name || `Missing Translation (${formData.locale})`, 
    };
});

  return (
    <div className="max-w-[80%] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-gray-900">Create New Article</h2>
        <p className="text-sm text-gray-500 mt-1">Draft and publish article content across supported languages.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Editor & Core Content (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Featured Media Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-gray-800">Featured Media</label>
            
            <MediaBlock
              data={formData.media}
              onChange={(updated) => setFormData({ ...formData, media: updated })}
            />

            {formData.media && (
              <div className="mt-4 mx-auto rounded-xl overflow-hidden border border-gray-100 max-w-md">
                <MediaRenderer
                  media={
                    typeof formData.media === "string"
                      ? JSON.parse(formData.media)
                      : formData.media
                  }
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
          </div>
          
          {/* Article Details Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">          
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Article Title <span className="text-red-500">*</span>{formData.slug &&(<span className="text-west">{`  :/${formData.slug}`}</span>)}
              </label>
              <input
                type="text"
                placeholder="Enter a compelling headline..."
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full text-xl font-medium border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Short Description</label>
              <textarea
                placeholder="Write a concise summary for search engines and post previews..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y"
                rows={3}
              />
            </div>
          </div>

          {/* Rich Text Editor Container */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Main Content <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-200 rounded-xl">
              <TextEditor
                ref={editorRef}
                onChange={(json) => setBodyContent(json)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Meta & Publishing Controls (1/3 width) */}
        <div className="sticky top-14 space-y-6 self-start">
          
          {/* Publishing Settings Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Publishing Metadata
            </h3>

            {/* Language / Locale Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
              <select
                value={formData.locale}
                onChange={(e) => setFormData({ ...formData, locale: e.target.value as Locale })}
                className="w-full border border-gray-300 bg-white text-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              >
                <option value="om">Oromo (om)</option>
                <option value="am">Amharic (am)</option>
                <option value="en">English (en)</option>
                <option value="sw">Swahili (sw)</option>
              </select>
            </div>

            {/* Tag Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tag</label>
              <select
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full border border-gray-300 bg-white text-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="breaking news">Breaking News</option>
                <option value="trending">Trending</option>
                <option value="morestories">More Stories</option>
              </select>
            </div>

            {/* Categories Multi-Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categories</label>
              <Select
                instanceId="category-select"
                isMulti
                options={categoryOptions}
                value={categoryOptions.filter((opt) => formData.category_ids.includes(opt?.value))}
                onChange={(selected) =>
                  setFormData({
                    ...formData,
                    category_ids: selected ? selected.map((opt) => opt.value) : [],
                  })
                }
                className="text-sm text-black"
                classNamePrefix="react-select"
              />
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition duration-200 shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                Publish Article
              </button>
            </div>
          </div>

          {/* Status Alerts */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium text-center">
              Article published successfully!
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