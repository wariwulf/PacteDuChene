"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentMember } from "@/services/members.service";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Member = {
  profile: {
    id: string;
    username: string;
    displayName?: string;
  };
};

type CombatRole = "TANK" | "HEAL" | "DPS";

type Discipline = {
  name: string;
  level: number;
};

const DISCIPLINES = [
  "Alchimie", "Archerie", "Arcs", "Armes d’hast",
  "Armure intermédiaire (bras)", "Armure intermédiaire (jambes)", "Armure intermédiaire (mains)",
  "Armure intermédiaire (pieds)", "Armure intermédiaire (tête)", "Armure intermédiaire (torse)",
  "Armure légère (bras)", "Armure légère (jambes)", "Armure légère (mains)",
  "Armure légère (pieds)", "Armure légère (tête)", "Armure légère (torse)",
  "Armure lourde (bras)", "Armure lourde (jambes)", "Armure lourde (mains)",
  "Armure lourde (pieds)", "Armure lourde (tête)", "Armure lourde (torse)",
  "Bâtons ecclésiastiques", "Bâtons sylvains", "Boucherie", "Boucliers", "Boulangerie",
  "Bûcheronnage", "Couture", "Cuisine", "Dépeçage", "Épées", "Forge", "Forge d’armes",
  "Forge d’armures", "Grandes épées", "Grandes haches", "Joaillerie", "Mains nues",
  "Masses lourdes", "Massues", "Menuiserie", "Minage", "Petites lances", "Travail du cuir",
  "Vinification et brassage",
] as const;

const DISCIPLINE_CATEGORIES: Record<string, readonly string[]> = {
  "Artisanat & professions": [
    "Alchimie", "Archerie", "Boucherie", "Boulangerie", "Bûcheronnage", "Couture", "Cuisine",
    "Dépeçage", "Forge", "Forge d’armes", "Forge d’armures", "Joaillerie", "Menuiserie", "Minage",
    "Travail du cuir", "Vinification et brassage",
  ],
  Combat: [
    "Arcs", "Armes d’hast", "Armure intermédiaire (bras)", "Armure intermédiaire (jambes)",
    "Armure intermédiaire (mains)", "Armure intermédiaire (pieds)", "Armure intermédiaire (tête)",
    "Armure intermédiaire (torse)", "Armure légère (bras)", "Armure légère (jambes)",
    "Armure légère (mains)", "Armure légère (pieds)", "Armure légère (tête)", "Armure légère (torse)",
    "Armure lourde (bras)", "Armure lourde (jambes)", "Armure lourde (mains)", "Armure lourde (pieds)",
    "Armure lourde (tête)", "Armure lourde (torse)", "Bâtons ecclésiastiques", "Bâtons sylvains",
    "Boucliers", "Épées", "Grandes épées", "Grandes haches", "Mains nues", "Masses lourdes",
    "Massues", "Petites lances",
  ],
};

type Character = {
  _id?: string;
  memberId: string;
  characterName: string;
  avatarId?: string;
  world?: string;
  province?: string;
  region?: string;
  clan?: string;
  disciplines?: Discipline[];
  mainProfession?: string;
  secondaryProfessions?: string[];
  combatRole?: CombatRole;
  specialization?: string;
  chronicleTitle?: string;
  chronicle?: string;
  isMainCharacter?: boolean;
};

type FormState = {
  characterName: string;
  avatarId: string;
  world: string;
  province: string;
  region: string;
  clan: string;
  disciplines: Discipline[];
  combatRole: "" | CombatRole;
  specialization: string;
  chronicleTitle: string;
  chronicle: string;
  isMainCharacter: boolean;
};

const emptyForm: FormState = {
  characterName: "",
  avatarId: "",
  world: "",
  province: "",
  region: "",
  clan: "",
  disciplines: [],
  combatRole: "",
  specialization: "",
  chronicleTitle: "",
  chronicle: "",
  isMainCharacter: false,
};

async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const payload = await response
    .json()
    .catch(() => ({}));

  if (
    !response.ok ||
    payload?.success === false
  ) {
    throw new Error(
      payload?.message ||
        `Erreur serveur (${response.status}).`
    );
  }

  return payload;
}

