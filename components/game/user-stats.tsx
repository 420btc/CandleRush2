"use client"

import { useGame } from "@/context/game-context"
import { TrendingUp, TrendingDown, Percent, DollarSign } from "lucide-react"

export default function UserStats() {
  const { bets, userBalance } = useGame()

  // Calcular la racha real de victorias consecutivas
  let realStreak = 0;
  for (let i = bets.length - 1; i >= 0; i--) {
    if (bets[i].status === "WON") {
      realStreak++;
    } else if (bets[i].status === "LOST") {
      break;
    }
  }

  // Calculate stats
  const totalBets = bets.length
  const wonBets = bets.filter((bet) => bet.status === "WON").length
  const lostBets = bets.filter((bet) => bet.status === "LOST").length
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0

  const balance = userBalance;
  const profitLoss = balance - 100;
  const isProfitable = profitLoss >= 0;

  return (
    <div className="space-y-4 text-white">
      {/* Rachas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {realStreak >= 3 ? (
            <span className="text-orange-400 animate-pulse text-2xl">🔥</span>
          ) : (
            <span className="text-zinc-400 text-xl">🏁</span>
          )}
          <span className="text-sm">Racha actual</span>
        </div>
        <span className={`font-bold text-lg ${realStreak >= 3 ? "text-orange-400" : ""} ${realStreak >= 1 ? "animate-shake" : ""}`}>{realStreak}</span>
      </div>
      <style jsx>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.5s infinite;
          display: inline-block;
        }
      `}</style>
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5 text-green-400" />
          <span className="text-sm text-white">Balance</span>
        </div>
        <span className="font-bold text-lg text-white">${balance.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-white">
          {isProfitable ? (
            <TrendingUp className="h-5 w-5 text-green-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-400" />
          )}
          <span className="text-sm text-white">Ganancias/Pérdidas</span>
        </div>
        <span className={`font-bold text-lg ${isProfitable ? "text-green-400" : "text-red-400"}`}>{isProfitable ? "+" : ""}{profitLoss.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-white">
          <Percent className="h-5 w-5 text-blue-400" />
          <span className="text-sm text-white">Tasa de victorias</span>
        </div>
        <span className="font-bold text-lg text-white">{winRate.toFixed(1)}%</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-white">
        <div className="bg-zinc-900/60 p-2 rounded-lg text-center text-white">
          <p className="text-xs text-zinc-400 text-white">Total</p>
          <p className="font-bold text-white">{totalBets}</p>
        </div>
        <div className="bg-green-900/30 p-2 rounded-lg text-center text-white">
          <p className="text-xs text-green-400 text-white">Ganadas</p>
          <p className="font-bold text-green-400 text-white">{wonBets}</p>
        </div>
        <div className="bg-red-900/30 p-2 rounded-lg text-center text-white">
          <p className="text-xs text-red-400 text-white">Perdidas</p>
          <p className="font-bold text-red-400 text-white">{lostBets}</p>
        </div>
      </div>
    </div>
  )
}
