"use client";

import { useEffect, useMemo, useState } from "react";

import {
  addUserXp,
  getUserLevel,
  removeUserXp,
  setUserLevel,
  setUserXp,
} from "@/services/levels.service";

import { getMembers } from "@/services/members.service";

import type { Member } from "@/services/members.service";
import type { UserLevel } from "@/types/levels.types";

type Operation = "ADD" | "REMOVE" | "SET_XP" | "SET_LEVEL";

export default function MemberLevelManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [userLevel, setUserLevelData] =
    useState<UserLevel | null>(null);

  const [search, setSearch] = useState("");

  const [operation, setOperation] =
    useState<Operation>("ADD");

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const [loadingMembers, setLoadingMembers] =
    useState(true);

  const [loadingLevel, setLoadingLevel] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // MEMBRES
  // ============================================================

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoadingMembers(true);
      setError("");

      const data = await getMembers();

      setMembers(data);
    } catch (err) {
      console.error(
        "Erreur récupération membres :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les membres."
      );
    } finally {
      setLoadingMembers(false);
    }
  }

  // ============================================================
  // MEMBRE SÉLECTIONNÉ
  // ============================================================

  const selectedMember = useMemo(
    () =>
      members.find(
        (member) =>
          member.profile.id === selectedUserId
      ) ?? null,
    [members, selectedUserId]
  );

  // ============================================================
  // RECHERCHE
  // ============================================================

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return members;
    }

    return members.filter((member) => {
      const username =
        member.profile.username?.toLowerCase() ?? "";

      const displayName =
        member.profile.displayName?.toLowerCase() ?? "";

      const email =
        member.profile.email?.toLowerCase() ?? "";

      return (
        username.includes(value) ||
        displayName.includes(value) ||
        email.includes(value)
      );
    });
  }, [members, search]);

  // ============================================================
  // CHARGEMENT DU NIVEAU
  // ============================================================

  useEffect(() => {
    if (!selectedUserId) {
      setUserLevelData(null);
      return;
    }

    loadUserLevel(selectedUserId);
  }, [selectedUserId]);

  async function loadUserLevel(userId: string) {
    try {
      setLoadingLevel(true);
      setError("");
      setSuccess("");

      const data = await getUserLevel(userId);

      setUserLevelData(data);
    } catch (err) {
      console.error(
        "Erreur récupération niveau :",
        err
      );

      setUserLevelData(null);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer le niveau du membre."
      );
    } finally {
      setLoadingLevel(false);
    }
  }

  // ============================================================
  // OPÉRATION
  // ============================================================

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function handleOperationChange(
    value: Operation
  ) {
    resetMessages();

    setOperation(value);
    setAmount("");
  }

  // ============================================================
  // MODIFICATION
  // ============================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    resetMessages();

    if (!selectedUserId) {
      setError("Veuillez sélectionner un membre.");
      return;
    }

    if (!amount.trim()) {
      setError("Veuillez renseigner une valeur.");
      return;
    }

    const numericValue = Number(amount);

    if (
      !Number.isFinite(numericValue) ||
      !Number.isInteger(numericValue)
    ) {
      setError(
        "La valeur doit être un nombre entier."
      );
      return;
    }

    if (numericValue < 0) {
      setError(
        "La valeur ne peut pas être négative."
      );
      return;
    }

    if (!reason.trim()) {
      setError(
        "Une raison est obligatoire pour une modification administrative."
      );
      return;
    }

    try {
      setSubmitting(true);

      let result: UserLevel;

      switch (operation) {
        case "ADD":
          if (numericValue <= 0) {
            throw new Error(
              "La quantité d'XP à ajouter doit être supérieure à 0."
            );
          }

          result = await addUserXp(
            selectedUserId,
            {
              amount: numericValue,
              reason: reason.trim(),
            }
          );

          break;

        case "REMOVE":
          if (numericValue <= 0) {
            throw new Error(
              "La quantité d'XP à retirer doit être supérieure à 0."
            );
          }

          result = await removeUserXp(
            selectedUserId,
            {
              amount: numericValue,
              reason: reason.trim(),
            }
          );

          break;

        case "SET_XP":
          result = await setUserXp(
            selectedUserId,
            {
              xp: numericValue,
              reason: reason.trim(),
            }
          );

          break;

        case "SET_LEVEL":
          if (numericValue < 1) {
            throw new Error(
              "Le niveau doit être supérieur ou égal à 1."
            );
          }

          result = await setUserLevel(
            selectedUserId,
            {
              level: numericValue,
              reason: reason.trim(),
            }
          );

          break;

        default:
          throw new Error(
            "Opération inconnue."
          );
      }

      setUserLevelData(result);

      setSuccess(
        "Modification du niveau effectuée avec succès."
      );

      setAmount("");
      setReason("");
    } catch (err) {
      console.error(
        "Erreur modification niveau :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le niveau."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="space-y-8">
      {/* ====================================================== */}
      {/* SÉLECTION DU MEMBRE                                    */}
      {/* ====================================================== */}

      <section className="rounded-xl border border-white/10 bg-black/20 p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-white">
            Gestion du niveau d'un membre
          </h2>

          <p className="mt-1 text-sm text-white/60">
            Sélectionnez un membre pour consulter et
            modifier sa progression.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="member-search"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              Rechercher un membre
            </label>

            <input
              id="member-search"
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Pseudo, nom ou adresse e-mail..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
            />
          </div>

          <div>
            <label
              htmlFor="member-select"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              Membre
            </label>

            {loadingMembers ? (
              <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
                Chargement des membres...
              </div>
            ) : (
              <select
                id="member-select"
                value={selectedUserId}
                onChange={(event) =>
                  setSelectedUserId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              >
                <option value="">
                  Sélectionner un membre
                </option>

                {filteredMembers.map((member) => (
                  <option
                    key={member.profile.id}
                    value={member.profile.id}
                  >
                    {member.profile.displayName ||
                      member.profile.username}{" "}
                    — {member.profile.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* ERREUR / SUCCÈS                                        */}
      {/* ====================================================== */}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {/* ====================================================== */}
      {/* INFORMATIONS MEMBRE                                    */}
      {/* ====================================================== */}

      {selectedMember && (
        <section className="rounded-xl border border-white/10 bg-black/20 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">
              {selectedMember.profile.displayName ||
                selectedMember.profile.username}
            </h2>

            <p className="text-sm text-white/50">
              {selectedMember.profile.email}
            </p>
          </div>

          {loadingLevel ? (
            <div className="py-8 text-center text-white/60">
              Chargement du niveau...
            </div>
          ) : userLevel ? (
            <div className="space-y-6">
              {/* Niveau / XP */}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/50">
                    Niveau
                  </p>

                  <p className="mt-2 text-3xl font-bold text-white">
                    {userLevel.level}
                  </p>

                  <p className="mt-1 text-sm text-white/60">
                    {userLevel.levelName}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/50">
                    XP totale
                  </p>

                  <p className="mt-2 text-3xl font-bold text-white">
                    {userLevel.xp}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/50">
                    Progression
                  </p>

                  <p className="mt-2 text-3xl font-bold text-white">
                    {userLevel.progressPercent}%
                  </p>
                </div>
              </div>

              {/* Barre XP */}

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-white/60">
                    Progression vers le niveau suivant
                  </span>

                  <span className="text-white/80">
                    {userLevel.nextLevelXp !== null
                      ? `${userLevel.progressXp} / ${
                          userLevel.nextLevelXp -
                          userLevel.currentLevelXp
                        } XP`
                      : "Niveau maximum"}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          userLevel.progressPercent
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/60">
              Impossible de récupérer les informations
              de niveau.
            </p>
          )}
        </section>
      )}

      {/* ====================================================== */}
      {/* MODIFICATION                                            */}
      {/* ====================================================== */}

      {selectedMember && userLevel && (
        <section className="rounded-xl border border-white/10 bg-black/20 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">
              Modification administrative
            </h2>

            <p className="mt-1 text-sm text-white/60">
              Toutes les modifications sont enregistrées
              dans l'historique du membre.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Type d'opération */}

            <div>
              <label
                htmlFor="level-operation"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Opération
              </label>

              <select
                id="level-operation"
                value={operation}
                onChange={(event) =>
                  handleOperationChange(
                    event.target.value as Operation
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              >
                <option value="ADD">
                  Ajouter de l'XP
                </option>

                <option value="REMOVE">
                  Retirer de l'XP
                </option>

                <option value="SET_XP">
                  Définir l'XP
                </option>

                <option value="SET_LEVEL">
                  Définir le niveau
                </option>
              </select>
            </div>

            {/* Valeur */}

            <div>
              <label
                htmlFor="level-amount"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                {operation === "SET_LEVEL"
                  ? "Niveau"
                  : operation === "SET_XP"
                  ? "XP totale"
                  : "Quantité d'XP"}
              </label>

              <input
                id="level-amount"
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder={
                  operation === "SET_LEVEL"
                    ? "Ex. 5"
                    : "Ex. 250"
                }
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              />
            </div>

            {/* Raison */}

            <div>
              <label
                htmlFor="level-reason"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Motif de la modification
              </label>

              <textarea
                id="level-reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                rows={3}
                placeholder="Ex. Récompense exceptionnelle pour participation à un événement RP."
                className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              />
            </div>

            {/* Bouton */}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-white px-5 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Modification..."
                : "Appliquer la modification"}
            </button>
          </form>
        </section>
      )}

      {/* ====================================================== */}
      {/* HISTORIQUE                                              */}
      {/* ====================================================== */}

      {selectedMember &&
        userLevel &&
        userLevel.history.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-black/20 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white">
                Historique
              </h2>

              <p className="text-sm text-white/60">
                Dernières modifications enregistrées.
              </p>
            </div>

            <div className="space-y-3">
              {[...userLevel.history]
                .reverse()
                .map((entry, index) => (
                  <div
                    key={`${entry.createdAt}-${index}`}
                    className="rounded-lg border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-medium text-white">
                          {entry.action}
                        </span>

                        <span className="ml-3 text-sm text-white/50">
                          {entry.source}
                        </span>
                      </div>

                      <span className="text-xs text-white/40">
                        {new Date(
                          entry.createdAt
                        ).toLocaleString("fr-FR")}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                      <div>
                        <span className="text-white/40">
                          XP
                        </span>

                        <p className="text-white">
                          {entry.previousXp} →{" "}
                          {entry.newXp}
                        </p>
                      </div>

                      <div>
                        <span className="text-white/40">
                          Niveau
                        </span>

                        <p className="text-white">
                          {entry.previousLevel} →{" "}
                          {entry.newLevel}
                        </p>
                      </div>

                      <div>
                        <span className="text-white/40">
                          Quantité
                        </span>

                        <p className="text-white">
                          {entry.amount !== undefined
                            ? entry.amount
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {entry.reason && (
                      <p className="mt-3 border-t border-white/10 pt-3 text-sm text-white/60">
                        {entry.reason}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}
    </div>
  );
}