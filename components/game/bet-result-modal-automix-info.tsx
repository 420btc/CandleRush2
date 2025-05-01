import React from "react";
import { getAutoMixMemory, AutoMixMemoryEntry, getTrendMemory, getVolumeTrendMemory, TrendMemoryEntry, VolumeTrendMemoryEntry, getValleyMemory, ValleyMemoryEntry, getRsiMemory, RsiMemoryEntry, getFibonacciMemory, FibonacciMemoryEntry } from "@/utils/autoMixMemory";

interface AutoMixInfoProps {
  betId: string;
  betTimestamp: number;
}

// Utilidad para encontrar la entrada de memoria más cercana a un timestamp dado
function findClosestEntry<T extends { timestamp: number }>(arr: T[], timestamp: number, toleranceMs: number = 180000): T | null {
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
  volumeVote: 'Voto Volumen',
};

export const BetResultAutoMixInfo: React.FC<AutoMixInfoProps> = ({ betId, betTimestamp }) => {
  // Buscar la entrada de memoria de AutoMix para este timestamp
  const autoMixMem = React.useMemo(() => getAutoMixMemory(), []);
  const trendMem = React.useMemo(() => getTrendMemory(), []);
  const volumeMem = React.useMemo(() => getVolumeTrendMemory(), []);
  const valleyMem = React.useMemo(() => getValleyMemory(), []);
  const rsiMem = React.useMemo(() => getRsiMemory(), []);
  const fibonacciMem = React.useMemo(() => getFibonacciMemory(), []);

  // --- Inicialización de todas las entradas de memoria ---
  const entry: AutoMixMemoryEntry | null = React.useMemo(() => {
    return findClosestEntry(autoMixMem, betTimestamp, 60000);
  }, [autoMixMem, betTimestamp]);
  const rsiEntry: RsiMemoryEntry | null = React.useMemo(() => findClosestEntry(rsiMem, betTimestamp, 60000), [rsiMem, betTimestamp]);
  const fibonacciEntry: FibonacciMemoryEntry | null = React.useMemo(() => findClosestEntry(fibonacciMem, betTimestamp, 60000), [fibonacciMem, betTimestamp]);
  const trendEntry: TrendMemoryEntry | null = React.useMemo(() => findClosestEntry(trendMem, betTimestamp, 60000), [trendMem, betTimestamp]);
  const volumeEntry: VolumeTrendMemoryEntry | null = React.useMemo(() => findClosestEntry(volumeMem, betTimestamp, 60000), [volumeMem, betTimestamp]);
  const valleyEntry: ValleyMemoryEntry | null = React.useMemo(() => findClosestEntry(valleyMem, betTimestamp, 60000), [valleyMem, betTimestamp]);

  // Determinar el voto de valle a mostrar: prioridad memoria de valle, luego memoria principal, luego 'Sin dato'
  const displayValleyVote = valleyEntry?.valleyVote ?? entry?.valleyVote ?? null;

  // --- Cálculo de mayoría de votos ponderados SOLO si no fue aleatorio ---
  const getMajorityVotes = () => {
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
    if (fibonacciEntry?.fibVote === "BULLISH") bullishVotes += 2;
    if (fibonacciEntry?.fibVote === "BEARISH") bearishVotes += 2;
    if (trendEntry?.trend === "BULLISH") bullishVotes++;
    if (trendEntry?.trend === "BEARISH") bearishVotes++;
    // Usar volumeVote de la entrada principal si está disponible, sino fallback a volumeEntry?.vote
    const displayVolumeVote = entry?.volumeVote ?? volumeEntry?.vote ?? null;
    if (displayVolumeVote === "BULLISH") bullishVotes++;
    if (displayVolumeVote === "BEARISH") bearishVotes++;
    const totalVotes = bullishVotes + bearishVotes;
    let mainMajority = null;
    if (bullishVotes > bearishVotes) mainMajority = 'BULLISH';
    else if (bearishVotes > bullishVotes) mainMajority = 'BEARISH';
    else if (bullishVotes === bearishVotes && totalVotes > 0) mainMajority = 'EMPATE';
    return {bullishVotes, bearishVotes, totalVotes, mainMajority};
  };
  const {bullishVotes, bearishVotes, totalVotes, mainMajority} = entry?.wasRandom ? {bullishVotes:0,bearishVotes:0,totalVotes:0,mainMajority:null} : getMajorityVotes();

  if (!entry) return null;

  // Mostrar mensaje especial si la apuesta fue aleatoria
  if (entry.wasRandom) {
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

return (
    <div className="mt-1 rounded-lg border-2 border-yellow-400 bg-black/90 p-1 text-left shadow-md">
      <div className="font-bold text-yellow-300 text-xs mb-0.5 leading-tight">AutoMix: Decisión y votos</div>
      <div className="flex flex-wrap gap-1 mb-0.5">
        <span className="bg-yellow-400 rounded px-1 py-0.5 text-black text-[11px] font-mono border border-yellow-400">
          Dirección: <b>{entry?.direction ?? 'Sin dato'}</b>
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
        {/* Tarjeta GRANDE de mayoría de votos ponderados */}
        {(() => {
          // Cálculo de votos ponderados
          let bullishVotes = 0;
          let bearishVotes = 0;
          // RSI: 1 voto
          if (rsiEntry?.rsiSignal === "BULLISH") bullishVotes++;
          if (rsiEntry?.rsiSignal === "BEARISH") bearishVotes++;
          // Valle
          if (displayValleyVote === "BULLISH") bullishVotes++;
          if (displayValleyVote === "BEARISH") bearishVotes++;
          // MajoritySignal
          if (entry?.majoritySignal === "BULLISH") bullishVotes++;
          if (entry?.majoritySignal === "BEARISH") bearishVotes++;
          // MACD
          if (entry?.macdSignal === "BULLISH") bullishVotes++;
          if (entry?.macdSignal === "BEARISH") bearishVotes++;
          // Fibonacci: 1 voto
          if (fibonacciEntry?.fibVote === "BULLISH") bullishVotes++;
          if (fibonacciEntry?.fibVote === "BEARISH") bearishVotes++;
          // Tendencia
          if (trendEntry?.trend === "BULLISH") bullishVotes++;
          if (trendEntry?.trend === "BEARISH") bearishVotes++;
          // Tendencia volumen
          if (volumeEntry?.vote === "BULLISH") bullishVotes++;
          if (volumeEntry?.vote === "BEARISH") bearishVotes++;
          const totalVotes = bullishVotes + bearishVotes;
          const pctBull = totalVotes > 0 ? (bullishVotes / totalVotes * 100).toFixed(1) : '0.0';
          const pctBear = totalVotes > 0 ? (bearishVotes / totalVotes * 100).toFixed(1) : '0.0';
          let mainMajority = null;
          if (bullishVotes > bearishVotes) mainMajority = 'BULLISH';
          else if (bearishVotes > bullishVotes) mainMajority = 'BEARISH';
          else if (bullishVotes === bearishVotes && totalVotes > 0) mainMajority = 'EMPATE';
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
          return (
            <>
              <div className={`col-span-4 md:col-span-8 bg-black/80 text-yellow-200 rounded px-2 py-1 text-[14px] font-bold flex items-center justify-center border-2 border-yellow-400 shadow-lg mb-2`}>
                <span className="text-lg">🔝 Mayoría de votos: <b>{mainMajority === 'EMPATE' ? 'Empate' : (mainMajority ?? 'Sin dato')}</b> <span className="text-xs">({pctBull}% Bullish / {pctBear}% Bearish)</span></span>
<span className="block text-[10px] text-white font-light mt-0.5">Nota: Todas las señales valen 1 voto</span>
              </div>
              {/* Desglose de votos */}
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
            </>
          );
        })()}
        {/* Octava tarjeta: Aleatoria */}
        {entry.wasRandom && (
          <div className="col-span-4 md:col-span-8 bg-yellow-400 text-black rounded px-2 py-1 text-[15px] font-bold flex items-center justify-center border-2 border-yellow-600 animate-pulse mb-2">
            <span>🃏 Decisión <b>ALEATORIA</b> (5%)</span>
          </div>
        )}
        {/* Tarjetas individuales */}
        {/* RSI Detallado */}
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
        {/* MACD Detallado */}
        <div className={`${entry.macdSignal === 'BULLISH' ? 'bg-green-900/70' : entry.macdSignal === 'BEARISH' ? 'bg-red-900/70' : 'bg-black/60'} rounded px-1 py-0.5 text-yellow-300 text-[11px] leading-tight`}>
          <b>MACD:</b> <span className="font-mono">{entry.macdSignal ? entry.macdSignal : 'Sin dato'} ({entry.macd !== undefined ? entry.macd.toFixed(2) : 'Sin dato'})</span>
        </div>
        {/* Fibonacci */}
        <div className={`${fibonacciEntry?.fibVote === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : fibonacciEntry?.fibVote === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Fibonacci:</b> <span className="font-mono">{fibonacciEntry?.fibVote ?? 'Sin dato'}{fibonacciEntry?.level ? ` (${fibonacciEntry.level})` : ''} {fibonacciEntry?.price !== undefined ? `@${fibonacciEntry.price.toFixed(2)}` : ''}</span>
        </div>
        {/* Valle Detallado */}
        <div className={`${valleyEntry?.valleyVote === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : valleyEntry?.valleyVote === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Valle:</b> <span className="font-mono">{valleyEntry?.valleyVote ?? 'Sin dato'}</span>
        </div>
        {/* Tendencia Velas */}
        <div className={`${trendEntry?.trend === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : trendEntry?.trend === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Tend. Velas:</b> <span className="font-mono">{trendEntry?.trend ?? 'Sin dato'}</span>
        </div>
        {/* Tendencia Volumen */}
        <div className={`${(volumeEntry?.vote === 'BULLISH' || (!volumeEntry && entry?.direction === 'BULLISH')) ? 'bg-green-900/70 text-yellow-300' : (volumeEntry?.vote === 'BEARISH' || (!volumeEntry && entry?.direction === 'BEARISH')) ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Tend. Volumen:</b> <span className="font-mono">{volumeEntry ? (volumeEntry.vote ?? entry?.direction ?? 'Sin dato') : (entry?.direction ?? 'Sin dato')}</span>
          <span className="ml-2 text-xs">{volumeEntry ? `Vol1: ${volumeEntry.avgVol1?.toFixed(2)}, Vol2: ${volumeEntry.avgVol2?.toFixed(2)}, ${volumeEntry.volumeTrend === 'UP' ? '▲' : '▼'} (${volumeEntry.majority})` : ''}</span>
        </div>
        {/* Mayoría */}
        <div className={`${entry?.majoritySignal === 'BULLISH' ? 'bg-green-900/70 text-yellow-300' : entry?.majoritySignal === 'BEARISH' ? 'bg-red-900/70 text-yellow-300' : 'bg-neutral-800/80 text-neutral-300'} rounded px-1 py-0.5 text-[11px] leading-tight`}>
          <b>Mayoría:</b> <span className="font-mono">{entry?.majoritySignal ?? 'Sin dato'}</span>
        </div>
      </div>
    </div>
  );
};
