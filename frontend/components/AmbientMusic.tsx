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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
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
