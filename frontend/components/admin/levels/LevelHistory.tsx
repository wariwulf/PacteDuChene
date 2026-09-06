import type { UserLevel } from "@/types/levels.types";

interface LevelHistoryProps {
  history: UserLevel["history"];
}

export default function LevelHistory({ history }: LevelHistoryProps) {
  if (!history?.length) {
    return (
      <div className="rounded-xl border border-dashed border-emerald-900 bg-black/20 p-5 text-sm text-emerald-400">
        Aucun changement enregistré pour ce membre.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history
        .slice()
        .reverse()
        .map((entry, index) => (
          <article
            key={`${entry.createdAt}-${index}`}
            className="rounded-xl border border-emerald-900/70 bg-black/20 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-emerald-100">
                  {entry.action}
                </span>
                <span className="ml-3 text-xs uppercase tracking-wide text-emerald-500">
                  {entry.source}
                </span>
              </div>
              <time className="text-xs text-emerald-500">
                {new Date(entry.createdAt).toLocaleString("fr-FR")}
              </time>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600">XP</p>
                <p className="mt-1 text-emerald-100">
                  {entry.previousXp} → {entry.newXp}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600">Niveau</p>
                <p className="mt-1 text-emerald-100">
                  {entry.previousLevel} → {entry.newLevel}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600">Quantité</p>
                <p className="mt-1 text-emerald-100">
                  {entry.amount !== undefined ? entry.amount : "—"}
                </p>
              </div>
            </div>

            {entry.reason && (
              <p className="mt-3 border-t border-emerald-900/60 pt-3 text-sm text-emerald-300/70">
                {entry.reason}
              </p>
            )}
          </article>
        ))}
    </div>
  );
}
