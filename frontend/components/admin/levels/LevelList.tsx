import type { LevelDefinition } from "@/types/levels.types";

interface LevelListProps {
  levels: LevelDefinition[];
  loading?: boolean;
  disabled?: boolean;
  onEdit: (level: LevelDefinition) => void;
  onDelete: (level: number) => void;
}

export default function LevelList({
  levels,
  loading = false,
  disabled = false,
  onEdit,
  onDelete,
}: LevelListProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-900/70 bg-[#071a12]/90 p-8 text-center text-emerald-300">
        Chargement des niveaux…
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-800 bg-[#071a12]/70 p-10 text-center">
        <p className="text-lg font-semibold text-emerald-100">
          Aucun niveau configuré
        </p>
        <p className="mt-2 text-sm text-emerald-400">
          Ajoutez le premier palier de progression du Pacte.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {levels
        .slice()
        .sort((a, b) => a.level - b.level)
        .map((level) => (
          <article
            key={level._id}
            className="rounded-2xl border border-emerald-900/70 bg-[#071a12]/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,.18)]"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-amber-700/70 bg-amber-950/30 text-xl font-bold text-amber-300">
                  {level.level}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[.18em] text-emerald-400">
                      Niveau {level.level}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        level.enabled
                          ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
                          : "border-slate-700 bg-slate-950/40 text-slate-400"
                      }`}
                    >
                      {level.enabled ? "Actif" : "Désactivé"}
                    </span>
                  </div>

                  <h3 className="mt-1 text-xl font-semibold text-[#f2ead2]">
                    {level.name}
                  </h3>

                  {level.description && (
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-emerald-300/75">
                      {level.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-500">
                    Seuil
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-amber-200">
                    {level.requiredXp.toLocaleString("fr-FR")} XP
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(level)}
                    disabled={disabled}
                    className="rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-500 hover:bg-emerald-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(level.level)}
                    disabled={disabled}
                    className="rounded-lg border border-red-900 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:border-red-700 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
    </div>
  );
}
