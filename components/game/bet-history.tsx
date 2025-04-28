"use client"

import { useGame } from "@/context/game-context"
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect, useRef } from "react"
import AnimatedBorder from "@/components/game/AnimatedBorder"
import "@/styles/animated-border.css"

import BetResultModal from "@/components/game/bet-result-modal"
import Achievements from "@/components/profile/Achievements";

export default function BetHistory() {
  // Estado para forzar re-render cada segundo
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const [showAchievements, setShowAchievements] = useState(false);
  const { bets, candles, currentCandle, clearBetsForCurrentPairAndTimeframe } = useGame()
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
    const handler = () => clearBetsForCurrentPairAndTimeframe();
    window.addEventListener('clearBets', handler);
    return () => window.removeEventListener('clearBets', handler);
  }, [clearBetsForCurrentPairAndTimeframe]);

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

// ...imports y lógica previa...

return (
  <div className="h-full flex-1 min-h-0 w-full flex flex-col">
    <div className="flex gap-2 mb-3 justify-center">
      <button
        className={`px-3 py-1 rounded-lg font-bold border-2 transition-all text-sm ${!showAchievements ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black/60 text-yellow-400 border-yellow-400 hover:bg-yellow-900/30'}`}
        onClick={() => setShowAchievements(false)}
      >Apuestas</button>
      <button
        className={`px-3 py-1 rounded-lg font-bold border-2 transition-all text-sm ${showAchievements ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black/60 text-yellow-400 border-yellow-400 hover:bg-yellow-900/30'}`}
        onClick={() => setShowAchievements(true)}
      >Logros</button>
    </div>
    {showAchievements ? (
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <Achievements />
      </div>
    ) : (
      <ScrollArea className="h-full flex-1 min-h-0 w-full pb-4">
        <div className="space-y-0">
          {bets.slice().reverse().map((bet) => {
            // --- LIVE PnL (solo si la apuesta está pendiente) ---
            // --- LIVE PnL limpio y robusto ---
            let livePnl: number | null = null;
            let livePnlColor = "text-zinc-400";
            // Usar siempre el precio de cierre de la vela activa
            const priceSource = currentCandle?.close ?? candles[candles.length - 1]?.close;
            if (bet.status === "PENDING" && bet.entryPrice && priceSource) {
              const priceChangePct = (priceSource - bet.entryPrice) / bet.entryPrice;
              const leverage = bet.leverage || 1;
              // Si la predicción es bajista, el PnL se invierte
              livePnl = bet.amount * leverage * priceChangePct * (bet.prediction === "BULLISH" ? 1 : -1);
              if (livePnl > 0.01) livePnlColor = "text-green-400";
              else if (livePnl < -0.01) livePnlColor = "text-red-400";
              else livePnlColor = "text-zinc-400";
            }
            return (
              <AnimatedBorder key={bet.id} isActive={bet.status === "PENDING"}>
                <div className={`py-3 min-h-[80px] rounded-xl border border-yellow-400 flex flex-col md:flex-row items-center justify-between max-w-[355px] mx-auto text-sm ${bet.prediction === "BULLISH" ? "bg-green-900/80" : "bg-red-900/80"}`}>
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
                      <p className="text-xs text-yellow-200 mt-1">Entrada: {bet.entryPrice ? bet.entryPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 w-full">
                    <span className="font-bold text-white text-lg">${bet.amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    {/* LIVE PnL en pequeño */}
                    {bet.status === "PENDING" && livePnl !== null && (
                      <span className={`text-xs font-mono ${livePnlColor}`} style={{minHeight:16}}>
                        PnL: {livePnl > 0 ? "+" : ""}{livePnl.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
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
                    {bet.status === "LIQUIDATED" && (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-5 w-5 text-yellow-400" />
                        <span className="text-sm bg-yellow-500/20 text-yellow-100 px-2 py-0.5 rounded-full">Liquidada</span>
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
                            candle: candles.find(c => bet.resolvedAt ? Math.abs(c.timestamp - bet.resolvedAt) < 2 * 60 * 1000 : Math.abs(c.timestamp - bet.timestamp) < 2 * 60 * 1000) || candles[candles.length - 1],
                            diff: (() => {
                              const candle = candles.find(c => bet.resolvedAt ? Math.abs(c.timestamp - bet.resolvedAt) < 2 * 60 * 1000 : Math.abs(c.timestamp - bet.timestamp) < 2 * 60 * 1000) || candles[candles.length - 1];
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
              </AnimatedBorder>
            );
          })}
        </div>
      </ScrollArea>
    )}
      {/* El modal solo se abre cuando el usuario hace clic en el botón Eye */}
      <BetResultModal open={modalOpen} onOpenChange={setModalOpen} result={selectedResult} />
    </div>
  );
}