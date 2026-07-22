"use client";

import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { useAuth } from "@/app/components/AuthContext";
import { Media, Category } from "@/app/types/types";
import MediaBlock from "../../components/mediaBlock";
import TextEditor, { TextEditorRef } from "../../components/editor/textEditor";
import { createArticle, getCategories } from "@/app/lib/api";

export default function ArticleForm() {
  const editorRef = useRef<TextEditorRef>(null);

  const [formData, setFormData] = useState({
    locale: "am",
    title: "",
    slug: "",
    tag: "primary",
    description: "",
    media: {
      mediaType: "image" as const,
      source: "external" as const,
      url: "",
    } as Media,
    category_ids: [],
  });

  const [bodyContent, setBodyContent] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories();
        if (categoriesData.data) setCategories(categoriesData.data);
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
      media: formData.media || null,
      category_ids: formData.category_ids,
      translations: [
        {
          id: 0,
          locale: formData.locale,
          title: titleText,
          slug: formData.slug,
          description: formData.description.trim(),
          content: bodyJson,                    // Main body from editor
          editor_id: user?.id || 0,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-xl">
      <h2 className="text-3xl font-serif font-bold mb-8 text-gray-900">Create New Article</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Metadata Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              readOnly
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <select
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              className="w-full border border-gray-300 bg-white rounded-lg px-4 py-2.5"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="breaking news">Breaking News</option>
              <option value="trending">Trending</option>
              <option value="morestories">More Stories</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
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
              className="text-black"
              classNamePrefix="react-select"
            />
          </div>
          {/* Locale */}
          <div className="flex justify-end">
            <select
              value={formData.locale}
              onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
              className="border border-gray-300 bg-white text-gray-800 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="om">Oromo (om)</option>
              <option value="am">Amharic (am)</option>
              <option value="en">English (en)</option>
              <option value="sw">Swahili (sw)</option>
            </select>
          </div>
        </div>
        

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Article Title</label>
          <input
            type="text"
            placeholder="Enter a compelling title..."
            value={formData.title}
            onChange={handleTitleChange}
            className="w-full text-2xl font-semibold border border-gray-300 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1.5">This will be used as the main headline</p>
        </div>

        {/* Featured Media */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Featured Media (Image/Video)</label>
          <MediaBlock
            data={formData.media}
            onChange={(updated) => setFormData({ ...formData, media: updated })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
          <textarea
            placeholder="Write a concise summary of the article..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full h-28 border border-gray-300 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            rows={4}
          />
        </div>

        {/* Main Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Main Article Content</label>
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <TextEditor
              ref={editorRef}
              onChange={(json) => setBodyContent(json)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
        >
          Publish Article
        </button>
      </form>

      {success && (
        <p className="text-green-600 text-center mt-6 font-medium">Article published successfully!</p>
      )}
      {error && <p className="text-red-600 text-center mt-6">{error}</p>}
    </div>
  );
}