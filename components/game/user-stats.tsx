"use client"

import { useGame } from "@/context/game-context"
import { TrendingUp, TrendingDown, Percent, DollarSign } from "lucide-react"

export default function UserStats() {
  const { userBalance, bets } = useGame()

  // Calculate stats
  const totalBets = bets.length
  const wonBets = bets.filter((bet) => bet.status === "WON").length
  const lostBets = bets.filter((bet) => bet.status === "LOST").length
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0

  // Calculate profit/loss
  const totalWon = bets.filter((bet) => bet.status === "WON").reduce((sum, bet) => sum + bet.amount * 0.9, 0)

  const totalLost = bets.filter((bet) => bet.status === "LOST").reduce((sum, bet) => sum + bet.amount, 0)

  const profitLoss = totalWon - totalLost
  const isProfitable = profitLoss >= 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          <span className="text-sm">Balance</span>
        </div>
        <span className="font-bold text-lg">${userBalance.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isProfitable ? (
            <TrendingUp className="h-5 w-5 text-green-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-400" />
          )}
          <span className="text-sm">Ganancias/Pérdidas</span>
        </div>
        <span className={`font-bold ${isProfitable ? "text-green-400" : "text-red-400"}`}>
          {isProfitable ? "+" : ""}
          {profitLoss.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-blue-400" />
          <span className="text-sm">Tasa de victorias</span>
        </div>
        <span className="font-bold">{winRate.toFixed(1)}%</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-zinc-700 p-2 rounded-lg text-center">
          <p className="text-xs text-zinc-400">Total</p>
          <p className="font-bold">{totalBets}</p>
        </div>
        <div className="bg-green-900/30 p-2 rounded-lg text-center">
          <p className="text-xs text-green-400">Ganadas</p>
          <p className="font-bold text-green-400">{wonBets}</p>
        </div>
        <div className="bg-red-900/30 p-2 rounded-lg text-center">
          <p className="text-xs text-red-400">Perdidas</p>
          <p className="font-bold text-red-400">{lostBets}</p>
        </div>
      </div>
    </div>
  )
}
