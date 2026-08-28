"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import {
  getPendingQuestSubmissions,
  type QuestSubmission,
} from "@/services/quest-submissions.service";

import QuestSubmissionReviewModal from "@/components/admin/QuestSubmissionReviewModal";

export default function QuestSubmissionsAdminPage() {
  const [submissions, setSubmissions] =
    useState<QuestSubmission[]>([]);

  const [selected, setSelected] =
    useState<QuestSubmission | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      setSubmissions(
        await getPendingQuestSubmissions()
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les demandes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="min-h-screen bg-[#173d2b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
              Administration
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Preuves de quêtes
            </h1>

            <p className="mt-3 text-gray-300">
              Vérifiez les preuves envoyées par les membres avant de valider leurs objectifs.
            </p>
          </div>

          <Link
            href="/administration/quetes"
            className="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20"
          >
            ← Gestion des quêtes
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-gray-400">
            Chargement des demandes...
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
            <h2 className="text-xl font-semibold">
              Aucune preuve en attente
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Toutes les demandes ont été traitées.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(
              (submission) => (
                <article
                  key={submission._id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-500">
                        Demande de validation
                      </p>

                      <h2 className="mt-1 text-lg font-bold">
                        Objectif :{" "}
                        {submission.objectiveId}
                      </h2>

                      <div className="mt-2 space-y-1 text-sm text-gray-400">
                        <p>
                          Membre :{" "}
                          {submission.userId}
                        </p>

                        <p>
                          Quête :{" "}
                          {submission.questId}
                        </p>

                        {submission.createdAt && (
                          <p>
                            Envoyée le{" "}
                            {new Date(
                              submission.createdAt
                            ).toLocaleString(
                              "fr-FR"
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelected(
                          submission
                        )
                      }
                      className="rounded-lg bg-[#a77c36] px-5 py-3 font-semibold text-[#17130c] hover:bg-[#bd9147]"
                    >
                      Examiner la preuve
                    </button>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm text-gray-300">
                    {submission.message}
                  </p>

                  {submission.attachments.length >
                    0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      {
                        submission
                          .attachments
                          .length
                      }{" "}
                      pièce(s) jointe(s)
                    </p>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </div>

      <QuestSubmissionReviewModal
        submission={selected}
        onClose={() =>
          setSelected(null)
        }
        onReviewed={async () => {
          setSelected(null);
          await load();
        }}
      />
    </main>
  );
}
