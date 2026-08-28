export interface LoreEntry {
  loreId: string;
  title: string;
  category: string;
  summary?: string;
  content: string;
  enabled: boolean;
  order: number;
}
