"use client";

import { useEffect, useRef, useState } from "react";

export default function NewsAmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.35;
    audio.loop = true;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    const startFromInteraction = () => {
      if (!audio.paused) return;

      void audio.play().catch((error) => {
        console.error("Impossible de lancer l'ambiance des actualités :", error);
      });
    };

    // Première tentative : si l'autoplay est autorisé, la lecture démarre.
    void audio.play().catch(() => {
      // Sinon, la première vraie interaction avec la page débloque le son.
      window.addEventListener("pointerdown", startFromInteraction, { once: true });
      window.addEventListener("keydown", startFromInteraction, { once: true });
      window.addEventListener("touchstart", startFromInteraction, { once: true });
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
        console.error("Impossible de lancer l'ambiance des actualités :", error);
      }
    } else {
      audio.pause();
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/actualites-village.mp3"
        preload="auto"
      />

      <button
        type="button"
        onClick={toggleMusic}
        className="fixed bottom-6 left-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-amber-700/50 bg-black/75 text-lg text-amber-400 shadow-lg backdrop-blur-sm transition hover:border-amber-500 hover:bg-black/90"
        aria-label={
          isPlaying
            ? "Couper l'ambiance sonore des actualités"
            : "Activer l'ambiance sonore des actualités"
        }
        title={
          isPlaying
            ? "Couper l'ambiance sonore des actualités"
            : "Activer l'ambiance sonore des actualités"
        }
      >
        <span aria-hidden="true">{isPlaying ? "♫" : "♪"}</span>
      </button>
    </>
  );
}
