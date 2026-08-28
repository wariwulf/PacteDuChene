"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { startDiscordLogin } from "@/lib/api/auth";

const oauthErrors: Record<string, string> = {
  suspended:
    "Votre compte Pacte est actuellement désactivé.",

  "not-linked":
    "Ce compte Discord n'est pas encore associé à un membre du Pacte.",

  failed:
    "La connexion avec Discord n'a pas pu être finalisée. Réessayez plus tard.",
};

export default function ConnexionPage() {
  const router = useRouter();

  const {
    login,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [oauthError, setOauthError] =
    useState("");

  /**
   * Récupération du message OAuth.
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const oauthErrorCode =
      params.get("oauthError") ?? "";

    setOauthError(
      oauthErrors[oauthErrorCode] ?? ""
    );
  }, []);

  /**
   * Redirection si l'utilisateur est déjà connecté.
   *
   * IMPORTANT :
   * router.replace() est exécuté dans un effet,
   * jamais pendant le rendu.
   */
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated
    ) {
      router.replace("/espace-membre");
    }
  }, [
    isLoading,
    isAuthenticated,
    router,
  ]);

  /**
   * Chargement initial.
   */
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-white">
          Chargement...
        </p>
      </main>
    );
  }

  /**
   * L'utilisateur est déjà connecté.
   * L'effet ci-dessus se charge de la redirection.
   */
  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-white">
          Redirection...
        </p>
      </main>
    );
  }

  /**
   * Connexion classique.
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login(
        email,
        password
      );

      /*
       * Pas de router.push() ici.
       *
       * Le changement de user dans AuthContext
       * déclenche l'effet de redirection ci-dessus.
       */
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Impossible de se connecter."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      {/* Fond */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/hero.png')",
        }}
      />

      {/* Voile sombre */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Contenu */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-black/60 p-8 shadow-2xl backdrop-blur-md">

          {/* En-tête */}
          <div className="mb-8 text-center">
            <div className="mb-4 text-4xl">
              🌳
            </div>

            <h1 className="text-3xl font-bold text-white">
              Le Pacte du Chêne
            </h1>

            <p className="mt-2 text-sm text-gray-300">
              Entrez dans le domaine du Pacte.
            </p>
          </div>

          {/* Erreur */}
          {(error || oauthError) && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">
              {error || oauthError}
            </div>
          )}

          {/* Formulaire */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-200"
              >
                Adresse e-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="vous@exemple.fr"
                required
                autoComplete="email"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-200"
              >
                Mot de passe
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Votre mot de passe"
                required
                autoComplete="current-password"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-amber-700 px-4 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Connexion..."
                : "Entrer dans le domaine"}
            </button>
          </form>

          {/* Discord */}
          <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-white/15" />
            <span>ou</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <button
            type="button"
            onClick={startDiscordLogin}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#5865F2] px-4 py-3 font-semibold text-white transition hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Se connecter avec Discord
          </button>

          {/* Retour */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="text-sm text-gray-400 transition hover:text-white"
            >
              ← Retour à l'accueil
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}