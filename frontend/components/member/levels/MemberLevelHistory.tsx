"use client";

import type { LevelHistoryEntry } from "@/types/levels.types";

interface MemberLevelHistoryProps {
  history: LevelHistoryEntry[];
}

function getActionLabel(action: LevelHistoryEntry["action"]) {
  switch (action) {
    case "XP_ADD":
      return "XP gagnée";

    case "XP_REMOVE":
      return "XP retirée";

    case "XP_SET":
      return "XP définie";

    case "LEVEL_SET":
      return "Niveau modifié";

    default:
      return action;
  }
}

function getActionDescription(
  entry: LevelHistoryEntry
) {
  switch (entry.action) {
    case "XP_ADD":
      return `Vous avez gagné ${entry.amount ?? 0} XP.`;

    case "XP_REMOVE":
      return `${entry.amount ?? 0} XP ont été retirées.`;

    case "XP_SET":
      return `Votre XP a été définie à ${entry.newXp}.`;

    case "LEVEL_SET":
      return `Votre niveau a été modifié.`;

    default:
      return "Modification de progression.";
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function MemberLevelHistory({
  history,
}: MemberLevelHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-black/20 p-6">
        <h2 className="text-xl font-semibold text-white">
          Historique
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Aucune modification de progression enregistrée.
        </p>
      </section>
    );
  }

  const entries = [...history].reverse();

  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Historique de progression
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          Retrouvez ici les dernières évolutions de votre progression.
        </p>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <article
            key={`${entry.createdAt}-${index}`}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="font-semibold text-white">
                  {getActionLabel(entry.action)}
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  {getActionDescription(entry)}
                </p>
              </div>

              <time
                dateTime={entry.createdAt}
                className="text-xs text-gray-500"
              >
                {formatDate(entry.createdAt)}
              </time>
            </div>

            <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  XP
                </p>

                <p className="mt-1 font-medium text-white">
                  {entry.previousXp} → {entry.newXp}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Niveau
                </p>

                <p className="mt-1 font-medium text-white">
                  {entry.previousLevel} → {entry.newLevel}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Source
                </p>

                <p className="mt-1 font-medium text-white">
                  {entry.source === "QUEST"
                    ? "Quête"
                    : entry.source === "ACHIEVEMENT"
                    ? "Exploit"
                    : "Administration"}
                </p>
              </div>
            </div>

            {entry.reason && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400">
                  {entry.reason}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}