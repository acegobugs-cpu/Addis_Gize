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
  editor_id: number;
  published_at?: string;
  updated_at?: string;
}

export interface Story {
  id: string;
  article_id?: string;
  tag: string;
  media?: Media;
  category_ids: string[];
  categories: Category[];
  locale: string;
  title: string;
  slug: string;
  description?: string;
  content?: any; // JSON content from Tiptap editor
  editor_id: number;
  published_at?: string;
  updated_at?: string;
}

export interface ArticleUpdate {
  id: string;
  tag: string;
  media?: Media;
  category_ids: string[];
  categories?: Category[];
  translation: Partial<ArticleTranslation>;
  updated_at: string;
}