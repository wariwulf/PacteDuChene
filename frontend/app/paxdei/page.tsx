"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Character {
  _id: string;
  memberId: string;
  characterName: string;
  avatarId?: string;
  world?: string;
  province?: string;
  region?: string;
  clan?: string;
  mainProfession?: string;
  secondaryProfessions?: string[];
  isMainCharacter?: boolean;
}

export default function PaxDeiPage() {
  const [memberId, setMemberId] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCharacters() {
    if (!memberId.trim()) {
      setError("Veuillez renseigner l'identifiant du membre.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/paxdei/characters/member/${encodeURIComponent(
          memberId.trim()
        )}`,
        {
          credentials: "include",
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message || `Erreur serveur (${response.status})`
        );
      }

      setCharacters(payload.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les donnÃ©es Pax Dei."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedMemberId =
      localStorage.getItem("pacte_member_id");

    if (savedMemberId) {
      setMemberId(savedMemberId);
    }
  }, []);

  return (
    <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-500">
            Le Pacte du ChÃªne
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">
                Pax Dei
              </h1>

              <p className="mt-2 text-green-300">
                GÃ©rez les informations Pax Dei associÃ©es aux
                membres du Pacte.
              </p>
            </div>

            <button
              onClick={loadCharacters}
              className="rounded-lg bg-amber-600 px-5 py-3 font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Chargement..." : "Actualiser"}
            </button>
          </div>
        </header>

        <section className="mb-8 rounded-xl border border-green-700 bg-green-900/60 p-6">
          <p className="mb-2 text-sm font-bold uppercase text-amber-500">
            Personnage Pax Dei
          </p>

          <h2 className="mb-2 text-2xl font-bold">
            Rechercher un membre
          </h2>

          <p className="mb-5 text-green-300">
            Entrez l'identifiant du membre pour retrouver ses
            personnages Pax Dei.
          </p>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={memberId}
              onChange={(event) => {
                setMemberId(event.target.value);

                localStorage.setItem(
                  "pacte_member_id",
                  event.target.value
                );
              }}
              placeholder="Identifiant du membre"
              className="flex-1 rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none placeholder:text-green-600 focus:border-amber-500"
            />

            <button
              onClick={loadCharacters}
              className="rounded-lg bg-amber-600 px-6 py-3 font-bold hover:bg-amber-500"
            >
              Rechercher
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-600 bg-red-950/40 p-4 text-red-300">
              {error}
            </div>
          )}
        </section>

        {characters.length === 0 && !loading ? (
          <section className="rounded-xl border border-green-700 bg-green-900/60 p-12 text-center">
            <div className="mb-4 text-5xl">âš”ï¸</div>

            <h2 className="text-2xl font-bold">
              Aucun personnage enregistrÃ©
            </h2>

            <p className="mt-2 text-green-300">
              Les informations Pax Dei de ce membre ne sont
              pas encore renseignÃ©es.
            </p>
          </section>
        ) : (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-amber-500">
                  Personnages
                </p>

                <h2 className="text-2xl font-bold">
                  Personnages Pax Dei
                </h2>
              </div>

              <span className="rounded-full bg-green-800 px-4 py-2 text-sm font-bold text-green-200">
                {characters.length} personnage
                {characters.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {characters.map((character) => (
                <article
                  key={character._id}
                  className={`rounded-xl border bg-green-900/60 p-6 ${
                    character.isMainCharacter
                      ? "border-amber-500"
                      : "border-green-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                        {character.isMainCharacter
                          ? "Personnage principal"
                          : "Personnage"}
                      </p>

                      <h3 className="mt-1 text-2xl font-bold">
                        {character.characterName}
                      </h3>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500 bg-green-950 text-xl">
                      âš”
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Info
                      label="Avatar ID"
                      value={character.avatarId}
                    />

                    <Info
                      label="Monde"
                      value={character.world}
                    />

                    <Info
                      label="Province"
                      value={character.province}
                    />

                    <Info
                      label="RÃ©gion"
                      value={character.region}
                    />

                    <Info
                      label="Clan"
                      value={character.clan}
                    />

                    <Info
                      label="Profession"
                      value={character.mainProfession}
                    />
                  </div>

                  {character.secondaryProfessions &&
                    character.secondaryProfessions.length > 0 && (
                      <div className="mt-5 rounded-lg border border-green-700 bg-green-950/50 p-4">
                        <p className="text-xs font-bold uppercase text-green-400">
                          Professions secondaires
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {character.secondaryProfessions.map(
                            (profession) => (
                              <span
                                key={profession}
                                className="rounded-full bg-green-800 px-3 py-1 text-sm text-green-200"
                              >
                                {profession}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 rounded-xl border border-green-700 bg-green-900/40 p-6">
          <p className="text-sm font-bold uppercase text-amber-500">
            Prochaine Ã©tape
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Connexion aux donnÃ©es Pax Dei
          </h2>

          <p className="mt-2 text-green-300">
            Cette interface utilise pour l'instant les donnÃ©es
            enregistrÃ©es dans le Pacte. La connexion aux sources
            externes Pax Dei pourra Ãªtre ajoutÃ©e sans modifier
            cette interface.
          </p>
        </section>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-green-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-green-100">
        {value || "Non renseignÃ©"}
      </p>
    </div>
  );
}
