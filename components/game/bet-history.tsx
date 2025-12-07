"use client"

import { useGame } from "@/context/game-context"
import { useDevice } from "@/context/device-mode-context"
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect, useRef } from "react"
import AnimatedBorder from "@/components/game/AnimatedBorder"
import "@/styles/animated-border.css"

import BetResultModal from "@/components/game/bet-result-modal"

export default function BetHistory() {
  const { isMobile } = useDevice()
  // Estado para forzar re-render cada segundo
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
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

  // Render skeleton while hydrating or if not hydrated
  if (!hydrated) {
    return (
      <div className="h-full flex-1 min-h-0 w-full flex flex-col overflow-hidden">
        <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'} mb-1 justify-center shrink-0`}>
          <div className={`${isMobile ? 'px-2 py-1' : 'px-3 py-1'} w-20 h-8 rounded-lg bg-zinc-800 animate-pulse`} />
          <div className={`${isMobile ? 'px-2 py-1' : 'px-3 py-1'} w-20 h-8 rounded-lg bg-zinc-800 animate-pulse`} />
        </div>
        <div className="flex-1 w-full bg-zinc-900/20 animate-pulse rounded-xl mt-2" />
      </div>
    );
  }

  return (
    <div className="h-full flex-1 min-h-0 w-full flex flex-col overflow-hidden">
      {bets.length === 0 ? (
        <div className="text-center py-4 text-zinc-500 w-full flex-1 flex flex-col items-center justify-center">
          <p>No hay apuestas realizadas</p>
        </div>
      ) : (
        <ScrollArea className="h-full flex-1 min-h-0 w-full">
          <div className={`${isMobile ? 'space-y-1' : 'space-y-0'} pb-4 pr-3`}>
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
                  <div className={`${isMobile ? 'py-1 min-h-[44px]' : 'py-1 min-h-[48px]'} rounded-xl border border-yellow-400 flex flex-row items-center w-full mx-auto ${isMobile ? 'text-xs' : 'text-xs'} ${isMobile ? 'gap-0.5' : 'gap-1'} ${bet.prediction === "BULLISH" ? "bg-green-900/80" : "bg-red-900/80"}`}>
                    {/* Icono y dirección */}
                    <div className={`flex flex-col items-center justify-center ${isMobile ? 'min-w-[24px]' : 'min-w-[28px]'}`}>
                      {/* Botón de eliminar */}
                      <button
                        className={`absolute ${isMobile ? 'right-0.5 top-0.5 p-0.5' : 'right-1 top-1 p-1'} rounded-full bg-black/70 hover:bg-black/90 transition z-10`}
                        onClick={() => deleteBet(bet.id)}
                        aria-label="Eliminar apuesta"
                      >
                        <XCircle className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-red-400`} />
                      </button>
                      <img
                        src={bet.prediction === "BULLISH" ? "/bull.png" : "/bear.png"}
                        alt={bet.prediction === "BULLISH" ? "Bull" : "Bear"}
                        className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} object-contain mx-auto`}
                      />
                      <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-bold mt-0.5 ${bet.prediction === "BULLISH" ? "text-green-400" : "text-red-400"}`}>{bet.prediction === "BULLISH" ? "BULL" : "BEAR"}</span>
                    </div>
                    {/* Info principal */}
                    <div className={`flex flex-col items-start justify-center ${isMobile ? 'min-w-[50px] max-w-[70px]' : 'min-w-[60px] max-w-[90px]'} truncate`}>
                      <span className={`${isMobile ? 'text-[10px]' : 'text-[12px]'} font-semibold text-white truncate`}>
                        {bet.prediction === "BULLISH" ? "Bull" : "Bear"} {bet.timeframe?.replace("m", "min")}
                      </span>
                      <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-white leading-tight truncate`}>{localTimes[bet.id] || ''}</span>
                      <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-yellow-200 mt-0.5 truncate`}>O: {bet.entryPrice ? bet.entryPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
                    </div>
                    {/* Monto y PnL */}
                    <div className={`flex flex-col items-center justify-center ${isMobile ? 'min-w-[55px] max-w-[70px]' : 'min-w-[70px] max-w-[90px]'} flex-shrink-0`}>
                      <span className={`font-extrabold text-yellow-300 ${isMobile ? 'text-sm' : 'text-base md:text-lg'} text-center leading-tight drop-shadow-sm`} style={{ letterSpacing: '0.01em' }}>
                        ${bet.amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {/* LIVE PnL en pequeño */}
                      {bet.status === "PENDING" && livePnl !== null && (
                        <span
                          className={`${isMobile ? 'text-[10px] px-1 py-0.5' : 'text-xs px-2 py-0.5'} font-bold font-mono rounded-full shadow-sm border mt-1 ${livePnl > 0 ? 'border-green-400 bg-green-600/80' : livePnl < 0 ? 'border-red-400 bg-red-700/80' : 'border-zinc-400 bg-black'} text-white`}
                          style={{ minHeight: isMobile ? 16 : 18, letterSpacing: '0.01em' }}
                        >
                          PnL: {livePnl > 0 ? '+' : ''}{livePnl.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    {/* Status + leverage badge always together */}
                    <div className={`flex items-center justify-center ${isMobile ? 'gap-0.5' : 'gap-1'} flex-1 ${isMobile ? 'min-w-[60px] max-w-[90px]' : 'min-w-[80px] max-w-[120px]'}`}>
                      {bet.status === "PENDING" && (
                        <>
                          <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-yellow-400 animate-pulse`} />
                          <span className={`${isMobile ? 'text-[10px] px-1 py-0.5' : 'text-sm px-2 py-0.5'} bg-yellow-500/20 text-yellow-100 rounded-full`}>Pendiente</span>
                        </>
                      )}
                      {bet.status === "WON" && (
                        <>
                          <CheckCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-400`} />
                          <span className={`${isMobile ? 'text-[10px] px-1 py-0.5' : 'text-sm px-2 py-0.5'} bg-green-500/20 text-green-100 rounded-full`}>Ganada</span>
                        </>
                      )}
                      {bet.status === "LOST" && (
                        <>
                          <XCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-red-400`} />
                          <span className={`${isMobile ? 'text-[10px] px-1 py-0.5' : 'text-sm px-2 py-0.5'} bg-red-500/20 text-red-100 rounded-full`}>Perdida</span>
                        </>
                      )}
                      {bet.status === "LIQUIDATED" && (
                        <>
                          <XCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-yellow-400`} />
                          <span className={`${isMobile ? 'text-[10px] px-1 py-0.5' : 'text-sm px-2 py-0.5'} bg-yellow-500/20 text-yellow-100 rounded-full`}>Liquidada</span>
                        </>
                      )}
                      {bet.leverage && bet.leverage > 1 && (
                        <span className={`${isMobile ? 'text-[9px] px-1 py-0.5' : 'text-xs px-1.5 py-0.5'} font-bold rounded-full bg-yellow-700/80 text-yellow-200 border border-yellow-400`} title={`Apalancamiento usado: ${bet.leverage}x`}>
                          {bet.leverage}x
                        </span>
                      )}
                    </div>
                    {/* Eye button at the end, always compact */}
                    <div className={`flex items-center justify-center ${isMobile ? 'min-w-[32px]' : 'min-w-[40px]'} flex-shrink-0`}>
                      <button
                        className={`text-yellow-400 transition ${bet.status === 'PENDING' ? 'opacity-40 cursor-not-allowed' : ''}`}
                        disabled={bet.status === 'PENDING'}
                        onClick={() => {
                          if (bet.status !== 'PENDING') {
                            // Buscar la vela correspondiente usando múltiples criterios
                            const resolvedCandle = (() => {
                              // 1. Primero intentar por resolvedAt si existe
                              if (bet.resolvedAt) {
                                const byResolved = candles.find(c => Math.abs(c.timestamp - bet.resolvedAt!) < 2 * 60 * 1000);
                                if (byResolved) return byResolved;
                              }

                              // 2. Luego intentar por candleTimestamp si existe
                              if (bet.candleTimestamp) {
                                const byCandleTimestamp = candles.find(c => Math.abs(c.timestamp - bet.candleTimestamp!) < 2 * 60 * 1000);
                                if (byCandleTimestamp) return byCandleTimestamp;
                              }

                              // 3. Finalmente por timestamp de la apuesta
                              const byTimestamp = candles.find(c => Math.abs(c.timestamp - bet.timestamp) < 2 * 60 * 1000);
                              if (byTimestamp) return byTimestamp;

                              // 4. Fallback a la última vela
                              return candles[candles.length - 1];
                            })();

                            setSelectedResult({
                              won: bet.status === "WON",
                              amount: bet.amount,
                              bet,
                              candle: resolvedCandle,
                              diff: resolvedCandle ? resolvedCandle.close - resolvedCandle.open : 0
                            });
                            setModalOpen(true);
                          }
                        }}
                      >
                        <Eye className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                      </button>
                    </div>
                  </div>
                </AnimatedBorder>
              );
            })}
          </div>
        </ScrollArea>
      )
      }
      <BetResultModal open={modalOpen} onOpenChange={setModalOpen} result={selectedResult} />
    </div>
  );
}
