import type { Candle } from "@/types/game";
import { saveTrendMemory, saveValleyMemory, saveRsiMemory, saveFibonacciMemory } from "./autoMixMemory";

/**
 * Decide la dirección de apuesta para AutoMix según las últimas 33 velas del MACD.
 * @param candles - Array de velas (ordenadas de más antigua a más reciente)
 * @returns {"BULLISH" | "BEARISH"} Dirección sugerida
 */
export function decideMixDirection(candles: Candle[], timeframe: string = "1m"): "BULLISH" | "BEARISH" {
  if (candles.length < 66) return Math.random() < 0.5 ? "BULLISH" : "BEARISH";

  // --- 1. Señal de mayoría (últimas 65 velas, excluyendo la más reciente) ---
  const last65 = candles.slice(-66, -1);
  const bullishCount = last65.filter(c => c.close > c.open).length;
  const bearishCount = last65.length - bullishCount;
  let majoritySignal: "BULLISH" | "BEARISH" | null = null;
  if (bullishCount > bearishCount) majoritySignal = "BULLISH";
  else if (bearishCount > bullishCount) majoritySignal = "BEARISH";

  // --- 2. Señal RSI (última vela usando 33 previas) ---
  function calcRSI(candles: Candle[], period = 33): number {
    if (candles.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    if (gains + losses === 0) return 50;
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  const rsi = calcRSI(candles);
  let rsiSignal: "BULLISH" | "BEARISH" | null = null;
  if (rsi > 60) rsiSignal = "BULLISH";
  else if (rsi < 40) rsiSignal = "BEARISH";
  // Guardar en memoria dedicada de RSI
  try {
    saveRsiMemory({ timestamp: Date.now(), rsi, rsiSignal });
  } catch {}

  // --- 2b. Análisis Fibonacci ---
  function calculateFibonacciLevels(candles: Candle[], timeframe: string) {
    let windowSize = 50;
    if (timeframe === "1m" || timeframe === "5m") windowSize = 100;
    if (timeframe === "15m" || timeframe === "1h") windowSize = 50;
    if (timeframe === "4h" || timeframe === "1d") windowSize = 30;
    if (candles.length < windowSize) return null;
    const window = candles.slice(-windowSize);
    const high = Math.max(...window.map(c => c.high));
    const low = Math.min(...window.map(c => c.low));
    const levels: Record<string, number> = {
      "0.236": high - (high - low) * 0.236,
      "0.382": high - (high - low) * 0.382,
      "0.5": high - (high - low) * 0.5,
      "0.618": high - (high - low) * 0.618,
      "0.786": high - (high - low) * 0.786,
    };
    return { high, low, levels };
  }
  function fibonacciVote(candles: Candle[], timeframe: string): {vote: "BULLISH"|"BEARISH"|null, level: string|null, price: number, levels: Record<string, number>} {
    const fib = calculateFibonacciLevels(candles, timeframe);
    if (!fib) return {vote: null, level: null, price: candles[candles.length-1]?.close, levels: {}};
    const price = candles[candles.length-1]?.close;
    let closestLevel: string|null = null;
    let minDiff = Infinity;
    for (const [level, val] of Object.entries(fib.levels)) {
      const diff = Math.abs(price-val);
      if (diff < minDiff) {
        minDiff = diff;
        closestLevel = level;
      }
    }
    // Considerar "cerca" si está a menos del 0.2%
    let vote: "BULLISH"|"BEARISH"|null = null;
    if (closestLevel && minDiff/price < 0.002) {
      // Si la última vela es alcista y rebota en nivel, voto BULLISH, si es bajista y rebota abajo, BEARISH
      const last = candles[candles.length-1];
      if (last.close > last.open) vote = "BULLISH";
      if (last.close < last.open) vote = "BEARISH";
    }
    return {vote, level: closestLevel, price, levels: fib.levels};
  }
  const fibResult = fibonacciVote(candles, timeframe);
  try {
    saveFibonacciMemory({ timestamp: Date.now(), fibVote: fibResult.vote, level: fibResult.level, price: fibResult.price, levels: fibResult.levels });
  } catch {}

  // --- 3. Señal MACD (últimas 66 velas) ---
  function calcEMA(values: number[], period: number): number[] {
    const k = 2 / (period + 1);
    let emaArr: number[] = [];
    let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    emaArr[period - 1] = ema;
    for (let i = period; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
      emaArr[i] = ema;
    }
    return emaArr;
  }
  const closes = candles.slice(-66).map(c => c.close);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  let macdLineArr: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (ema12[i] !== undefined && ema26[i] !== undefined) {
      macdLineArr[i] = ema12[i] - ema26[i];
    } else {
      macdLineArr[i] = 0;
    }
  }
  const signalLineArr = calcEMA(macdLineArr.filter(x => x !== undefined), 9);
  // Usar el último valor válido para comparar
  const macdLine = macdLineArr[macdLineArr.length - 1];
  const signalLine = signalLineArr[signalLineArr.length - 1];
  let macdSignal: "BULLISH" | "BEARISH" | null = null;
  if (macdLine > signalLine) macdSignal = "BULLISH";
  else if (macdLine < signalLine) macdSignal = "BEARISH";

  // --- 4. Señales primordiales: RSI y Valle ---
  // Si ambas están presentes y de acuerdo, se sigue esa dirección.
  // Si solo una está presente, se prioriza sobre Majority y MACD.
  // Solo si ninguna está presente, se usa la votación entre Majority y MACD.

  // --- Voto por apertura/cierre de valle (ventana amplia) ---
  function detectValleyVote(candles: Candle[]): "BULLISH" | "BEARISH" | null {
    if (candles.length < 66) return null;
    const window = candles.slice(-66);
    for (let i = 2; i < window.length - 1; i++) {
      const prev2 = window[i - 2];
      const prev1 = window[i - 1];
      const curr = window[i];
      const next = window[i + 1];
      // Apertura de valle alcista
      if (
        prev2.close > prev1.close &&
        prev1.close < curr.close &&
        curr.close > curr.open
      ) {
        return "BULLISH";
      }
      // Apertura de valle bajista
      if (
        prev2.close < prev1.close &&
        prev1.close > curr.close &&
        curr.close < curr.open
      ) {
        return "BEARISH";
      }
      // Cierre de valle alcista
      if (
        prev2.close < prev1.close &&
        prev1.close < curr.close &&
        next.close < curr.close &&
        curr.close < curr.open
      ) {
        return "BEARISH";
      }
      // Cierre de valle bajista
      if (
        prev2.close > prev1.close &&
        prev1.close > curr.close &&
        next.close > curr.close &&
        curr.close > curr.open
      ) {
        return "BULLISH";
      }
    }
    return null;
  }
  const valleyVote = detectValleyVote(candles);
// Guardar en memoria de valle
try {
  saveValleyMemory({ timestamp: Date.now(), valleyVote });
} catch {}

  // --- Votación proporcional: RSI, Valle, Majority y MACD (25% cada uno) ---
  let bullishVotes = 0;
  let bearishVotes = 0;
  if (rsiSignal === "BULLISH") bullishVotes++;
  if (rsiSignal === "BEARISH") bearishVotes++;
  if (valleyVote === "BULLISH") bullishVotes++;
  if (valleyVote === "BEARISH") bearishVotes++;
  if (majoritySignal === "BULLISH") bullishVotes++;
  if (majoritySignal === "BEARISH") bearishVotes++;
  if (macdSignal === "BULLISH") bullishVotes++;
  if (macdSignal === "BEARISH") bearishVotes++;
  // Fibonacci: peso bajo (0.5 voto)
  if (fibResult.vote === "BULLISH") bullishVotes += 0.5;
  if (fibResult.vote === "BEARISH") bearishVotes += 0.5;

  // --- 6. Voto por tendencia y conteo de velas (últimas 70) ---
  // Importar función de memoria de tendencia
  // (asegúrate de tener: import { saveTrendMemory } from "./autoMixMemory"; al inicio del archivo)
  function trendVote(candles: Candle[]): "BULLISH" | "BEARISH" | null {
    if (candles.length < 70) return null;
    const last70 = candles.slice(-70);
    const bullishCount = last70.filter(c => c.close > c.open).length;
    const bearishCount = last70.filter(c => c.close < c.open).length;
    let trend: "BULLISH" | "BEARISH" | null = null;
    if (bullishCount > bearishCount) trend = "BULLISH";
    else if (bearishCount > bullishCount) trend = "BEARISH";
    // Guardar en memoria de tendencia
    try {
      // @ts-ignore
      saveTrendMemory({ timestamp: Date.now(), bullishCount, bearishCount, trend });
    } catch {}
    return trend;
  }
  const trend = trendVote(candles);
  if (trend === "BULLISH") bullishVotes++;
  if (trend === "BEARISH") bearishVotes++;

  // --- 7. Voto por tendencia de volumen (últimas 30 velas) ---
  // Importar función de memoria de tendencia de volumen
  // (asegúrate de tener: import { saveVolumeTrendMemory } from "./autoMixMemory"; al inicio del archivo)
  function volumeTrendVote(candles: Candle[]): "BULLISH" | "BEARISH" | null {
    if (candles.length < 30) return null;
    const last30 = candles.slice(-30);
    const firstHalf = last30.slice(0, 15);
    const secondHalf = last30.slice(15);
    const avgVol1 = firstHalf.reduce((a, c) => a + (c.volume || 0), 0) / 15;
    const avgVol2 = secondHalf.reduce((a, c) => a + (c.volume || 0), 0) / 15;
    const bullishCount = last30.filter(c => c.close > c.open).length;
    const bearishCount = last30.filter(c => c.close < c.open).length;
    let majority: "BULLISH" | "BEARISH" = bullishCount >= bearishCount ? "BULLISH" : "BEARISH";
    let volumeTrend: "UP" | "DOWN" = avgVol2 > avgVol1 ? "UP" : "DOWN";
    let vote: "BULLISH" | "BEARISH" | null = null;
    // Si la mayoría de las velas son bullish
    if (bullishCount > bearishCount) {
      if (avgVol2 < avgVol1) vote = "BEARISH"; // baja el volumen en tendencia alcista
      if (avgVol2 > avgVol1) vote = "BULLISH"; // sube el volumen en tendencia alcista
    }
    // Si la mayoría son bearish
    if (bearishCount > bullishCount) {
      if (avgVol2 < avgVol1) vote = "BULLISH"; // baja el volumen en tendencia bajista
      if (avgVol2 > avgVol1) vote = "BEARISH"; // sube el volumen en tendencia bajista
    }
    // Guardar en memoria de tendencia de volumen
    // Guardar siempre la memoria, aunque vote sea null
    try {
      // @ts-ignore
      saveVolumeTrendMemory({ timestamp: Date.now(), avgVol1, avgVol2, volumeTrend, majority, vote: vote ?? null });
    } catch {}

    return vote;
  }
  const volumeVote = volumeTrendVote(candles);
  if (volumeVote === "BULLISH") bullishVotes++;
  if (volumeVote === "BEARISH") bearishVotes++;

  const totalVotes = bullishVotes + bearishVotes;
  if (totalVotes === 0) return Math.random() < 0.5 ? "BULLISH" : "BEARISH";
  const bullishProb = bullishVotes / totalVotes;
  return Math.random() < bullishProb ? "BULLISH" : "BEARISH";
}

// Para uso futuro: exportar la proporción
export function getMacdBullishRatio(candles: Candle[]): number {
  if (candles.length < 66) return 0.5;
  const last66 = candles.slice(-66);
  const bullishCount = last66.filter(c => c.close > c.open).length;
  return bullishCount / 66;
}
