"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteQuest, getQuests } from "@/services/quests.service";
import QuestDifficulty from "@/components/admin/quests/QuestDifficulty";
import type { QuestDefinition } from "@/types/quests.types";

export default function AdministrationQuetesPage() {
  const [quests, setQuests] = useState<QuestDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuests() {
    try {
      setLoading(true);
      setError("");
      setQuests(await getQuests());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les quêtes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadQuests(); }, []);

  async function handleDelete(quest: QuestDefinition) {
    if (!window.confirm(`Voulez-vous vraiment supprimer la quête "${quest.name}" ?`)) return;
    try {
      await deleteQuest(quest.questId);
      await loadQuests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la quête.");
    }
  }

  return (
    <main className="min-h-screen bg-[#173d2b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">Administration</p>
            <h1 className="text-4xl font-bold">Gestion des quêtes</h1>
            <p className="mt-3 text-gray-300">Créez, modifiez et gérez les quêtes du Pacte du Chêne.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/administration/quetes/soumissions" className="rounded-lg bg-[#55734e] px-5 py-3 text-center font-semibold hover:bg-[#668c5e]">
              Preuves en attente
            </Link>
            <Link href="/administration/quetes/nouvelle" className="rounded-lg bg-amber-600 px-5 py-3 text-center font-semibold hover:bg-amber-500">
              + Nouvelle quête
            </Link>
          </div>
        </header>

        {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-red-300">{error}</div>}
        {loading && <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center text-gray-400">Chargement des quêtes...</div>}

        {!loading && quests.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
            <h2 className="text-xl font-semibold">Aucune quête</h2>
            <p className="mt-2 text-gray-400">Créez votre première quête pour commencer.</p>
          </div>
        )}

        {!loading && quests.length > 0 && (
          <div className="space-y-6">
            {quests.map((quest) => (
              <article key={quest.questId} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                  {quest.imageUrl ? <img src={quest.imageUrl} alt="" className="h-full min-h-64 w-full object-cover" /> : <div className="min-h-64 bg-gradient-to-br from-[#173d2b] to-[#081c13]" />}
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div><p className="text-xs uppercase tracking-[0.2em] text-amber-500">{quest.questId}</p><h2 className="mt-1 text-2xl font-bold">{quest.name}</h2></div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${quest.enabled ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>{quest.enabled ? "Active" : "Désactivée"}</span>
                    </div>
                    <div className="mt-3"><QuestDifficulty value={quest.difficulty} /></div>
                    <p className="mt-4 text-gray-400">{quest.description || "Aucune description."}</p>
                    <div className="mt-5 flex flex-wrap gap-2 text-sm text-gray-400">
                      <span className="rounded-lg bg-white/5 px-3 py-2">{quest.steps?.length ?? 0} étape(s)</span>
                      <span className="rounded-lg bg-white/5 px-3 py-2">{quest.objectives?.length ?? 0} objectif(s)</span>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                      <Link href={`/administration/quetes/${quest.questId}`} className="rounded-lg bg-white/10 px-4 py-2 font-semibold hover:bg-white/20">Modifier</Link>
                      <button type="button" onClick={() => handleDelete(quest)} className="rounded-lg bg-red-900/60 px-4 py-2 font-semibold text-red-200 hover:bg-red-800">Supprimer</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
