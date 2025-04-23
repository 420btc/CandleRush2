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

  const getPhaseLabel = () => {
    switch (gamePhase) {
      case "BETTING":
        return "Fase de apuestas"
      case "RESOLVING":
        return "Resolviendo"
      case "WAITING":
        return `Esperando (${timeframe})`
      default:
        return "Cargando"
    }
  }

  // Devuelve el color del texto para el label de fase
  const getPhaseColor = () => {
    switch (gamePhase) {
      case "BETTING":
        if (timeLeft > 6000) return "text-green-400";
        if (timeLeft > 3000) return "text-orange-400";
        return "text-red-400";
      case "RESOLVING":
        return "text-yellow-400";
      case "WAITING":
        return "text-blue-400";
      default:
        return "text-zinc-400";
    }
  }

  // Determinar el color de fondo del countdown
  const getCountdownBg = () => {
    if (gamePhase !== "BETTING") return "bg-zinc-700";
    if (timeLeft > 6000) return "bg-green-700";
    if (timeLeft > 3000) return "bg-orange-500";
    return "bg-red-600 animate-pulse";
  };

  // BETTING: Large, prominent timer
  if (gamePhase === "BETTING") {
    return (
      <div className="w-full flex flex-col items-center justify-center my-2">
        <div className="text-lg md:text-2xl font-extrabold text-[#FFD600] mb-1 animate-pulse drop-shadow-lg">
          Fase de apuestas
        </div>
        <div className={`flex items-center justify-center rounded-lg shadow-lg px-4 py-2 bg-black border-2 border-yellow-400 animate-pulse`}
             style={{ minWidth: 120 }}>
          <Clock className="h-5 w-5 text-yellow-300 mr-2" />
          <span className="text-3xl md:text-4xl font-extrabold text-green-400">
            {Math.max(0, Math.ceil(timeLeft / 1000))}
          </span>
          <span className="text-lg font-bold text-green-400 ml-1">s</span>
        </div>
      </div>
    )
  }

  // NOT BETTING: Dimmed/closed state
  return (
    <div className="w-full flex flex-col items-center justify-center my-4">
      <div className="text-xl md:text-2xl font-bold text-zinc-400 mb-2">
        Apuestas cerradas
      </div>
      <div className="flex items-center justify-center rounded-lg px-8 py-4 bg-zinc-800 border-4 border-zinc-700 opacity-60" style={{ minWidth: 200 }}>
        <Clock className="h-8 w-8 text-zinc-400 mr-3" />
        <span className="text-4xl font-bold text-zinc-400">
          --
        </span>
      </div>
    </div>
  )
}
