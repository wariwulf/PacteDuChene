"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  submitQuestObjective,
} from "@/services/quest-submissions.service";

type Props = {
  open: boolean;
  userId: string;
  questId: string;
  objectiveId: string;
  objectiveName: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

const MAX_FILES = 5;
const MAX_FILE_SIZE =
  50 * 1024 * 1024;

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]);

export default function ObjectiveSubmissionModal({
  open,
  userId,
  questId,
  objectiveId,
  objectiveName,
  onClose,
  onSubmitted,
}: Props) {
  const [message, setMessage] =
    useState("");

  const [files, setFiles] =
    useState<File[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) {
      setMessage("");
      setFiles([]);
      setError("");
      setSaving(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function addFiles(
    list: FileList | null
  ) {
    if (!list) return;

    const incoming =
      Array.from(list);

    const next = [
      ...files,
      ...incoming,
    ];

    const unique: File[] = [];

    for (const file of next) {
      const duplicate =
        unique.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified ===
              file.lastModified
        );

      if (!duplicate) {
        unique.push(file);
      }
    }

    if (
      unique.length >
      MAX_FILES
    ) {
      setError(
        `Vous pouvez joindre au maximum ${MAX_FILES} fichiers.`
      );
    }

    const invalidType =
      unique.find(
        (file) =>
          !ACCEPTED_TYPES.has(
            file.type
          )
      );

    if (invalidType) {
      setError(
        `Le fichier "${invalidType.name}" utilise un format non autorisé.`
      );
      return;
    }

    const tooLarge =
      unique.find(
        (file) =>
          file.size >
          MAX_FILE_SIZE
      );

    if (tooLarge) {
      setError(
        `Le fichier "${tooLarge.name}" dépasse la limite de 50 Mo.`
      );
      return;
    }

    setError("");
    setFiles(
      unique.slice(0, MAX_FILES)
    );
  }

  async function handleSubmit() {
    if (!message.trim()) {
      setError(
        "Expliquez comment vous avez réalisé cet objectif."
      );
      return;
    }

    if (!userId) {
      setError(
        "Utilisateur authentifié introuvable."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await submitQuestObjective(
        userId,
        questId,
        objectiveId,
        message.trim(),
        files
      );

      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer la preuve."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-[#c6a15b]/25 bg-[#0b1711] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#c6a15b]">
            Validation d'objectif
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#f5e8c8]">
            {objectiveName}
          </h2>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#e7dfc7]">
              Expliquez votre réalisation
            </label>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              rows={6}
              maxLength={5000}
              placeholder="Décrivez ce que vous avez réalisé et les éléments permettant à l'administration de le vérifier..."
              className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[#f5e8c8] outline-none transition focus:border-[#c6a15b]/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#e7dfc7]">
              Preuves
            </label>

            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg"
              onChange={(event) =>
                addFiles(
                  event.target.files
                )
              }
              className="block w-full rounded-xl border border-dashed border-[#c6a15b]/30 bg-black/20 p-4 text-sm text-[#cfc6ad]"
            />

            <p className="mt-2 text-xs text-[#8f9b91]">
              Jusqu'à {MAX_FILES} fichiers,
              50 Mo maximum par fichier.
            </p>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map(
                  (
                    file,
                    index
                  ) => (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-sm"
                    >
                      <span className="truncate text-[#d9d1ba]">
                        {file.name}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setFiles(
                            (
                              current
                            ) =>
                              current.filter(
                                (
                                  _,
                                  fileIndex
                                ) =>
                                  fileIndex !==
                                  index
                              )
                          )
                        }
                        className="ml-3 text-[#dca0a0] hover:text-red-300"
                      >
                        Retirer
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#cfc6ad] hover:bg-white/[.05]"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-[#a77c36] px-5 py-2 text-sm font-bold text-[#17130c] disabled:opacity-50"
          >
            {saving
              ? "Envoi..."
              : "Soumettre la preuve"}
          </button>
        </div>
      </div>
    </div>
  );
}
