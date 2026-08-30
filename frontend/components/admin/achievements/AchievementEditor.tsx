"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAchievement,
  getAchievement,
  updateAchievement,
} from "../../../services/achievements.service";
import type { AchievementLevel } from "../../../types/achievements.types";
import { AchievementBadgeImage } from "../../member/achievements/AchievementBadge";

interface Props {
  achievementId?: string;
}

function generateAchievementId(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suffix = Date.now().toString(36).slice(-6);
  return `${slug || "exploit"}-${suffix}`;
}

export default function AchievementEditor({ achievementId }: Props) {
  const router = useRouter();
  const editing = Boolean(achievementId);

  const [id, setId] = useState(achievementId ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<AchievementLevel>(1);
  const [rewardCurrencyId, setRewardCurrencyId] = useState("");
  const [rewardAmount, setRewardAmount] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [linkedQuestName, setLinkedQuestName] = useState("");
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!achievementId) return;

    getAchievement(achievementId)
      .then((achievement) => {
        setId(achievement.achievementId);
        setName(achievement.name);
        setDescription(achievement.description ?? "");
        setLevel(achievement.level);
        setRewardCurrencyId(achievement.rewardCurrencyId ?? "");
        setRewardAmount(achievement.rewardAmount ?? 0);
        setEnabled(achievement.enabled);
        setLinkedQuestName(achievement.linkedQuestName ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger l'exploit."))
      .finally(() => setLoading(false));
  }, [achievementId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Le titre de l'exploit est obligatoire.");
      return;
    }

    try {
      setSaving(true);

      if (editing && achievementId) {
        await updateAchievement(achievementId, {
          name: name.trim(),
          description: description.trim() || undefined,
          level,
          rewardCurrencyId: rewardCurrencyId.trim() || undefined,
          rewardAmount: Number(rewardAmount),
          enabled,
        });
      } else {
        const generatedAchievementId = generateAchievementId(name);

        await createAchievement({
          achievementId: generatedAchievementId,
          name: name.trim(),
          description: description.trim() || undefined,
          level,
          rewardCurrencyId: rewardCurrencyId.trim() || undefined,
          rewardAmount: Number(rewardAmount),
          enabled,
        });
      }

      router.push("/administration/exploits");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'exploit.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-300">Chargement de l&apos;exploit...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-sm text-red-200">{error}</div>}

      {linkedQuestName && (
        <div className="rounded-lg border border-blue-400/20 bg-blue-500/5 p-4 text-sm text-blue-200">
          Cet exploit est lié à la quête <strong>{linkedQuestName}</strong>. Il sera attribué automatiquement à la fin de cette quête et ne peut pas être validé manuellement.
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-black/10 p-6">
        <h2 className="text-xl font-bold">Identité de l&apos;exploit</h2>
        <div className="mt-5 grid gap-5">
          <label>
            <span className="mb-2 block text-sm font-semibold">Titre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chasseur du Pacte" className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Description de la tâche à accomplir</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={5000} placeholder="Décrivez précisément ce que le membre doit accomplir..." className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3" />
          </label>
        </div>
        {!editing && (
          <p className="mt-3 text-xs text-gray-500">
            L&apos;identifiant technique de l&apos;exploit sera généré automatiquement lors de sa création.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-black/10 p-6">
        <h2 className="text-xl font-bold">Niveau de l&apos;exploit</h2>
        <p className="mt-1 text-sm text-gray-400">Le niveau détermine le badge affiché au membre.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {([
            [1, "Bronze", "Niveau 1"],
            [2, "Argent", "Niveau 2"],
            [3, "Or", "Niveau 3"],
          ] as const).map(([value, label, subtitle]) => (
            <button
              key={value}
              type="button"
              onClick={() => setLevel(value)}
              className={`rounded-xl border p-5 text-left transition ${level === value ? "border-amber-400 bg-amber-500/10" : "border-white/10 bg-black/10 hover:bg-white/5"}`}
            >
              <AchievementBadgeImage level={value} size={72} />
              <p className="mt-2 font-bold">{label}</p>
              <p className="text-sm text-gray-400">{subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/10 p-6">
        <h2 className="text-xl font-bold">Récompense</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold">Identifiant de la monnaie</span>
            <input value={rewardCurrencyId} onChange={(e) => setRewardCurrencyId(e.target.value)} placeholder="solidus" className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Quantité</span>
            <input type="number" min={0} value={rewardAmount} onChange={(e) => setRewardAmount(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3" />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/10 p-6">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4" />
          <span className="font-semibold">Exploit actif</span>
        </label>
        <p className="mt-2 text-sm text-gray-400">Un exploit désactivé n&apos;est pas disponible pour les membres.</p>
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push("/administration/exploits")} className="rounded-lg border border-white/10 px-5 py-3 font-semibold text-gray-300 hover:bg-white/5">Annuler</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-amber-500 px-5 py-3 font-semibold text-white hover:bg-amber-400 disabled:opacity-50">{saving ? "Enregistrement..." : editing ? "Enregistrer les modifications" : "Créer l'exploit"}</button>
      </div>
    </form>
  );
}