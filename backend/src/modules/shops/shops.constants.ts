export const FIXED_SHOPS = [
  {
    shopId: "comptoir-des-racines",
    name: "Le Comptoir des Racines",
    description:
      "Là où convergent les richesses tirées de nos terres et de nos voyages. Le Comptoir rassemble les ressources et matériaux nécessaires à ceux qui bâtissent, forgent et font vivre le Pacte. Ici, chaque pièce de bronze trouve son utilité.",
    currencyId: "bronze" as const,
  },
  {
    shopId: "forge-du-chene",
    name: "La Forge du Chêne",
    description:
      "Entre ses murs prennent forme les ouvrages que les mains les plus habiles du Pacte savent créer. Armes, armures et équipements rares y trouvent leur place, tandis que certaines occasions permettent aux membres de prendre part à des événements hors du commun.",
    currencyId: "argent" as const,
  },
  {
    shopId: "tresor-du-serment",
    name: "Le Trésor du Serment",
    description:
      "Gardien des richesses les plus précieuses du Pacte, le Trésor ne s'ouvre qu'à ceux qui possèdent le Solidus. Ses portes donnent accès aux plus grands ouvrages, aux événements d'importance et aux honneurs réservés à ceux qui souhaitent laisser leur marque dans l'histoire du Chêne.",
    currencyId: "solidus" as const,
  },
] as const;

export type FixedShopId = (typeof FIXED_SHOPS)[number]["shopId"];
