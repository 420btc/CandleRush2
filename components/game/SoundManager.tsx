"use client";
import { useEffect, useRef, useState } from "react";

interface SoundManagerProps {
  muted: boolean;
  onToggleMute: () => void;
  triggerLose: boolean;
  triggerWin: boolean;
}

export default function SoundManager({ muted, onToggleMute, triggerLose, triggerWin }: SoundManagerProps) {
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const loseRef = useRef<HTMLAudioElement | null>(null);
  const winRef = useRef<HTMLAudioElement | null>(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Precarga fondo1.mp3 al montar
  useEffect(() => {
    bgRef.current = new Audio("/fondo1.mp3");
    bgRef.current.loop = true;
    bgRef.current.volume = 0.45;
    bgRef.current.preload = "auto";
    bgRef.current.addEventListener("canplaythrough", () => setBgLoaded(true), { once: true });
    return () => {
      bgRef.current?.pause();
      bgRef.current = null;
    };
  }, []);

  // Play/stop música de fondo según mute
  useEffect(() => {
    if (!bgRef.current) return;
    if (!muted && bgLoaded) {
      bgRef.current.currentTime = 0;
      bgRef.current.play();
    } else {
      bgRef.current.pause();
    }
  }, [muted, bgLoaded]);

  // Sonido de derrota
  useEffect(() => {
    if (triggerLose) {
      if (!loseRef.current) {
        loseRef.current = new Audio("/perdida.mp3");
        loseRef.current.volume = 1;
        loseRef.current.preload = "auto";
      }
      loseRef.current.currentTime = 0;
      loseRef.current.play();
    }
  }, [triggerLose]);

  // Sonido de victoria
  useEffect(() => {
    if (triggerWin) {
      if (!winRef.current) {
        winRef.current = new Audio("/ganada.mp3");
        winRef.current.volume = 1;
        winRef.current.preload = "auto";
      }
      winRef.current.currentTime = 0;
      winRef.current.play();
    }
  }, [triggerWin]);

  // Botón para mutear/desmutear
  return (
    <button
      onClick={onToggleMute}
      className={`z-50 rounded-full p-2 border-2 border-[#FFD600] bg-black/80 text-[#FFD600] shadow-lg hover:bg-[#FFD600] hover:text-black transition-all`}
      style={{ fontSize: 16 }}
      aria-label={muted ? "Activar sonido" : "Desactivar sonido"}
    >
      {muted ? (
        <span role="img" aria-label="Sin sonido">🔇</span>
      ) : (
        <span role="img" aria-label="Sonando">🔊</span>
      )}
    </button>
  );
}
