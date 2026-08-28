"use client";

import { FormEvent, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface DiscordLink {
  memberId: string;
  discordId: string;
  discordUsername?: string;
  linkedAt: string;
  updatedAt?: string;
}

export default function AdministrationDiscordPage() {
  const [memberId, setMemberId] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");

  const [link, setLink] = useState<DiscordLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function searchMember(event?: FormEvent) {
    event?.preventDefault();

    const id = memberId.trim();

    if (!id) {
      setError("L'identifiant du membre est obligatoire.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/discord/member/${encodeURIComponent(id)}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            `Erreur serveur (${response.status})`
        );
      }

      const currentLink = payload.data ?? null;

      setLink(currentLink);
      setDiscordId(currentLink?.discordId ?? "");
      setDiscordUsername(currentLink?.discordUsername ?? "");

      if (!currentLink) {
        setMessage(
          "Aucune liaison Discord n'est actuellement enregistrée."
        );
      }
    } catch (err) {
      setLink(null);
      setDiscordId("");
      setDiscordUsername("");

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer la liaison Discord."
      );
    } finally {
      setLoading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    if (!memberId.trim() || !discordId.trim()) {
      setError(
        "L'identifiant du membre et l'identifiant Discord sont obligatoires."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/discord/link`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: memberId.trim(),
          discordId: discordId.trim(),
          discordUsername:
            discordUsername.trim() || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            `Erreur serveur (${response.status})`
        );
      }

      setLink(payload.data ?? null);
      setMessage(
        "La liaison Discord a été enregistrée."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer la liaison."
      );
    } finally {
      setSaving(false);
    }
  }

  async function unlink() {
    if (!memberId.trim()) return;

    if (
      !window.confirm(
        "Confirmer la dissociation du compte Discord ?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/discord/link/${encodeURIComponent(
          memberId.trim()
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            `Erreur serveur (${response.status})`
        );
      }

      setLink(null);
      setDiscordId("");
      setDiscordUsername("");
      setMessage("La liaison Discord a été supprimée.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la liaison."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
            Administration
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Gestion Discord
          </h1>

          <p className="mt-3 text-green-300">
            Associez ou dissociez manuellement les comptes Discord des membres.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-700 bg-red-950/40 p-5 text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-700 bg-green-900/50 p-5 text-green-300">
            {message}
          </div>
        )}

        <section className="rounded-xl border border-green-800 bg-green-900/50 p-6 md:p-8">
          <h2 className="text-2xl font-bold">
            Membre
          </h2>

          <form
            onSubmit={searchMember}
            className="mt-6 flex flex-col gap-4 md:flex-row"
          >
            <input
              value={memberId}
              onChange={(event) =>
                setMemberId(event.target.value)
              }
              placeholder="Identifiant du membre"
              className="min-w-0 flex-1 rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none placeholder:text-green-600 focus:border-amber-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-600 px-6 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? "Recherche..." : "Charger"}
            </button>
          </form>
        </section>

        {memberId.trim() && (
          <section className="mt-6 rounded-xl border border-green-800 bg-green-900/50 p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-amber-400">
                Liaison Discord
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {link ? "Compte associé" : "Aucun compte associé"}
              </h2>
            </div>

            <form onSubmit={save} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-green-300">
                  Identifiant Discord
                </span>

                <input
                  required
                  value={discordId}
                  onChange={(event) =>
                    setDiscordId(event.target.value)
                  }
                  placeholder="123456789012345678"
                  className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-green-300">
                  Nom Discord
                </span>

                <input
                  value={discordUsername}
                  onChange={(event) =>
                    setDiscordUsername(event.target.value)
                  }
                  placeholder="Pseudo Discord"
                  className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                />
              </label>

              {link && (
                <div className="rounded-lg border border-green-800 bg-green-950/50 p-5">
                  <p className="text-sm text-green-400">
                    Liaison actuelle
                  </p>

                  <p className="mt-2 font-mono text-green-100">
                    {link.discordId}
                  </p>

                  {link.discordUsername && (
                    <p className="mt-1 text-green-300">
                      {link.discordUsername}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50"
                >
                  {saving
                    ? "Enregistrement..."
                    : link
                      ? "Modifier la liaison"
                      : "Associer Discord"}
                </button>

                {link && (
                  <button
                    type="button"
                    onClick={unlink}
                    disabled={saving}
                    className="rounded-lg border border-red-700 px-5 py-3 font-semibold text-red-300 hover:bg-red-950 disabled:opacity-50"
                  >
                    Dissocier
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
