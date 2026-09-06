"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AmbientMusic.module.css";

export default function AmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = 0.25;
    audio.loop = true;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    let unlocked = false;

    const startFromInteraction = () => {
      if (unlocked || !audio.paused) return;

      unlocked = true;

      void audio.play().catch((error) => {
        console.error("Impossible de lancer la musique :", error);
      });

      window.removeEventListener("pointerdown", startFromInteraction);
      window.removeEventListener("keydown", startFromInteraction);
      window.removeEventListener("touchstart", startFromInteraction);
    };

    // Première tentative : si le navigateur autorise l'autoplay,
    // la musique démarre immédiatement.
    void audio.play().catch(() => {
      // Autoplay bloqué : on attend la première interaction de l'utilisateur.
      window.addEventListener("pointerdown", startFromInteraction, {
        once: true,
      });
      window.addEventListener("keydown", startFromInteraction, {
        once: true,
      });
      window.addEventListener("touchstart", startFromInteraction, {
        once: true,
      });
    });

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      window.removeEventListener("pointerdown", startFromInteraction);
      window.removeEventListener("keydown", startFromInteraction);
      window.removeEventListener("touchstart", startFromInteraction);
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        console.error("Impossible de lancer la musique :", error);
      }
    } else {
      audio.pause();
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/pacte-accueil.mp3"
        preload="auto"
      />

      <button
        type="button"
        onClick={toggleMusic}
        className={`${styles.button} ${isPlaying ? styles.playing : ""}`}
        aria-label={isPlaying ? "Couper la musique d'ambiance" : "Activer la musique d'ambiance"}
        title={isPlaying ? "Couper la musique d'ambiance" : "Activer la musique d'ambiance"}
      >
        <span aria-hidden="true">{isPlaying ? "♫" : "♪"}</span>
      </button>
    </>
  );
}
