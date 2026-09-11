import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: [
        "/administration/",
        "/espace-membre/",
        "/inventaire/",
        "/connexion/",
        "/login/",
        "/auth-test/",
        "/changement-de-mot-de-passe/",
        "/changement-mot-de-passe/",
        "/clan/",
        "/boutiques/",
        "/niveaux/",
        "/paxdei/",
        "/discord/",
        "/contact/",
        "/economie/",
        "/quetes/",
      ],
    }],
    sitemap: "https://lepacteduchene.fr/sitemap.xml",
  };
}
