"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentMember } from "@/services/members.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Member = {
  profile: { id: string; username: string; displayName?: string; avatar?: string; role: string };
  discord?: { linked?: boolean };
  paxDei?: { characterName?: string; level?: number };
};

type Level = { xp: number; level: number; levelName: string; currentLevelXp: number; nextLevelXp: number | null; progressXp: number; progressPercent: number };
type BalanceMap = Record<string, number>;
type Character = {
  _id?: string; memberId: string; characterName: string; avatarId?: string; world?: string;
  province?: string; region?: string; clan?: string; mainProfession?: string;
  secondaryProfessions?: string[]; isMainCharacter?: boolean;
};

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include", cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) throw new Error(payload?.message || `Erreur serveur (${response.status}).`);
  return payload;
}

function arr<T>(payload: any, key: string): T[] {
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}
function roleLabel(role?: string) {
  const labels: Record<string,string> = { OWNER:"Rex", ADMIN:"Administrateur", ADMINISTRATOR:"Administrateur", PLAYER:"Membre", MEMBER:"Membre" };
  return labels[String(role ?? "").toUpperCase()] || role || "Membre";
}
function Stat({ label, value }: { label:string; value:number }) {
  return <div className="rounded-xl border border-green-800 bg-green-950/60 p-4 text-center"><p className="text-2xl font-bold text-amber-400">{value.toLocaleString("fr-FR")}</p><p className="mt-1 text-xs text-green-300">{label}</p></div>;
}
function Balance({ icon, label, value }: { icon:string; label:string; value:number }) {
  return <div className="rounded-xl border border-green-800 bg-green-950/60 p-4"><div className="text-xl">{icon}</div><p className="mt-2 text-sm text-green-300">{label}</p><p className="mt-1 text-xl font-bold text-amber-400">{value.toLocaleString("fr-FR")}</p></div>;
}
function TextStat({ label, value }: { label:string; value:string }) {
  return <div className="rounded-xl border border-green-800 bg-green-950/60 p-4"><p className="text-xs uppercase tracking-wider text-green-400">{label}</p><p className="mt-1 break-words font-semibold text-white">{value}</p></div>;
}

