"use client";
import { useEffect, useRef, useState } from "react";

interface SoundManagerProps {
  muted: boolean;
  onToggleMute: () => void;
  triggerLose: boolean;
  triggerWin: boolean;
}


export default function SoundManager({ muted, onToggleMute, triggerLose, triggerWin }: SoundManagerProps) {
  // Estado para detectar si el usuario ya interactuó
  const [hasInteracted, setHasInteracted] = useState(false);
  useEffect(() => {
    const enable = () => setHasInteracted(true);
    window.addEventListener('pointerdown', enable, { once: true });
    window.addEventListener('keydown', enable, { once: true });
    return () => {
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
    };
  }, []);
  // Volumen de música de fondo
  const [musicVolume, setMusicVolume] = useState(0.45);

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
      audio.volume = musicVolume;
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

  // Actualizar volumen de música de fondo en tiempo real
  useEffect(() => {
    bgRefs.current.forEach(audio => {
      audio.volume = musicVolume;
    });
  }, [musicVolume]);

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
    // Fade in
    currentAudio.volume = 0;
    if (hasInteracted) {
      currentAudio.play();
    }
    let fadeInVol = 0;
    const fadeStep = 0.05;
    const fadeInterval = setInterval(() => {
      fadeInVol = Math.min(musicVolume, fadeInVol + fadeStep);
      currentAudio.volume = fadeInVol;
      if (fadeInVol >= musicVolume) {
        clearInterval(fadeInterval);
      }
    }, 40);
    const handleEnded = () => {
      // Fade out antes de cambiar de pista
      let fadeOutVol = currentAudio.volume;
      const fadeStep = 0.05;
      const fadeInterval = setInterval(() => {
        fadeOutVol = Math.max(0, fadeOutVol - fadeStep);
        currentAudio.volume = fadeOutVol;
        if (fadeOutVol <= 0) {
          clearInterval(fadeInterval);
          currentAudio.pause();
          const next = (currentTrack + 1) % bgTracks.length;
          setCurrentTrack(next);
        }
      }, 40);
    };
    currentAudio.onended = handleEnded;
    return () => {
      currentAudio.onended = null;
      currentAudio.pause();
    };
  }, [muted, bgLoaded, currentTrack, musicVolume]);

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

  // Botón para mutear/desmutear y slider de volumen
  return (
    <div className="flex flex-row items-center gap-1 bg-black/80 p-2 rounded-lg shadow-lg" style={{minWidth:'unset',minHeight:'unset'}} data-component-name="SoundManager">
      <button
        onClick={onToggleMute}
        className="flex items-center justify-center rounded p-1 border-2 border-[#FFD600] bg-transparent text-[#FFD600] hover:bg-[#FFD600] hover:text-black transition-all"
        style={{width:28,height:28,minWidth:28,minHeight:28,padding:0}}
        aria-label={muted ? "Activar sonido" : "Desactivar sonido"}
      >
        {muted ? (
          // VolumeX de lucide-react
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={2} style={{ display: 'block', margin: 'auto' }}>
            <path d="M9 9v6h4l5 5V4l-5 5H9z" />
            <line x1="18" y1="6" x2="6" y2="18" stroke="#FFD600" strokeWidth={2}/>
          </svg>
        ) : (
          // Volume2 de lucide-react
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={2} style={{ display: 'block', margin: 'auto' }}>
            <polygon points="11 5 6 9H2v6h4l5 4V5z" stroke="#FFD600" strokeLinejoin="round" strokeWidth={2} fill="none"/>
            <path d="M19 12c0-1.657-1.343-3-3-3m3 3c0 1.657-1.343 3-3 3m3-3h0" stroke="#FFD600" strokeWidth={2} fill="none"/>
          </svg>
        )}
      </button>
      {/* Control de volumen de música */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={musicVolume}
        onChange={e => setMusicVolume(Number(e.target.value))}
        className="w-20 accent-yellow-400"
        disabled={muted}
        data-component-name="SoundManager"
      />
    </div>
  );
}
