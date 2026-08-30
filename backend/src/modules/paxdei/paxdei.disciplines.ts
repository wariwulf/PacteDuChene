export const PAX_DEI_DISCIPLINES = [
  'Alchimie',
  'Archerie',
  'Arcs',
  'Armes d’hast',
  'Armure intermédiaire (bras)',
  'Armure intermédiaire (jambes)',
  'Armure intermédiaire (mains)',
  'Armure intermédiaire (pieds)',
  'Armure intermédiaire (tête)',
  'Armure intermédiaire (torse)',
  'Armure légère (bras)',
  'Armure légère (jambes)',
  'Armure légère (mains)',
  'Armure légère (pieds)',
  'Armure légère (tête)',
  'Armure légère (torse)',
  'Armure lourde (bras)',
  'Armure lourde (jambes)',
  'Armure lourde (mains)',
  'Armure lourde (pieds)',
  'Armure lourde (tête)',
  'Armure lourde (torse)',
  'Bâtons ecclésiastiques',
  'Bâtons sylvains',
  'Boucherie',
  'Boucliers',
  'Boulangerie',
  'Bûcheronnage',
  'Couture',
  'Cuisine',
  'Dépeçage',
  'Épées',
  'Forge',
  'Forge d’armes',
  'Forge d’armures',
  'Grandes épées',
  'Grandes haches',
  'Joaillerie',
  'Mains nues',
  'Masses lourdes',
  'Massues',
  'Menuiserie',
  'Minage',
  'Petites lances',
  'Travail du cuir',
  'Vinification et brassage',
] as const;

export type PaxDeiDisciplineName =
  (typeof PAX_DEI_DISCIPLINES)[number];

export function isPaxDeiDisciplineName(
  value: unknown
): value is PaxDeiDisciplineName {
  return (
    typeof value === "string" &&
    (PAX_DEI_DISCIPLINES as readonly string[]).includes(value)
  );
}
