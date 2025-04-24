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
      <div className="w-full flex flex-col items-center justify-center my-0">
        <div className="flex items-center justify-between w-full text-sm font-normal text-[#FFD600] animate-pulse">
  <span>Fase de apuestas</span>
  <img src="/portada.png" alt="Logo" className="h-24 w-24 ml-2" style={{objectFit:'contain'}} />
</div>
        <div className={`flex items-center justify-center rounded-lg shadow px-2 py-1 bg-black border border-yellow-400 animate-pulse`}
             style={{ minWidth: 70 }}>
          <Clock className="h-4 w-4 text-yellow-300 mr-1" />
          <span className="text-xl font-extrabold text-green-400">
            {Math.max(0, Math.ceil(timeLeft / 1000))}
          </span>
          <span className="text-base font-bold text-green-400 ml-1">s</span>
        </div>
      </div>
    )
  }

  // NOT BETTING: Dimmed/closed state
  return (
    <div className="w-full flex flex-col items-center justify-center my-0">
      <div className="flex items-center justify-between w-full text-sm font-normal text-zinc-400">
  <span>Apuestas cerradas</span>
  <img src="/portada.png" alt="Logo" className="h-24 w-24 ml-2" style={{objectFit:'contain'}} />
</div>
      <div className="flex items-center justify-center rounded-lg px-2 py-1 bg-zinc-800 border border-zinc-700 opacity-60" style={{ minWidth: 70 }}>
        <Clock className="h-4 w-4 text-zinc-400 mr-1" />
        <span className="text-xl font-bold text-zinc-400">
          --
        </span>
      </div>
    </div>
  )
}
