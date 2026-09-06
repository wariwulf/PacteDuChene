import { FormEvent, useEffect, useState } from "react";

import type {
  CreateLevelData,
  LevelDefinition,
  UpdateLevelData,
} from "@/types/levels.types";

interface LevelFormProps {
  level?: LevelDefinition | null;
  onSubmit: (
    data: CreateLevelData | UpdateLevelData
  ) => Promise<void>;
  onCancel: () => void;
}

export default function LevelForm({
  level,
  onSubmit,
  onCancel,
}: LevelFormProps) {
  const isEditing = Boolean(level);
  const [levelNumber, setLevelNumber] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredXp, setRequiredXp] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLevelNumber(level ? String(level.level) : "");
    setName(level?.name ?? "");
    setDescription(level?.description ?? "");
    setRequiredXp(level ? String(level.requiredXp) : "");
    setEnabled(level?.enabled ?? true);
    setError("");
  }, [level]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedLevel = Number(levelNumber);
    const parsedXp = Number(requiredXp);

    if (
      !isEditing &&
      (!Number.isInteger(parsedLevel) || parsedLevel < 1)
    ) {
      setError("Le numéro du niveau doit être un entier supérieur ou égal à 1.");
      return;
    }

    if (!Number.isFinite(parsedXp) || parsedXp < 0) {
      setError("L'XP requis doit être un nombre positif ou nul.");
      return;
    }

    if (!name.trim()) {
      setError("Le nom du niveau est obligatoire.");
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        await onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
          requiredXp: parsedXp,
          enabled,
        });
      } else {
        await onSubmit({
          level: parsedLevel,
          name: name.trim(),
          description: description.trim() || undefined,
          requiredXp: parsedXp,
          enabled,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-amber-800/60 bg-[#071a12]/95 p-6 shadow-[0_15px_40px_rgba(0,0,0,.22)]"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-500">
            Configuration
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[#f2ead2]">
            {isEditing ? `Modifier le niveau ${level?.level}` : "Ajouter un niveau"}
          </h2>
          <p className="mt-1 text-sm text-emerald-300/70">
            Définissez le palier et les conditions de progression.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-emerald-900 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-950/60 disabled:opacity-50"
        >
          Fermer
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-900/80 bg-red-950/30 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {!isEditing && (
          <div>
            <label htmlFor="level" className="mb-2 block text-sm font-semibold text-emerald-100">
              Numéro du niveau
            </label>
            <input
              id="level"
              type="number"
              min="1"
              step="1"
              value={levelNumber}
              onChange={(event) => setLevelNumber(event.target.value)}
              disabled={loading}
              required
              className="w-full rounded-xl border border-emerald-900 bg-black/30 px-4 py-3 text-white outline-none focus:border-amber-700"
              placeholder="Ex. 6"
            />
          </div>
        )}

        <div className={isEditing ? "md:col-span-2" : ""}>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-emerald-100">
            Nom du niveau
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
            required
            className="w-full rounded-xl border border-emerald-900 bg-black/30 px-4 py-3 text-white outline-none focus:border-amber-700"
            placeholder="Ex. Gardien du Chêne"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="mb-2 block text-sm font-semibold text-emerald-100">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={loading}
            rows={3}
            className="w-full resize-y rounded-xl border border-emerald-900 bg-black/30 px-4 py-3 text-white outline-none focus:border-amber-700"
            placeholder="Décrivez ce que représente ce rang au sein du Pacte."
          />
        </div>

        <div>
          <label htmlFor="requiredXp" className="mb-2 block text-sm font-semibold text-emerald-100">
            XP nécessaire
          </label>
          <input
            id="requiredXp"
            type="number"
            min="0"
            step="1"
            value={requiredXp}
            onChange={(event) => setRequiredXp(event.target.value)}
            disabled={loading}
            required
            className="w-full rounded-xl border border-emerald-900 bg-black/30 px-4 py-3 text-white outline-none focus:border-amber-700"
            placeholder="Ex. 1000"
          />
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-emerald-900 bg-black/20 px-4 py-3 text-sm font-semibold text-emerald-100">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            disabled={loading}
            className="h-4 w-4 accent-amber-600"
          />
          Niveau actif
        </label>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-emerald-900/70 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-emerald-900 px-5 py-3 font-semibold text-emerald-200 hover:bg-emerald-950/60 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl border border-amber-600 bg-amber-700/90 px-5 py-3 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Enregistrement…"
            : isEditing
              ? "Enregistrer les modifications"
              : "Créer le niveau"}
        </button>
      </div>
    </form>
  );
}
