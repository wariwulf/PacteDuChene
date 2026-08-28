const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type ApiOptions = RequestInit & {
  body?: BodyInit | null;
};

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch (error) {
    console.error(`Erreur réseau sur ${endpoint}:`, error);

    throw new Error(
      "Impossible de contacter le serveur. Vérifiez que l'API est démarrée."
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  let payload: any = null;

  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch (error) {
      console.error(
        `Réponse JSON invalide reçue depuis ${endpoint}:`,
        error
      );

      throw new Error(
        `Le serveur a retourné une réponse JSON invalide (${response.status}).`
      );
    }
  } else {
    const text = await response.text();

    console.error(
      `Réponse non JSON reçue depuis ${endpoint}:`,
      text.slice(0, 500)
    );

    throw new Error(
      `Le serveur a retourné une réponse inattendue (${response.status}).`
    );
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message ||
        `Erreur serveur (${response.status}).`
    );
  }

  return payload as T;
}

export { API_URL };