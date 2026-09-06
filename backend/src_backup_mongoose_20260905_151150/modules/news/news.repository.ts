import { News, type NewsDocument } from "./news.model";
import { Schema } from "mongoose";
import { Types } from "mongoose";
import type {
  CreateNewsInput,
  UpdateNewsInput,
} from "./news.types";

export async function findPublishedNews(): Promise<NewsDocument[]> {
  return News.find({
    published: true,
  })
    .sort({
      publishedAt: -1,
      createdAt: -1,
    })
    .lean();
}

export async function findNewsBySlug(
  slug: string
): Promise<NewsDocument | null> {
  return News.findOne({
    slug,
    published: true,
  }).lean();
}

export async function createNews(
  data: CreateNewsInput & {
    slug: string;
    authorId: Types.ObjectId;
  }
): Promise<NewsDocument> {
  return News.create(data);
}

export async function updateNews(
  id: string,
  data: UpdateNewsInput
): Promise<NewsDocument | null> {
  return News.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
}