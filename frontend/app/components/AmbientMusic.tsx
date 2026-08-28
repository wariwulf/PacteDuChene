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

  // Tentative de lecture automatique
  audio.play().catch(() => {
    // Le navigateur bloque l'autoplay.
    // L'utilisateur pourra alors utiliser le bouton.
    console.log("Autoplay bloqué par le navigateur.");
  });

  return () => {
    audio.removeEventListener("play", onPlay);
    audio.removeEventListener("pause", onPause);
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
