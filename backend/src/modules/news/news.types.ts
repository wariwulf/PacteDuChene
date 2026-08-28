import type { NewsCategory } from "./news.model";

export interface CreateNewsInput {
  title: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  image?: string;
  published?: boolean;
  featured?: boolean;
  publishedAt?: Date;
}

export interface UpdateNewsInput {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: NewsCategory;
  image?: string;
  published?: boolean;
  featured?: boolean;
  publishedAt?: Date;
}