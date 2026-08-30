"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type Role =
  | "PLAYER"
  | "MODERATOR"
  | "ADMIN"
  | "OWNER";

type Status =
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED";

type Member = {
  id: string;
  email: string;
  role: Role;
  status: Status;
  mustChangePassword: boolean;
  profile: {
    username: string;
    displayName?: string;
    avatar?: string;
  };
  discord?: {
    linked: boolean;
    discordId?: string;
    username?: string;
  };
};

type DiscordRole = {
  id: string;
  name: string;
  color?: number;
};

type DiscordProfile = {
  linked: boolean;
  inGuild: boolean;
  discordId: string;
  username?: string;
  globalName?: string | null;
  displayName?: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  guildAvatarUrl?: string | null;
  joinedAt?: string | null;
  roles: DiscordRole[];
};

function extractArray(payload: any): Member[] {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.members)) {
    return payload.members;
  }

  return Array.isArray(payload) ? payload : [];
}

async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message ||
        `Erreur serveur (${response.status})`
    );
  }

  return payload;
}

function roleLabel(role: Role) {
  switch (role) {
    case "OWNER":
      return "Propriétaire";
    case "ADMIN":
      return "Administrateur";
    case "MODERATOR":
      return "Modérateur";
    default:
      return "Membre";
  }
}

function statusLabel(status: Status) {
  switch (status) {
    case "ACTIVE":
      return "Actif";
    case "SUSPENDED":
      return "Suspendu";
    case "DELETED":
      return "Archivé";
    default:
      return status;
  }
}

function statusClass(status: Status) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-900 text-green-300";
    case "SUSPENDED":
      return "bg-amber-900 text-amber-300";
    case "DELETED":
      return "bg-red-950 text-red-300";
    default:
      return "bg-gray-800 text-gray-300";
  }
}

