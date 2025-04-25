"use client"

import { useGame } from "@/context/game-context"
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"

import BetResultModal from "@/components/game/bet-result-modal"

export default function BetHistory() {
  const { bets, candles } = useGame()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [localTimes, setLocalTimes] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Solo calcular en cliente
    const times: Record<string, string> = {};
    bets.forEach((bet) => {
      times[bet.id] = new Date(bet.timestamp).toLocaleTimeString();
    });
    setLocalTimes(times);
    setHydrated(true);
  }, [bets]);

  if (!hydrated) {
    // Evita hydration mismatch
    return null;
  }

  if (bets.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 w-full">
        <p>No hay apuestas realizadas</p>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="h-[500px] w-full lg:h-full lg:w-full">
        <div className="space-y-2 w-full h-full">
        {bets
          .slice()
          .reverse()
          .map((bet) => (
            <div key={bet.id} className={`p-2 rounded-xl border border-yellow-400 flex items-center justify-between w-[calc(100%-2px)] text-sm ${bet.prediction === "BULLISH" ? "bg-green-900/80" : "bg-red-900/80"}`}>
              <div className="flex items-center gap-2">
                {bet.prediction === "BULLISH" ? (
                  <ArrowUpCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-red-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {bet.prediction === "BULLISH" ? "Alcista" : "Bajista"} {bet.timeframe?.replace("m", "min")}
                  </p>
                  <p className="text-sm text-white">{localTimes[bet.id] || ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-white">${bet.amount.toFixed(2)}</span>

                {bet.status === "PENDING" && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
                    <span className="text-sm bg-yellow-500/20 text-yellow-100 px-2 py-0.5 rounded-full">Pendiente</span>
                  </div>
                )}

                {bet.status === "WON" && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {(() => {
                      const resolvedCandle = candles.reduce((prev, curr) => {
                        return Math.abs(curr.timestamp - bet.timestamp) < Math.abs((prev?.timestamp ?? 0) - bet.timestamp)
                          ? curr
                          : prev
                      }, candles[0]);
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
                       const payout = Math.min(999999, bet.amount * multiplier);
                       return <span className="text-green-400 font-medium">+${payout.toFixed(2)}</span>;
                    })()}
                    <button
                      className="ml-2 p-1 rounded hover:bg-zinc-600 transition"
                      title="Ver resultado"
                      onClick={() => {
                        const resolvedCandle = candles.reduce((prev, curr) => {
                          return Math.abs(curr.timestamp - bet.timestamp) < Math.abs((prev?.timestamp ?? 0) - bet.timestamp)
                            ? curr
                            : prev
                        }, candles[0])
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
                         const payout = Math.min(999999, bet.amount * multiplier);
                         setSelectedResult({
                           won: bet.status === "WON",
                           amount: payout,
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
