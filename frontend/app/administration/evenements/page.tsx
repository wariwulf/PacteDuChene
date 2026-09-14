"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addAdminClanEventParticipant,
  clanEventMediaUrl,
  createClanEvent,
  deleteClanEvent,
  EventObjective,
  EventReward,
  getAdminClanEventMembers,
  getAdminClanEventParticipants,
  getAdminClanEvents,
  removeAdminClanEventParticipant,
  setAdminClanEventObjectiveValidation,
  updateClanEvent,
  uploadClanEventImage,
  type AdminEventMember,
  type AdminEventParticipant,
  type ClanEvent,
  type ClanEventMode,
  type ClanEventStatus,
  type ClanEventType,
  type CurrencyId,
  type ParticipationOptions,
  type ObjectiveValidationStatus,
  type Recurrence,
} from "@/services/clan-events.service";

const types: ClanEventType[] = [
  "COLLECTE",
  "COMBAT",
  "CEREMONIE",
  "REUNION",
  "SORTIE",
  "AUTRE",
];

const labels: Record<string, string> = {
  COLLECTE: "Collecte",
  COMBAT: "Combat",
  CEREMONIE: "Cérémonie",
  REUNION: "Réunion",
  SORTIE: "Sortie",
  AUTRE: "Autre",
};

const emptyOptions: ParticipationOptions = {
  accepted: true,
  declined: true,
  maybe: true,
  attempts: false,
};

const emptyRec: Recurrence = {
  enabled: false,
  frequency: "WEEKLY",
  interval: 1,
  weekdays: [1],
};

