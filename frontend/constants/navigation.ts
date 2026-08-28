export type NavigationAccess = "public" | "member" | "admin";

export interface NavigationItem {
  label: string;
  href: string;
  access: NavigationAccess;
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
    label: "Boutiques",
    href: "/boutiques",
    access: "member",
  },
  {
    label: "Discord",
    href: "/discord",
    access: "member",
  },
  {
    label: "Événements",
    href: "/espace-membre/evenements",
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
    label: "Personnage",
    href: "/espace-membre/personnage",
    access: "member",
  },
  {
    label: "Économie",
    href: "/espace-membre/economie",
    access: "member",
  },
  {
    label: "Clan",
    href: "/clan",
    access: "member",
  },
];

export const administrationNavigation: NavigationItem[] = [
  {
    label: "Membres",
    href: "/administration/membres",
    access: "admin",
  },
  {
    label: "Quêtes",
    href: "/administration/quetes",
    access: "admin",
  },
  {
    label: "Exploits",
    href: "/administration/exploits",
    access: "admin",
  },
  {
    label: "Niveaux",
    href: "/administration/niveaux",
    access: "admin",
  },
  {
    label: "Économie",
    href: "/administration/economie",
    access: "admin",
  },
  {
    label: "Inventaire",
    href: "/administration/inventaire",
    access: "admin",
  },
  {
    label: "Lore",
    href: "/administration/lore",
    access: "admin",
  },
  {
    label: "Actualités",
    href: "/administration/news",
    access: "admin",
  },
  {
    label: "Boutiques",
    href: "/administration/boutiques",
    access: "admin",
  },
  {
    label: "Discord",
    href: "/administration/discord",
    access: "admin",
  },
  {
    label: "Événements",
    href: "/administration/evenements",
    access: "admin",
  },
];

export const memberNavigation = navigation.filter(
  (item) => item.access === "member"
);
