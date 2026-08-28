"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export default function ChangementMotDePassePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmation, setConfirmation] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!user) {
      setError(
        "Vous devez être connecté pour modifier votre mot de passe."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    if (newPassword !== confirmation) {
      setError(
        "Les deux nouveaux mots de passe ne correspondent pas."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/users/password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const payload = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        payload?.success === false
      ) {
        throw new Error(
          payload?.message ||
            `Erreur serveur (${response.status})`
        );
      }

      await refreshUser();

      setMessage(
        "Votre mot de passe a été modifié avec succès."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");

      setTimeout(() => {
        router.replace("/espace-membre");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le mot de passe."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-amber-500">
          Le Pacte du Chêne
        </p>

        <h1 className="text-4xl font-bold">
          Sécurisation du compte
        </h1>

        <p className="mt-3 text-green-200">
          Votre compte utilise actuellement un
          mot de passe temporaire. Vous devez en
          choisir un nouveau avant de continuer.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-700 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-green-600 bg-green-900/60 p-4 text-green-100">
            {message}
          </div>
        )}

        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl border border-green-800 bg-green-900/60 p-6"
        >
          <label className="block">
            <span className="mb-2 block font-semibold">
              Mot de passe temporaire
            </span>

            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block font-semibold">
              Nouveau mot de passe
            </span>

            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
            />

            <span className="mt-2 block text-sm text-green-300">
              Minimum : 8 caractères.
            </span>
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block font-semibold">
              Confirmer le nouveau mot de passe
            </span>

            <input
              type="password"
              required
              minLength={8}
              value={confirmation}
              onChange={(e) =>
                setConfirmation(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50"
          >
            {loading
              ? "Modification..."
              : "Choisir mon nouveau mot de passe"}
          </button>
        </form>
      </div>
    </main>
  );
}
