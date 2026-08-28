import { apiFetch, API_URL } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
}

function extractUser(payload: any): AuthUser {
  const user =
    payload?.data?.user ??
    payload?.user ??
    payload?.data ??
    payload;

  return {
    id: String(user?.id ?? ""),
    email: String(user?.email ?? ""),
    username: String(user?.username ?? ""),
    role: String(user?.role ?? "PLAYER"),
    mustChangePassword: Boolean(
      user?.mustChangePassword
    ),
  };
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const payload = await apiFetch<any>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  return extractUser(payload);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await apiFetch<any>("/auth/me", {
      method: "GET",
      cache: "no-store",
    });

    return extractUser(payload);
  } catch (error) {
    /*
     * Une absence de session est normale.
     * Le backend utilise 401 dans ce cas.
     */
    if (
      error instanceof Error &&
      (
        error.message.includes("401") ||
        error.message.toLowerCase().includes("authentification")
      )
    ) {
      return null;
    }

    throw error;
  }
}

/**
 * Connexion Discord.
 *
 * OAuth nécessite une navigation complète du navigateur
 * afin que Discord puisse rediriger vers le callback backend.
 */
export function startDiscordLogin(): void {
  window.location.assign(
    `${API_URL}/auth/discord`
  );
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", {
    method: "POST",
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiFetch("/users/change-password", {
    method: "POST",
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
}