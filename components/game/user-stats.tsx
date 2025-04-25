"use client"

import { useGame } from "@/context/game-context"
import { TrendingUp, TrendingDown, Percent, DollarSign } from "lucide-react"

export default function UserStats() {
  const { bets } = useGame()

  // Calculate stats
  const totalBets = bets.length
  const wonBets = bets.filter((bet) => bet.status === "WON").length
  const lostBets = bets.filter((bet) => bet.status === "LOST").length
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0

  // Lógica de balance real con payout escalonado
  const { candles } = useGame();
  let balance = bets.length === 0 ? 0 : 100;
  bets.forEach((bet) => {
    // Busca la vela más cercana por timestamp
    const resolvedCandle = candles.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - bet.timestamp) < Math.abs((prev?.timestamp ?? 0) - bet.timestamp)
        ? curr
        : prev;
    }, candles[0]);
    if (!resolvedCandle) return;
    const open = resolvedCandle.open;
    const close = resolvedCandle.close;
    const movement = Math.abs(close - open);
    let multiplier = 1;
    if (movement < 10) multiplier = 1.1;
    else if (movement < 20) multiplier = 1.2;
    else if (movement < 50) multiplier = 1.5;
    else if (movement < 100) multiplier = 2.5;
    else if (movement < 200) multiplier = 5;
    else if (movement < 500) multiplier = 15;
    else if (movement < 800) multiplier = 40;
    else if (movement < 1500) multiplier = 70;
    else multiplier = 100;
    if (bet.status === "WON") {
      balance += bet.amount * (multiplier - 1);
    } else if (bet.status === "LOST") {
      balance -= bet.amount;
    }
  });

  // Calculate profit/loss
  const profitLoss = bets.length === 0 ? 0 : balance - 100;
  const isProfitable = profitLoss >= 0;

  return (
    <div className="space-y-4 text-white">
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
