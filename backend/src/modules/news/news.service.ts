import { Types } from "mongoose";

import {
  createNews,
  findNewsBySlug,
  findPublishedNews,
  updateNews,
} from "./news.repository";

import type {
  CreateNewsInput,
  UpdateNewsInput,
} from "./news.types";


function createSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getPublishedNews() {
  return findPublishedNews();
}

export async function getPublishedNewsBySlug(
  slug: string
) {
  return findNewsBySlug(slug);
}

export async function createNewsArticle(
  input: CreateNewsInput,
  authorId: string
) {
  const slug = createSlug(input.title);

  return createNews({
    ...input,
    slug,
    authorId: new Types.ObjectId(authorId),
  });
}

export async function updateNewsArticle(
  id: string,
  input: UpdateNewsInput
) {
  return updateNews(id, input);
}