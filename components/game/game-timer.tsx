"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/context/game-context"
import { Clock } from "lucide-react"

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

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)

    // Si es más de un minuto, mostrar minutos y segundos
    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes}m ${seconds}s`
    }

    // Si es menos de un minuto, solo mostrar segundos
    return `${totalSeconds}s`
  }

  // Etiqueta y color según fase
  const isBetting = gamePhase === "BETTING";
  const label = isBetting ? "Apuestas Abiertas" : "Apuestas Cerradas";
  const labelColor = isBetting ? "text-green-400" : "text-red-400";

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 select-none" data-component-name="GameTimer">
      <span className={`text-4xl font-extrabold uppercase tracking-wide drop-shadow-lg mb-1 ${labelColor}`}>{label}</span>
      <span className="text-[4rem] leading-none font-black text-white drop-shadow-xl mb-2">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}
