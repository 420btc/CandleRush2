"use client";
import { useEffect, useRef, useState } from "react";

interface SoundManagerProps {
  muted: boolean;
  onToggleMute: () => void;
  triggerLose: boolean;
  triggerWin: boolean;
}

export default function SoundManager({ muted, onToggleMute, triggerLose, triggerWin }: SoundManagerProps) {
  // Refs para sonidos de victoria y derrota
  const loseRef = useRef<HTMLAudioElement | null>(null);
  const winRef = useRef<HTMLAudioElement | null>(null);
  // Secuencia de música de fondo
  const bgTracks = ["/fondo1.mp3", "/fondo2.mp3", "/fondo3.mp3"];
  const bgRefs = useRef<HTMLAudioElement[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Precarga todos los fondos al montar
  useEffect(() => {
    bgRefs.current = bgTracks.map((src, idx) => {
      const audio = new Audio(src);
      audio.volume = 0.45;
      audio.preload = "auto";
      // Solo marcar como cargado cuando el primero esté listo
      if (idx === 0) {
        audio.addEventListener("canplaythrough", () => setBgLoaded(true), { once: true });
      }
      return audio;
    });
    return () => {
      bgRefs.current.forEach(audio => audio.pause());
    };
  }, []);

  // Manejar reproducción secuencial y mute
  useEffect(() => {
    if (!bgLoaded) return;
    if (muted) {
      bgRefs.current.forEach(audio => audio.pause());
      return;
    }
    const currentAudio = bgRefs.current[currentTrack];
    if (!currentAudio) return;
    currentAudio.currentTime = 0;
    currentAudio.play();
    const handleEnded = () => {
      const next = (currentTrack + 1) % bgTracks.length;
      setCurrentTrack(next);
    };
    currentAudio.onended = handleEnded;
    return () => {
      currentAudio.onended = null;
      currentAudio.pause();
    };
  }, [muted, bgLoaded, currentTrack]);

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
