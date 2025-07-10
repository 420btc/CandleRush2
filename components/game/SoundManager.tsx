"use client";
import { useEffect, useRef, useState } from "react";
import PiFileAudioBold from "@/components/icons/PiFileAudioBold";

// Estilos CSS para el slider personalizado
const sliderStyles = `
  .custom-slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFD600 0%, #FFA500 100%);
    border: 1px solid #FFD600;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(255, 214, 0, 0.4), 0 0 6px rgba(255, 214, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .custom-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(255, 214, 0, 0.6), 0 0 10px rgba(255, 214, 0, 0.3);
  }
  
  .custom-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFD600 0%, #FFA500 100%);
    border: 1px solid #FFD600;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(255, 214, 0, 0.4);
  }
  
  .custom-slider:disabled::-webkit-slider-thumb {
    background: #666;
    border-color: #888;
    box-shadow: none;
  }
  
  .custom-slider:disabled::-moz-range-thumb {
    background: #666;
    border-color: #888;
    box-shadow: none;
  }
`;

interface SoundManagerProps {
  muted: boolean;
  onToggleMute: () => void;
  triggerLose: boolean;
  triggerWin: boolean;
}


export default function SoundManager({ muted, onToggleMute, triggerLose, triggerWin }: SoundManagerProps) {
  // Inyectar estilos CSS una sola vez
  useEffect(() => {
    if (!document.getElementById('sound-manager-styles')) {
      const style = document.createElement('style');
      style.id = 'sound-manager-styles';
      style.innerHTML = sliderStyles;
      document.head.appendChild(style);
    }
  }, []);

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
    <div 
      className="flex flex-row items-center gap-2 rounded-md shadow-lg border border-[#FFD600]/30" 
      style={{
        minWidth:'unset',
        minHeight:'unset',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(40,40,40,0.95) 100%)',
        backdropFilter: 'blur(6px)',
        padding: '6px 8px',
        boxShadow: '0 0 12px rgba(255, 214, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        height: '32px'
      }} 
      data-component-name="SoundManager"
    >
      <button
        onClick={onToggleMute}
        className="flex items-center justify-center rounded-md transition-all duration-200 transform hover:scale-105"
        style={{
          width: 20,
          height: 20,
          minWidth: 20,
          minHeight: 20,
          padding: 0,
          background: muted 
            ? 'linear-gradient(135deg, #666 0%, #444 100%)' 
            : 'linear-gradient(135deg, #FFD600 0%, #FFA500 100%)',
          border: `1px solid ${muted ? '#888' : '#FFD600'}`,
          boxShadow: muted 
            ? '0 1px 4px rgba(0,0,0,0.3)' 
            : '0 1px 6px rgba(255, 214, 0, 0.4), 0 0 10px rgba(255, 214, 0, 0.2)',
        }}
        aria-label={muted ? "Activar sonido" : "Desactivar sonido"}
      >
        <PiFileAudioBold 
          className="h-3 w-3 transition-colors duration-200" 
          style={{ 
            display: 'block', 
            margin: 'auto', 
            color: muted ? '#ccc' : '#000',
            filter: muted ? 'none' : 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))'
          }} 
        />
      </button>
      {/* Control de volumen de música */}
      <div className="flex flex-col items-center gap-0.5">
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={musicVolume}
        onChange={e => setMusicVolume(Number(e.target.value))}
          className="w-16 h-1 rounded-md appearance-none cursor-pointer custom-slider"
          style={{
            background: muted 
              ? 'linear-gradient(to right, #444 0%, #666 100%)' 
              : `linear-gradient(to right, #FFD600 0%, #FFD600 ${musicVolume * 100}%, #333 ${musicVolume * 100}%, #333 100%)`,
            outline: 'none',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.1)'
          }}
        disabled={muted}
        data-component-name="SoundManager"
      />
        <span 
          className="text-xs font-bold transition-colors duration-200"
          style={{ 
            color: muted ? '#888' : '#FFD600',
            textShadow: muted ? 'none' : '0 1px 1px rgba(0,0,0,0.5)',
            fontSize: '10px'
          }}
        >
          {Math.round(musicVolume * 100)}%
        </span>
      </div>
    </div>
  );
}
