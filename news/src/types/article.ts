import { Category } from "./category";
import { Media } from "./media";

export interface Article {
  id: string;
  tag: string;
  media?: Media;
  category_ids: string[];
  categories: Category[];
  translations: ArticleTranslation[];
  created_at: string;
  updated_at: string;
}

export interface ArticleTranslation {
  id: string;
  article_id?: string;
  locale: string;
  title: string;
  slug: string;
  description?: string;
  content?: any; // JSON content from Tiptap editor
  editor_id: string;
  published_at?: string;
  updated_at?: string;
}

export interface ArticleUpdate {
  id: string;
  tag: string;
  media?: Media;
  category_ids: number[];
  categories?: Category[];
  translations: Record<string, Partial<ArticleTranslation>>;
  updated_at: string;
}

export interface Story {
  id: string;
  article_id?: string;
  tag: string;
  media?: Media;
  categories: Category[];
  locale: string;
  title: string;
  slug: string;
  description?: string;
  content?: any; // JSON content from Tiptap editor
  editor_id: string;
  published_at?: string;
  updated_at?: string;
}

// 1. Define the exact response structure returned by Go Elasticsearch backend
export interface SearchHit {
  article_id: string;
  locale: string;
  title: string;
  slug: string;
  description: string;
  highlights?: Record<string, string[]>;
}
