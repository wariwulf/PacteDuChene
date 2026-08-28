"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  type AuthUser,
} from "@/lib/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<AuthUser>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /**
   * Restauration de la session au chargement
   * de l'application.
   */
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const currentUser =
          await getCurrentUser();

        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        /*
         * Une erreur serveur ne doit pas provoquer
         * une unhandledRejection dans React.
         */
        console.error(
          "Erreur restauration de session :",
          error
        );

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Connexion.
   */
  async function login(
    email: string,
    password: string
  ): Promise<AuthUser> {
    const authenticatedUser =
      await apiLogin(email, password);

    setUser(authenticatedUser);

    return authenticatedUser;
  }

  /**
   * Déconnexion.
   */
  async function logout(): Promise<void> {
    try {
      await apiLogout();
    } finally {
      /*
       * Même si l'appel backend échoue,
       * on considère la session locale terminée.
       */
      setUser(null);
    }
  }

  /**
   * Actualisation de l'utilisateur courant.
   */
  async function refreshUser(): Promise<void> {
    try {
      const currentUser =
        await getCurrentUser();

      setUser(currentUser);
    } catch (error) {
      console.error(
        "Erreur actualisation utilisateur :",
        error
      );

      setUser(null);

      throw error;
    }
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,

    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé dans un AuthProvider."
    );
  }

  return context;
}