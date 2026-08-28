"use client";

import { AchievementBadgeImage } from "./AchievementBadge";
import type { Achievement } from "../../../types/achievements.types";

interface FeaturedAchievementSelectorProps {
  achievements: Achievement[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  saving?: boolean;
}

export default function FeaturedAchievementSelector({
  achievements,
  selectedIds,
  onChange,
  saving = false,
}: FeaturedAchievementSelectorProps) {
  function toggle(achievementId: string) {
    if (saving) return;

    const currentIndex = selectedIds.indexOf(achievementId);

    if (currentIndex >= 0) {
      onChange(selectedIds.filter((id) => id !== achievementId));
      return;
    }

    if (selectedIds.length >= 3) return;
    onChange([...selectedIds, achievementId]);
  }

  const slots = [0, 1, 2];

  return (
    <section className="rounded-2xl border border-amber-600/25 bg-black/15 p-6 shadow-[0_18px_50px_rgba(0,0,0,.12)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-amber-400">
            Personnalisation
          </p>
          <h2 className="mt-1 text-2xl font-bold">Mes exploits mis en avant</h2>
          <p className="mt-1 text-sm text-gray-400">
            Choisissez jusqu&apos;à trois exploits à afficher sur votre fiche de membre.
          </p>
        </div>
        <span className="text-sm font-semibold text-amber-300">
          {selectedIds.length}/3 sélectionnés
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {slots.map((slot) => {
          const id = selectedIds[slot];
          const achievement = achievements.find((item) => item.achievementId === id);

          return (
            <div
              key={slot}
              className="min-h-[116px] rounded-xl border border-white/10 bg-green-950/50 p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Emplacement {slot + 1}
              </p>

              {achievement ? (
                <div className="mt-3 flex items-center gap-3">
                  <AchievementBadgeImage level={achievement.level} size={48} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{achievement.name}</p>
                    <p className="text-xs text-amber-400">
                      {slot === 0 ? "Exploit principal" : `Position ${slot + 1}`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-gray-600">Emplacement libre</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-gray-300">
          Cliquez sur un exploit pour l&apos;ajouter ou le retirer.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => {
            const index = selectedIds.indexOf(achievement.achievementId);
            const selected = index >= 0;
            const disabled = !selected && selectedIds.length >= 3;

            return (
              <button
                key={achievement.achievementId}
                type="button"
                disabled={disabled || saving}
                onClick={() => toggle(achievement.achievementId)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-amber-500/60 bg-amber-500/10"
                    : disabled
                      ? "cursor-not-allowed border-white/5 bg-white/[.02] opacity-40"
                      : "border-white/10 bg-white/[.03] hover:border-amber-500/35 hover:bg-white/[.05]"
                }`}
              >
                <div className="relative shrink-0">
                  <AchievementBadgeImage level={achievement.level} size={44} />
                  {selected && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-green-950">
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{achievement.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {selected ? "Mis en avant" : "Disponible"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {saving && (
        <p className="mt-4 text-sm font-semibold text-amber-300">
          Enregistrement des exploits mis en avant...
        </p>
      )}
    </section>
  );
}
