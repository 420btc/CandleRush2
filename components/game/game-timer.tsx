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

  const getPhaseColor = () => {
    switch (gamePhase) {
      case "BETTING":
        return "text-green-400"
      case "RESOLVING":
        return "text-yellow-400"
      case "WAITING":
        return "text-blue-400"
      default:
        return "text-zinc-400"
    }
  }

  // Determinar si debemos mostrar el countdown prominente
  const showCountdown = gamePhase === "BETTING" && timeLeft <= 10000

  return (
    <div className="flex items-center gap-2">
      <div className={`text-sm font-medium ${getPhaseColor()}`}>{getPhaseLabel()}</div>
      <div
        className={`flex items-center gap-1 ${showCountdown ? "bg-red-600 animate-pulse" : "bg-zinc-700"} px-2 py-1 rounded text-sm`}
      >
        <Clock className="h-3 w-3" />
        <span>{formatTime(timeLeft)}</span>
      </div>
    </div>
  )
}
