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

  // Función para eliminar una apuesta específica
  const deleteBet = (betId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta apuesta?')) {
      // Filtrar el bet del array local
      const updatedBets = bets.filter(b => b.id !== betId);
      // Dispatchar el evento para que se actualice el estado global
      window.dispatchEvent(new CustomEvent('deleteBet', { detail: { betId } }));
    }
  };

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
      <div className="text-center py-4 text-zinc-500 w-full">
        <p>No hay apuestas realizadas</p>
      </div>
    )
  }

  return (
    <div className="h-full flex-1 min-h-0 w-full flex flex-col">
      <div className="flex gap-2 mb-1 justify-center">
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
                livePnl = bet.amount * leverage * priceChangePct * (bet.prediction === "BULLISH" ? 1 : -1);
                if (livePnl > 0.01) livePnlColor = "text-green-400";
                else if (livePnl < -0.01) livePnlColor = "text-red-400";
                else livePnlColor = "text-zinc-400";
              }
              return (
                <AnimatedBorder key={bet.id} isActive={bet.status === "PENDING"}>
                  <div className={`py-1 min-h-[48px] rounded-xl border border-yellow-400 flex flex-row items-center max-w-[355px] mx-auto text-xs gap-1 ${bet.prediction === "BULLISH" ? "bg-green-900/80" : "bg-red-900/80"}`}>
                    {/* Icono y dirección */}
                    <div className="flex flex-col items-center justify-center min-w-[28px]">
                      {/* Botón de eliminar */}
                      <button
                        className="absolute right-1.5 top-1 p-0.25 rounded-full bg-black/50 hover:bg-black/70 transition"
                        onClick={() => deleteBet(bet.id)}
                        aria-label="Eliminar apuesta"
                      >
                        <XCircle className="w-3 h-3 text-red-400" />
                      </button>
                      <img
                        src={bet.prediction === "BULLISH" ? "/bull.png" : "/bear.png"}
                        alt={bet.prediction === "BULLISH" ? "Bull" : "Bear"}
                        className="w-5 h-5 object-contain mx-auto"
                      />
                      <span className={`text-[10px] font-bold mt-0.5 ${bet.prediction === "BULLISH" ? "text-green-400" : "text-red-400"}`}>{bet.prediction === "BULLISH" ? "BULL" : "BEAR"}</span>
                    </div>
                    {/* Info principal */}
                    <div className="flex flex-col items-start justify-center min-w-[70px] max-w-[110px] truncate">
                      <span className="text-[12px] font-semibold text-white truncate">
                        {bet.prediction === "BULLISH" ? "Bull" : "Bear"} {bet.timeframe?.replace("m", "min")}
                      </span>
                      <span className="text-[10px] text-white leading-tight truncate">{localTimes[bet.id] || ''}</span>
                      <span className="text-[10px] text-yellow-200 mt-0.5 truncate">O: {bet.entryPrice ? bet.entryPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
                    </div>
                    {/* Monto y PnL */}
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                      <span className="font-extrabold text-yellow-300 text-base md:text-lg text-center leading-tight drop-shadow-sm" style={{letterSpacing: '0.01em'}}>
                        ${bet.amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {/* LIVE PnL en pequeño */}
                      {bet.status === "PENDING" && livePnl !== null && (
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full shadow-sm border mt-1 ${livePnl > 0 ? 'border-green-400 bg-green-600/80' : livePnl < 0 ? 'border-red-400 bg-red-700/80' : 'border-zinc-400 bg-black'} text-white`}
                          style={{minHeight:18, letterSpacing: '0.01em'}}
                        >
                          PnL: {livePnl > 0 ? '+' : ''}{livePnl.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    {/* Status + leverage badge always together */}
                    <div className="flex items-center justify-center gap-1 w-full">
                      {bet.status === "PENDING" && (
                        <>
                          <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
                          <span className="text-sm bg-yellow-500/20 text-yellow-100 px-2 py-0.5 rounded-full">Pendiente</span>
                        </>
                      )}
                      {bet.status === "WON" && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-sm bg-green-500/20 text-green-100 px-2 py-0.5 rounded-full">Ganada</span>
                        </>
                      )}
                      {bet.status === "LOST" && (
                        <>
                          <XCircle className="h-5 w-5 text-red-400" />
                          <span className="text-sm bg-red-500/20 text-red-100 px-2 py-0.5 rounded-full">Perdida</span>
                        </>
                      )}
                      {bet.status === "LIQUIDATED" && (
                        <>
                          <XCircle className="h-5 w-5 text-yellow-400" />
                          <span className="text-sm bg-yellow-500/20 text-yellow-100 px-2 py-0.5 rounded-full">Liquidada</span>
                        </>
                      )}
                      {bet.leverage && bet.leverage > 1 && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-yellow-700/80 text-yellow-200 border border-yellow-400" title={`Apalancamiento usado: ${bet.leverage}x`}>
                          {bet.leverage}x
                        </span>
                      )}
                    </div>
                    {/* Eye button at the end, always compact */}
                    <div className="flex items-center justify-center min-w-[32px]">
                      <button
                        className={`text-yellow-400 transition ${bet.status === 'PENDING' ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </AnimatedBorder>
              );
            })}
          </div>
        </ScrollArea>
      )}
      <BetResultModal open={modalOpen} onOpenChange={setModalOpen} result={selectedResult} />
    </div>
  );
}