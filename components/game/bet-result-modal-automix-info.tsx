import React from "react";
import { getAutoMixMemory, AutoMixMemoryEntry, getTrendMemory, getVolumeTrendMemory, TrendMemoryEntry, VolumeTrendMemoryEntry, getValleyMemory, ValleyMemoryEntry, getRsiMemory, RsiMemoryEntry, getFibonacciMemory, FibonacciMemoryEntry } from "@/utils/autoMixMemory";

interface AutoMixInfoProps {
  betId: string;
  betTimestamp: number;
}

// Utilidad para encontrar la entrada de memoria más cercana a un timestamp dado
function findClosestEntry<T extends { timestamp: number }>(arr: T[], timestamp: number, toleranceMs: number = 60000): T | null {
  if (!arr.length) return null;
  let closest: T | null = null;
  let minDiff = toleranceMs;
  for (const entry of arr) {
    const diff = Math.abs(entry.timestamp - timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  return closest;
}

const LABELS: Record<string, string> = {
  majoritySignal: 'Mayoría',
  rsiSignal: 'RSI',
  macdSignal: 'MACD',
  trend: 'Tendencia Velas',
  volume: 'Tendencia Volumen',
};

export const BetResultAutoMixInfo: React.FC<AutoMixInfoProps> = ({ betId, betTimestamp }) => {
  // Buscar la entrada de memoria de AutoMix para este timestamp
  const autoMixMem = React.useMemo(() => getAutoMixMemory(), []);
  const trendMem = React.useMemo(() => getTrendMemory(), []);
  const volumeMem = React.useMemo(() => getVolumeTrendMemory(), []);

  const valleyMem = React.useMemo(() => getValleyMemory(), []);
  const rsiMem = React.useMemo(() => getRsiMemory(), []);
  const fibonacciMem = React.useMemo(() => getFibonacciMemory(), []);

  const entry: AutoMixMemoryEntry | null = React.useMemo(() => {
    // Buscar por timestamp más cercano (tolerancia 60s)
    return findClosestEntry(autoMixMem, betTimestamp, 60000);
  }, [autoMixMem, betTimestamp]);

  const rsiEntry: RsiMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(rsiMem, betTimestamp, 60000);
  }, [rsiMem, betTimestamp]);

  const fibonacciEntry: FibonacciMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(fibonacciMem, betTimestamp, 60000);
  }, [fibonacciMem, betTimestamp]);

  const trendEntry: TrendMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(trendMem, betTimestamp, 60000);
  }, [trendMem, betTimestamp]);

  const volumeEntry: VolumeTrendMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(volumeMem, betTimestamp, 60000);
  }, [volumeMem, betTimestamp]);

  const valleyEntry: ValleyMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(valleyMem, betTimestamp, 60000);
  }, [valleyMem, betTimestamp]);

  if (!entry) return null;

  // Determinar el voto de valle a mostrar: prioridad memoria de valle, luego memoria principal, luego 'Sin dato'
  const displayValleyVote = valleyEntry?.valleyVote ?? entry.valleyVote ?? null;

  return (
    <div className="mt-1 rounded-lg border-2 border-yellow-400 bg-black/90 p-1 text-left shadow-md">
      <div className="font-bold text-yellow-300 text-xs mb-0.5 leading-tight">AutoMix: Decisión y votos</div>
      <div className="flex flex-wrap gap-1 mb-0.5">
        <span className="bg-yellow-400 rounded px-1 py-0.5 text-black text-[11px] font-mono border border-yellow-400">Dirección: <b>{entry.direction}</b></span>
        <span className="bg-yellow-400 rounded px-1 py-0.5 text-black text-[11px] font-mono border border-yellow-400">Resultado: <b>{entry.result}</b></span>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-2">
        {/* Mayoría */}
        <div className={`${entry.majoritySignal === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : entry.majoritySignal === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Mayoría:</b> <span className="font-mono">{entry.majoritySignal ?? '-'}</span>
        </div>
        {/* RSI */}
        <div className={`${(rsiEntry?.rsiSignal === 'BULLISH' || (!rsiEntry || rsiEntry.rsiSignal == null) && entry.direction === 'BULLISH') ? 'bg-green-900/70 text-yellow-300' : (rsiEntry?.rsiSignal === 'BEARISH' || (!rsiEntry || rsiEntry.rsiSignal == null) && entry.direction === 'BEARISH') ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
  <b>RSI:</b> <span className="font-mono">{rsiEntry ? (rsiEntry.rsiSignal ?? entry.direction) : entry.direction} ({rsiEntry?.rsi !== undefined ? rsiEntry.rsi.toFixed(2) : 'Sin dato'})</span>
</div>
        {/* MACD */}
        <div className={`${entry.macdSignal === 'BULLISH' ? 'bg-green-900/70' : entry.macdSignal === 'BEARISH' ? 'bg-red-900/70' : 'bg-black/60'} rounded px-1 py-0.5 text-yellow-300 text-[11px] leading-tight`}>
          <b>MACD:</b> <span className="font-mono">{entry.macdSignal ? entry.macdSignal : 'Sin dato'} ({entry.macd !== undefined ? entry.macd.toFixed(2) : 'Sin dato'})</span>
        </div>
        {/* Fibonacci */}
        <div className={`${fibonacciEntry?.fibVote === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : fibonacciEntry?.fibVote === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Fibonacci:</b> <span className="font-mono">{fibonacciEntry?.fibVote ?? 'Sin dato'}{fibonacciEntry?.level ? ` (${fibonacciEntry.level})` : ''} {fibonacciEntry?.price !== undefined ? `@${fibonacciEntry.price.toFixed(2)}` : ''}</span>
        </div>
        {/* Valle */}
        <div className={`${valleyEntry?.valleyVote === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : valleyEntry?.valleyVote === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Valle:</b> <span className="font-mono">{valleyEntry?.valleyVote ?? 'Sin dato'}</span>
        </div>
        {/* Tendencia Velas */}
        <div className={`${trendEntry?.trend === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : trendEntry?.trend === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Tend. Velas:</b> <span className="font-mono">{trendEntry?.trend ?? 'Sin dato'}</span>
        </div>
        {/* Tendencia Volumen */}
        <div className={`${(volumeEntry?.vote === 'BULLISH' || (!volumeEntry || volumeEntry.vote == null) && entry.direction === 'BULLISH') ? 'bg-green-900/70 text-yellow-300' : (volumeEntry?.vote === 'BEARISH' || (!volumeEntry || volumeEntry.vote == null) && entry.direction === 'BEARISH') ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
  <b>Tend. Volumen:</b> <span className="font-mono">{volumeEntry ? (volumeEntry.vote ?? entry.direction) : entry.direction}</span>
  <span className="ml-2 text-xs">{volumeEntry ? `Vol1: ${volumeEntry.avgVol1.toFixed(2)}, Vol2: ${volumeEntry.avgVol2.toFixed(2)}, ${volumeEntry.volumeTrend === 'UP' ? '▲' : '▼'} (${volumeEntry.majority})` : ''}</span>
</div>
      </div>
    </div>
  );
};
