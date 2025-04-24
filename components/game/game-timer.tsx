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

  // Nuevo diseño: solo un bloque grande y claro
  const isBetting = gamePhase === "BETTING";
  const label = isBetting ? "Apuestas Abiertas" : "Apuestas Cerradas";
  const seconds = Math.max(0, Math.floor(timeLeft / 1000));
  const labelColor = isBetting ? "text-green-400" : "text-red-400";

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 select-none" data-component-name="GameTimer">
      <span className={`text-4xl font-extrabold uppercase tracking-wide drop-shadow-lg mb-1 ${labelColor}`}>{label}</span>
      <span className="text-[4rem] leading-none font-black text-white drop-shadow-xl mb-2">
        {seconds}s
      </span>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 select-none" data-component-name="GameTimer">
      <span className={`text-4xl font-extrabold uppercase tracking-wide drop-shadow-lg mb-1 ${labelColor}`}>{label}</span>
      <span className="text-[4rem] leading-none font-black text-white drop-shadow-xl mb-2">
        {seconds}s
      </span>
    </div>
  );
}
