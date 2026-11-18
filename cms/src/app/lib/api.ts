"use server";

import { Article, ArticleCreate, ArticleTranslation, ArticleUpdate, Story } from "../types/article";
import { Cat, CategoryLocale } from "../types/category";
import { Locale } from "../types/locale";
import { MediaItemRes } from "../types/media";
import { AuthResponse, Invite, RegisterData, User } from "../types/user";
// 1. Import your advanced BackendClient instance 
import { client as backend } from "./client"; // Adjust path to your BackendClient file
// 1. Mirror your Go AppError struct in TypeScript
interface AppResponse<T = any> {
  success: boolean;
  statusCode?: number; // Internal App Code
  message?: string;
  details?: string;
  data?: T;
}

/**
 * Robust helper utility to process Go AppError & success payloads uniformly.
 */
async function handleResponse<T>(response: Response): Promise<AppResponse<T>> {
  // Handle HTTP No Content safely
  if (response.status === 204) {
    return {} as AppResponse<T>;
  }

  let body: AppResponse<T> | null = null;
  try {
    body = await response.json();
  } catch {
    // Fallback if the body isn't JSON at all
  }

  // Check if network failed OR if backend explicitly marked success: false
  if (!response.ok || (body && body.success === false)) {
    const errorMessage = body?.message || body?.details || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  // Fallback if the backend returned a flat object/array instead of nesting it in "data"
  return (body as AppResponse<T>) || ([] as unknown as T);
}

// ==========================================
// AUTH ACTIONS
// ==========================================

export async function loginUser(email_or_username: string, password: string) {
  const res = await backend.post("/auth/login", { email_or_username, password });
  return handleResponse<{ email_or_username: string; password: string }>(res);
}

export async function RegisterUser(slug: string, data: RegisterData) {
  const res = await backend.post(`/auth/register/${slug}`, data);
  return handleResponse<AuthResponse>(res);
}

// ==========================================
// INVITE / EMAIL ACTIONS
// ==========================================

export async function invite(data: {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  roleIds: string[];
}) {
  const res = await backend.post("/users/invite", data);
  return handleResponse<Invite>(res);
}

export async function getInvites() {
  const res = await backend.get("/users/invites");
  return handleResponse<Invite[]>(res);
}

export async function deleteEmails(id: string) {
  const res = await backend.delete(`/authorize-emails/${id}`);
  return handleResponse<any>(res);
}

// ==========================================
// USERS ACTIONS
// ==========================================

export async function getUsers() {
  const res = await backend.get("/users");
  return handleResponse<User[]>(res);
}

export async function deleteUser(id: string) {
  const res = await backend.delete(`/users/${id}`);
  return handleResponse<any>(res);
}

export async function updateUser(id: string, data: Partial<User>) {
  const res = await backend.put(`/users/${id}`, data);
  return handleResponse<User>(res);
}

// ==========================================
// ARTICLES ACTIONS
// ==========================================

export async function getArticles(lan:string) {
  const res = await backend.get(`/articles?lan=${lan}`);
  return handleResponse<Article[]>(res);
}

export async function getArticleById(id: string) {
  const res = await backend.get(`/articles/${id}`);
  return handleResponse<Article>(res);
}

export async function getArticleBySlug(slug: string) {
  const res = await backend.get(`/articles/slug/${slug}`);
  return handleResponse<Article>(res);
}


export async function createArticle(data: Partial<ArticleCreate>) {
  const res = await backend.post("/articles", data);
  return handleResponse<Article>(res);
}

export async function updateArticle(article_id: string, data: Partial<ArticleUpdate>) {
  const res = await backend.patch(`/articles/${article_id}`, data);
  return handleResponse<ArticleUpdate>(res);
}

export async function deleteArticle(id: string) {
  const res = await backend.delete(`/articles/${id}`);
  return handleResponse<any>(res);
}

// ==========================================
// LOCALE ACTIONS
// ==========================================

export async function getStories(lan: Locale){
  const res = await backend.get(`/articles/lan/${lan}`);
  return handleResponse<Story[]>(res);
}

export async function getArticleLocales(id: string){
  const res = await backend.get(`/articles/${id}/lan`);
  return handleResponse<Article>(res);
}

export async function addLocale(data: Partial<ArticleTranslation>) {
  const res = await backend.post(`/articles/locale`, data);
  return handleResponse<ArticleTranslation>(res);
}

export async function deleteLocale(id: string) {
  const res = await backend.delete(`/delete/locale/${id}`);
  return handleResponse<any>(res);
}

// ==========================================
// CATEGORIES ACTIONS
// ==========================================

export async function getCategories() {
  const res = await backend.get("/categories");
  return handleResponse<Cat[]>(res);
}

export async function getCategoryById(id: string) {
  const res = await backend.get(`/categories/${id}`);
  return handleResponse<CategoryLocale>(res);
}

export async function getCategoryBySlug(slug: string) {
  const res = await backend.get(`/categories/slug/${slug}`);
  return handleResponse<CategoryLocale>(res);
}

export async function getArticlesByCategory(categoryId: string) {
  const res = await backend.get(`/articles/category/${categoryId}`);
  return handleResponse<Article[]>(res);
}

export async function getCategoriesByArticle(articleId: string) {
  const res = await backend.get(`/categories/article/${articleId}`);
  return handleResponse<CategoryLocale[]>(res);
}

export async function createCategory(data: Partial<CategoryLocale>) {
  const res = await backend.post("/categories", data);
  return handleResponse<CategoryLocale>(res);
}

export async function updateCategory(id: string, data: Partial<CategoryLocale>) {
  const res = await backend.put(`/categories/${id}`, data);
  return handleResponse<CategoryLocale>(res);
}

export async function deleteCategory(id: string) {
  const res = await backend.delete(`/categories/${id}`);
  return handleResponse<any>(res);
}

// ==========================================
// MEDIA ACTIONS
// ==========================================

export async function getMedia() {
  const res = await backend.get("/uploads");
  return handleResponse<MediaItemRes[]>(res);
}

export async function delMedia(filename: string) {
  const res = await backend.delete(`/upload/${filename}`);
  return handleResponse<any>(res);
}

/**
 * Advanced Note on FormData handling:
 * Next.js Server Actions automatically parse multi-part FormData natively.
 * We pass the formData directly as options to client.post().
 */
export async function uploadFile(formData: FormData) {
  // Since BackendClient post takes (path, body, options), pass formData via custom options boundary
  const res = await backend.post("/uploads", undefined, { body: formData });
  return handleResponse<any>(res);
}

export async function getPresignedUrl(metadata: {
  filename: string;
  contentType: string;
}) {
  const { filename, contentType } = metadata;

  const presignRes = await backend.post("/uploads/presignedUrl", undefined, {
    body: JSON.stringify({
      filename,
      content_type: contentType || "application/octet-stream",
      type: contentType,
      source: "bucket",
    }),
  });

  if (!presignRes.ok) {
    throw new Error("Failed to retrieve presigned URL from backend");
  }

  const result = await presignRes.json();
  const { upload_url, media_id, storage_key } = result?.data || {};

  if (!upload_url) {
    throw new Error("Presigned URL was not returned by the backend");
  }

  return {
    uploadUrl: upload_url as string,
    mediaId: media_id as string,
    storageKey: storage_key as string,
  };
}

export async function confirmSave(keys : string[]){
  const res = await backend.post("/uploads/confirm", undefined, {body: JSON.stringify({storageKeys: keys})})
  return handleResponse<MediaItemRes[]>(res);
}