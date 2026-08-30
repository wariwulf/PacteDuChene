"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createQuest,
  getQuest,
  getQuests,
  updateQuest,
} from "@/services/quests.service";
import QuestDifficulty from "@/components/admin/quests/QuestDifficulty";
import type { QuestDefinition, QuestObjective, QuestStep } from "@/types/quests.types";

type Props = { questId?: string };

type ObjectiveForm = QuestObjective;
type StepForm = QuestStep;

type AchievementOption = {
  achievementId: string;
  name: string;
  linkedQuestId?: string;
  linkedQuestName?: string;
  enabled?: boolean;
};

type CurrencyOption = {
  currencyId: string;
  name: string;
  enabled?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function arrayFromPayload<T>(payload: any, key: string): T[] {
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

const newObjective = (stepIndex = 0, objectiveIndex = 0): ObjectiveForm => ({
  objectiveId: `etape-${stepIndex + 1}-objectif-${objectiveIndex + 1}`,
  name: "",
  description: "",
  target: 1,
  eventType: "",
  eventTargetId: "",
  requiresProof: false,
});

const newStep = (index = 0): StepForm => ({
  stepId: `etape-${index + 1}`,
  name: "",
  description: "",
  imageUrl: "",
  difficulty: 1,
  objectives: [newObjective(index, 0)],
});

function legacySteps(quest: QuestDefinition): StepForm[] {
  if (quest.steps?.length) return quest.steps;
  return [{
    stepId: "etape-1",
    name: "Étape principale",
    description: quest.description ?? "",
    imageUrl: "",
    difficulty: quest.difficulty ?? 1,
    objectives: quest.objectives ?? [],
  }];
}

export default function QuestEditor({ questId }: Props) {
  const router = useRouter();
  const editing = Boolean(questId);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [questIdValue, setQuestIdValue] = useState(questId ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [availableQuests, setAvailableQuests] = useState<QuestDefinition[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<AchievementOption[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyOption[]>([]);
  const [steps, setSteps] = useState<StepForm[]>([newStep(0)]);
  const [rewardXp, setRewardXp] = useState(0);
  const [rewardCurrencyId, setRewardCurrencyId] = useState("");
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardAchievementId, setRewardAchievementId] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [quests, achievementsResponse, currenciesResponse] = await Promise.all([
          getQuests(),
          fetch(`${API_URL}/achievements`, {
            credentials: "include",
            cache: "no-store",
          }).then(async (response) => {
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || payload?.success === false) {
              throw new Error(payload?.message || "Impossible de récupérer les exploits.");
            }
            return payload;
          }),
          fetch(`${API_URL}/economy/currencies`, {
            credentials: "include",
            cache: "no-store",
          }).then(async (response) => {
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || payload?.success === false) {
              throw new Error(payload?.message || "Impossible de récupérer les monnaies.");
            }
            return payload;
          }),
        ]);

        setAvailableQuests(quests);
        setAvailableAchievements(arrayFromPayload<AchievementOption>(achievementsResponse, "achievements"));
        setAvailableCurrencies(arrayFromPayload<CurrencyOption>(currenciesResponse, "currencies"));

        if (questId) {
          const quest = await getQuest(questId);
          setQuestIdValue(quest.questId);
          setName(quest.name);
          setDescription(quest.description ?? "");
          setImageUrl(quest.imageUrl ?? "");
          setDifficulty(quest.difficulty ?? 1);
          setPrerequisites(quest.prerequisites ?? []);
          setSteps(legacySteps(quest));
          setRewardXp(quest.rewardXp ?? 0);
          setRewardCurrencyId(quest.rewardCurrencyId ?? "");
          setRewardAmount(quest.rewardAmount ?? 0);
          setRewardAchievementId(quest.rewardAchievementId ?? "");
          setEnabled(quest.enabled);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger la quête.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [questId]);

  function updateStep(index: number, field: keyof StepForm, value: string | number | boolean) {
    setSteps((current) => current.map((step, i) => i === index ? { ...step, [field]: value } : step));
  }

  function addStep() {
    setSteps((current) => {
      const used = new Set(current.map((step) => step.stepId));
      let index = current.length;
      let candidate = `etape-${index + 1}`;
      while (used.has(candidate)) {
        index += 1;
        candidate = `etape-${index + 1}`;
      }
      return [...current, newStep(index)];
    });
  }

  function removeStep(index: number) {
    setSteps((current) => current.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    setSteps((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function updateObjective(stepIndex: number, objectiveIndex: number, field: keyof ObjectiveForm, value: string | number | boolean) {
    setSteps((current) => current.map((step, si) => si !== stepIndex ? step : {
      ...step,
      objectives: step.objectives.map((objective, oi) => oi === objectiveIndex ? { ...objective, [field]: value } : objective),
    }));
  }

  function addObjective(stepIndex: number) {
    setSteps((current) => current.map((step, si) => {
      if (si !== stepIndex) return step;

      const used = new Set(step.objectives.map((objective) => objective.objectiveId));
      let index = step.objectives.length;
      let candidate = `etape-${stepIndex + 1}-objectif-${index + 1}`;
      while (used.has(candidate)) {
        index += 1;
        candidate = `etape-${stepIndex + 1}-objectif-${index + 1}`;
      }

      return {
        ...step,
        objectives: [...step.objectives, newObjective(stepIndex, index)],
      };
    }));
  }

  function removeObjective(stepIndex: number, objectiveIndex: number) {
    setSteps((current) => current.map((step, si) => si !== stepIndex ? step : {
      ...step,
      objectives: step.objectives.filter((_, oi) => oi !== objectiveIndex),
    }));
  }

  function togglePrerequisite(id: string) {
    setPrerequisites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function flattenObjectives(stepList: StepForm[]) {
    return stepList.flatMap((step) => step.objectives.map((objective) => ({
      ...objective,
      eventType: objective.eventType?.trim() || undefined,
      eventTargetId: objective.eventTargetId?.trim() || undefined,
    })));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Le nom de la quête est obligatoire.");
      return;
    }

    const slugify = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const baseQuestId = editing && questIdValue.trim()
      ? questIdValue.trim()
      : slugify(name) || "quete";

    let finalQuestId = baseQuestId;
    if (!editing) {
      const usedQuestIds = new Set(availableQuests.map((item) => item.questId));
      let suffix = 2;
      while (usedQuestIds.has(finalQuestId)) {
        finalQuestId = `${baseQuestId}-${suffix}`;
        suffix += 1;
      }
    }
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      setError("La difficulté de la quête doit être comprise entre 1 et 5.");
      return;
    }
    if (!steps.length) {
      setError("La quête doit posséder au moins une étape.");
      return;
    }

    const objectiveIds = new Set<string>();
    for (const [stepIndex, step] of steps.entries()) {
      if (!step.stepId.trim() || !step.name.trim()) {
        setError(`L'étape ${stepIndex + 1} doit posséder un nom.`);
        return;
      }
      if (step.difficulty < 1 || step.difficulty > 5) {
        setError(`La difficulté de l'étape ${stepIndex + 1} doit être comprise entre 1 et 5.`);
        return;
      }
      if (!step.objectives.length) {
        setError(`L'étape ${stepIndex + 1} doit posséder au moins un objectif.`);
        return;
      }
      for (const objective of step.objectives) {
        if (!objective.objectiveId.trim() || !objective.name.trim()) {
          setError("Chaque objectif doit posséder un nom.");
          return;
        }
        if (objectiveIds.has(objective.objectiveId.trim())) {
          setError(`L'identifiant d'objectif "${objective.objectiveId}" est utilisé plusieurs fois.`);
          return;
        }
        if (objective.target <= 0) {
          setError("La cible de chaque objectif doit être supérieure à zéro.");
          return;
        }
        objectiveIds.add(objective.objectiveId.trim());
      }
    }

    const cleanedSteps = steps.map((step) => ({
      ...step,
      stepId: step.stepId.trim(),
      name: step.name.trim(),
      description: step.description?.trim() || undefined,
      imageUrl: step.imageUrl?.trim() || undefined,
      difficulty: Number(step.difficulty),
      objectives: step.objectives.map((objective) => ({
        objectiveId: objective.objectiveId.trim(),
        name: objective.name.trim(),
        description: objective.description?.trim() || undefined,
        target: Number(objective.target),
        eventType: objective.eventType?.trim() || undefined,
        eventTargetId: objective.eventTargetId?.trim() || undefined,
        requiresProof: objective.requiresProof === true,
      })),
    }));

    try {
      setSaving(true);
      const payload = {
        questId: finalQuestId,
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        difficulty: Number(difficulty),
        prerequisites,
        steps: cleanedSteps,
        objectives: flattenObjectives(cleanedSteps),
        rewardXp: Number(rewardXp),
        rewardCurrencyId: rewardCurrencyId.trim() || undefined,
        rewardAmount: Number(rewardAmount),
        rewardAchievementId: rewardAchievementId.trim() || undefined,
        enabled,
      };

      if (editing && questId) {
        await updateQuest(questId, payload);
      } else {
        await createQuest(payload);
      }
      router.push("/administration/quetes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer la quête.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-[#173d2b] text-white"><div className="mx-auto max-w-6xl px-6 py-12 text-gray-400">Chargement...</div></main>;
  }

  return (
    <main className="min-h-screen bg-[#173d2b] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">Administration</p>
          <h1 className="text-4xl font-bold">{editing ? "Modifier la quête" : "Nouvelle quête"}</h1>
          <p className="mt-3 text-gray-300">Construisez la quête, son illustration, sa difficulté et ses étapes.</p>
        </header>

        {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-red-300">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <h2 className="mb-6 text-2xl font-bold">Présentation de la quête</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Nom</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500" placeholder="La chasse au sanglier" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Image de la quête</span>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500" placeholder="/images/quetes/sanglier.jpg ou URL complète" />
                <span className="mt-1 block text-xs text-gray-500">Cette image est la seule affichée dans la liste des quêtes.</span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Difficulté</span>
                <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                  <QuestDifficulty value={difficulty} />
                  <input type="range" min={1} max={5} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="mt-3 w-full accent-amber-500" />
                </div>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Description</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500" />
              </label>
            </div>
            {imageUrl && <img src={imageUrl} alt="" className="mt-5 h-48 w-full rounded-xl object-cover" />}
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-black/20 p-6">
            <h2 className="mb-2 text-2xl font-bold">Prérequis</h2>
            <p className="mb-5 text-sm text-gray-400">Les quêtes sélectionnées doivent être terminées avant celle-ci.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {availableQuests.filter((q) => q.questId !== questIdValue.trim()).map((q) => (
                <label key={q.questId} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${prerequisites.includes(q.questId) ? "border-amber-500/60 bg-amber-500/10" : "border-white/10 bg-black/10"}`}>
                  <input type="checkbox" checked={prerequisites.includes(q.questId)} onChange={() => togglePrerequisite(q.questId)} className="h-5 w-5 accent-amber-500" />
                  <span><strong className="block">{q.name}</strong><small className="text-gray-500">{q.questId}</small></span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-2xl font-bold">Étapes</h2><p className="mt-1 text-sm text-gray-400">Les étapes sont affichées dans cet ordre et peuvent chacune avoir leur illustration et difficulté.</p></div>
              <button type="button" onClick={addStep} className="rounded-lg bg-amber-600 px-4 py-2.5 font-semibold hover:bg-amber-500">+ Ajouter une étape</button>
            </div>

            <div className="space-y-6">
              {steps.map((step, stepIndex) => (
                <article key={`${step.stepId}-${stepIndex}`} className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-amber-400">Étape {stepIndex + 1}</h3>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveStep(stepIndex, -1)} disabled={stepIndex === 0} className="rounded bg-white/10 px-3 py-1.5 text-sm disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => moveStep(stepIndex, 1)} disabled={stepIndex === steps.length - 1} className="rounded bg-white/10 px-3 py-1.5 text-sm disabled:opacity-30">↓</button>
                      {steps.length > 1 && <button type="button" onClick={() => removeStep(stepIndex)} className="rounded bg-red-900/50 px-3 py-1.5 text-sm text-red-200">Supprimer</button>}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Titre</span><input value={step.name} onChange={(e) => updateStep(stepIndex, "name", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500" /></label>
                    <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Image de l'étape</span><input value={step.imageUrl ?? ""} onChange={(e) => updateStep(stepIndex, "imageUrl", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500" placeholder="/images/quetes/etape.jpg ou URL complète" /></label>
                    <label><span className="mb-2 block text-sm font-semibold">Difficulté</span><div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3"><QuestDifficulty value={step.difficulty} /><input type="range" min={1} max={5} value={step.difficulty} onChange={(e) => updateStep(stepIndex, "difficulty", Number(e.target.value))} className="mt-3 w-full accent-amber-500" /></div></label>
                    <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Description de l'étape</span><textarea value={step.description ?? ""} onChange={(e) => updateStep(stepIndex, "description", e.target.value)} rows={3} className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500" /></label>
                  </div>

                  {step.imageUrl && <img src={step.imageUrl} alt="" className="mt-5 h-40 w-full rounded-xl object-cover" />}

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="mb-4 flex items-center justify-between gap-3"><div><h4 className="font-semibold">Objectifs</h4><p className="text-xs text-gray-500">Les objectifs restent reliés au moteur d'événements du jeu.</p></div><button type="button" onClick={() => addObjective(stepIndex)} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">+ Objectif</button></div>
                    <div className="space-y-4">
                      {step.objectives.map((objective, objectiveIndex) => (
                        <div key={`${objective.objectiveId}-${objectiveIndex}`} className="rounded-xl border border-white/10 bg-black/10 p-4">
                          <div className="mb-4 flex justify-between"><strong className="text-amber-400">Objectif {objectiveIndex + 1}</strong>{step.objectives.length > 1 && <button type="button" onClick={() => removeObjective(stepIndex, objectiveIndex)} className="text-sm text-red-400">Supprimer</button>}</div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <label><span className="mb-1 block text-xs font-semibold text-gray-400">Nom</span><input value={objective.name} onChange={(e) => updateObjective(stepIndex, objectiveIndex, "name", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-amber-500" /></label>
                            <label><span className="mb-1 block text-xs font-semibold text-gray-400">Cible</span><input type="number" min={1} value={objective.target} onChange={(e) => updateObjective(stepIndex, objectiveIndex, "target", Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-amber-500" /></label>
                            <label><span className="mb-1 block text-xs font-semibold text-gray-400">Type d'événement</span><input value={objective.eventType ?? ""} onChange={(e) => updateObjective(stepIndex, objectiveIndex, "eventType", e.target.value)} placeholder="ex: hunt" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-amber-500" /></label>
                            <label><span className="mb-1 block text-xs font-semibold text-gray-400">Cible d’événement <span className="font-normal text-gray-500">(optionnel)</span></span><input value={objective.eventTargetId ?? ""} onChange={(e) => updateObjective(stepIndex, objectiveIndex, "eventTargetId", e.target.value)} placeholder="ID de la cible si nécessaire" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-amber-500" /></label>
                            <label className="md:col-span-2 flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3">
                              <input
                                type="checkbox"
                                checked={objective.requiresProof === true}
                                onChange={(e) => updateObjective(stepIndex, objectiveIndex, "requiresProof", e.target.checked)}
                                className="h-5 w-5 accent-amber-500"
                              />
                              <span>
                                <strong className="block text-sm">Preuve obligatoire</strong>
                                <small className="text-xs text-gray-500">
                                  L'objectif devra être validé par un administrateur avant de terminer la quête.
                                </small>
                              </span>
                            </label>
                            <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-gray-400">Description</span><textarea value={objective.description ?? ""} onChange={(e) => updateObjective(stepIndex, objectiveIndex, "description", e.target.value)} rows={2} className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 outline-none focus:border-amber-500" /></label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <h2 className="mb-6 text-2xl font-bold">Récompenses</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">XP</span><input type="number" min={0} value={rewardXp} onChange={(e) => setRewardXp(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3" /></label>
              <label><span className="mb-2 block text-sm font-semibold">Quantité de monnaie</span><input type="number" min={0} value={rewardAmount} onChange={(e) => setRewardAmount(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3" /></label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Monnaie</span>
                <select
                  value={rewardCurrencyId}
                  onChange={(e) => setRewardCurrencyId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500"
                >
                  <option value="">Aucune monnaie</option>
                  {availableCurrencies.map((currency) => (
                    <option key={currency.currencyId} value={currency.currencyId}>
                      {currency.name} ({currency.currencyId})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Exploit attribué à la fin de la quête</span>
                <select
                  value={rewardAchievementId}
                  onChange={(e) => setRewardAchievementId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500"
                >
                  <option value="">Aucun exploit</option>
                  {availableAchievements
                    .filter((achievement) =>
                      !achievement.linkedQuestId ||
                      achievement.linkedQuestId === questIdValue
                    )
                    .map((achievement) => (
                      <option key={achievement.achievementId} value={achievement.achievementId}>
                        {achievement.name} ({achievement.achievementId})
                      </option>
                    ))}
                </select>
                <span className="mt-1 block text-xs text-gray-500">
                  Les exploits déjà liés à une autre quête ne sont pas proposés.
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-amber-500" /><span><strong className="block">Quête active</strong><small className="text-gray-400">Les membres pourront la commencer.</small></span></label>
          </section>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push("/administration/quetes")} className="rounded-lg bg-white/10 px-5 py-3 font-semibold hover:bg-white/20">Annuler</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-amber-600 px-6 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50">{saving ? "Enregistrement..." : editing ? "Enregistrer les modifications" : "Créer la quête"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
