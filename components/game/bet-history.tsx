"use client"

import { useGame } from "@/context/game-context"
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

import BetResultModal from "@/components/game/bet-result-modal"
import { useState } from "react"

export default function BetHistory() {
  const { bets, candles } = useGame()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)

  if (bets.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>No hay apuestas realizadas</p>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="h-[500px]">
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
                  <p className="text-sm font-medium">
                    {bet.prediction === "BULLISH" ? "Alcista" : "Bajista"} {bet.timeframe?.replace("m", "min")}
                  </p>
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
                    <button
                      className="ml-2 p-1 rounded hover:bg-zinc-600 transition"
                      title="Ver resultado"
                      onClick={() => {
                        // Buscar la vela asociada en el array de velas por timestamp más cercano
                        const resolvedCandle = candles.reduce((prev, curr) => {
                          return Math.abs(curr.timestamp - bet.timestamp) < Math.abs((prev?.timestamp ?? 0) - bet.timestamp)
                            ? curr
                            : prev
                        }, candles[0])
                        setSelectedResult({
                          won: bet.status === "WON",
                          amount: bet.status === "WON" ? (bet.amount * 0.9) : bet.amount,
                          bet: {
                            prediction: bet.prediction,
                            amount: bet.amount,
                            timestamp: bet.timestamp,
                            symbol: bet.symbol,
                            timeframe: bet.timeframe,
                          },
                          candle: resolvedCandle || { open: 0, close: 0, high: 0, low: 0 },
                          diff: resolvedCandle ? resolvedCandle.close - resolvedCandle.open : 0,
                        })
                        setModalOpen(true)
                      }}
                    >
                      <Eye className="h-5 w-5 text-yellow-400" />
                    </button>
                  </div>
                )}

                {bet.status === "LOST" && (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-medium">-${bet.amount.toFixed(2)}</span>
                    <button
                      className="ml-2 p-1 rounded hover:bg-zinc-600 transition"
                      title="Ver resultado"
                      onClick={() => {
                        const resolvedCandle = candles.reduce((prev, curr) => {
                          return Math.abs(curr.timestamp - bet.timestamp) < Math.abs((prev?.timestamp ?? 0) - bet.timestamp)
                            ? curr
                            : prev
                        }, candles[0])
                        setSelectedResult({
                          won: false,
                          amount: bet.amount,
                          bet: {
                            prediction: bet.prediction,
                            amount: bet.amount,
                            timestamp: bet.timestamp,
                            symbol: bet.symbol,
                            timeframe: bet.timeframe,
                          },
                          candle: resolvedCandle || { open: 0, close: 0, high: 0, low: 0 },
                          diff: resolvedCandle ? resolvedCandle.close - resolvedCandle.open : 0,
                        })
                        setModalOpen(true)
                      }}
                    >
                      <Eye className="h-5 w-5 text-yellow-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </ScrollArea>
    <BetResultModal open={modalOpen} onOpenChange={setModalOpen} result={selectedResult} />
    </>
  )
}
