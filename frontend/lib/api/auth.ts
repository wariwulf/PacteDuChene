const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
  permissions: string[];
  isFactionLeader: boolean;
  factionRoleId?: string;
}

function extractUser(payload: any): AuthUser {
  return payload?.data?.user || payload?.user || payload?.data || payload;
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message || `Erreur serveur (${response.status})`
    );
  }
  return payload;
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return extractUser(await parseResponse(response));
}

/** OAuth nécessite une navigation navigateur afin que Discord puisse rediriger vers le callback backend. */
export function startDiscordLogin(): void {
  window.location.assign(`${API_URL}/auth/discord`);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) return null;
  return extractUser(await parseResponse(response));
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  await parseResponse(response);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(`${API_URL}/users/change-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  await parseResponse(response);
}
