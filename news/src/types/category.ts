import { Article, ArticleTranslation, Story } from "./article";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryArticle {
  id: string;
  name: string;
  slug: string;
  articles: Story[]
}