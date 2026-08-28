"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function ChangementMotDePassePage() {
  const { user, isLoading, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, router, user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 10) {
      setError("Le nouveau mot de passe doit contenir au moins 10 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }

    try {
      setSaving(true);
      await changePassword(currentPassword, newPassword);
      await refreshUser();
      setSuccess("Mot de passe modifié. Bienvenue dans le Pacte du Chêne.");
      setTimeout(() => router.replace("/espace-membre"), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de modifier le mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !user) return null;

  return (
    <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
          Le Pacte du Chêne
        </p>
        <h1 className="text-4xl font-bold">Sécurisez votre compte</h1>
        <p className="mt-3 text-green-200">
          Votre compte vient d'être créé. Vous devez choisir un nouveau mot de passe avant de continuer.
        </p>

        <form onSubmit={submit} className="mt-8 rounded-2xl border border-green-800 bg-green-900/60 p-8 shadow-xl">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block font-semibold">Mot de passe temporaire</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">Nouveau mot de passe</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={10}
                autoComplete="new-password"
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">Confirmer le nouveau mot de passe</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={10}
                autoComplete="new-password"
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
              />
            </label>
          </div>

          {error && <div className="mt-5 rounded-lg border border-red-700 bg-red-950/40 p-4 text-red-200">{error}</div>}
          {success && <div className="mt-5 rounded-lg border border-green-500 bg-green-950/40 p-4 text-green-200">{success}</div>}

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Définir mon mot de passe"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-green-600 px-5 py-3 font-semibold text-green-100 hover:bg-green-800"
            >
              Se déconnecter
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
