"use client";
import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { useAuth } from "@/app/components/AuthContext";
import { Media, Category } from "@/app/types/types";
import MediaBlock from "../../components/mediaBlock";
import TextEditor, { TextEditorRef } from "../../components/editor/textEditor";
import { createArticle, getCategories } from "@/app/lib/api";

interface ArticleFormData {
  locale: string;
  title: any;
  slug: string;
  tag: string;
  description: any;
  content: any;
  editor_id: number;
  is_published: number;
  category_ids: number[];
}


export default function ArticleForm() {
  const editorRef = useRef<TextEditorRef>(null);
  const [formData, setFormData] = useState<ArticleFormData>({
    locale: "am",
    title: {},
    slug: "",
    tag: "primary",
    description: {},
    content: {},
    editor_id: 0,
    is_published: 0,
    category_ids: [],
  });

  const [content, setContent] = useState<any>([]);
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

    const titleJson = editorHelpers.getTitle();
    const descriptionJson = editorHelpers.getDescription();
    const bodyJson = editorHelpers.getBody();

    console.log("title: ", titleJson);
    console.log("description: ", descriptionJson);
    console.log("body: ", bodyJson);

    // Validation
    const titleText = titleJson.content?.[0]?.text?.trim() || "";
    if (!titleText) {
      alert("Title is required");
      return;
    }

    const payload = {
      tag: formData.tag,
      category_ids: formData.category_ids,
      translations: [
        {
          id: 0,
          locale: formData.locale,
          title: titleJson,
          slug: formData.slug,
          description: descriptionJson,
          content: bodyJson,
          editor_id: user?.id || 0,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    try {
      await createArticle(payload);
      setSuccess(true);
      setFormData({
        locale: "am",
        title: {},
        slug: "",
        tag: "primary",
        description: {},
        content: {},
        editor_id: 0,
        is_published: 0,
        category_ids: [],
      });
      setError(null);
      //   setTimeout(() => {
      //     onSuccess();
      //   }, 1000);
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

  const categoryOptions = categories?.map((category) => ({
    value: category.id,
    label: category.name,
  })) || [];

  return (
    <div className="mx-auto p-6 rounded-lg shadow-lg w-full bg-white text-black">
      <h2 className="text-2xl font-serif font-bold mb-6">Create Article</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <select
          value={formData.locale}
          onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
          className="self-end border border-gray-300 bg-white text-gray-800 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="om">om</option>
          <option value="am">am</option>
          <option value="en">en</option>
          <option value="sw">sw</option>
        </select>

        <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            placeholder="Slug"
            value={formData.slug}
            readOnly
            className="border border-gray-300 bg-white text-gray-800 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
          <select
            value={formData.tag}
            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
            className="border border-gray-300 bg-white text-gray-800 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          >
            <option value="primary">primary</option>
            <option value="secondary">secondary</option>
            <option value="breaking news">breaking news</option>
            <option value="trending">trending</option>
            <option value="morestories">morestories</option>
          </select>
          <div className="flex-1">
            <Select
              isMulti
              options={categoryOptions}
              value={categoryOptions.filter((opt) =>
                formData.category_ids.includes(opt.value),
              )}
              onChange={(selected) =>
                setFormData({
                  ...formData,
                  category_ids: selected
                    ? selected.map((opt) => opt.value)
                    : [],
                })
              }
              className="text-black"
              classNamePrefix="react-select"
            />
          </div>
        </div>
        <h1 className="font-semibold text-lg text-gray-800">Content</h1>
        <TextEditor
          ref={editorRef}
          onChange={(json) => setContent(json)}
        />

        <button
          type="submit"
          className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition-colors"
        >
          Add Article
        </button>
      </form>
      {success && (
        <p className="text-green-600 mt-2">Article created successfully!</p>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}