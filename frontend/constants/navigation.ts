import type { SitePermission } from "@/lib/permissions";

export type NavigationAccess = "public" | "member" | "admin";

export interface NavigationItem {
  label: string;
  href: string;
  access: NavigationAccess;
  /** Permission fonctionnelle requise pour une entrée d’administration. */
  permission?: SitePermission;
  /** Entrée réservée aux rôles ADMIN / OWNER. */
  adminOnly?: boolean;
}

export const navigation: NavigationItem[] = [
  {
    label: "Accueil",
    href: "/",
    access: "public",
  },
  {
    label: "Actualités",
    href: "/news",
    access: "public",
  },
  {
    label: "Lore",
    href: "/lore",
    access: "public",
  },
  {
    label: "Clan",
    href: "/clan",
    access: "member",
  },
  {
    label: "Personnage",
    href: "/espace-membre/personnage",
    access: "member",
  },
  {
    label: "Inventaire",
    href: "/inventaire",
    access: "member",
  },
  {
    label: "Quêtes",
    href: "/espace-membre/quetes",
    access: "member",
  },
  {
    label: "Exploits",
    href: "/espace-membre/exploits",
    access: "member",
  },
  {
    label: "Boutiques",
    href: "/boutiques",
    access: "member",
  },
  {
    label: "Événements",
    href: "/espace-membre/evenements",
    access: "member",
  },
  {
    label: "Discord",
    href: "/discord",
    access: "member",
  },
];

export const administrationNavigation: NavigationItem[] = [
  {
    label: "Membres",
    href: "/administration/membres",
    access: "admin",
    adminOnly: true,
  },
  {
    label: "Quêtes",
    href: "/administration/quetes",
    access: "admin",
    permission: "quests.manage",
  },
  {
    label: "Exploits",
    href: "/administration/exploits",
    access: "admin",
    permission: "achievements.manage",
  },
  {
    label: "Niveaux",
    href: "/administration/niveaux",
    access: "admin",
    adminOnly: true,
  },
  {
    label: "Économie",
    href: "/administration/economie",
    access: "admin",
    permission: "economy.adjust",
  },
  {
    label: "Inventaire",
    href: "/administration/inventaire",
    access: "admin",
    adminOnly: true,
  },
  {
    label: "Lore",
    href: "/administration/lore",
    access: "admin",
    adminOnly: true,
  },
  {
    label: "Actualités",
    href: "/administration/news",
    access: "admin",
    permission: "news.manage",
  },
  {
    label: "Boutiques",
    href: "/administration/boutiques",
    access: "admin",
    adminOnly: true,
  },
  {
    label: "Discord",
    href: "/administration/discord",
    access: "admin",
    adminOnly: true,
  },
  {
    label: "Événements",
    href: "/administration/evenements",
    access: "admin",
    adminOnly: true,
  },
];

export const memberNavigation = navigation.filter(
  (item) => item.access === "member"
);
