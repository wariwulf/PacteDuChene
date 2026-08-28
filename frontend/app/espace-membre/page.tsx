"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import MemberLevelCard from "@/components/member/levels/MemberLevelCard";
import { useAuth } from "@/contexts/AuthContext";


export default function EspaceMembrePage() {
  const router = useRouter();


  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/connexion");
    }
  }, [isLoading, isAuthenticated, router]);


  if (isLoading) {
    return (
      <main className="min-h-screen text-white">
        <p>Chargement de votre domaine...</p>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#173d2b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* =====================================================
            EN-TÊTE
        ===================================================== */}
        <header className="mb-10">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">
            Le Pacte du Chêne
          </p>

          <h1 className="text-4xl font-bold">
            Bienvenue, {user.username}
          </h1>

          <p className="mt-3 text-gray-300">
            Vous êtes désormais dans le domaine du Pacte.
          </p>
        </header>

        {/* =====================================================
            PROGRESSION DU MEMBRE
        ===================================================== */}
        <section className="mb-10">
          <MemberLevelCard />
        </section>

        {/* =====================================================
            ESPACE MEMBRE
        ===================================================== */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* PERSONNAGE */}
          <Link
            href="/espace-membre/personnage"
            className="group rounded-xl border border-white/10 bg-black/20 p-6 transition hover:border-amber-500/40 hover:bg-black/30"
          >
            <h2 className="mb-2 text-xl font-semibold group-hover:text-amber-500">
              Mon personnage
            </h2>

            <p className="text-sm text-gray-400">
              Retrouvez ici votre fiche, vos fonctions et votre progression.
            </p>

            <span className="mt-5 block text-sm font-semibold text-amber-500">
              Voir mon personnage →
            </span>
          </Link>

          {/* QUÊTES */}
          <Link
            href="/espace-membre/quetes"
            className="group rounded-xl border border-white/10 bg-black/20 p-6 transition hover:border-amber-500/40 hover:bg-black/30"
          >
            <h2 className="mb-2 text-xl font-semibold group-hover:text-amber-500">
              Quêtes
            </h2>

            <p className="text-sm text-gray-400">
              Consultez vos quêtes et votre progression au sein du Pacte.
            </p>

            <span className="mt-5 block text-sm font-semibold text-amber-500">
              Voir mes quêtes →
            </span>
          </Link>

          {/* EXPLOITS */}
          <Link
            href="/espace-membre/exploits"
            className="group rounded-xl border border-white/10 bg-black/20 p-6 transition hover:border-amber-500/40 hover:bg-black/30"
          >
            <h2 className="mb-2 text-xl font-semibold group-hover:text-amber-500">
              Exploits
            </h2>

            <p className="text-sm text-gray-400">
              Découvrez vos exploits et ceux accomplis par la communauté.
            </p>

            <span className="mt-5 block text-sm font-semibold text-amber-500">
              Voir mes exploits →
            </span>
          </Link>

        </section>

        {/* =====================================================
            INFORMATIONS DU COMPTE
        ===================================================== */}
        <div className="mt-10 border-t border-white/10 pt-6">

          <p className="mb-4 text-sm text-gray-400">
            Rôle actuel :{" "}
            <span className="font-semibold text-amber-500">
              {user.role}
            </span>
          </p>

          <button
            onClick={async () => {
              await logout();
              router.replace("/connexion");
            }}
            className="rounded-lg bg-red-800 px-5 py-3 font-semibold transition hover:bg-red-700"
          >
            Quitter le domaine
          </button>

        </div>
      </div>
    </main>
  );
}
