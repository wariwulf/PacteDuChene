"use client";

import { useMemo, useState } from "react";
import type { AchievementSubmission } from "../../../types/achievements.types";
import { reviewAchievementSubmission } from "../../../services/achievements.service";

interface Props {
  submission: AchievementSubmission;
  achievementName: string;
  onClose: () => void;
  onReviewed: () => void;
}

function buildFileUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const origin = apiUrl.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function AchievementSubmissionReviewModal({
  submission,
  achievementName,
  onClose,
  onReviewed,
}: Props) {
  const [response, setResponse] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const files = useMemo(
    () => submission.attachments.map((attachment) => ({
      ...attachment,
      fullUrl: buildFileUrl(attachment.url),
    })),
    [submission.attachments]
  );

  async function handleReview(status: "approved" | "rejected") {
    if (status === "rejected" && !response.trim()) {
      setError("Un motif est obligatoire pour refuser l'exploit.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      await reviewAchievementSubmission(submission._id, status, response);
      onReviewed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de traiter la demande.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-amber-500/20 bg-[#091c15] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">Demande de validation d&apos;exploit</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{achievementName}</h2>
          <p className="mt-1 text-sm text-gray-500">Joueur : {submission.userId}</p>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-300">Explication du joueur</h3>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 whitespace-pre-wrap text-gray-200">
              {submission.message}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-300">Pièces justificatives</h3>
            {files.length === 0 ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">Aucune pièce jointe.</p>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={`${file.url}-${file.originalName}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    {file.type === "image" && (
                      <img src={file.fullUrl} alt={file.originalName} className="max-h-[500px] w-full object-contain bg-black/30" />
                    )}
                    {file.type === "video" && (
                      <video src={file.fullUrl} controls className="max-h-[500px] w-full bg-black" />
                    )}
                    {file.type === "audio" && (
                      <div className="p-5"><audio src={file.fullUrl} controls className="w-full" /></div>
                    )}
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{file.originalName}</p>
                        <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} Ko · {file.mimeType}</p>
                      </div>
                      <a href={file.fullUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5">Ouvrir</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-sm text-red-200">{error}</div>}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-300">Réponse de l&apos;administration</span>
            <textarea
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              rows={4}
              maxLength={3000}
              placeholder="Message transmis au membre..."
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-5">
          <button type="button" onClick={onClose} disabled={processing} className="rounded-lg border border-white/10 px-5 py-2.5 font-semibold text-gray-300 hover:bg-white/5">Fermer</button>
          <button type="button" onClick={() => handleReview("rejected")} disabled={processing} className="rounded-lg border border-red-500/40 px-5 py-2.5 font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50">Refuser</button>
          <button type="button" onClick={() => handleReview("approved")} disabled={processing} className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-500 disabled:opacity-50">Valider</button>
        </div>
      </div>
    </div>
  );
}
