import Link from "next/link";
import type { Faction } from "@/services/factions.service";

export default function FactionCard({ faction, href }: { faction: Faction; href: string }) {
  return <Link href={href} className="block rounded-2xl border border-emerald-900/70 bg-[#071a11]/90 p-6 transition hover:border-amber-500/60 hover:bg-[#0a2417]">
    <div className="flex items-start gap-4"><div className="text-4xl">{faction.icon}</div><div><h2 className="text-xl font-bold text-amber-200">{faction.name}</h2><p className="mt-2 text-sm leading-6 text-emerald-200/80">{faction.description}</p></div></div>
  </Link>;
}
