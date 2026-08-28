"use client";

import { useState, type FormEvent } from "react";
import type { Achievement } from "../../../types/achievements.types";
import { submitAchievement } from "../../../services/achievements.service";

interface AchievementSubmissionModalProps {
  achievement: Achievement;
  userId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function AchievementSubmissionModal({
  achievement,
  userId,
  onClose,
  onSubmitted,
}: AchievementSubmissionModalProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("Expliquez comment vous avez réalisé cet exploit.");
      return;
    }

    if (files.length === 0) {
      setError("Ajoutez au moins une pièce justificative.");
      return;
    }

    try {
      setSubmitting(true);
      await submitAchievement(userId, achievement.achievementId, message, files);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer la demande.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a2018] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
            Demande de validation
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{achievement.name}</h2>
          <p className="mt-1 text-sm text-gray-400">
            Votre preuve sera examinée par un administrateur.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-amber-300">
              Explication
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="Expliquez ce que vous avez accompli et dans quelles circonstances..."
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-amber-300">
              Pièces justificatives
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))}
              className="block w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:font-semibold file:text-white"
            />
            <p className="mt-2 text-xs text-gray-500">
              Jusqu&apos;à 5 fichiers, 50 Mo maximum par fichier.
            </p>
          </label>

          {files.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="mb-2 text-sm font-semibold text-white">Fichiers sélectionnés</p>
              <ul className="space-y-1 text-sm text-gray-400">
                {files.map((file) => (
                  <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-white/10 px-5 py-2.5 font-semibold text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-white hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Envoi..." : "Envoyer la preuve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