export default function PersonnagePage() {
  const [member,setMember]=useState<Member|null>(null);
  const [level,setLevel]=useState<Level|null>(null);
  const [balances,setBalances]=useState<BalanceMap>({});
  const [achievementStats,setAchievementStats]=useState({total:0,unlocked:0});
  const [questStats,setQuestStats]=useState({available:0,active:0,completed:0});
  const [characters,setCharacters]=useState<Character[]>([]);
  const [charactersLoading,setCharactersLoading]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    try{
      setLoading(true); setError("");
      const current=(await getCurrentMember()) as Member|null;
      if(!current?.profile?.id) throw new Error("Impossible d'identifier le membre connecté.");
      setMember(current);
      const id=encodeURIComponent(current.profile.id);
      setCharactersLoading(true);
      const results=await Promise.allSettled([
        api<any>(`/paxdei/characters/member/${id}`),
        api<any>(`/levels/user/${id}`),
        api<any>(`/economy/${id}`),
        Promise.all([api<any>("/achievements"),api<any>(`/achievements/user/${id}`)]),
        Promise.all([api<any>("/quests"),api<any>(`/quests/user/${id}`)])
      ]);
      if(results[0].status==="fulfilled") setCharacters(arr<Character>(results[0].value,"characters")); else setCharacters([]);
      setCharactersLoading(false);
      if(results[1].status==="fulfilled") setLevel(results[1].value?.data?.level ?? null);
      if(results[2].status==="fulfilled") setBalances(results[2].value?.data?.balances ?? {});
      if(results[3].status==="fulfilled"){
        const all=arr<any>(results[3].value[0],"achievements"), unlocked=arr<any>(results[3].value[1],"achievements");
        setAchievementStats({total:all.filter(x=>x.enabled!==false).length,unlocked:unlocked.length});
      }
      if(results[4].status==="fulfilled"){
        const all=arr<any>(results[4].value[0],"quests").filter(x=>x.enabled!==false), user=arr<any>(results[4].value[1],"userQuests");
        const ids=new Set(user.map(x=>String(x.questId)));
        setQuestStats({available:all.filter(x=>!ids.has(String(x.questId))).length,active:user.filter(x=>String(x.status).toLowerCase()==="active").length,completed:user.filter(x=>String(x.status).toLowerCase()==="completed").length});
      }
    }catch(e){setError(e instanceof Error?e.message:"Impossible de charger le personnage.");}
    finally{setCharactersLoading(false);setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  if(loading&&!member) return <main className="min-h-screen bg-[#173d2b] px-6 py-12 text-white"><div className="mx-auto max-w-7xl">Chargement de votre personnage...</div></main>;
  if(!member) return <main className="min-h-screen bg-[#173d2b] px-6 py-12 text-white"><div className="mx-auto max-w-6xl rounded-xl border border-red-700 bg-red-950/40 p-8"><h1 className="text-2xl font-bold text-red-300">Impossible de charger le personnage</h1><p className="mt-2 text-red-200">{error||"Membre introuvable."}</p><button onClick={load} className="mt-5 rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500">Réessayer</button></div></main>;
  const name=member.profile.displayName||member.profile.username, progress=Math.max(0,Math.min(100,level?.progressPercent??0)), id=member.profile.id;
  const mainCharacter=characters.find(c=>c.isMainCharacter)||characters[0];
  return <main className="min-h-screen bg-[#173d2b] px-6 py-10 text-white"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">Le Pacte du Chêne</p><h1 className="mt-2 text-4xl font-bold">Mon personnage</h1><p className="mt-3 text-green-300">Votre identité, votre progression et les grands indicateurs de votre aventure.</p></div><button onClick={load} className="rounded-lg bg-amber-600 px-6 py-3 font-semibold hover:bg-amber-500">Actualiser</button></header>
    {error&&<div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-amber-200">{error}</div>}
    <section className="mb-6 rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-amber-500/70 bg-green-950 text-4xl font-bold text-amber-400">{member.profile.avatar?<img src={member.profile.avatar} alt={`Portrait de ${name}`} className="h-full w-full object-cover"/>:name.charAt(0).toUpperCase()}</div><div><p className="text-sm uppercase tracking-[0.2em] text-green-400">Personnage du Pacte</p><h2 className="mt-1 text-3xl font-bold">{name}</h2><p className="text-green-300">@{member.profile.username}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-amber-600/20 px-3 py-1 text-sm font-semibold text-amber-300">{roleLabel(member.profile.role)}</span>{member.discord?.linked&&<span className="rounded-full bg-indigo-900/50 px-3 py-1 text-sm text-indigo-200">Discord lié</span>}{mainCharacter&&<span className="rounded-full bg-green-950 px-3 py-1 text-sm text-green-300">Pax Dei : {mainCharacter.characterName}</span>}</div></div></div></section>
    <section className="mb-6 rounded-2xl border border-amber-700/30 bg-gradient-to-br from-amber-950/20 to-green-900/50 p-6 shadow-xl"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm uppercase tracking-[0.2em] text-amber-400">Pax Dei</p><h2 className="mt-1 text-3xl font-bold">Votre personnage en jeu</h2><p className="mt-2 text-green-300">Les informations enregistrées pour vos personnages Pax Dei.</p></div><span className="text-sm font-semibold text-amber-300">{characters.length} personnage{characters.length>1?"s":""}</span></div>
      {charactersLoading?<div className="mt-5 rounded-xl border border-green-800 bg-green-950/50 p-6 text-green-300">Chargement des données Pax Dei...</div>:characters.length===0?<div className="mt-5 rounded-xl border border-dashed border-white/10 bg-green-950/40 p-6 text-center"><p className="text-green-300">Aucun personnage Pax Dei n&apos;est encore renseigné.</p><Link href="/paxdei" className="mt-4 inline-block rounded-lg border border-green-700 bg-green-950 px-4 py-2 text-sm font-semibold text-amber-400 hover:border-amber-500">Gérer mes personnages →</Link></div>:<div className="mt-5 grid gap-5 md:grid-cols-2">{characters.map(c=><article key={c._id||c.characterName} className={`rounded-xl border bg-green-950/50 p-5 ${c.isMainCharacter?"border-amber-500/70":"border-green-800"}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">{c.isMainCharacter?"Personnage principal":"Personnage Pax Dei"}</p><h3 className="mt-1 text-2xl font-bold">{c.characterName}</h3></div><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-500/50 bg-green-900 text-xl">⚔</div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><TextStat label="Monde" value={c.world||"—"}/><TextStat label="Province" value={c.province||"—"}/><TextStat label="Région" value={c.region||"—"}/><TextStat label="Clan" value={c.clan||"—"}/></div><div className="mt-4 rounded-xl border border-green-800 bg-green-900/40 p-4"><p className="text-xs uppercase tracking-[0.15em] text-green-400">Profession principale</p><p className="mt-1 font-semibold text-white">{c.mainProfession||"Non renseignée"}</p></div>{c.secondaryProfessions&&c.secondaryProfessions.length>0&&<div className="mt-4"><p className="text-xs uppercase tracking-[0.15em] text-green-400">Professions secondaires</p><div className="mt-2 flex flex-wrap gap-2">{c.secondaryProfessions.map(p=><span key={p} className="rounded-full bg-green-900 px-3 py-1 text-xs text-green-200">{p}</span>)}</div></div>}</article>)}</div>}
    </section>
    <section className="mb-6 rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl"><p className="text-sm uppercase tracking-[0.2em] text-green-400">Progression</p><div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><h2 className="text-3xl font-bold">Niveau {level?.level??"—"}</h2><p className="text-amber-400">{level?.levelName??"Niveau indisponible"}</p></div><p className="text-2xl font-bold text-amber-400">{(level?.xp??0).toLocaleString("fr-FR")} XP</p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-green-950"><div className="h-full rounded-full bg-amber-500" style={{width:`${progress}%`}}/></div><div className="mt-2 flex justify-between text-sm text-green-300"><span>Vers le prochain niveau</span><span>{Math.round(progress)} %</span></div></section>
    <section className="grid gap-6 md:grid-cols-2"><section className="rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-sm uppercase tracking-[0.2em] text-amber-400">Économie</p><h2 className="mt-1 text-2xl font-bold">Votre patrimoine</h2></div><Link href={`/economie/${encodeURIComponent(id)}`} className="text-sm font-semibold text-amber-400 hover:text-amber-300">Détail →</Link></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Balance icon="🪙" label="Solidus" value={balances.solidus??0}/><Balance icon="💠" label="Crédits" value={balances.credits??0}/><Balance icon="⚔️" label="Honneur" value={balances.honor??0}/></div></section><Link href="/espace-membre/exploits" className="group rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl hover:border-amber-500/60"><p className="text-sm uppercase tracking-[0.2em] text-amber-400">Exploits</p><h2 className="mt-1 text-2xl font-bold group-hover:text-amber-300">Vos accomplissements</h2><div className="mt-6 flex items-end gap-3"><span className="text-4xl font-bold text-amber-400">{achievementStats.unlocked}</span><span className="pb-1 text-green-300">/ {achievementStats.total} débloqués</span></div><span className="mt-5 block text-sm font-semibold text-amber-400">Voir mes exploits →</span></Link><Link href="/espace-membre/quetes" className="group rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl hover:border-amber-500/60"><p className="text-sm uppercase tracking-[0.2em] text-amber-400">Quêtes</p><h2 className="mt-1 text-2xl font-bold group-hover:text-amber-300">Votre aventure</h2><div className="mt-6 grid grid-cols-3 gap-3"><Stat label="Disponibles" value={questStats.available}/><Stat label="En cours" value={questStats.active}/><Stat label="Terminées" value={questStats.completed}/></div><span className="mt-5 block text-sm font-semibold text-amber-400">Voir mes quêtes →</span></Link><section className="rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl"><p className="text-sm uppercase tracking-[0.2em] text-amber-400">Profil</p><h2 className="mt-1 text-2xl font-bold">Votre fiche</h2><p className="mt-3 text-green-300">Retrouvez votre fiche membre complète et les informations enregistrées par le Pacte.</p><Link href={`/membres/${encodeURIComponent(id)}`} className="mt-5 inline-block rounded-lg border border-green-700 bg-green-950 px-5 py-3 font-semibold hover:border-amber-500 hover:text-amber-300">Voir ma fiche membre →</Link></section></section>
  </div></main>;
}
