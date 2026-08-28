"use client";

import { useEffect, useState } from "react";

import {
  getCurrentMember,
  type Member,
} from "../services/members.service";

interface UseCurrentMemberResult {
  member: Member | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCurrentMember(): UseCurrentMemberResult {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMember = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getCurrentMember();

      setMember(data);
    } catch (err) {
      console.error(
        "Erreur récupération membre :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer votre profil."
      );

      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMember();
  }, []);

  return {
    member,
    loading,
    error,
    refresh: loadMember,
  };
}