"use server";

// 1. Import your advanced BackendClient instance 
import { client as backend } from "./client"; // Adjust path to your BackendClient file
import {
  LoginData,
  RegisterData,
  AuthResponse,
  User,
  Article,
  Category,
  MediaFile,
  ArticleTranslation,
  ArticleUpdate,
  Invite,
} from "../types/types";
import { MediaItemRes } from "../(main)/files/page";

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
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle HTTP No Content safely
  if (response.status === 204) {
    return {} as T;
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
  return (body as T) || ([] as unknown as T);
}

// ==========================================
// AUTH ACTIONS
// ==========================================

// export async function loginUser(email_or_username: string, password: string) {
//   const res = await backend.post("/auth/login", { email_or_username, password });
//   return handleResponse<{ email_or_username: string; password: string }>(res);
// }

// export async function registerUser(slug: string, data: RegisterData) {
//   const res = await backend.post(`/auth/register/${slug}`, data);
//   return handleResponse<AuthResponse>(res);
// }

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
  return handleResponse<{ success: boolean; statusCode: number; data: Invite[] }>(res);
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

export async function deleteUser(id: number) {
  const res = await backend.delete(`/users/${id}`);
  return handleResponse<any>(res);
}

export async function updateUser(id: number, data: Partial<User>) {
  const res = await backend.put(`/users/${id}`, data);
  return handleResponse<User>(res);
}

// ==========================================
// ARTICLES ACTIONS
// ==========================================

export async function getArticles() {
  const res = await backend.get("/articles");
  return handleResponse<AppResponse<Article[]>>(res);
}

export async function getArticleById(id: string) {
  const res = await backend.get(`/articles/${id}`);
  return handleResponse<Article>(res);
}

export async function getArticleBySlug(slug: string) {
  const res = await backend.get(`/articles/slug/${slug}`);
  return handleResponse<Article>(res);
}

export async function createArticle(data: Partial<Article>) {
  const res = await backend.post("/articles", data);
  return handleResponse<Article>(res);
}

export async function updateArticle(article_id: number, data: Partial<ArticleUpdate>) {
  const res = await backend.patch(`/articles/${article_id}`, data);
  return handleResponse<ArticleUpdate>(res);
}

export async function deleteArticle(id: number) {
  const res = await backend.delete(`/articles/${id}`);
  return handleResponse<any>(res);
}

// ==========================================
// LOCALE ACTIONS
// ==========================================

export async function addLocale(data: Partial<ArticleTranslation>) {
  const res = await backend.post("/locale", data);
  return handleResponse<ArticleTranslation>(res);
}

export async function deleteLocale(id: number) {
  const res = await backend.delete(`/delete/locale/${id}`);
  return handleResponse<any>(res);
}

// ==========================================
// CATEGORIES ACTIONS
// ==========================================

export async function getCategories() {
  const res = await backend.get("/categories");
  return handleResponse<AppResponse<Category[]>>(res);
}

export async function getCategoryById(id: string) {
  const res = await backend.get(`/categories/${id}`);
  return handleResponse<Category>(res);
}

export async function getCategoryBySlug(slug: string) {
  const res = await backend.get(`/categories/slug/${slug}`);
  return handleResponse<Category>(res);
}

export async function getArticlesByCategory(categoryId: string) {
  const res = await backend.get(`/articles/category/${categoryId}`);
  return handleResponse<Article[]>(res);
}

export async function getCategoriesByArticle(articleId: string) {
  const res = await backend.get(`/categories/article/${articleId}`);
  return handleResponse<Category[]>(res);
}

export async function createCategory(data: Partial<Category>) {
  const res = await backend.post("/categories", data);
  return handleResponse<Category>(res);
}

export async function updateCategory(id: number, data: Partial<Category>) {
  const res = await backend.put(`/categories/${id}`, data);
  return handleResponse<Category>(res);
}

export async function deleteCategory(id: number) {
  const res = await backend.delete(`/categories/${id}`);
  return handleResponse<any>(res);
}

// ==========================================
// MEDIA ACTIONS
// ==========================================

export async function getMedia() {
  const res = await backend.get("/uploads");
  return handleResponse<{files:any[]}>(res);
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

export async function putMedia(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // 1. Ask Go backend for Presigned Upload URL
  // Replace backend endpoint with your actual Go server URL (e.g. http://localhost:8080)
  const presignRes = await backend.post("/uploads/presignedUrl", undefined, {
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      type: file.type,
      source: "bucket",
    }),
  });

  if (!presignRes.ok) {
    throw new Error("Failed to retrieve presigned URL from backend");
  }

  const result = await presignRes.json();
  const { upload_url, media_id, storage_key } = result?.data;

  // 3. Convert File to ArrayBuffer and stream to S3 / LocalStack
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Length": buffer.length.toString(),
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`S3 upload failed (${uploadRes.status}): ${errText}`);
  }

  // 4. Return result safely to Client Component without exposing presigned URLs
  return {
    success: true,
    mediaId: media_id,
    storageKey: storage_key,
  };
}

export async function confirmSave(keys : string[]){
  const res = await backend.post("/uploads/confirm", undefined, {body: JSON.stringify({storageKeys: keys})})
  return await res.json()
}