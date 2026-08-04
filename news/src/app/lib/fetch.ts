import { Article, SearchHit, Story } from "@/types/article";
import { CategoryArticle } from "@/types/category";
import axios from "axios";
import CategoryArticleList from "../[locale]/section/[slug]/catList";

export interface ResponseType<T> {
  status: number;
  message: string;
  data: T;
}

// 2. Axios Instance Setup
const API = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const REVALIDATE_DURATION = 30; // 30 seconds

// Helper to create consistent fallback responses on error
function createErrorResponse<T>(
  message: string,
  defaultData: T,
): ResponseType<T> {
  return {
    status: 500,
    message,
    data: defaultData,
  };
}

// 3. Strongly-Typed API Functions

/**
 * Fetch all articles, optionally filtered by locale language.
 */
export async function fetchArticles(
  lan: string = "am",
): Promise<ResponseType<Story[]>> {
  try {
    const res = await API.get<ResponseType<Story[]>>(`/articles/lan/${lan}`);
    return res.data;
  } catch (error) {
    handleAxiosError(error, "Articles");
    return createErrorResponse("Failed to fetch articles", []);
  }
}

/**
 * Fetch a single article by slug and optional locale language.
 */
export async function fetchArticleById(
  slug: string,
  lan?: string | null,
): Promise<ResponseType<Story | null>> {
  try {
    const res = await API.get<ResponseType<Story | null>>(
      `/articles/slug/${slug}`,
      {
        params: lan ? { locale: lan } : undefined,
      },
    );
    return res.data;
  } catch (error) {
    handleAxiosError(error, "Article");
    return createErrorResponse("Failed to fetch article", null);
  }
}

/**
 * Fetch articles belonging to a specific category slug.
 */
export async function fetchArticlesByCategory(
  slug: string,
  lan?: string | null,
): Promise<ResponseType<CategoryArticle | null>> {
  try {
    const res = await API.get<ResponseType<CategoryArticle>>(
      `/articles/lan/${lan}/category/${slug}`,
    );
    console.log("dlklk", res.data);
    return res.data;
  } catch (error) {
    handleAxiosError(error, "Articles by Category");
    return createErrorResponse("Failed to fetch category articles", null);
  }
}

/**
 * Fetch all article categories.
 */
export async function fetchCategories(
  lan: string,
): Promise<ResponseType<CategoryArticle[]>> {
  try {
    const res = await API.get<ResponseType<CategoryArticle[]>>(
      `/articles/lan/${lan}/categories`,
    );
    return res.data;
  } catch (error) {
    handleAxiosError(error, "Categories");
    return createErrorResponse("Failed to fetch categories", []);
  }
}

/**
 * Search articles by query string.
 */
export async function fetchSearch(
  locale: string,
  q: string,
): Promise<ResponseType<SearchHit[]>> {
  try {
    const res = await API.get<ResponseType<SearchHit[]>>(
      `/articles/lan/${locale}/search?q=${q}`
    );
    return res.data ?? [];
  } catch (error) {
    handleAxiosError(error, "Search");
    return createErrorResponse("Search failed", []);
  }
}

// Helper utility to safely log Axios errors with TypeScript
function handleAxiosError(error: unknown, context: string): void {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error(`${context} Status:`, error.response.status);
    }
    console.error(`Error fetching ${context.toLowerCase()}:`, error.message);
  } else if (error instanceof Error) {
    console.error(`Unexpected error in ${context}:`, error.message);
  } else {
    console.error(`Unknown error in ${context}:`, error);
  }
}
