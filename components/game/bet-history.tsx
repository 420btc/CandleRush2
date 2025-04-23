"use client"

import { useGame } from "@/context/game-context"
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function BetHistory() {
  const { bets } = useGame()

  if (bets.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>No hay apuestas realizadas</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {bets
          .slice()
          .reverse()
          .map((bet) => (
            <div key={bet.id} className="p-3 rounded-lg bg-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {bet.prediction === "BULLISH" ? (
                  <ArrowUpCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-red-400" />
                )}
                <div>
                  <p className="text-sm font-medium">{bet.prediction === "BULLISH" ? "Alcista" : "Bajista"}</p>
                  <p className="text-xs text-zinc-400">{new Date(bet.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">${bet.amount.toFixed(2)}</span>

                {bet.status === "PENDING" && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-yellow-400 animate-pulse" />
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Pendiente</span>
                  </div>
                )}

                {bet.status === "WON" && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">+${(bet.amount * 1.9).toFixed(2)}</span>
                  </div>
                )}

                {bet.status === "LOST" && (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-medium">-${bet.amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </ScrollArea>
  )
}
