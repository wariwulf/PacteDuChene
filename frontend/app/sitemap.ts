import type { MetadataRoute } from "next";

const siteUrl = "https://lepacteduchene.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/clan",
    "/boutiques",
    "/niveaux",
    "/lore",
    "/news",
    "/paxdei",
    "/discord",
    "/contact",
  ];

  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : "daily",
    priority:
      path === "/"
        ? 1
        : ["/clan", "/news", "/lore", "/paxdei"].includes(path)
          ? 0.9
          : 0.7,
  }));
}