export default function AdministrationMembresPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState<Member | null>(null);
  const [temporaryPassword, setTemporaryPassword] =
    useState("");
  const [avatarFile, setAvatarFile] =
    useState<File | null>(null);
  const [discordProfile, setDiscordProfile] =
    useState<DiscordProfile | null>(null);
  const [discordProfileLoading, setDiscordProfileLoading] =
    useState(false);
  const [discordProfileError, setDiscordProfileError] =
    useState("");

  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    role: "PLAYER" as Role,
    avatar: "",
    discordId: "",
    discordUsername: "",
  });

  async function loadCurrentUser() {
    try {
      setAuthLoading(true);

      const payload = await apiRequest("/auth/me");
      const role = payload?.data?.user?.role as Role | undefined;

      if (role !== "OWNER" && role !== "ADMIN") {
        router.replace("/espace-membre");
        return;
      }

      setCurrentUserRole(role);
    } catch (err) {
      setCurrentUserRole(null);
      router.replace("/espace-membre");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");

      const payload = await apiRequest(
        "/users/admin"
      );

      setMembers(extractArray(payload));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les membres."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserRole === "OWNER" || currentUserRole === "ADMIN") {
      void loadMembers();
    }
  }, [currentUserRole]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return members;
    }

    return members.filter((member) =>
      [
        member.email,
        member.profile.username,
        member.profile.displayName,
        member.role,
        member.status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(q)
        )
    );
  }, [members, search]);

  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";

  function canEditRole(member?: Member | null) {
    if (!currentUserRole) return false;
    if (isOwner) return true;

    // ADMIN peut uniquement attribuer/révoquer MODERATOR.
    // Les rôles ADMIN et OWNER sont donc verrouillés.
    return !!member && member.role !== "ADMIN" && member.role !== "OWNER";
  }

  function allowedRoleOptions(member?: Member | null) {
    if (isOwner) {
      return ["PLAYER", "MODERATOR", "ADMIN", "OWNER"] as Role[];
    }

    if (isAdmin) {
      return ["PLAYER", "MODERATOR"] as Role[];
    }

    return ["PLAYER"] as Role[];
  }

  function resetForm() {
    setSelected(null);
    setTemporaryPassword("");
    setAvatarFile(null);
    setDiscordProfile(null);
    setDiscordProfileError("");

    setForm({
      email: "",
      username: "",
      displayName: "",
      role: "PLAYER",
      avatar: "",
      discordId: "",
      discordUsername: "",
    });
  }

  function editMember(member: Member) {
    setSelected(member);
    setTemporaryPassword("");
    setAvatarFile(null);
    setDiscordProfile(null);
    setDiscordProfileError("");

    setForm({
      email: member.email,
      username: member.profile.username,
      displayName:
        member.profile.displayName || "",
      role: member.role,
      avatar: member.profile.avatar || "",
      discordId: member.discord?.discordId || "",
      discordUsername: member.discord?.username || "",
    });
  }

  async function loadDiscordProfile(userId: string) {
    setDiscordProfileLoading(true);
    setDiscordProfileError("");

    try {
      const payload = await apiRequest(
        `/discord/profile/${encodeURIComponent(userId)}`
      );

      setDiscordProfile(payload?.data || null);
    } catch (err) {
      setDiscordProfile(null);
      setDiscordProfileError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer le profil Discord."
      );
    } finally {
      setDiscordProfileLoading(false);
    }
  }

  useEffect(() => {
    if (!selected?.id || !form.discordId) {
      setDiscordProfile(null);
      setDiscordProfileError("");
      return;
    }

    loadDiscordProfile(selected.id);
  }, [selected?.id, form.discordId]);

  async function uploadAvatar(userId: string) {
    if (!avatarFile) {
      return null;
    }

    const data = new FormData();
    data.append("avatar", avatarFile);

    /*
     * L'endpoint /users/avatar doit être celui déjà utilisé
     * par ton backend pour l'upload. Il reçoit le cookie de
     * session et associe le fichier au membre sélectionné.
     *
     * Si ton endpoint actuel est déjà fonctionnel, conserve-le.
     */
    const response = await fetch(
      `${API_URL}/users/avatar/${encodeURIComponent(
        userId
      )}`,
      {
        method: "POST",
        credentials: "include",
        body: data,
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
          "Impossible d'importer le portrait."
      );
    }

    return payload?.data?.avatar as
      | string
      | undefined;
  }

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");
    setTemporaryPassword("");

    try {
      if (selected && form.role !== selected.role && !canEditRole(selected)) {
        throw new Error(
          "Un administrateur ne peut modifier que les rôles des membres et modérateurs. Seul le propriétaire peut gérer les administrateurs et le propriétaire."
        );
      }

      if (!selected && form.role !== "PLAYER" && form.role !== "MODERATOR" && !isOwner) {
        throw new Error(
          "Un administrateur peut uniquement créer un membre ou un modérateur."
        );
      }

      if (selected) {
        let avatar = form.avatar;

        if (avatarFile) {
          avatar =
            (await uploadAvatar(selected.id)) ||
            avatar;
        }

        await apiRequest(
          `/users/admin/${encodeURIComponent(
            selected.id
          )}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              ...form,
              avatar,
            }),
          }
        );

        setMessage(
          "Membre modifié avec succès."
        );

        if (form.discordId) {
          await loadDiscordProfile(selected.id);
        }
      } else {
        const payload = await apiRequest(
          "/users/admin",
          {
            method: "POST",
            body: JSON.stringify(form),
          }
        );

        setTemporaryPassword(
          payload?.data?.temporaryPassword ||
            ""
        );

        const createdId =
          payload?.data?.user?.id;

        if (createdId && avatarFile) {
          await uploadAvatar(createdId);
        }

        setMessage(
          "Membre créé. Conservez le mot de passe temporaire affiché ci-dessous."
        );

        resetForm();
      }

      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Opération impossible."
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(id: string) {
    if (
      !window.confirm(
        "Réinitialiser le mot de passe de ce membre ?"
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const payload = await apiRequest(
        `/users/admin/${encodeURIComponent(
          id
        )}/reset-password`,
        {
          method: "POST",
        }
      );

      setTemporaryPassword(
        payload?.data?.temporaryPassword ||
          ""
      );

      setMessage(
        "Nouveau mot de passe temporaire généré. Le membre devra le modifier à sa prochaine connexion."
      );

      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de réinitialiser le mot de passe."
      );
    }
  }

  async function changeStatus(
    id: string,
    action:
      | "suspend"
      | "reactivate"
  ) {
    const message =
      action === "suspend"
        ? "Suspendre ce compte ? Le membre ne pourra plus se connecter."
        : "Réactiver ce compte ?";

    if (!window.confirm(message)) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await apiRequest(
        `/users/admin/${encodeURIComponent(
          id
        )}/${action}`,
        {
          method: "POST",
        }
      );

      setMessage(
        action === "suspend"
          ? "Compte suspendu."
          : "Compte réactivé."
      );

      await loadMembers();

      if (selected?.id === id) {
        const refreshed =
          extractArray(
            await apiRequest("/users/admin")
          ).find(
            (member) => member.id === id
          );

        if (refreshed) {
          editMember(refreshed);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le statut."
      );
    }
  }

  async function archiveMember(id: string) {
    if (
      !window.confirm(
        "Archiver ce membre ?\n\nLe compte sera désactivé et disparaîtra de l'annuaire. Les données seront conservées afin de permettre une restauration ultérieure."
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await apiRequest(
        `/users/admin/${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        "Membre archivé. Son compte ne peut plus se connecter."
      );

      if (selected?.id === id) {
        resetForm();
      }

      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'archiver le membre."
      );
    }
  }

  async function restoreMember(id: string) {
    if (
      !window.confirm(
        "Restaurer ce membre et réactiver son compte ?"
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await apiRequest(
        `/users/admin/${encodeURIComponent(
          id
        )}/restore`,
        {
          method: "POST",
        }
      );

      setMessage(
        "Membre restauré et compte réactivé."
      );

      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de restaurer le membre."
      );
    }
  }

  if (authLoading || !currentUserRole) {
    return (
      <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-green-800 bg-green-900/60 p-8 text-center">
            <p className="text-green-200">Vérification des droits d'administration...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
              Administration
            </p>

            <h1 className="text-4xl font-bold">
              Gestion des membres
            </h1>

            <p className="mt-2 text-green-200">
              Créez les comptes des membres du Pacte et
              gérez leurs accès.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMembers}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50"
          >
            {loading
              ? "Chargement..."
              : "Actualiser"}
          </button>
        </header>

        {error && (
          <div className="mb-5 rounded-lg border border-red-700 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-green-600 bg-green-900/60 p-4 text-green-100">
            {message}
          </div>
        )}

        {temporaryPassword && (
          <div className="mb-8 rounded-xl border border-amber-500 bg-amber-950/40 p-5">
            <p className="font-semibold text-amber-300">
              Mot de passe temporaire
            </p>

            <p className="mt-2 break-all rounded-lg bg-green-950 p-4 font-mono text-lg text-white">
              {temporaryPassword}
            </p>

            <p className="mt-2 text-sm text-amber-100">
              Communiquez-le au membre de manière sécurisée.
              Il devra le modifier dès sa première connexion.
            </p>
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-green-800 bg-green-900/60 p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                {selected
                  ? "Modifier"
                  : "Nouveau membre"}
              </p>

              <h2 className="text-2xl font-bold">
                {selected
                  ? selected.profile.displayName ||
                    selected.profile.username
                  : "Créer un compte membre"}
              </h2>
            </div>

            {selected && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-green-600 px-4 py-2 hover:bg-green-800"
              >
                Nouveau
              </button>
            )}
          </div>

          <form
            onSubmit={submit}
            className="grid gap-5 md:grid-cols-2"
          >
            <label className="block">
              <span className="mb-2 block font-semibold">
                Email
              </span>

              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">
                Identifiant
              </span>

              <input
                required
                value={form.username}
                onChange={(event) =>
                  setForm({
                    ...form,
                    username: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">
                Nom affiché
              </span>

              <input
                value={form.displayName}
                onChange={(event) =>
                  setForm({
                    ...form,
                    displayName:
                      event.target.value,
                  })
                }
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">
                Rôle
              </span>

              <select
                value={form.role}
                disabled={!!selected && !canEditRole(selected)}
                onChange={(event) =>
                  setForm({
                    ...form,
                    role: event.target.value as Role,
                  })
                }
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {allowedRoleOptions(selected).map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>

              {isAdmin && selected && !canEditRole(selected) && (
                <p className="mt-2 text-xs text-amber-300">
                  Seul le propriétaire peut modifier les rôles Administrateur et Propriétaire.
                </p>
              )}

              {isAdmin && !selected && (
                <p className="mt-2 text-xs text-green-300">
                  En tant qu'administrateur, vous pouvez créer des membres ou des modérateurs.
                </p>
              )}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block font-semibold">
                Portrait
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setAvatarFile(
                    event.target.files?.[0] ||
                      null
                  )
                }
                className="block w-full rounded-lg border border-green-700 bg-green-950 p-3"
              />

              <input
                value={form.avatar}
                onChange={(event) =>
                  setForm({
                    ...form,
                    avatar: event.target.value,
                  })
                }
                placeholder="Ou URL du portrait"
                className="mt-3 w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
              />
            </label>

            <div className="rounded-xl border border-indigo-700 bg-indigo-950/30 p-5 md:col-span-2">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
                  Compte Discord
                </p>
                <p className="mt-1 text-sm text-green-200">
                  Associez le compte Discord du membre à son compte du Pacte.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block font-semibold">
                    Identifiant Discord
                  </span>
                  <input
                    value={form.discordId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        discordId: event.target.value,
                      })
                    }
                    placeholder="Ex. 123456789012345678"
                    className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
                  />
                  <p className="mt-2 text-xs text-green-300">
                    L'identifiant numérique du compte Discord.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block font-semibold">
                    Nom Discord
                  </span>
                  <input
                    value={form.discordUsername}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        discordUsername: event.target.value,
                      })
                    }
                    placeholder="Ex. Testeur"
                    className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
                  />
                  <p className="mt-2 text-xs text-green-300">
                    Nom d'utilisateur Discord actuel.
                  </p>
                </label>
              </div>

              {selected && (
                <div className="mt-4 rounded-xl bg-green-950 p-4">
                  {!form.discordId ? (
                    <p className="text-sm text-green-300">
                      ⚪ Aucun compte Discord lié.
                    </p>
                  ) : discordProfileLoading ? (
                    <p className="text-sm text-green-200">
                      Chargement du profil Discord...
                    </p>
                  ) : discordProfileError ? (
                    <div className="space-y-3">
                      <p className="text-sm text-amber-300">
                        ⚠ {discordProfileError}
                      </p>
                      <button
                        type="button"
                        onClick={() => loadDiscordProfile(selected.id)}
                        className="rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-900"
                      >
                        Réessayer
                      </button>
                    </div>
                  ) : discordProfile ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-indigo-400 bg-green-800">
                          {discordProfile.guildAvatarUrl || discordProfile.avatarUrl ? (
                            <img
                              src={
                                discordProfile.guildAvatarUrl ||
                                discordProfile.avatarUrl ||
                                ""
                              }
                              alt="Avatar Discord"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-indigo-300">
                              {(discordProfile.displayName ||
                                discordProfile.username ||
                                "?")
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold text-white">
                              {discordProfile.displayName ||
                                discordProfile.username ||
                                "Utilisateur Discord"}
                            </h3>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                discordProfile.inGuild
                                  ? "bg-green-800 text-green-200"
                                  : "bg-red-950 text-red-300"
                              }`}
                            >
                              {discordProfile.inGuild
                                ? "Présent sur le serveur"
                                : "Absent du serveur"}
                            </span>
                          </div>

                          <p className="mt-1 text-green-300">
                            @{discordProfile.username || form.discordUsername || "inconnu"}
                          </p>

                          {discordProfile.globalName &&
                            discordProfile.globalName !== discordProfile.username && (
                              <p className="mt-1 text-sm text-green-400">
                                Nom global : {discordProfile.globalName}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-green-800 bg-green-900/60 p-3">
                          <p className="text-xs uppercase tracking-wide text-green-400">
                            Identifiant Discord
                          </p>
                          <p className="mt-1 break-all font-mono text-sm text-white">
                            {discordProfile.discordId}
                          </p>
                        </div>

                        <div className="rounded-lg border border-green-800 bg-green-900/60 p-3">
                          <p className="text-xs uppercase tracking-wide text-green-400">
                            Surnom sur le serveur
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {discordProfile.nickname || "Aucun surnom"}
                          </p>
                        </div>
                      </div>

                      {discordProfile.joinedAt && (
                        <p className="text-sm text-green-300">
                          Membre du serveur depuis le {
                            new Date(discordProfile.joinedAt).toLocaleDateString(
                              "fr-FR"
                            )
                          }
                        </p>
                      )}

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
                          Rôles Discord
                        </p>

                        {discordProfile.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {discordProfile.roles.map((role) => (
                              <span
                                key={role.id}
                                className="rounded-full border border-indigo-700 bg-indigo-950/70 px-3 py-1 text-sm text-indigo-200"
                              >
                                {role.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-green-400">
                            Aucun rôle Discord récupéré.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-green-800 pt-4">
                        <p className="text-sm text-green-300">
                          🟢 Profil Discord récupéré depuis le serveur.
                        </p>
                        <button
                          type="button"
                          onClick={() => loadDiscordProfile(selected.id)}
                          disabled={discordProfileLoading}
                          className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-950/60 disabled:opacity-50"
                        >
                          Actualiser Discord
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-green-300">
                      ⚪ Aucun profil Discord disponible.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <button
                disabled={saving}
                type="submit"
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : selected
                    ? "Enregistrer les modifications"
                    : "Créer le membre"}
              </button>

              {selected && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      resetPassword(
                        selected.id
                      )
                    }
                    className="rounded-lg border border-amber-600 px-5 py-3 font-semibold text-amber-200 hover:bg-amber-950/40"
                  >
                    Réinitialiser le mot de passe
                  </button>

                  {selected.status ===
                    "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() =>
                        changeStatus(
                          selected.id,
                          "suspend"
                        )
                      }
                      className="rounded-lg border border-amber-700 px-5 py-3 font-semibold text-amber-300 hover:bg-amber-950/40"
                    >
                      Suspendre
                    </button>
                  )}

                  {selected.status ===
                    "SUSPENDED" && (
                    <button
                      type="button"
                      onClick={() =>
                        changeStatus(
                          selected.id,
                          "reactivate"
                        )
                      }
                      className="rounded-lg border border-green-600 px-5 py-3 font-semibold text-green-300 hover:bg-green-950/40"
                    >
                      Réactiver
                    </button>
                  )}

                  {selected.status !==
                    "DELETED" && (
                    <button
                      type="button"
                      onClick={() =>
                        archiveMember(
                          selected.id
                        )
                      }
                      className="rounded-lg border border-red-700 px-5 py-3 font-semibold text-red-300 hover:bg-red-950/40"
                    >
                      Archiver le membre
                    </button>
                  )}
                </>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-green-800 bg-green-900/60 p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Annuaire
              </p>

              <h2 className="text-2xl font-bold">
                Membres existants
              </h2>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher..."
              className="rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          {loading ? (
            <p className="text-green-200">
              Chargement...
            </p>
          ) : filteredMembers.length === 0 ? (
            <p className="rounded-lg bg-green-950 p-5 text-green-200">
              Aucun membre trouvé.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredMembers.map(
                (member) => (
                  <article
                    key={member.id}
                    className="rounded-xl border border-green-700 bg-green-950/60 p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-500 bg-green-800">
                        {member.profile
                          .avatar ? (
                          <img
                            src={
                              member.profile
                                .avatar
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-amber-400">
                            {(
                              member.profile
                                .displayName ||
                              member.profile
                                .username ||
                              "?"
                            )
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold">
                          {member.profile
                            .displayName ||
                            member.profile
                              .username}
                        </h3>

                        <p className="truncate text-sm text-green-300">
                          @
                          {
                            member.profile
                              .username
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-green-200">
                      <p>{member.email}</p>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-amber-900 px-3 py-1 text-amber-300">
                          {roleLabel(
                            member.role
                          )}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 ${statusClass(
                            member.status
                          )}`}
                        >
                          {statusLabel(
                            member.status
                          )}
                        </span>
                      </div>

                      {member.mustChangePassword && (
                        <p className="text-amber-300">
                          ⚠ Changement de mot de passe requis
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editMember(member)
                        }
                        className="flex-1 rounded-lg border border-green-600 px-4 py-2 font-semibold hover:bg-green-900"
                      >
                        Gérer
                      </button>

                      {member.status ===
                        "DELETED" && (
                        <button
                          type="button"
                          onClick={() =>
                            restoreMember(
                              member.id
                            )
                          }
                          className="rounded-lg border border-green-600 px-4 py-2 font-semibold text-green-300 hover:bg-green-950"
                        >
                          Restaurer
                        </button>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
