"use client";

import { useEffect, useState } from "react";

import { getCurrentMember } from "@/services/members.service";
import { getUserLevel } from "@/services/levels.service";

import type { UserLevel } from "@/types/levels.types";
import MemberLevelHistory from "./MemberLevelHistory";

interface MemberLevelCardProps {
  userId?: string;
}

export default function MemberLevelCard({
  userId,
}: MemberLevelCardProps) {
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLevel() {
      try {
        setLoading(true);
        setError("");

        let currentUserId = userId;

        if (!currentUserId) {
          const member = await getCurrentMember();
          currentUserId = member.profile.id;
        }

        const userLevel = await getUserLevel(currentUserId);

        setLevel(userLevel);
      } catch (err) {
        console.error(
          "Erreur récupération niveau membre :",
          err
        );

        setError(
          "Impossible de récupérer votre progression."
        );
      } finally {
        setLoading(false);
      }
    }

    loadLevel();
  }, [userId]);

  if (loading) {
    return (
      <section className="rounded-xl border border-white/10 bg-black/20 p-6">
        <p className="text-sm text-white/60">
          Chargement de votre progression...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-sm text-red-400">
          {error}
        </p>
      </section>
    );
  }

  if (!level) {
    return null;
  }

  const isMaxLevel = level.nextLevelXp === null;

  const xpRemaining = isMaxLevel
    ? 0
    : Math.max(
        level.nextLevelXp! - level.xp,
        0
      );

  return (
    <div className="space-y-6">

        <section className="rounded-xl border border-white/10 bg-black/20 p-6">
        <div className="mb-6">
            <p className="text-sm text-white/50">
            Votre progression
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
            {level.levelName}
            </h2>

            <p className="mt-1 text-sm text-white/60">
            Niveau {level.level}
            </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/50">
                Niveau
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
                {level.level}
            </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/50">
                XP totale
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
                {level.xp}
            </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/50">
                Progression
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
                {level.progressPercent}%
            </p>
            </div>

        </div>

        <div className="mt-6">

            <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-white/60">
                {isMaxLevel
                ? "Niveau maximum atteint"
                : "Progression vers le niveau suivant"}
            </span>

            <span className="font-medium text-white">
                {isMaxLevel
                ? `${level.xp} XP`
                : `${level.progressXp} / ${
                    level.nextLevelXp! -
                    level.currentLevelXp
                    } XP`}
            </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{
                width: `${Math.min(
                    Math.max(level.progressPercent, 0),
                    100
                )}%`,
                }}
            />
            </div>

            {!isMaxLevel && (
            <p className="mt-2 text-right text-xs text-white/40">
                Encore {xpRemaining} XP avant le niveau{" "}
                {level.level + 1}
            </p>
            )}

        </div>
        </section>

        <MemberLevelHistory
        history={level.history}
        />

    </div>
    );
}