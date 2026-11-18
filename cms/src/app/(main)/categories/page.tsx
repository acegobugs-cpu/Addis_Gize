"use client";

import { useEffect, useState } from "react";
import { Cat, CategoryLocale } from "@/app/types/category";
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/app/lib/api";
import { Locale, LOCALE_LABELS, SUPPORTED_LOCALES } from "@/app/types/locale";

interface CategoryFormData {
  locale: Locale;
  name: string;
  slug: string;
}

export default function Categories() {
  const [cat, setCat] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Main Form State (For creating a brand new category)
  const [form, setForm] = useState<CategoryFormData>({ locale: "en", name: "", slug: "" });

  // Modal State (For adding/editing/deleting a translation on an existing category)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState<CategoryFormData>({ locale: "en", name: "", slug: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      if (categoriesData.data) setCat(categoriesData.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- MAIN FORM HANDLERS ---
  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value as Locale;
    setForm({ ...form, locale });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().split(/[\s-]/)[0].replace(/[^a-z]/g, "");
    setForm({ ...form, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug) return setError("Slug cannot be empty");
    try {
      await createCategory(form);
      setSuccess(true);
      setForm({ locale: "en", name: "", slug: "" });
      setError(null);
      fetchCategories();
    } catch (err) {
      setError("Failed to create category");
      setSuccess(false);
    }
  };

  // --- MODAL HANDLERS ---
  const openAddTranslationModal = (categoryId: string, locale: Locale) => {
    setActiveCategoryId(categoryId);
    setModalMode("add");
    setModalForm({ locale, name: "", slug: "" });
    setIsModalOpen(true);
  };

  const openEditTranslationModal = (categoryId: string, translation: CategoryFormData) => {
    setActiveCategoryId(categoryId);
    setModalMode("edit");
    setModalForm({ locale: translation.locale, name: translation.name, slug: translation.slug });
    setIsModalOpen(true);
  };

  const handleModalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().split(/[\s-]/)[0].replace(/[^a-z]/g, "");
    setModalForm({ ...modalForm, name, slug });
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryId) return;
    
    try {
      await updateCategory(activeCategoryId, modalForm);
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save translation:", error);
      alert("Failed to save translation");
    }
  };

  const handleModalDelete = async () => {
    if (!activeCategoryId) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the ${modalForm.locale} translation?`);
    if (!confirmDelete) return;

    try {
      // NOTE: You may need a specific API endpoint for deleting just ONE translation 
      // e.g., deleteTranslation(activeCategoryId, modalForm.locale).
      // If deleteCategory deletes the ENTIRE category for all languages, use carefully!
      await deleteCategory(activeCategoryId); 
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete translation:", error);
      alert("Failed to delete translation");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      <h1 className="text-3xl font-serif font-bold mb-8 text-gray-800">Categories</h1>

      {/* Create Category Form */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-serif font-bold mb-4 text-gray-800">Create Category</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <select 
            value={form.locale} 
            onChange={handleLocaleChange}
            className="border border-gray-300 p-3 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <option key={locale} value={locale}>{locale}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Category Name"
            value={form.name}
            onChange={handleNameChange}
            className="border border-gray-300 p-3 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            type="text"
            placeholder="Slug"
            value={form.slug}
            readOnly
            className="border border-gray-300 p-3 rounded text-gray-800 bg-gray-100 focus:outline-none"
            required
          />
          <button type="submit" className="bg-purple-600 text-white p-3 rounded hover:bg-purple-700 transition-colors">
            Add Category
          </button>
        </form>
        {success && <p className="text-green-600 mt-2">Category created successfully!</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {/* Category List */}
      {loading ? (
        <p className="text-gray-700">Loading...</p>
      ) : cat.length > 0 ? (
        <div className="p-6 bg-white rounded-lg shadow-lg overflow-x-auto">
          <h2 className="text-2xl font-serif font-bold mb-4 text-gray-800">Category List</h2>
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-3">ID / Ref</th>
                {SUPPORTED_LOCALES.map((locale) => (
                  <th key={locale} className="border border-gray-300 p-3 uppercase">{locale}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cat.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3 text-sm text-gray-500">
                    <span className="font-mono text-xs">{category.id.substring(0, 8)}...</span>
                  </td>

                  {SUPPORTED_LOCALES.map((locale) => {
                    const translation = category[locale];
                    return (
                      <td key={locale} className="border border-gray-300 p-3">
                        {translation ? (
                          <div 
                            className="flex flex-col cursor-pointer p-2 rounded hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200"
                            onClick={() => openEditTranslationModal(category.id, translation)}
                          >
                            <span className="font-semibold text-gray-800">{translation.name}</span>
                            <span className="text-xs text-gray-500">{translation.slug}</span>
                          </div>
                        ) : (
                          <div 
                            className="text-sm text-red-500 italic cursor-pointer p-2 rounded hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                            onClick={() => openAddTranslationModal(category.id, locale)}
                          >
                            + Add Translation
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-700 text-center py-4">No categories found.</p>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {modalMode === "add" ? "Add Translation" : "Edit Translation"} ({modalForm.locale.toUpperCase()})
            </h3>
            
            <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={handleModalNameChange}
                  className="w-full border border-gray-300 p-3 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={modalForm.slug}
                  readOnly
                  className="w-full border border-gray-300 p-3 rounded text-gray-800 bg-gray-100 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white p-3 rounded hover:bg-purple-700 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-800 p-3 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Only show delete option if we are editing an existing translation */}
              {modalMode === "edit" && (
                <button
                  type="button"
                  onClick={handleModalDelete}
                  className="mt-2 w-full text-red-600 border border-red-200 p-3 rounded hover:bg-red-50 transition-colors"
                >
                  Delete this translation
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}