import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

import {
  getPublishedNews,
  getPublishedNewsBySlug,
  createNewsArticle,
  updateNewsArticle,
} from "./news.service";

export async function getNews(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const news = await getPublishedNews();

    return res.status(200).json({
      success: true,
      data: {
        news,
      },
    });
  } catch (error) {
    console.error("Erreur récupération actualités :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les actualités.",
    });
  }
}

export async function getNewsBySlug(
  req: AuthenticatedRequest & { params: { slug: string } },
  res: Response
) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug de l'actualité manquant.",
      });
    }

    const article = await getPublishedNewsBySlug(slug);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Actualité introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        news: article,
      },
    });
  } catch (error) {
    console.error(
      "Erreur récupération actualité :",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer cette actualité.",
    });
  }
}

export async function createNews(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      image,
      published,
      featured,
      publishedAt,
    } = req.body;

    if (!title || !excerpt || !content || !category) {
      return res.status(400).json({
        success: false,
        message:
          "Le titre, le résumé, le contenu et la catégorie sont obligatoires.",
      });
    }

    const article = await createNewsArticle(
      {
        title,
        excerpt,
        content,
        category,
        image,
        published,
        featured,
        publishedAt,
      },
      req.user!.id
    );

    return res.status(201).json({
      success: true,
      data: {
        news: article,
      },
    });
  } catch (error) {
    console.error(
      "Erreur création actualité :",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Impossible de créer cette actualité.",
    });
  }
}

export async function updateNews(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de l'actualité manquant.",
      });
    }

    const {
      title,
      excerpt,
      content,
      category,
      image,
      published,
      featured,
      publishedAt,
    } = req.body;

    const article = await updateNewsArticle(id, {
      title,
      excerpt,
      content,
      category,
      image,
      published,
      featured,
      publishedAt,
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Actualité introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        news: article,
      },
    });
  } catch (error) {
    console.error("Erreur modification actualité :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de modifier cette actualité.",
    });
  }
}