"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/context/game-context"
import { Clock } from "lucide-react"
import { formatTime } from "@/utils/formatTime"
import FlipDigits from "./FlipDigits"

export default function GameTimer() {
  const { gamePhase, nextPhaseTime, nextCandleTime, timeframe } = useGame()
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Si estamos en fase de apuestas, mostrar el tiempo hasta que termine
      if (gamePhase === "BETTING" && nextPhaseTime) {
        const now = Date.now()
        return Math.max(0, nextPhaseTime - now)
      }

      // Si estamos en fase de espera, mostrar el tiempo hasta la próxima vela
      if (gamePhase === "WAITING" && nextCandleTime) {
        const now = Date.now()
        return Math.max(0, nextCandleTime - now)
      }

      return 0
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [nextPhaseTime, nextCandleTime, gamePhase])

  // Etiqueta y color según fase
  const isBetting = gamePhase === "BETTING";
  const label = isBetting ? "Apuestas Abiertas" : "Apuestas Cerradas";
  const labelColor = isBetting ? "text-green-400" : "text-red-400";

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 select-none" data-component-name="GameTimer">
      <span style={{ position: 'relative', display: 'inline-block' }}>
        {/* Glow background */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '110%',
            height: '70%',
            borderRadius: '30%',
            filter: 'blur(22px)',
            opacity: label === 'Apuestas Abiertas' ? 0.36 : 0.33,
            background: label === 'Apuestas Abiertas' ? '#00FF85' : '#FF2222',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        {/* Text label */}
        <span className={`text-4xl font-extrabold uppercase tracking-wide drop-shadow-lg mb-1 ${labelColor}`}
              style={{ position: 'relative', zIndex: 1 }}>
          {label}
        </span>
      </span>
      <FlipDigits value={formatTime(timeLeft)} className="text-[4rem] leading-none font-black text-white drop-shadow-xl mb-2" />
    </div>
  );
}
