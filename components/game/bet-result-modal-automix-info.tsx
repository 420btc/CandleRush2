import React from "react";
import { getAutoMixMemory, AutoMixMemoryEntry, getTrendMemory, getVolumeTrendMemory, TrendMemoryEntry, VolumeTrendMemoryEntry } from "@/utils/autoMixMemory";

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

  const entry: AutoMixMemoryEntry | null = React.useMemo(() => {
    // Buscar por timestamp más cercano (tolerancia 60s)
    return findClosestEntry(autoMixMem, betTimestamp, 60000);
  }, [autoMixMem, betTimestamp]);

  const trendEntry: TrendMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(trendMem, betTimestamp, 60000);
  }, [trendMem, betTimestamp]);

  const volumeEntry: VolumeTrendMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(volumeMem, betTimestamp, 60000);
  }, [volumeMem, betTimestamp]);

  if (!entry) return null;

  return (
    <div className="mt-4 rounded-xl border-2 border-yellow-400 bg-black/80 p-4 text-left">
      <div className="font-bold text-yellow-300 text-lg mb-2">AutoMix: Decisión y votos</div>
      <div className="flex flex-wrap gap-3 mb-2">
        <span className="bg-yellow-900/80 rounded px-3 py-1 text-yellow-200 text-sm font-mono">Dirección: <b>{entry.direction}</b></span>
        <span className="bg-yellow-900/80 rounded px-3 py-1 text-yellow-200 text-sm font-mono">Resultado: <b>{entry.result}</b></span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        <div className="bg-yellow-800/30 rounded-lg px-3 py-2">
          <b>Mayoría:</b> <span className="font-mono">{entry.majoritySignal ?? '-'}</span>
        </div>
        <div className="bg-yellow-800/30 rounded-lg px-3 py-2">
          <b>RSI:</b> <span className="font-mono">{entry.rsiSignal ?? '-'} ({entry.rsi?.toFixed(2)})</span>
        </div>
        <div className="bg-yellow-800/30 rounded-lg px-3 py-2">
          <b>MACD:</b> <span className="font-mono">{entry.macdSignal ?? '-'} (MACD: {entry.macd?.toFixed(2)}, Signal: {entry.macdSignalLine?.toFixed(2)})</span>
        </div>
        <div className="bg-yellow-800/30 rounded-lg px-3 py-2">
          <b>Tendencia Velas:</b> <span className="font-mono">{trendEntry?.trend ?? '-'}</span>
          <span className="ml-2 text-xs">Bulls: {trendEntry?.bullishCount ?? '-'}, Bears: {trendEntry?.bearishCount ?? '-'}</span>
        </div>
        <div className="bg-yellow-800/30 rounded-lg px-3 py-2 col-span-2 md:col-span-1">
          <b>Tendencia Volumen:</b> <span className="font-mono">{volumeEntry?.vote ?? '-'}</span>
          <span className="ml-2 text-xs">{volumeEntry ? `Vol1: ${volumeEntry.avgVol1.toFixed(2)}, Vol2: ${volumeEntry.avgVol2.toFixed(2)}, ${volumeEntry.volumeTrend === 'UP' ? '▲' : '▼'} (${volumeEntry.majority})` : ''}</span>
        </div>
      </div>
    </div>
  );
};