function local(value?: string) {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  const off = d.getTimezoneOffset();

  return new Date(
    d.getTime() - off * 60000
  ).toISOString().slice(0, 16);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

const defaultForm = () => ({
  title: "",
  description: "",
  type: "AUTRE" as ClanEventType,
  mode: "INSTANT" as ClanEventMode,
  startsAt: "",
  durationMinutes: "120",
  location: "",
  discordChannel: "",
  imageUrl: "",
  reminderMinutes: "60",
  objectives: [] as EventObjective[],
  rewards: [] as EventReward[],
  participationOptions: { ...emptyOptions },
  recurrence: { ...emptyRec },
});


const objectiveLabels: Record<
  ObjectiveValidationStatus,
  string
> = {
  PENDING: "En attente",
  VALIDATED: "Validé",
  REJECTED: "Rejeté",
};

function memberName(member?: AdminEventParticipant["member"]) {
  if (!member) return "Membre inconnu";

  return (
    member.displayName ||
    member.characterName ||
    member.username ||
    member.discordUsername ||
    "Membre"
  );
}

function memberNameFromAdminMember(member: AdminEventMember) {
  return (
    member.profile?.displayName ||
    member.paxDei?.characterName ||
    member.profile?.username ||
    member.discord?.username ||
    String(member._id)
  );
}

export default function AdministrationEvenementsPage() {
  const [events, setEvents] = useState<ClanEvent[]>([]);
  const [form, setForm] = useState(defaultForm());

  const [editing, setEditing] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [selectedEventId, setSelectedEventId] =
    useState<string | null>(null);

  const [participants, setParticipants] =
    useState<AdminEventParticipant[]>([]);

  const [members, setMembers] =
    useState<AdminEventMember[]>([]);

  const [participantsLoading, setParticipantsLoading] =
    useState(false);

  const [membersLoading, setMembersLoading] =
    useState(false);

  const [participantError, setParticipantError] =
    useState("");

  const [addingMemberId, setAddingMemberId] =
    useState("");

  const [participantAction, setParticipantAction] =
    useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      setEvents(await getAdminClanEvents());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de charger les événements."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function reset() {
    setEditing(null);
    setForm(defaultForm());
    setImage(null);
  }

  function edit(event: ClanEvent) {
    setEditing(event.eventId);

    setForm({
      title: event.title,
      description: event.description ?? "",
      type: event.type,
      mode: event.mode ?? "INSTANT",
      startsAt: local(event.startsAt),
      durationMinutes: String(
        event.durationMinutes ?? 120
      ),
      location: event.location ?? "",
      discordChannel:
        event.discordChannel ??
        event.discordChannelId ??
        "",
      imageUrl: event.imageUrl ?? "",
      reminderMinutes: String(
        event.reminderMinutes ?? 60
      ),
      objectives: event.objectives ?? [],
      rewards: event.rewards ?? [],
      participationOptions:
        event.participationOptions ??
        { ...emptyOptions },
      recurrence:
        event.recurrence ??
        { ...emptyRec },
    });

    setImage(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function addObjective(required = true) {
    setForm((current) => ({
      ...current,
      objectives: [
        ...current.objectives,
        {
          objectiveId: uid("obj"),
          title: "",
          description: "",
          required,
        },
      ],
    }));
  }

  function addReward() {
    setForm((current) => ({
      ...current,
      rewards: [
        ...current.rewards,
        {
          rewardId: uid("reward"),
          objectiveId:
            current.objectives[0]?.objectiveId,
          currencyId: "bronze",
          amount: 100,
          label: "",
        },
      ],
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.title.trim() || !form.startsAt) {
        throw new Error(
          "Le titre et la date de début sont obligatoires."
        );
      }

      const objectives = form.objectives
        .filter((objective) =>
          objective.title.trim()
        )
        .map((objective) => ({
          ...objective,
          title: objective.title.trim(),
        }));

      const rewards = form.rewards
        .filter((reward) => Number(reward.amount) > 0)
        .map((reward) => {
          if (!reward.objectiveId) {
            throw new Error(
              "Chaque récompense doit être liée à un objectif."
            );
          }

          if (
            !objectives.some(
              (objective) =>
                objective.objectiveId ===
                reward.objectiveId
            )
          ) {
            throw new Error(
              "Une récompense est liée à un objectif qui n'existe plus."
            );
          }

          return reward;
        });

      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        mode: form.mode,
        startsAt: new Date(
          form.startsAt
        ).toISOString(),
        durationMinutes:
          Number(form.durationMinutes) || 120,
        location: form.location.trim(),
        discordChannel:
          form.discordChannel.trim(),
        imageUrl: form.imageUrl.trim(),
        reminderMinutes:
          Number(form.reminderMinutes) || 0,
        objectives,
        rewards,
        participationOptions:
          form.participationOptions,
        recurrence: form.recurrence,
      };

      let saved: ClanEvent;

      if (editing) {
        saved = await updateClanEvent(
          editing,
          data
        );

        setMessage(
          "Événement modifié. Le message Discord sera synchronisé par le bot."
        );
      } else {
        saved = await createClanEvent({
          ...data,
          status: "PUBLISHED",
        });

        setMessage(
          "Événement créé. Le bot va publier le rendez-vous sur Discord."
        );
      }

      if (image) {
        saved = await uploadClanEventImage(
          saved.eventId,
          image
        );
      }

      reset();
      await load();

      if (selectedEventId === saved.eventId) {
        await loadParticipantData(saved.eventId);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible d'enregistrer l'événement."
      );
    } finally {
      setSaving(false);
    }
  }

  async function status(
    id: string,
    nextStatus: ClanEventStatus
  ) {
    try {
      setError("");

      await updateClanEvent(id, {
        status: nextStatus,
      });

      await load();

      if (
        selectedEventId === id &&
        nextStatus === "ARCHIVED"
      ) {
        closeParticipantManager();
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de modifier le statut."
      );
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Supprimer définitivement cet événement ?"
      )
    ) {
      return;
    }

    try {
      setError("");

      await deleteClanEvent(id);

      if (selectedEventId === id) {
        closeParticipantManager();
      }

      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de supprimer l'événement."
      );
    }
  }

  async function loadParticipantData(
    eventId: string
  ) {
    try {
      setParticipantsLoading(true);
      setParticipantError("");

      const data =
        await getAdminClanEventParticipants(
          eventId
        );

      setParticipants(data);

      setMembersLoading(true);

      const available =
        await getAdminClanEventMembers(
          eventId
        );

      setMembers(available);
    } catch (e) {
      setParticipantError(
        e instanceof Error
          ? e.message
          : "Impossible de charger les participants."
      );
    } finally {
      setParticipantsLoading(false);
      setMembersLoading(false);
    }
  }

  async function openParticipantManager(
    eventId: string
  ) {
    setSelectedEventId(eventId);
    setAddingMemberId("");
    await loadParticipantData(eventId);
  }

  function closeParticipantManager() {
    setSelectedEventId(null);
    setParticipants([]);
    setMembers([]);
    setParticipantError("");
  }

  async function refreshParticipantData() {
    if (!selectedEventId) return;
    await loadParticipantData(selectedEventId);
  }

  async function addParticipant() {
    if (!selectedEventId || !addingMemberId) {
      return;
    }

    try {
      setParticipantAction(
        `add:${addingMemberId}`
      );
      setParticipantError("");

      await addAdminClanEventParticipant(
        selectedEventId,
        addingMemberId
      );

      setAddingMemberId("");
      await refreshParticipantData();

      setMessage("Participant ajouté.");
    } catch (e) {
      setParticipantError(
        e instanceof Error
          ? e.message
          : "Impossible d'ajouter le participant."
      );
    } finally {
      setParticipantAction("");
    }
  }

  async function removeParticipant(
    participant: AdminEventParticipant
  ) {
    if (!selectedEventId) return;

    const name = memberName(
      participant.member
    );

    if (
      !confirm(
        `Retirer ${name} de cet événement ?`
      )
    ) {
      return;
    }

    try {
      setParticipantAction(
        `remove:${participant.memberId}`
      );
      setParticipantError("");

      await removeAdminClanEventParticipant(
        selectedEventId,
        participant.memberId
      );

      await refreshParticipantData();

      setMessage("Participant retiré.");
    } catch (e) {
      setParticipantError(
        e instanceof Error
          ? e.message
          : "Impossible de retirer le participant."
      );
    } finally {
      setParticipantAction("");
    }
  }

  async function changeEventObjective(
    objectiveId: string,
    status: "PENDING" | "VALIDATED" | "REJECTED",
  ) {
    if (!selectedEventId) return;

    try {
      setParticipantAction(`event-objective:${objectiveId}`);
      setParticipantError("");

      const updated = await setAdminClanEventObjectiveValidation(
        selectedEventId,
        objectiveId,
        status,
      );

      setEvents((current) =>
        current.map((event) =>
          event.eventId === updated.eventId
            ? updated
            : event,
        ),
      );

      await refreshParticipantData();
    } catch (e) {
      setParticipantError(
        e instanceof Error
          ? e.message
          : "Impossible de modifier la validation de l'objectif.",
      );
    } finally {
      setParticipantAction("");
    }
  }

  const selectedEvent = useMemo(
    () =>
      events.find(
        (event) =>
          event.eventId === selectedEventId
      ) ?? null,
    [events, selectedEventId]
  );

  const currentEvent = selectedEvent;

  const field =
    "w-full rounded-lg border border-green-800 bg-[#06170e] px-4 py-3 text-white outline-none placeholder:text-green-700 focus:border-amber-500";

  return (
    <main className="min-h-screen bg-[#04100a] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.3em] text-amber-400">
            Administration
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Événements du Pacte
          </h1>

          <p className="mt-2 text-green-300">
            Créez les rendez-vous, missions et
            expéditions qui seront publiés sur
            Discord et dans l'espace membre.
          </p>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-800 bg-red-950/60 p-4 text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-green-700 bg-green-950/60 p-4 text-green-200">
            {message}
          </div>
        )}

        <form
          onSubmit={submit}
          className="mb-10 rounded-2xl border border-green-800 bg-[#092317]/95 p-5 shadow-2xl md:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">
                {editing
                  ? "Modifier un événement"
                  : "Nouvel événement"}
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {editing
                  ? form.title ||
                    "Événement en cours"
                  : "Créer un rendez-vous"}
              </h2>
            </div>

            {editing && (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-green-700 px-4 py-2 text-sm"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Titre *
              </span>

              <input
                className={field}
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                placeholder="Conquête du Funébois"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Nature
              </span>

              <select
                className={field}
                value={form.mode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mode: e.target
                      .value as ClanEventMode,
                  })
                }
              >
                <option value="INSTANT">
                  Action instantanée / événement court
                </option>
                <option value="LONG">
                  Mission longue / événement étendu
                </option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Catégorie
              </span>

              <select
                className={field}
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target
                      .value as ClanEventType,
                  })
                }
              >
                {types.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {labels[type]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Début *
              </span>

              <input
                type="datetime-local"
                className={field}
                value={form.startsAt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startsAt: e.target.value,
                  })
                }
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Durée (minutes)
              </span>

              <input
                type="number"
                min="1"
                className={field}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationMinutes:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Lieu
              </span>

              <input
                className={field}
                value={form.location}
                onChange={(e) =>
                  setForm({
                    ...form,
                    location: e.target.value,
                  })
                }
                placeholder="Lyoness — Grand Chêne"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Salon Discord (ID ou nom)
              </span>

              <input
                className={field}
                value={form.discordChannel}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discordChannel:
                      e.target.value,
                  })
                }
                placeholder="123456789012345678"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Image
              </span>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={field}
                onChange={(e) =>
                  setImage(
                    e.target.files?.[0] ??
                      null
                  )
                }
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold">
                Ou URL de l'image
              </span>

              <input
                className={field}
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    imageUrl: e.target.value,
                  })
                }
                placeholder="https://…"
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold">
                Description
              </span>

              <textarea
                rows={6}
                className={field}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
                placeholder="Contexte, consignes, déroulement…"
              />
            </label>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-green-800 bg-[#061a10] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-amber-300">
                    Objectifs principaux
                  </h3>

                  <p className="text-sm text-green-400">
                    Les objectifs obligatoires
                    de l'événement.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    addObjective(true)
                  }
                  className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold"
                >
                  + Ajouter
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {form.objectives
                  .filter(
                    (objective) =>
                      objective.required
                  )
                  .map((objective, index) => (
                    <div
                      key={
                        objective.objectiveId
                      }
                      className="rounded-lg border border-green-800 bg-green-950/70 p-3"
                    >
                      <input
                        className={field}
                        value={
                          objective.title
                        }
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            objectives:
                              current.objectives.map(
                                (item) =>
                                  item.objectiveId ===
                                  objective.objectiveId
                                    ? {
                                        ...item,
                                        title:
                                          e.target
                                            .value,
                                      }
                                    : item
                              ),
                          }))
                        }
                        placeholder={`Objectif ${
                          index + 1
                        }`}
                      />

                      <textarea
                        className={`${field} mt-2`}
                        rows={2}
                        value={
                          objective.description ??
                          ""
                        }
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            objectives:
                              current.objectives.map(
                                (item) =>
                                  item.objectiveId ===
                                  objective.objectiveId
                                    ? {
                                        ...item,
                                        description:
                                          e.target
                                            .value,
                                      }
                                    : item
                              ),
                          }))
                        }
                        placeholder="Détail facultatif"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            objectives:
                              current.objectives.filter(
                                (item) =>
                                  item.objectiveId !==
                                  objective.objectiveId
                              ),
                          }))
                        }
                        className="mt-2 text-xs text-red-300"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
              </div>
            </section>

            <section className="rounded-xl border border-green-800 bg-[#061a10] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-amber-300">
                    Objectifs secondaires
                  </h3>

                  <p className="text-sm text-green-400">
                    Facultatifs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    addObjective(false)
                  }
                  className="rounded-lg border border-amber-700 px-3 py-2 text-sm"
                >
                  + Ajouter
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {form.objectives
                  .filter(
                    (objective) =>
                      !objective.required
                  )
                  .map((objective) => (
                    <div
                      key={
                        objective.objectiveId
                      }
                      className="rounded-lg border border-green-800 bg-green-950/70 p-3"
                    >
                      <input
                        className={field}
                        value={
                          objective.title
                        }
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            objectives:
                              current.objectives.map(
                                (item) =>
                                  item.objectiveId ===
                                  objective.objectiveId
                                    ? {
                                        ...item,
                                        title:
                                          e.target
                                            .value,
                                      }
                                    : item
                              ),
                          }))
                        }
                        placeholder="Objectif secondaire"
                      />

                      <textarea
                        className={`${field} mt-2`}
                        rows={2}
                        value={
                          objective.description ??
                          ""
                        }
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            objectives:
                              current.objectives.map(
                                (item) =>
                                  item.objectiveId ===
                                  objective.objectiveId
                                    ? {
                                        ...item,
                                        description:
                                          e.target
                                            .value,
                                      }
                                    : item
                              ),
                          }))
                        }
                        placeholder="Détail facultatif"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            objectives:
                              current.objectives.filter(
                                (item) =>
                                  item.objectiveId !==
                                  objective.objectiveId
                              ),
                          }))
                        }
                        className="mt-2 text-xs text-red-300"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-green-800 bg-[#061a10] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-amber-300">
                  Récompenses
                </h3>

                <p className="text-sm text-green-400">
                  Chaque récompense doit être liée
                  à un objectif validé et ne pourra
                  être attribuée qu'à un participant
                  marqué présent.
                </p>
              </div>

              <button
                type="button"
                onClick={addReward}
                disabled={
                  form.objectives.length === 0
                }
                className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Ajouter
              </button>
            </div>

            {form.objectives.length === 0 && (
              <p className="mt-4 rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
                Ajoutez d'abord au moins un
                objectif pour pouvoir créer une
                récompense.
              </p>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {form.rewards.map((reward) => (
                <div
                  key={reward.rewardId}
                  className="rounded-lg border border-green-800 bg-green-950/70 p-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className={field}
                      value={reward.currencyId}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          rewards:
                            current.rewards.map(
                              (item) =>
                                item.rewardId ===
                                reward.rewardId
                                  ? {
                                      ...item,
                                      currencyId:
                                        e.target
                                          .value as CurrencyId,
                                    }
                                  : item
                            ),
                        }))
                      }
                    >
                      <option value="bronze">
                        Bronze
                      </option>
                      <option value="argent">
                        Argent
                      </option>
                      <option value="solidus">
                        Solidus
                      </option>
                      <option value="xp">
                        XP
                      </option>
                    </select>

                    <input
                      type="number"
                      min="1"
                      className={field}
                      value={reward.amount}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          rewards:
                            current.rewards.map(
                              (item) =>
                                item.rewardId ===
                                reward.rewardId
                                  ? {
                                      ...item,
                                      amount:
                                        Number(
                                          e.target
                                            .value
                                        ),
                                    }
                                  : item
                            ),
                        }))
                      }
                    />
                  </div>

                  <select
                    className={`${field} mt-2`}
                    value={
                      reward.objectiveId ??
                      ""
                    }
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        rewards:
                          current.rewards.map(
                            (item) =>
                              item.rewardId ===
                              reward.rewardId
                                ? {
                                    ...item,
                                    objectiveId:
                                      e.target
                                        .value ||
                                      undefined,
                                  }
                                : item
                          ),
                      }))
                    }
                  >
                    <option value="">
                      Objectif déclencheur…
                    </option>

                    {form.objectives
                      .filter(
                        (objective) =>
                          objective.title.trim()
                      )
                      .map((objective) => (
                        <option
                          key={
                            objective.objectiveId
                          }
                          value={
                            objective.objectiveId
                          }
                        >
                          {objective.title}
                        </option>
                      ))}
                  </select>

                  <input
                    className={`${field} mt-2`}
                    value={reward.label ?? ""}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        rewards:
                          current.rewards.map(
                            (item) =>
                              item.rewardId ===
                              reward.rewardId
                                ? {
                                    ...item,
                                    label:
                                      e.target
                                        .value,
                                  }
                                : item
                          ),
                      }))
                    }
                    placeholder="Ex : Prime de conquête"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        rewards:
                          current.rewards.filter(
                            (item) =>
                              item.rewardId !==
                              reward.rewardId
                          ),
                      }))
                    }
                    className="mt-2 text-xs text-red-300"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-green-800 bg-[#061a10] p-5">
              <h3 className="font-bold text-amber-300">
                Réponses Discord
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    [
                      "accepted",
                      "Je participe",
                    ],
                    [
                      "maybe",
                      "Peut-être",
                    ],
                    [
                      "declined",
                      "Je ne participe pas",
                    ],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-lg bg-green-950/70 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={
                        form
                          .participationOptions[
                          key
                        ]
                      }
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          participationOptions:
                            {
                              ...current.participationOptions,
                              [key]:
                                e.target.checked,
                            },
                        }))
                      }
                    />

                    {label}
                  </label>
                ))}
              </div>

              <label className="mt-3 flex items-center gap-3 rounded-lg bg-green-950/70 p-3">
                <input
                  type="checkbox"
                  checked={
                    form.participationOptions
                      .attempts
                  }
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      participationOptions:
                        {
                          ...current.participationOptions,
                          attempts:
                            e.target.checked,
                        },
                    }))
                  }
                />

                Activer le suivi des tentatives
              </label>
            </section>

            <section className="rounded-xl border border-green-800 bg-[#061a10] p-5">
              <h3 className="font-bold text-amber-300">
                Rappel
              </h3>

              <p className="mt-1 text-sm text-green-400">
                Le bot publiera un rappel dans le
                même salon.
              </p>

              <label className="mt-3 block">
                <span className="mb-2 block text-sm">
                  Minutes avant le début (0 = aucun)
                </span>

                <input
                  type="number"
                  min="0"
                  className={field}
                  value={form.reminderMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reminderMinutes:
                        e.target.value,
                    })
                  }
                />
              </label>
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-green-800 bg-[#061a10] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-amber-300">
                  Récurrence
                </h3>

                <p className="text-sm text-green-400">
                  Chaque occurrence sera publiée,
                  suivie et archivée séparément.
                </p>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    form.recurrence.enabled
                  }
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      recurrence: {
                        ...current.recurrence,
                        enabled:
                          e.target.checked,
                      },
                    }))
                  }
                />

                Répéter cet événement
              </label>
            </div>

            {form.recurrence.enabled && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <select
                  className={field}
                  value={
                    form.recurrence.frequency
                  }
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      recurrence: {
                        ...current.recurrence,
                        frequency:
                          e.target
                            .value as any,
                      },
                    }))
                  }
                >
                  <option value="DAILY">
                    Tous les jours
                  </option>
                  <option value="WEEKLY">
                    Toutes les semaines
                  </option>
                  <option value="MONTHLY">
                    Tous les mois
                  </option>
                </select>

                <input
                  type="number"
                  min="1"
                  className={field}
                  value={
                    form.recurrence.interval ??
                    1
                  }
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      recurrence: {
                        ...current.recurrence,
                        interval:
                          Number(
                            e.target.value
                          ),
                      },
                    }))
                  }
                  placeholder="Intervalle"
                />

                {form.recurrence.frequency ===
                "MONTHLY" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className={field}
                      value={
                        form.recurrence
                          .monthDay ?? ""
                      }
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          recurrence: {
                            ...current.recurrence,
                            monthDay:
                              Number(
                                e.target.value
                              ),
                          },
                        }))
                      }
                      placeholder="Jour du mois"
                    />

                    <select
                      className={field}
                      value={
                        form.recurrence
                          .nthWeek ?? ""
                      }
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          recurrence: {
                            ...current.recurrence,
                            nthWeek:
                              Number(
                                e.target.value
                              ) as any,
                          },
                        }))
                      }
                    >
                      <option value="">
                        Semaine…
                      </option>
                      <option value="1">
                        1er
                      </option>
                      <option value="2">
                        2e
                      </option>
                      <option value="3">
                        3e
                      </option>
                      <option value="4">
                        4e
                      </option>
                      <option value="5">
                        5e
                      </option>
                    </select>

                    <select
                      className={`${field} col-span-2`}
                      value={
                        form.recurrence
                          .nthWeekday ?? ""
                      }
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          recurrence: {
                            ...current.recurrence,
                            nthWeekday:
                              Number(
                                e.target.value
                              ),
                          },
                        }))
                      }
                    >
                      <option value="">
                        Jour…
                      </option>

                      {[
                        "Dimanche",
                        "Lundi",
                        "Mardi",
                        "Mercredi",
                        "Jeudi",
                        "Vendredi",
                        "Samedi",
                      ].map(
                        (label, index) => (
                          <option
                            key={label}
                            value={index}
                          >
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 rounded-lg bg-green-950/70 p-3">
                    {[
                      "D",
                      "L",
                      "M",
                      "M",
                      "J",
                      "V",
                      "S",
                    ].map((label, index) => (
                      <label
                        key={`${label}-${index}`}
                        className="flex items-center gap-1 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={(
                            form.recurrence
                              .weekdays ?? []
                          ).includes(index)}
                          onChange={(e) =>
                            setForm((current) => ({
                              ...current,
                              recurrence: {
                                ...current.recurrence,
                                weekdays:
                                  e.target
                                    .checked
                                    ? [
                                        ...(current
                                          .recurrence
                                          .weekdays ??
                                          []),
                                        index,
                                      ]
                                    : (
                                        current
                                          .recurrence
                                          .weekdays ??
                                        []
                                      ).filter(
                                        (day) =>
                                          day !==
                                          index
                                      ),
                              },
                            }))
                          }
                        />

                        {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <button
            disabled={saving}
            className="mt-7 rounded-lg bg-amber-600 px-6 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50"
          >
            {saving
              ? "Enregistrement…"
              : editing
                ? "Enregistrer les modifications"
                : "Créer et publier l'événement"}
          </button>
        </form>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">
                Archives et calendrier
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Événements
              </h2>
            </div>

            <button
              onClick={() => void load()}
              className="rounded-lg border border-green-700 px-4 py-2 text-sm"
            >
              Actualiser
            </button>
          </div>

          {loading ? (
            <p className="text-green-300">
              Chargement…
            </p>
          ) : (
            (() => {
              const active = events.filter(
                (event) =>
                  event.status ===
                  "PUBLISHED"
              );

              const archived = events.filter(
                (event) =>
                  event.status !==
                  "PUBLISHED"
              );

              const card = (
                event: ClanEvent
              ) => (
                <article
                  key={event.eventId}
                  className="rounded-xl border border-green-800 bg-[#092317]/95 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-amber-600/20 px-3 py-1 text-xs font-bold text-amber-300">
                          {labels[event.type]}
                        </span>

                        <span className="rounded-full border border-green-700 px-3 py-1 text-xs text-green-300">
                          {event.status}
                        </span>

                        <span className="rounded-full border border-green-700 px-3 py-1 text-xs text-green-400">
                          {event.mode ===
                          "LONG"
                            ? "Mission longue"
                            : "Action"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-bold">
                        {event.title}
                      </h3>

                      <p className="mt-1 text-sm text-green-400">
                        {new Date(
                          event.startsAt
                        ).toLocaleString(
                          "fr-FR"
                        )}{" "}
                        ·{" "}
                        {event.durationMinutes ??
                          "?"}{" "}
                        min
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          edit(event)
                        }
                        className="rounded-lg border border-green-700 px-4 py-2 text-sm"
                      >
                        Modifier
                      </button>

                      <button
                        onClick={() =>
                          void openParticipantManager(
                            event.eventId
                          )
                        }
                        className="rounded-lg border border-amber-700 px-4 py-2 text-sm text-amber-300"
                      >
                        Participants
                      </button>

                      {event.status ===
                        "PUBLISHED" && (
                        <>
                          <button
                            onClick={() =>
                              void status(
                                event.eventId,
                                "CANCELLED"
                              )
                            }
                            className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-300"
                          >
                            Annuler
                          </button>

                          <button
                            onClick={() =>
                              void status(
                                event.eventId,
                                "COMPLETED"
                              )
                            }
                            className="rounded-lg border border-amber-700 px-4 py-2 text-sm text-amber-300"
                          >
                            Terminer
                          </button>
                        </>
                      )}

                      {event.status ===
                        "CANCELLED" && (
                        <button
                          onClick={() =>
                            void status(
                              event.eventId,
                              "PUBLISHED"
                            )
                          }
                          className="rounded-lg border border-green-700 px-4 py-2 text-sm text-green-300"
                        >
                          Republier
                        </button>
                      )}

                      <button
                        onClick={() =>
                          void remove(
                            event.eventId
                          )
                        }
                        className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              );

              return (
                <div className="space-y-10">
                  <section>
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="text-xl font-bold text-green-100">
                        Événements actifs
                      </h3>

                      <span className="rounded-full border border-green-700 px-2.5 py-1 text-xs text-green-300">
                        {active.length}
                      </span>
                    </div>

                    {active.length === 0 ? (
                      <div className="rounded-xl border border-green-800 bg-[#092317]/60 p-6 text-green-400">
                        Aucun événement actif.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {active.map(card)}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="text-xl font-bold text-green-100">
                        Événements archivés
                      </h3>

                      <span className="rounded-full border border-green-700 px-2.5 py-1 text-xs text-green-300">
                        {archived.length}
                      </span>
                    </div>

                    {archived.length === 0 ? (
                      <div className="rounded-xl border border-green-800 bg-[#092317]/60 p-6 text-green-400">
                        Aucun événement archivé.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {archived.map(card)}
                      </div>
                    )}
                  </section>
                </div>
              );
            })()
          )}
        </section>

        {selectedEvent && (
          <section className="mt-10 rounded-2xl border border-amber-800 bg-[#092317]/95 p-5 shadow-2xl md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">
                  Gestion de l'événement
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {selectedEvent.title}
                </h2>

                <p className="mt-1 text-sm text-green-400">
                  Validation des objectifs et gestion des participants
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    void refreshParticipantData()
                  }
                  disabled={
                    participantsLoading ||
                    membersLoading
                  }
                  className="rounded-lg border border-green-700 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Actualiser
                </button>

                <button
                  onClick={closeParticipantManager}
                  className="rounded-lg border border-green-700 px-4 py-2 text-sm"
                >
                  Fermer
                </button>
              </div>
            </div>

            {participantError && (
              <div className="mt-5 rounded-xl border border-red-800 bg-red-950/60 p-4 text-red-200">
                {participantError}
              </div>
            )}

            <div className="mt-6 rounded-xl border border-green-800 bg-[#061a10] p-5">
              <h3 className="font-bold text-amber-300">
                Ajouter un participant
              </h3>

              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <select
                  className={`${field} md:flex-1`}
                  value={addingMemberId}
                  onChange={(e) =>
                    setAddingMemberId(
                      e.target.value
                    )
                  }
                  disabled={membersLoading}
                >
                  <option value="">
                    {membersLoading
                      ? "Chargement des membres…"
                      : "Sélectionner un membre…"}
                  </option>

                  {members.map((member) => (
                    <option
                      key={String(
                        member._id
                      )}
                      value={String(
                        member._id
                      )}
                    >
                      {memberNameFromAdminMember(
                        member
                      )}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    void addParticipant()
                  }
                  disabled={
                    !addingMemberId ||
                    Boolean(
                      participantAction
                    )
                  }
                  className="rounded-lg bg-amber-700 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-green-800 bg-[#061a10] p-5">
              <div>
                <h3 className="font-bold text-amber-300">
                  Validation des objectifs de l'événement
                </h3>
                <p className="mt-1 text-sm text-green-400">
                  Un objectif est validé une seule fois pour tout l'événement.
                  Une récompense liée est attribuée automatiquement aux membres
                  présents dans la liste des participants (réponse « Je participe »).
                </p>
              </div>

              {selectedEvent.objectives.length === 0 ? (
                <p className="mt-4 rounded-lg border border-green-800 bg-green-950/50 p-4 text-sm text-green-500">
                  Aucun objectif n'est défini pour cet événement.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {selectedEvent.objectives.map((objective) => (
                    <div
                      key={objective.objectiveId}
                      className="rounded-lg border border-green-800 bg-green-950/50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold">
                              {objective.title}
                            </h4>
                            <span className="rounded-full border border-green-800 px-2 py-1 text-xs text-green-400">
                              {objective.required ? "Obligatoire" : "Secondaire"}
                            </span>
                            <span className={`rounded-full border px-2 py-1 text-xs ${
                              objective.status === "VALIDATED"
                                ? "border-green-600 text-green-300"
                                : objective.status === "REJECTED"
                                  ? "border-red-700 text-red-300"
                                  : "border-amber-700 text-amber-300"
                            }`}>
                              {objective.status === "VALIDATED"
                                ? "Validé"
                                : objective.status === "REJECTED"
                                  ? "Rejeté"
                                  : "En attente"}
                            </span>
                          </div>
                          {objective.description && (
                            <p className="mt-1 text-sm text-green-500">
                              {objective.description}
                            </p>
                          )}
                          {objective.validatedAt && (
                            <p className="mt-1 text-xs text-green-600">
                              Validé le {new Date(objective.validatedAt).toLocaleString("fr-FR")}
                            </p>
                          )}
                        </div>

                        <select
                          className="rounded-lg border border-green-800 bg-[#06170e] px-3 py-2 text-sm text-white"
                          value={objective.status ?? "PENDING"}
                          onChange={(e) =>
                            void changeEventObjective(
                              objective.objectiveId,
                              e.target.value as "PENDING" | "VALIDATED" | "REJECTED",
                            )
                          }
                          disabled={participantAction === `event-objective:${objective.objectiveId}`}
                        >
                          <option value="PENDING">En attente</option>
                          <option value="VALIDATED">Validé</option>
                          <option value="REJECTED">Rejeté</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              {participantsLoading ? (
                <p className="text-green-300">
                  Chargement des participants…
                </p>
              ) : participants.length === 0 ? (
                <div className="rounded-xl border border-green-800 bg-[#061a10] p-6 text-green-400">
                  Aucun participant enregistré
                  pour cet événement.
                </div>
              ) : (
                <div className="space-y-4">
                  {participants.map((participant) => {
                    const isEligible = participant.status === "ACCEPTED";

                    return (
                      <article
                        key={participant.memberId}
                        className="rounded-xl border border-green-800 bg-[#061a10] p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="text-lg font-bold">
                              {memberName(participant.member)}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full border border-green-700 px-3 py-1 text-green-300">
                                Réponse : {participant.status}
                              </span>

                              <span
                                className={`rounded-full border px-3 py-1 ${
                                  isEligible
                                    ? "border-green-600 text-green-300"
                                    : "border-amber-700 text-amber-300"
                                }`}
                              >
                                {isEligible
                                  ? "Présence : considérée présente"
                                  : "Non éligible aux récompenses"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => void removeParticipant(participant)}
                              disabled={
                                participantAction ===
                                `remove:${participant.memberId}`
                              }
                              className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 disabled:opacity-50"
                            >
                              Retirer
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
