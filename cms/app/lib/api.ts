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

/**
 * Helper utility to process response payloads uniformly.
 * Server Actions return data directly to the client components.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP error! status: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return (await response.json()) || [];
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
  return handleResponse<Category[]>(res);
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
  return handleResponse<{ files: string[] }>(res);
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
  const res = await backend.post("/upload", undefined, { body: formData });
  return handleResponse<any>(res);
}