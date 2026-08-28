"use client";

import { FormEvent, useEffect, useState } from "react";

import type {
  CreateLevelData,
  LevelDefinition,
  UpdateLevelData,
} from "@/types/levels.types";

interface LevelFormProps {
  level?: LevelDefinition | null;
  onSubmit: (
    data: CreateLevelData | UpdateLevelData
  ) => Promise<void>;
  onCancel: () => void;
}

export default function LevelForm({
  level,
  onSubmit,
  onCancel,
}: LevelFormProps) {
  const isEditing = Boolean(level);

  const [levelNumber, setLevelNumber] =
    useState("");

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [requiredXp, setRequiredXp] =
    useState("");

  const [enabled, setEnabled] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (level) {
      setLevelNumber(String(level.level));
      setName(level.name);
      setDescription(level.description ?? "");
      setRequiredXp(String(level.requiredXp));
      setEnabled(level.enabled);
    } else {
      setLevelNumber("");
      setName("");
      setDescription("");
      setRequiredXp("");
      setEnabled(true);
    }

    setError("");
  }, [level]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const parsedLevel = Number(levelNumber);
    const parsedXp = Number(requiredXp);

    if (
      !isEditing &&
      (!Number.isInteger(parsedLevel) ||
        parsedLevel < 1)
    ) {
      setError(
        "Le numéro du niveau doit être un entier supérieur ou égal à 1."
      );
      return;
    }

    if (
      !Number.isFinite(parsedXp) ||
      parsedXp < 0
    ) {
      setError(
        "L'XP requis doit être un nombre positif ou nul."
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Le nom du niveau est obligatoire."
      );
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        await onSubmit({
          name: name.trim(),
          description:
            description.trim() || undefined,
          requiredXp: parsedXp,
          enabled,
        });
      } else {
        await onSubmit({
          level: parsedLevel,
          name: name.trim(),
          description:
            description.trim() || undefined,
          requiredXp: parsedXp,
          enabled,
        });
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h2>
          {isEditing
            ? `Modifier le niveau ${level?.level}`
            : "Nouveau niveau"}
        </h2>

        <p>
          Configurez les paramètres de ce niveau.
        </p>
      </div>

      {error && (
        <div role="alert">
          {error}
        </div>
      )}

      {!isEditing && (
        <div>
          <label htmlFor="level">
            Niveau
          </label>

          <input
            id="level"
            type="number"
            min="1"
            step="1"
            value={levelNumber}
            onChange={(event) =>
              setLevelNumber(event.target.value)
            }
            disabled={loading}
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="name">
          Nom
        </label>

        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="description">
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          disabled={loading}
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="requiredXp">
          XP requis
        </label>

        <input
          id="requiredXp"
          type="number"
          min="0"
          step="1"
          value={requiredXp}
          onChange={(event) =>
            setRequiredXp(event.target.value)
          }
          disabled={loading}
          required
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) =>
              setEnabled(event.target.checked)
            }
            disabled={loading}
          />

          Niveau actif
        </label>
      </div>

      <div>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Enregistrement..."
            : isEditing
              ? "Modifier le niveau"
              : "Créer le niveau"}
        </button>
      </div>
    </form>
  );
}