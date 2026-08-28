import { Schema, model, type Document } from "mongoose";
import { Types } from "mongoose";

export type NewsCategory =
  | "COMMUNAUTE"
  | "EVENEMENT"
  | "PACTE"
  | "ANNONCE";

export interface NewsDocument extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  authorId: Types.ObjectId;
  image?: string;
  published: boolean;
  featured: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<NewsDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    excerpt: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "COMMUNAUTE",
        "EVENEMENT",
        "PACTE",
        "ANNONCE",
      ],
      required: true,
    },

    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    image: {
      type: String,
    },

    published: {
      type: Boolean,
      default: false,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

newsSchema.index({
  published: 1,
  publishedAt: -1,
});

newsSchema.index({
  featured: 1,
  published: 1,
  publishedAt: -1,
});

export const News = model<NewsDocument>("News", newsSchema);