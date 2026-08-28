
"use client";

import { useState } from "react";
import { reviewQuestSubmission } from "@/services/quest-submissions.service";

type Attachment = {
  type: "image" | "video" | "audio";
  url: string;
  originalName: string;
};

type Submission = {
  _id: string;
  userId: string;
  questId: string;
  objectiveId: string;
  message: string;
  attachments: Attachment[];
};

type Props = {
  submission: Submission | null;
  onClose: () => void;
  onReviewed?: () => void;
};

export default function QuestSubmissionReviewModal({
  submission,
  onClose,
  onReviewed,
}: Props) {
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!submission) return null;

  const currentSubmission = submission;

  async function review(status: "approved" | "rejected") {
    if (status === "rejected" && !response.trim()) {
      setError("Un motif est obligatoire pour refuser la preuve.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await reviewQuestSubmission(
        currentSubmission._id,
        status,
        response
      );

      onReviewed?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de traiter la demande."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#c6a15b]/25 bg-[#0b1711] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#c6a15b]">
            Demande de validation
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#f5e8c8]">
            Objectif : {currentSubmission.objectiveId}
          </h2>
          <p className="mt-1 text-xs text-[#8f9b91]">
            Joueur : {currentSubmission.userId}
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#c6a15b]">
              Explication du joueur
            </h3>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[#ddd4bc]">
              {currentSubmission.message}
            </div>
          </div>

          {currentSubmission.attachments.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#c6a15b]">
                Pièces justificatives
              </h3>

              <div className="space-y-4">
                {currentSubmission.attachments.map((attachment) => {
                  const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "http://localhost:5000/api";

                  // Les fichiers sont servis par Express sur /uploads,
                  // alors que l'API est exposée sur /api.
                  // On retire donc uniquement le suffixe /api de l'URL de base.
                  const apiOrigin = apiUrl.replace(/\/api\/?$/, "");

                  const url = attachment.url.startsWith("http")
                    ? attachment.url
                    : new URL(
                        attachment.url.startsWith("/")
                          ? attachment.url
                          : `/${attachment.url}`,
                        `${apiOrigin}/`
                      ).toString();

                  if (attachment.type === "image") {
                    return (
                      <div
                        key={attachment.url}
                        className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3"
                      >
                        <img
                          src={url}
                          alt={attachment.originalName}
                          className="max-h-[420px] w-full rounded-lg object-contain bg-black/30"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs text-[#9fa99f]">
                            {attachment.originalName}
                          </span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#f5e8c8] hover:border-[#c6a15b]/50"
                          >
                            Ouvrir
                          </a>
                        </div>
                      </div>
                    );
                  }

                  if (attachment.type === "video") {
                    return (
                      <div
                        key={attachment.url}
                        className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3"
                      >
                        <video
                          controls
                          className="max-h-[420px] w-full rounded-lg bg-black"
                          src={url}
                        />
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs text-[#9fa99f]">
                            {attachment.originalName}
                          </span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#f5e8c8] hover:border-[#c6a15b]/50"
                          >
                            Ouvrir
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={attachment.url}
                      className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <audio controls className="w-full" src={url} />
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-xs text-[#9fa99f]">
                          {attachment.originalName}
                        </span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#f5e8c8] hover:border-[#c6a15b]/50"
                        >
                          Ouvrir
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#e7dfc7]">
              Réponse de l'administration
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              maxLength={3000}
              placeholder="Message transmis au membre..."
              className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[#f5e8c8] outline-none focus:border-[#c6a15b]/60"
            />
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
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#cfc6ad]"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={() => review("rejected")}
            disabled={saving}
            className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 disabled:opacity-50"
          >
            Refuser
          </button>

          <button
            type="button"
            onClick={() => review("approved")}
            disabled={saving}
            className="rounded-xl bg-[#55734e] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
