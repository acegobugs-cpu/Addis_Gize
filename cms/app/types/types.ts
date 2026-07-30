export interface LoginData {
  email_or_username: string;
  password: string;
}

export interface RegisterData {
  fname: string;
  lname: string;
  mname?: string;
  uname: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
}

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

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Invite {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  inviterId?: string;
  status: string;
  roleIds?: string[];
}

export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
  uploaded_at: string;
}

export interface Media {
  mediaType: "image" | "video" | "audio" | "embed";
  url: string;
  alt?: string;
}

export interface MediaItemRes {
  id: string;
  fileName: string;
  url: string;
  thumbnailUrl: string;
  type: string;
  source: string;
  created_at: string;
}

export interface RegisterFormData {
  email: string;
  fname: string;
  mname?: string;
  lname: string;
  uname: string;
  password: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface AuthResponse {
  token: string;
  user: User;
}
