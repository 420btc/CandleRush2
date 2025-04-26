"use client"

import { useGame } from "@/context/game-context"
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"

import BetResultModal from "@/components/game/bet-result-modal"

export default function BetHistory() {
  const { bets, candles, clearBets } = useGame()
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

  // Suscribirse al evento global para limpiar historial
  useEffect(() => {
    const handler = () => clearBets();
    window.addEventListener('clearBets', handler);
    return () => window.removeEventListener('clearBets', handler);
  }, [clearBets]);

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
    <div className="h-full flex-1 min-h-0 w-full flex flex-col">
      <ScrollArea className="h-full flex-1 min-h-0 w-full pb-4">
        <div className="space-y-0">
          {bets
            .slice()
            .reverse()
            .map((bet) => (
              <div key={bet.id} className={`py-3 min-h-[80px] rounded-xl border border-yellow-400 flex flex-col md:flex-row items-center justify-between max-w-[280px] mx-auto text-sm ${bet.prediction === "BULLISH" ? "bg-green-900/80" : "bg-red-900/80"}`}>
                <div className="flex items-center gap-4 w-full md:w-1/2">
                  <div className="flex flex-col items-center justify-center min-w-[36px]">
                    <img
                      src={bet.prediction === "BULLISH" ? "/bull.png" : "/bear.png"}
                      alt={bet.prediction === "BULLISH" ? "Bull" : "Bear"}
                      className="w-7 h-7 object-contain mx-auto"
                    />
                    <span className={`text-xs font-bold mt-1 ${bet.prediction === "BULLISH" ? "text-green-400" : "text-red-400"}`}>{bet.prediction === "BULLISH" ? "BULL" : "BEAR"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {bet.prediction === "BULLISH" ? "Alcista" : "Bajista"} {bet.timeframe?.replace("m", "min")}
                    </p>
                    <p className="text-sm text-white">{localTimes[bet.id] || ''}</p>
                    {/* Mostrar precio de entrada */}
                    <p className="text-xs text-yellow-200 mt-1">Entrada: {(() => {
                      const candle = candles.reduce((prev, curr) => {
                        return Math.abs(curr.timestamp - bet.timestamp) < Math.abs((prev?.timestamp ?? 0) - bet.timestamp)
                          ? curr
                          : prev
                      }, candles[0]);
                      return candle?.open?.toFixed(2) ?? '-';
                    })()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="font-bold text-white text-lg">${bet.amount.toFixed(2)}</span>
                  {bet.status === "PENDING" && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
                      <span className="text-sm bg-yellow-500/20 text-yellow-100 px-2 py-0.5 rounded-full">Pendiente</span>
                    </div>
                  )}
                  {bet.status === "WON" && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-sm bg-green-500/20 text-green-100 px-2 py-0.5 rounded-full">Ganada</span>
                    </div>
                  )}
                  {bet.status === "LOST" && (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <span className="text-sm bg-red-500/20 text-red-100 px-2 py-0.5 rounded-full">Perdida</span>
                    </div>
                  )}
                  <button
                    className={`mt-1 px-2 py-1 bg-yellow-700/20 rounded-lg text-yellow-400 transition flex items-center justify-center ${bet.status === 'PENDING' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-yellow-700/40'}`}
                    disabled={bet.status === 'PENDING'}
                    onClick={() => {
                      if (bet.status !== 'PENDING') {
                        setSelectedResult({
                          won: bet.status === "WON",
                          amount: bet.amount,
                          bet,
                          candle: candles.find(c => Math.abs(c.timestamp - bet.timestamp) < 2 * 60 * 1000) || candles[candles.length - 1],
                          diff: (() => {
                            const candle = candles.find(c => Math.abs(c.timestamp - bet.timestamp) < 2 * 60 * 1000) || candles[candles.length - 1];
                            return candle ? candle.close - candle.open : 0;
                          })()
                        });
                        setModalOpen(true);
                      }
                    }}
                  >
                    <Eye className="h-5 w-5 text-yellow-400" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
      <BetResultModal open={modalOpen} onOpenChange={setModalOpen} result={selectedResult} />
    </div>
  )
}
