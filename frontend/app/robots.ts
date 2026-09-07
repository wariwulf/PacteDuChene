import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/administration/",
          "/espace-membre/",
          "/connexion/",
          "/login/",
          "/auth-test/",
          "/changement-de-mot-de-passe/",
          "/changement-mot-de-passe/",
          "/economie/",
          "/quetes/",
        ],
      },
    ],
    sitemap: "https://lepacteduchene.fr/sitemap.xml",
  };
}
