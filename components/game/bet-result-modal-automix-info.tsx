import React from "react";
import { getAutoMixMemory, AutoMixMemoryEntry, getTrendMemory, getVolumeTrendMemory, TrendMemoryEntry, VolumeTrendMemoryEntry, getValleyMemory, ValleyMemoryEntry, getRsiMemory, RsiMemoryEntry } from "@/utils/autoMixMemory";

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

  const entry: AutoMixMemoryEntry | null = React.useMemo(() => {
    // Buscar por timestamp más cercano (tolerancia 60s)
    return findClosestEntry(autoMixMem, betTimestamp, 60000);
  }, [autoMixMem, betTimestamp]);

  const rsiEntry: RsiMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(rsiMem, betTimestamp, 60000);
  }, [rsiMem, betTimestamp]);

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 mt-0.5">
        {/* Mayoría */}
        <div className={`${entry.majoritySignal === 'BULLISH' ? 'bg-green-900/70' : entry.majoritySignal === 'BEARISH' ? 'bg-red-900/70' : 'bg-black/60'} rounded px-1 py-0.5 text-yellow-300 text-[11px] leading-tight`}>
          <b>Mayoría:</b> <span className="font-mono">{entry.majoritySignal ?? '-'}</span>
        </div>
        {/* RSI */}
        <div className={`${rsiEntry?.rsiSignal === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : rsiEntry?.rsiSignal === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>RSI:</b> <span className="font-mono">{rsiEntry?.rsiSignal ? rsiEntry.rsiSignal : 'Sin dato'} ({rsiEntry?.rsi !== undefined ? rsiEntry.rsi.toFixed(2) : 'Sin dato'})</span>
        </div>
        {/* MACD */}
        <div className={`${entry.macdSignal === 'BULLISH' ? 'bg-green-900/70' : entry.macdSignal === 'BEARISH' ? 'bg-red-900/70' : 'bg-black/60'} rounded px-1 py-0.5 text-yellow-300 text-[11px] leading-tight`}>
          <b>MACD:</b> <span className="font-mono">{entry.macdSignal ?? '-'} (MACD: {entry.macd?.toFixed(2)}, Signal: {entry.macdSignalLine?.toFixed(2)})</span>
        </div>
        {/* Valle */}
        <div className={`${displayValleyVote === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : displayValleyVote === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Valle:</b> <span className="font-mono">{displayValleyVote ? displayValleyVote : 'Sin dato'}</span>
        </div>
        {/* Tendencia Velas */}
        <div className={`${trendEntry?.trend === 'BULLISH' ? 'bg-green-900/70' : trendEntry?.trend === 'BEARISH' ? 'bg-red-900/70' : 'bg-black/60'} rounded px-1 py-0.5 text-yellow-300 text-[11px] leading-tight`}>
          <b>Tendencia Velas:</b> <span className="font-mono">{trendEntry?.trend ?? 'Sin dato'}</span>
          <span className="ml-2 text-xs">{trendEntry ? `Bull: ${trendEntry.bullishCount}, Bear: ${trendEntry.bearishCount}` : ''}</span>
        </div>
        {/* Tendencia Volumen */}
        <div className={`${volumeEntry?.vote === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : volumeEntry?.vote === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Tendencia Volumen:</b> <span className="font-mono">{volumeEntry?.vote ?? 'Sin dato'}</span>
          <span className="ml-2 text-xs">{volumeEntry ? `Vol1: ${volumeEntry.avgVol1.toFixed(2)}, Vol2: ${volumeEntry.avgVol2.toFixed(2)}, ${volumeEntry.volumeTrend === 'UP' ? '▲' : '▼'} (${volumeEntry.majority})` : ''}</span>
        </div>
      </div>
    </div>
  );
};