function toForm(character: Character): FormState {
  return {
    characterName: character.characterName ?? "",
    avatarId: character.avatarId ?? "",
    world: character.world ?? "",
    province: character.province ?? "",
    region: character.region ?? "",
    clan: character.clan ?? "",
    disciplines: Array.isArray(character.disciplines) ? character.disciplines : [],
    combatRole: character.combatRole ?? "",
    specialization: character.specialization ?? "",
    chronicleTitle: character.chronicleTitle ?? "",
    chronicle: character.chronicle ?? "",
    isMainCharacter: Boolean(
      character.isMainCharacter
    ),
  };
}

function roleLabel(role?: CombatRole | "") {
  if (role === "TANK") return "Tank";
  if (role === "HEAL") return "Heal";
  if (role === "DPS") return "DPS";
  return "Non renseigné";
}

function roleIcon(role?: CombatRole | "") {
  if (role === "TANK") return "🛡️";
  if (role === "HEAL") return "✚";
  return "⚔️";
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-green-400">
        {label}
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-white outline-none placeholder:text-green-700 focus:border-amber-500"
      />
    </label>
  );
}

export default function PaxDeiPage() {
  const [member, setMember] =
    useState<Member | null>(null);
  const [characters, setCharacters] =
    useState<Character[]>([]);
  const [form, setForm] =
    useState<FormState>(emptyForm);
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [message, setMessage] =
    useState("");
  const [selectedDiscipline, setSelectedDiscipline] =
    useState<Discipline["name"] | "">("");
  const [selectedDisciplineLevel, setSelectedDisciplineLevel] =
    useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const current =
        (await getCurrentMember()) as Member | null;

      if (!current?.profile?.id) {
        throw new Error(
          "Impossible d'identifier le membre connecté."
        );
      }

      setMember(current);

      const payload = await api<any>(
        `/paxdei/characters/member/${encodeURIComponent(
          current.profile.id
        )}`
      );

      setCharacters(
        Array.isArray(payload?.data)
          ? payload.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger vos personnages."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, disciplines: [] });
    setSelectedDiscipline("");
    setSelectedDisciplineLevel(0);
    setMessage("");
    setError("");
  }

  function startEdit(character: Character) {
    setEditingId(character._id ?? null);
    setForm(toForm(character));
    setSelectedDiscipline("");
    setSelectedDisciplineLevel(0);
    setMessage("");
    setError("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateForm<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!member?.profile?.id) {
      setError(
        "Impossible d'identifier le membre connecté."
      );
      return;
    }

    if (!form.characterName.trim()) {
      setError(
        "Le nom du personnage est obligatoire."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const body = {
        ...(editingId
          ? {}
          : { memberId: member.profile.id }),
        characterName: form.characterName.trim(),
        avatarId: form.avatarId.trim(),
        world: form.world.trim(),
        province: form.province.trim(),
        region: form.region.trim(),
        clan: form.clan.trim(),
        disciplines: form.disciplines,
        combatRole:
          form.combatRole || undefined,
        specialization:
          form.specialization.trim(),
        chronicleTitle:
          form.chronicleTitle.trim(),
        chronicle: form.chronicle.trim(),
        isMainCharacter:
          form.isMainCharacter,
      };

      if (editingId) {
        await api(
          `/paxdei/characters/${encodeURIComponent(
            editingId
          )}`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          }
        );

        setMessage(
          "Personnage mis à jour avec succès."
        );
      } else {
        await api("/paxdei/characters", {
          method: "POST",
          body: JSON.stringify(body),
        });

        setMessage(
          "Personnage enregistré avec succès."
        );
      }

      await load();

      // On conserve le formulaire en mode édition après sauvegarde :
      // cela permet de vérifier immédiatement les disciplines enregistrées.
      if (editingId) {
        const refreshed = await api<any>(
          `/paxdei/characters/${encodeURIComponent(editingId)}`
        );
        const refreshedCharacter = refreshed?.data as Character | undefined;
        if (refreshedCharacter) {
          setForm(toForm(refreshedCharacter));
        }
      }

      setSelectedDiscipline("");
      setSelectedDisciplineLevel(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le personnage."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    character: Character
  ) {
    if (!character._id) return;

    const confirmed = window.confirm(
      `Supprimer le personnage « ${character.characterName} » ?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api(
        `/paxdei/characters/${encodeURIComponent(
          character._id
        )}`,
        {
          method: "DELETE",
        }
      );

      if (editingId === character._id) {
        startCreate();
      }

      setMessage(
        "Personnage supprimé avec succès."
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le personnage."
      );
    }
  }

  if (loading && !member) {
    return (
      <main className="min-h-screen bg-[#173d2b] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          Chargement de vos personnages...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#173d2b] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Le Pacte du Chêne
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Mes personnages Pax Dei
            </h1>

            <p className="mt-3 max-w-2xl text-green-300">
              Les données Pax Dei sont désormais renseignées
              manuellement par chaque membre. Le site ne dépend
              d'aucune API externe du jeu.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/espace-membre/personnage"
              className="rounded-lg border border-green-700 bg-green-950 px-5 py-3 text-sm font-semibold text-green-200 hover:border-amber-500 hover:text-amber-300"
            >
              ← Mon registre
            </Link>

            <button
              type="button"
              onClick={startCreate}
              className="rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold hover:bg-amber-500"
            >
              + Ajouter un personnage
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-700 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-green-700 bg-green-950/60 p-4 text-green-200">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              {editingId
                ? "Modifier le personnage"
                : "Nouveau personnage"}
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Fiche Pax Dei
            </h2>

            <p className="mt-2 text-sm text-green-300">
              Renseignez uniquement les informations que vous
              souhaitez afficher sur votre registre.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nom du personnage"
                value={form.characterName}
                onChange={(value) =>
                  updateForm(
                    "characterName",
                    value
                  )
                }
                placeholder="Ex. Wariwulf Fra"
              />

              <Input
                label="Monde"
                value={form.world}
                onChange={(value) =>
                  updateForm("world", value)
                }
                placeholder="Ex. Fenrir"
              />

              <Input
                label="Province"
                value={form.province}
                onChange={(value) =>
                  updateForm(
                    "province",
                    value
                  )
                }
              />

              <Input
                label="Région"
                value={form.region}
                onChange={(value) =>
                  updateForm("region", value)
                }
              />

              <Input
                label="Clan"
                value={form.clan}
                onChange={(value) =>
                  updateForm("clan", value)
                }
              />

              <Input
                label="Spécialisation"
                value={form.specialization}
                onChange={(value) =>
                  updateForm(
                    "specialization",
                    value
                  )
                }
                placeholder="Ex. Archer, mêlée..."
              />
            </div>

            <section className="rounded-xl border border-green-800 bg-green-950/40 p-5">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                  Disciplines Pax Dei
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">
                  Vos disciplines et leurs niveaux
                </h3>
                <p className="mt-1 text-sm text-green-300">
                  Sélectionnez une discipline dans la liste puis indiquez son niveau. Vous pouvez en renseigner autant que nécessaire. Niveau maximum : 40.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                <select
                  value={selectedDiscipline}
                  onChange={(event) =>
                    setSelectedDiscipline(
                      event.target.value as Discipline["name"] | ""
                    )
                  }
                  className="rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                >
                  <option value="">Choisir une discipline</option>
                  {Object.entries(DISCIPLINE_CATEGORIES).map(([category, names]) => (
                    <optgroup key={category} label={category}>
                      {names.map((name) => (
                        <option
                          key={name}
                          value={name}
                          disabled={form.disciplines.some((d) => d.name === name)}
                        >
                          {name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <input
                  type="number"
                  min={0}
                  max={40}
                  step={1}
                  value={selectedDisciplineLevel}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setSelectedDisciplineLevel(
                      Number.isFinite(value) ? Math.max(0, Math.min(40, Math.trunc(value))) : 0
                    );
                  }}
                  className="rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                  aria-label="Niveau de la discipline (maximum 40)"
                />

                <button
                  type="button"
                  onClick={() => {
                    setError("");

                    if (!selectedDiscipline) {
                      setError("Choisissez une discipline avant de l'ajouter.");
                      return;
                    }

                    if (form.disciplines.some((d) => d.name === selectedDiscipline)) {
                      setError("Cette discipline est déjà ajoutée.");
                      return;
                    }

                    updateForm("disciplines", [
                      ...form.disciplines,
                      { name: selectedDiscipline, level: selectedDisciplineLevel },
                    ]);
                    setSelectedDiscipline("");
                    setSelectedDisciplineLevel(0);
                  }}
                  className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white hover:bg-amber-500"
                >
                  + Ajouter
                </button>
              </div>

              {form.disciplines.length > 0 ? (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                    Disciplines enregistrées dans cette fiche
                  </p>

                  {form.disciplines.map((discipline) => (
                    <div
                      key={discipline.name}
                      className="rounded-xl border border-green-800 bg-green-900/50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-white">
                              {discipline.name}
                            </p>
                            <span className="text-sm font-bold text-amber-400">
                              Niveau {discipline.level}
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-950">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{ width: `${(discipline.level / 40) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={40}
                            step={1}
                            value={discipline.level}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (!Number.isInteger(value) || value < 0 || value > 40) return;
                              updateForm(
                                "disciplines",
                                form.disciplines.map((item) =>
                                  item.name === discipline.name
                                    ? { ...item, level: value }
                                    : item
                                )
                              );
                            }}
                            className="w-24 rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-center text-white outline-none focus:border-amber-500"
                            aria-label={`Niveau de ${discipline.name}`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateForm(
                                "disciplines",
                                form.disciplines.filter(
                                  (item) => item.name !== discipline.name
                                )
                              )
                            }
                            className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm font-semibold text-red-300 hover:border-red-600"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-green-800 bg-green-950/40 p-5 text-center text-sm text-green-400">
                  Aucune discipline ajoutée pour le moment.
                </div>
              )}
            </section>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                Rôle de combat
              </p>

              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {(["TANK", "HEAL", "DPS"] as const).map(
                  (role) => {
                    const selected =
                      form.combatRole === role;

                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() =>
                          updateForm(
                            "combatRole",
                            selected ? "" : role
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-amber-500 bg-amber-950/30"
                            : "border-green-800 bg-green-950/40 hover:border-green-600"
                        }`}
                      >
                        <div className="text-2xl">
                          {roleIcon(role)}
                        </div>

                        <p className="mt-2 font-semibold">
                          {roleLabel(role)}
                        </p>

                        <p className="mt-1 text-xs text-green-300">
                          {role === "TANK" &&
                            "Encaisse et protège le groupe."}
                          {role === "HEAL" &&
                            "Soutient et soigne le groupe."}
                          {role === "DPS" &&
                            "Se concentre sur les dégâts."}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-green-800 bg-green-950/40 p-4">
              <input
                type="checkbox"
                checked={form.isMainCharacter}
                onChange={(event) =>
                  updateForm(
                    "isMainCharacter",
                    event.target.checked
                  )
                }
                className="h-4 w-4 accent-amber-500"
              />

              <span>
                <span className="block font-semibold">
                  Définir comme personnage principal
                </span>
                <span className="mt-1 block text-xs text-green-400">
                  Un seul personnage peut être principal. Si vous
                  choisissez celui-ci, l'ancien personnage principal
                  sera automatiquement remplacé.
                </span>
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Titre de la chronique"
                value={form.chronicleTitle}
                onChange={(value) =>
                  updateForm(
                    "chronicleTitle",
                    value
                  )
                }
                placeholder="Les mémoires de..."
              />

              <Input
                label="Identifiant de portrait"
                value={form.avatarId}
                onChange={(value) =>
                  updateForm("avatarId", value)
                }
                placeholder="Optionnel"
              />
            </div>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                Chronique du personnage
              </span>

              <textarea
                value={form.chronicle}
                onChange={(event) =>
                  updateForm(
                    "chronicle",
                    event.target.value
                  )
                }
                rows={8}
                maxLength={5000}
                placeholder="Racontez en quelques lignes l'histoire de votre personnage..."
                className="mt-2 w-full resize-y rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-white outline-none placeholder:text-green-700 focus:border-amber-500"
              />

              <p className="mt-1 text-right text-xs text-green-500">
                {form.chronicle.length}/5000
              </p>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : editingId
                    ? "Enregistrer les modifications"
                    : "Créer le personnage"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="rounded-lg border border-green-700 bg-green-950 px-6 py-3 font-semibold text-green-200 hover:border-amber-500"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                Registre
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Mes personnages
              </h2>
            </div>

            <span className="rounded-full bg-green-900 px-4 py-2 text-sm font-semibold text-green-200">
              {characters.length} personnage
              {characters.length > 1 ? "s" : ""}
            </span>
          </div>

          {characters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-green-800 bg-green-900/30 p-10 text-center">
              <div className="text-4xl">⚔️</div>
              <h3 className="mt-3 text-xl font-bold">
                Aucun personnage enregistré
              </h3>
              <p className="mt-2 text-green-300">
                Commencez par renseigner votre personnage principal.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {characters.map((character) => (
                <article
                  key={
                    character._id ??
                    character.characterName
                  }
                  className={`rounded-2xl border bg-green-900/50 p-6 shadow-xl ${
                    character.isMainCharacter
                      ? "border-amber-500/70"
                      : "border-green-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                        {character.isMainCharacter
                          ? "Personnage principal"
                          : "Personnage Pax Dei"}
                      </p>

                      <h3 className="mt-1 text-2xl font-bold">
                        {character.characterName}
                      </h3>

                      <p className="mt-1 text-sm text-green-300">
                        {roleIcon(
                          character.combatRole
                        )}{" "}
                        {roleLabel(
                          character.combatRole
                        )}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-500/50 bg-green-950 text-xl">
                      {roleIcon(
                        character.combatRole
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Info
                      label="Monde"
                      value={character.world}
                    />
                    <Info
                      label="Clan"
                      value={character.clan}
                    />
                    <Info
                      label="Province"
                      value={character.province}
                    />
                    <Info
                      label="Région"
                      value={character.region}
                    />
                    <Info
                      label="Disciplines"
                      value={character.disciplines?.length ? `${character.disciplines.length} discipline${character.disciplines.length > 1 ? "s" : ""}` : "Aucune"}
                    />
                    <Info
                      label="Spécialisation"
                      value={character.specialization}
                    />
                  </div>

                  {character.disciplines?.length ? (
                    <div className="mt-5 rounded-xl border border-green-800 bg-green-950/50 p-4">
                      <p className="text-xs uppercase tracking-wider text-green-400">Disciplines</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {character.disciplines.map((discipline) => (
                          <div key={discipline.name} className="rounded-lg bg-green-900/60 p-3">
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="text-green-100">{discipline.name}</span>
                              <span className="font-bold text-amber-400">{discipline.level}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-green-950">
                              <div className="h-full rounded-full bg-amber-500" style={{ width: `${(discipline.level / 40) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {character.disciplines?.length ? (
                    <div className="mt-4 rounded-xl border border-green-800 bg-green-950/50 p-4">
                      <p className="text-xs uppercase tracking-wider text-green-400">
                        Disciplines
                      </p>
                      <div className="mt-3 space-y-2">
                        {character.disciplines.map((discipline) => (
                          <div key={discipline.name}>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-green-100">{discipline.name}</span>
                              <span className="font-bold text-amber-400">{discipline.level}</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-green-950">
                              <div className="h-full rounded-full bg-amber-500" style={{ width: `${(discipline.level / 40) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {character.chronicle && (
                    <div className="mt-4 rounded-xl border border-green-800 bg-green-950/50 p-4">
                      <p className="text-xs uppercase tracking-wider text-green-400">
                        Chronique
                      </p>

                      <p className="mt-1 line-clamp-3 text-sm leading-6 text-green-100">
                        {character.chronicle}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(character)
                      }
                      className="rounded-lg border border-green-700 bg-green-950 px-4 py-2 text-sm font-semibold text-amber-400 hover:border-amber-500"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(character)
                      }
                      className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-300 hover:border-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
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
      <p className="text-xs uppercase tracking-wider text-green-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-green-100">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}
