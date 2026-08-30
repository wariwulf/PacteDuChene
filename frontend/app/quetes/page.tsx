"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { completeQuest, getQuests, getUserQuests, startQuest as startQuestApi } from "@/services/quests.service";
import QuestCard from "@/components/member/quests/QuestCard";
import type { QuestDefinition, UserQuest } from "@/types/quests.types";

export default function QuetesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [quests, setQuests] = useState<QuestDefinition[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace("/connexion"); }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true); setError("");
      const [q, uq] = await Promise.all([getQuests(), getUserQuests(user.id)]);
      setQuests(q.filter((item) => item.enabled)); setUserQuests(uq);
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible de récupérer les quêtes."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (!authLoading && isAuthenticated && user) load(); }, [authLoading, isAuthenticated, user, load]);

  async function startQuest(id: string) { if (!user) return; try { setActionLoading(true); await startQuestApi(user.id, id); setSuccess("La quête a été commencée avec succès."); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Impossible de démarrer la quête."); } finally { setActionLoading(false); } }
  async function complete(id: string) { if (!user) return; try { setActionLoading(true); await completeQuest(user.id, id); setSuccess("Quête terminée avec succès."); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Impossible de terminer la quête."); } finally { setActionLoading(false); } }

  if (authLoading) return <main className="min-h-screen bg-[#173d2b] text-white"><div className="mx-auto max-w-7xl px-6 py-12 text-gray-300">Chargement de votre domaine...</div></main>;
  if (!isAuthenticated || !user) return null;

  const active = userQuests.filter((q) => q.status === "active").length;
  const completed = userQuests.filter((q) => q.status === "completed").length;
  const available = quests.filter((q) => !userQuests.some((u) => u.questId === q.questId)).length;

  return <main className="min-h-screen bg-[#173d2b] text-white"><div className="mx-auto max-w-7xl px-6 py-12">
    <header className="mb-10"><p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">Le Pacte du Chêne</p><h1 className="text-4xl font-bold">Quêtes</h1><p className="mt-3 max-w-2xl text-gray-300">Accomplissez les missions confiées aux membres du Pacte et faites progresser votre réputation.</p></header>
    {error && <div className="mb-6 rounded-xl border border-red-500/20 bg-red-900/30 p-4 text-red-300">{error}</div>}
    {success && <div className="mb-6 rounded-xl border border-green-500/20 bg-green-900/30 p-4 text-green-300">{success}</div>}
    {!loading && <section className="mb-10 grid gap-6 md:grid-cols-3">{[["Quêtes disponibles",available],["Quêtes en cours",active],["Quêtes terminées",completed]].map(([label,value]) => <article key={String(label)} className="rounded-xl border border-white/10 bg-black/20 p-6"><p className="text-sm text-gray-400">{label}</p><p className="mt-2 text-3xl font-bold text-amber-500">{value}</p></article>)}</section>}
    {loading && <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center text-gray-400">Chargement des quêtes...</div>}
    {!loading && quests.length === 0 && <div className="rounded-xl border border-white/10 bg-black/20 p-8"><h2 className="text-xl font-bold">Aucune quête disponible</h2></div>}
    {!loading && quests.length > 0 && <section><div className="mb-6"><h2 className="text-2xl font-bold">Quêtes disponibles</h2><p className="mt-2 text-gray-400">Choisissez une quête et accomplissez ses différentes étapes.</p></div><div className="space-y-8">{quests.map((quest) => <QuestCard key={quest.questId} quest={quest} userQuest={userQuests.find((u) => u.questId === quest.questId)} userId={user.id} onStart={startQuest} onComplete={complete} onRefresh={load} loading={actionLoading} />)}</div></section>}
    {userQuests.length > 0 && <section className="mt-12"><h2 className="text-2xl font-bold">Mon historique</h2><div className="mt-5 space-y-3">{userQuests.map((u) => <article key={`${u.userId}-${u.questId}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-5"><span>{quests.find((q) => q.questId === u.questId)?.name ?? u.questId}</span><Link href={`/quetes/${u.questId}`} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Ouvrir</Link></article>)}</div></section>}
  </div></main>;
}