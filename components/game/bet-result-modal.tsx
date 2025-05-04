"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface BetResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    bet: Bet;
    candle: {
      open: number;
      close: number;
      high: number;
      low: number;
    };
  } | null;
}

import type { Bet } from "@/types/game";

import React, { useRef, useEffect } from "react";
// Lógica de desglose de señales/votos fusionada directamente en este archivo


// Helper para detectar si una apuesta es AutoMix
function isAutoMixBet(bet: Bet): boolean {
  // Busca una entrada en la memoria de AutoMix con timestamp cercano y misma dirección
  try {
    const mem = getAutoMixMemory();
    return mem.some(e => Math.abs(e.timestamp - bet.timestamp) < 60000 && e.direction === bet.prediction);
  } catch {
    return false;
  }
}


// --- COMPONENTE DE DESGLOSE DE SEÑALES/VOTOS ---
import { getAutoMixMemory, getTrendMemory, getVolumeTrendMemory, getValleyMemory, getRsiMemory, getFibonacciMemory } from "@/utils/autoMixMemory";

function findClosestEntry<T extends { timestamp: number }>(arr: T[], timestamp: number, toleranceMs: number = 300000): T | null {
  if (!arr.length) return null;
  
  // Primero intentar encontrar una coincidencia exacta
  const exactMatch = arr.find(e => e.timestamp === timestamp);
  if (exactMatch) return exactMatch;
  
  // Si no hay coincidencia exacta, buscar la más cercana dentro del rango de tolerancia
  let closest: T | null = null;
  let minDiff = toleranceMs;
  
  for (const entry of arr) {
    const diff = Math.abs(entry.timestamp - timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  
  // Si encontramos algo dentro del rango de tolerancia, lo devolvemos
  if (closest && minDiff <= toleranceMs) {
    return closest;
  }
  
  // Si no encontramos nada dentro del rango de tolerancia, devolvemos el más cercano
  return closest;
}

const LABELS: Record<string, string> = {
  majoritySignal: 'Mayoría',
  rsiSignal: 'RSI',
  macdSignal: 'MACD',
  trend: 'Tendencia Velas',
  volume: 'Tendencia Volumen',
  volumeVote: 'Voto Volumen',
};

function BetSignalsBreakdown({ bet }: { bet: Bet }) {
  // Buscar la entrada de memoria de AutoMix para este timestamp
  const autoMixMem = React.useMemo(() => getAutoMixMemory(), []);
  const trendMem = React.useMemo(() => getTrendMemory(), []);
  const volumeMem = React.useMemo(() => getVolumeTrendMemory(), []);
  const valleyMem = React.useMemo(() => getValleyMemory(), []);
  const rsiMem = React.useMemo(() => getRsiMemory(), []);
  const fibonacciMem = React.useMemo(() => getFibonacciMemory(), []);

  // Buscar primero por betId, luego por timestamp si no hay match exacto
  const entry = React.useMemo(() => {
    let found = null;
    if (!bet.id) {
      found = findClosestEntry(autoMixMem, bet.timestamp, 60000);
      if (!found) {
        console.warn('[BET RESULT MODAL][MEMORY] No se encontró entrada AutoMix por timestamp', { bet });
        console.log('[BET RESULT MODAL][MEMORY] Memoria actual:', autoMixMem.slice(-5));
      }
      return found;
    }
    const byId = autoMixMem.find(e => e.betId === bet.id);
    if (byId) return byId;
    found = findClosestEntry(autoMixMem, bet.timestamp, 60000);
    if (!found) {
      console.warn('[BET RESULT MODAL][MEMORY] No se encontró entrada AutoMix por betId ni timestamp', { bet });
      console.log('[BET RESULT MODAL][MEMORY] Memoria actual:', autoMixMem.slice(-5));
    }
    return found;
  }, [autoMixMem, bet.id, bet.timestamp]);
  const rsiEntry = React.useMemo(() => findClosestEntry(rsiMem, bet.timestamp, 60000), [rsiMem, bet.timestamp]);
  const fibonacciEntry = React.useMemo(() => findClosestEntry(fibonacciMem, bet.timestamp, 60000), [fibonacciMem, bet.timestamp]);
  const trendEntry = React.useMemo(() => findClosestEntry(trendMem, bet.timestamp, 60000), [trendMem, bet.timestamp]);
  const volumeEntry = React.useMemo(() => findClosestEntry(volumeMem, bet.timestamp, 60000), [volumeMem, bet.timestamp]);
  const valleyEntry = React.useMemo(() => findClosestEntry(valleyMem, bet.timestamp, 60000), [valleyMem, bet.timestamp]);

  // Determinar el voto de valle a mostrar: prioridad memoria de valle, luego memoria principal, luego 'Sin dato'
  const displayValleyVote = valleyEntry?.valleyVote ?? entry?.valleyVote ?? null;

  // Mostrar mensaje especial si la apuesta fue aleatoria
  if (entry?.wasRandom) {
    return (
      <div className="mt-1 rounded-lg border-2 border-yellow-400 bg-black/90 p-3 text-left shadow-md">
        <div className="font-bold text-yellow-300 text-xs mb-1 leading-tight">AutoMix: Decisión aleatoria</div>
        <div className="text-white text-sm">
          Esta apuesta fue tomada de forma <b>aleatoria</b> (modo suerte, 5%), por lo que no hay desglose de votos de señales.<br />
          <span className="text-yellow-400">La decisión fue tomada al azar para simular el factor de suerte.</span>
        </div>
      </div>
    );
  }

  // Calcular señales presentes y total
  const totalSignals = 7;
  const signalsPresent = [
    rsiEntry?.rsiSignal,
    fibonacciEntry?.fibVote,
    entry?.majoritySignal,
    entry?.macdSignal,
    displayValleyVote,
    trendEntry?.trend,
    volumeEntry?.vote
  ].filter(v => v === "BULLISH" || v === "BEARISH").length;

  // Si no hay datos relevantes, no mostrar nada
  if (!entry && !rsiEntry && !fibonacciEntry && !trendEntry && !volumeEntry && !valleyEntry) return null;

  // Cálculo de votos ponderados
  let bullishVotes = 0;
  let bearishVotes = 0;
  if (rsiEntry?.rsiSignal === "BULLISH") bullishVotes++;
  if (rsiEntry?.rsiSignal === "BEARISH") bearishVotes++;
  if (displayValleyVote === "BULLISH") bullishVotes++;
  if (displayValleyVote === "BEARISH") bearishVotes++;
  if (entry?.majoritySignal === "BULLISH") bullishVotes++;
  if (entry?.majoritySignal === "BEARISH") bearishVotes++;
  if (entry?.macdSignal === "BULLISH") bullishVotes++;
  if (entry?.macdSignal === "BEARISH") bearishVotes++;
  if (fibonacciEntry?.fibVote === "BULLISH") bullishVotes++;
  if (fibonacciEntry?.fibVote === "BEARISH") bearishVotes++;
  if (trendEntry?.trend === "BULLISH") bullishVotes++;
  if (trendEntry?.trend === "BEARISH") bearishVotes++;
  const displayVolumeVote = entry?.volumeVote ?? volumeEntry?.vote ?? null;
  if (displayVolumeVote === "BULLISH") bullishVotes++;
  if (displayVolumeVote === "BEARISH") bearishVotes++;
  const totalVotes = bullishVotes + bearishVotes;
  let mainMajority = null;
  if (bullishVotes > bearishVotes) mainMajority = 'BULLISH';
  else if (bearishVotes > bullishVotes) mainMajority = 'BEARISH';
  else if (bullishVotes === bearishVotes && totalVotes > 0) mainMajority = 'EMPATE';
  const pctBull = totalVotes > 0 ? (bullishVotes / totalVotes * 100).toFixed(1) : '0.0';
  const pctBear = totalVotes > 0 ? (bearishVotes / totalVotes * 100).toFixed(1) : '0.0';

  return (
    <div className="mt-1 rounded-lg border-2 border-yellow-400 bg-black/90 p-1 text-left shadow-md">
      <div className="font-bold text-yellow-300 text-xs mb-0.5 leading-tight">Desglose de señales/votos</div>
      <div className="flex flex-wrap gap-1 mb-0.5">
        <span className="bg-yellow-400 rounded px-1 py-0.5 text-black text-[11px] font-mono border border-yellow-400">
          Dirección: <b>{entry?.direction ?? bet.prediction ?? 'Sin dato'}</b>
          {(() => {
            if (entry?.emaPositionVote === 'BULLISH') return ' (EMA 55/200: BULLISH)';
            if (entry?.emaPositionVote === 'BEARISH') return ' (EMA 55/200: BEARISH)';
            if (entry && 'emaPositionVote' in entry && entry.emaPositionVote === null) return ' (EMA 55/200: Zona neutra)';
            if (!entry || !('emaPositionVote' in entry)) return ' (EMA 55/200: Sin dato)';
            return '';
          })()}
        </span>
        <span className="bg-yellow-400 rounded px-1 py-0.5 text-black text-[11px] font-mono border border-yellow-400">
          {entry?.crossSignal === 'GOLDEN_CROSS' && 'Golden Cross: Se produjo un cruce alcista'}
          {entry?.crossSignal === 'DEATH_CROSS' && 'Death Cross: Se produjo un cruce bajista'}
          {entry && 'crossSignal' in entry && entry.crossSignal === null && 'No hubo Golden Cross ni Death Cross en este momento (se comprobó, pero no ocurrió ningún cruce).'}
          {(!entry || !('crossSignal' in entry)) && 'No se pudo comprobar el cruce para esta apuesta (dato no disponible).'}
        </span>
      </div>
      <div className={`grid gap-2 mt-2`}>
        <div className={`col-span-4 md:col-span-8 bg-black/80 text-yellow-200 rounded px-2 py-1 text-[14px] font-bold flex items-center justify-center border-2 border-yellow-400 shadow-lg mb-2`}>
          <span className="text-lg">🔝 Mayoría de votos: <b>{mainMajority === 'EMPATE' ? 'Empate' : (mainMajority ?? 'Sin dato')}</b> <span className="text-xs">({pctBull}% Bullish / {pctBear}% Bearish)</span></span>
          <span className="block text-[10px] text-white font-light mt-0.5">Nota: Todas las señales valen 1 voto</span>
        </div>
        <div className="col-span-4 md:col-span-8 flex flex-row gap-2 justify-center mb-2">
          <span className="bg-green-900/70 text-yellow-300 rounded px-2 py-0.5 text-xs font-mono">Bullish: {bullishVotes}</span>
          <span className="bg-red-900/70 text-yellow-300 rounded px-2 py-0.5 text-xs font-mono">Bearish: {bearishVotes}</span>
          <span className="bg-neutral-800/80 text-neutral-300 rounded px-2 py-0.5 text-xs font-mono">Total: {signalsPresent}/{totalSignals}</span>
          <span className="text-[10px] text-neutral-300 font-mono ml-2 align-middle">
            RSI:{rsiEntry?.rsiSignal === 'BULLISH' ? '+1' : rsiEntry?.rsiSignal === 'BEARISH' ? '-1' : 'Sin dato'},
            Fib:{fibonacciEntry?.fibVote === 'BULLISH' ? '+1' : fibonacciEntry?.fibVote === 'BEARISH' ? '-1' : 'Sin dato'},
            Mayoría:{entry?.majoritySignal === 'BULLISH' ? '+1' : entry?.majoritySignal === 'BEARISH' ? '-1' : 'Sin dato'},
            MACD:{entry?.macdSignal === 'BULLISH' ? '+1' : entry?.macdSignal === 'BEARISH' ? '-1' : 'Sin dato'},
            Valle:{displayValleyVote === 'BULLISH' ? '+1' : displayValleyVote === 'BEARISH' ? '-1' : 'Sin dato'},
            Tend:{trendEntry?.trend === 'BULLISH' ? '+1' : trendEntry?.trend === 'BEARISH' ? '-1' : 'Sin dato'},
            Vol:{volumeEntry?.vote === 'BULLISH' ? '+1' : volumeEntry?.vote === 'BEARISH' ? '-1' : 'Sin dato'}
          </span>
        </div>
        {/* Tarjetas individuales */}
        <div className={`${rsiEntry?.rsiSignal === 'BULLISH' || entry?.rsiSignal === 'BULLISH'
          ? 'bg-green-900/70'
          : (rsiEntry?.rsiSignal === 'BEARISH' || entry?.rsiSignal === 'BEARISH')
            ? 'bg-red-900/70'
            : (rsiEntry?.rsi !== undefined && rsiEntry.rsi >= 40 && rsiEntry.rsi <= 60)
              ? 'bg-blue-900/70' // zona neutra (RSI entre 40-60)
              : 'bg-neutral-800/80'
        } text-yellow-300 rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>RSI:</b> <span className="font-mono">{rsiEntry?.rsiSignal === 'BULLISH' ? 'BULLISH' : rsiEntry?.rsiSignal === 'BEARISH' ? 'BEARISH' : (rsiEntry?.rsi !== undefined && rsiEntry.rsi >= 40 && rsiEntry.rsi <= 60) ? 'Zona neutra' : 'Sin dato'} ({rsiEntry?.rsi !== undefined ? rsiEntry.rsi.toFixed(2) : 'Sin dato'})</span>
        </div>
        <div className={`${entry?.macdSignal === 'BULLISH' ? 'bg-green-900/70' : entry?.macdSignal === 'BEARISH' ? 'bg-red-900/70' : 'bg-black/60'} rounded px-1 py-0.5 text-yellow-300 text-[11px] leading-tight`}>
          <b>MACD:</b> <span className="font-mono">{entry?.macdSignal ? entry.macdSignal : 'Sin dato'} ({entry?.macd !== undefined ? entry.macd.toFixed(2) : 'Sin dato'})</span>
        </div>
        <div className={`${fibonacciEntry?.fibVote === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : fibonacciEntry?.fibVote === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Fibonacci:</b> <span className="font-mono">{fibonacciEntry?.fibVote ?? 'Sin dato'}{fibonacciEntry?.level ? ` (${fibonacciEntry.level})` : ''} {fibonacciEntry?.price !== undefined ? `@${fibonacciEntry.price.toFixed(2)}` : ''}</span>
        </div>
        <div className={`${valleyEntry?.valleyVote === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : valleyEntry?.valleyVote === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Valle:</b> <span className="font-mono">{valleyEntry?.valleyVote ?? 'Sin dato'}</span>
        </div>
        <div className={`${trendEntry?.trend === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : trendEntry?.trend === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Tend. Velas:</b> <span className="font-mono">{trendEntry?.trend ?? 'Sin dato'}</span>
        </div>
        <div className={`${(volumeEntry?.vote === 'BULLISH' || (!volumeEntry && entry?.direction === 'BULLISH')) ? 'bg-green-900/70 text-yellow-300' : (volumeEntry?.vote === 'BEARISH' || (!volumeEntry && entry?.direction === 'BEARISH')) ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Tend. Volumen:</b> <span className="font-mono">{volumeEntry ? (volumeEntry.vote ?? entry?.direction ?? 'Sin dato') : (entry?.direction ?? 'Sin dato')}</span>
          <span className="ml-2 text-xs">{volumeEntry ? `Vol1: ${volumeEntry.avgVol1?.toFixed(2)}, Vol2: ${volumeEntry.avgVol2?.toFixed(2)}, ${volumeEntry.volumeTrend === 'UP' ? '▲' : '▼'} (${volumeEntry.majority})` : ''}</span>
        </div>
        <div className={`${entry?.majoritySignal === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : entry?.majoritySignal === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Mayoría:</b> <span className="font-mono">{entry?.majoritySignal ?? 'Sin dato'}</span>
        </div>
      </div>
    </div>
  );
}

export default function BetResultModal({ open, onOpenChange, result }: BetResultModalProps) {
  const liquidatedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [played, setPlayed] = React.useState(false);
  useEffect(() => {
    // Reset played when modal closes or result cambia
    if (!open || !result || !(result.bet.status === 'LIQUIDATED' || result.bet.wasLiquidated)) {
      setPlayed(false);
      if (liquidatedAudioRef.current) {
        liquidatedAudioRef.current.pause();
        liquidatedAudioRef.current.currentTime = 0;
      }
      return;
    }
    if (!played) {
      setPlayed(true);
      if (liquidatedAudioRef.current) {
        liquidatedAudioRef.current.currentTime = 0;
        liquidatedAudioRef.current.play();
      }
    }
  }, [open, result, played]);

  if (!result) return null;
  const { bet, candle } = result;
  const openPrice = bet.entryPrice ?? candle.open;
  const closePrice = candle.close;
  const diff = closePrice - openPrice;
  const wasLiquidated = bet.status === 'LIQUIDATED' || bet.wasLiquidated;
  const won = bet.status === 'WON';
  return (
    <>
      <audio ref={liquidatedAudioRef} src="/liquidated.mp3" preload="auto" style={{ display: 'none' }} />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center max-w-lg p-8 rounded-2xl border-4 shadow-2xl border-yellow-400 bg-black">
        <DialogHeader>
          <DialogTitle className="text-3xl font-extrabold mb-1 flex items-center justify-center gap-2"
            style={{letterSpacing:'-1px'}}>
            {wasLiquidated ? (
              <>
                <ArrowDownCircle className="inline h-8 w-8 text-yellow-400 mr-1" />
                <span className="flex items-center gap-1">
                  <span className="text-white">LIQUIDADO</span>
                  <span className="text-2xl text-white">💀</span>
                </span>
              </>
            ) : won ? (
              <>
                <ArrowUpCircle className="inline h-8 w-8 text-green-400 mr-1" />
                <span className="text-white">¡Ganaste!</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="inline h-8 w-8 text-red-400 mr-1" />
                <span className="text-white">Perdiste</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="rounded-xl p-4 border text-lg font-bold border-yellow-400 bg-black"
            style={{color: '#FFD600'}}>{wasLiquidated ? (
              <>
                Ganancia: <span className="font-mono text-2xl ml-2 text-yellow-400">0 $</span>
                {bet.liquidationFee && bet.liquidationFee > 0 && (
                  <div className="mt-2 text-lg font-bold text-red-500 bg-yellow-900/70 rounded-lg px-3 py-2 border border-yellow-400 animate-pulse">
                    Penalización por liquidación: <span className="text-yellow-300">-{bet.liquidationFee.toFixed(2)} $</span>
                  </div>
                )}
              </>
            ) : (
              <>
                Ganancia: <span className={`font-mono text-2xl ml-2 ${won ? 'text-green-400' : 'text-red-400'}`}>{(bet.winnings ?? 0) > 0 ? `+${(bet.winnings ?? 0).toFixed(2)}` : (bet.winnings ?? 0).toFixed(2)} $</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 justify-center text-xl font-bold mt-2">
            {bet.prediction === "BULLISH" ? <ArrowUpCircle className="h-7 w-7 text-green-400" /> : <ArrowDownCircle className="h-7 w-7 text-red-400" />}
            <span className={bet.prediction === "BULLISH" ? "text-green-300" : "text-red-300"}>{bet.prediction === "BULLISH" ? "Alcista" : "Bajista"}</span>
            <span className="text-yellow-400 ml-2">{bet.symbol} <span className="text-white">({bet.timeframe})</span></span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 mb-2" style={{letterSpacing:'0.03em'}}>
            {new Date(bet.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-6 text-base">
            <div className="rounded-xl p-4 min-w-[90px] border-2 border-yellow-400 bg-black flex flex-col items-center">
              <div className="text-yellow-400 mb-1">Apertura</div>
              <div className="font-mono text-xl text-white break-words">{openPrice.toFixed(2)}</div>
            </div>
            <div className="rounded-xl p-4 min-w-[90px] border-2 border-yellow-400 bg-black flex flex-col items-center">
              <div className="text-yellow-400 mb-1">Cierre</div>
              <div className="font-mono text-xl text-white break-words">{closePrice.toFixed(2)}</div>
            </div>
            <div className="rounded-xl p-4 min-w-[90px] border-2 border-yellow-400 bg-black flex flex-col items-center">
              <div className="text-yellow-400 mb-1">Diferencia</div>
              <div className={`font-mono text-xl break-words ${diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-white"}`}>{diff > 0 ? "+" : ""}${diff.toFixed(2)}</div>
            </div>
          </div>
          {/* Desglose de señales/votos (fusionado, visible para cualquier apuesta si hay datos) */}
          <BetSignalsBreakdown bet={bet} />
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
