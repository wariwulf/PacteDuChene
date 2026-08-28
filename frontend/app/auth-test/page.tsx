"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function AuthTestPage() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  } = useAuth();

  if (isLoading) {
    return <p>Chargement de la session...</p>;
  }

  return (
    <main className="min-h-screen p-10">
      <h1 className="mb-6 text-3xl font-bold">
        Test authentification
      </h1>

      {isAuthenticated ? (
        <div className="space-y-4">
          <p>
            Connecté en tant que{" "}
            <strong>{user?.username}</strong>
          </p>

          <p>
            Rôle : <strong>{user?.role}</strong>
          </p>

          <button
            onClick={logout}
            className="rounded-lg bg-red-700 px-4 py-2 text-white"
          >
            Déconnexion
          </button>
        </div>
      ) : (
        <button
          onClick={() =>
            login(
              "test@pacte-du-chene.fr",
              "PacteTest2026!"
            )
          }
          className="rounded-lg bg-amber-700 px-4 py-2 text-white"
        >
          Se connecter avec le compte de test
        </button>
      )}
    </main>
  );
}