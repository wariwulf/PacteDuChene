"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AmbientMusic.module.css";

interface AmbientMusicProps {
  src?: string;
}

export default function AmbientMusic({
  src = "/audio/pacte-accueil.mp3",
}: AmbientMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = 0.25;
    audio.loop = true;

    const removeInteractionListeners = () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    const onPlay = () => {
      setIsPlaying(true);
      removeInteractionListeners();
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const handleFirstInteraction = async (event: Event) => {
      if (hasInteractedRef.current) return;

      const target = event.target as HTMLElement | null;

      // Si l'utilisateur clique directement sur le bouton musique,
      // on laisse toggleMusic() gérer l'action.
      if (target?.closest(`.${styles.button}`)) {
        hasInteractedRef.current = true;
        removeInteractionListeners();
        return;
      }

      hasInteractedRef.current = true;

      try {
        await audio.play();
      } catch {
        // Le navigateur peut encore refuser la lecture.
        // Pas besoin d'afficher une erreur dans la console.
        hasInteractedRef.current = false;
      }

      removeInteractionListeners();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    // ---------------------------------------------------------
    // Tentative d'autoplay à l'ouverture
    // ---------------------------------------------------------
    audio.play().catch(() => {
      // Autoplay bloqué : on attend une vraie interaction.
    });

    // ---------------------------------------------------------
    // Première interaction utilisateur
    // ---------------------------------------------------------
    window.addEventListener("pointerdown", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      removeInteractionListeners();

      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    hasInteractedRef.current = true;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        // Le navigateur refuse encore la lecture.
      }
    } else {
      audio.pause();
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
      />

      <button
        type="button"
        onClick={toggleMusic}
        className={`${styles.button} ${
          isPlaying ? styles.playing : ""
        }`}
        aria-label={
          isPlaying
            ? "Couper la musique d'ambiance"
            : "Activer la musique d'ambiance"
        }
        title={
          isPlaying
            ? "Couper la musique d'ambiance"
            : "Activer la musique d'ambiance"
        }
      >
        <span aria-hidden="true">
          {isPlaying ? "♫" : "♪"}
        </span>
      </button>
    </>
  );
}