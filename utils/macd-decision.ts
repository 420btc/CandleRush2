import type { Candle } from "@/types/game";
import { saveTrendMemory, saveValleyMemory, saveRsiMemory, saveFibonacciMemory, getAutoMixMemory, AutoMixMemoryEntry } from "./autoMixMemory";
import type { WhaleTrade } from "@/hooks/useWhaleTrades";
import { getWhaleVote } from "./whale-vote";
import { getAdxMemoryVote } from "./adx-vote";

/**
 * Decide la dirección de apuesta para AutoMix según las últimas 33 velas del MACD.
 * @param candles - Array de velas (ordenadas de más antigua a más reciente)
 * @returns {"BULLISH" | "BEARISH"} Dirección sugerida
 */
/**
 * Decide la dirección de apuesta para AutoMix según las últimas 33 velas del MACD y, opcionalmente, el voto de whale trades.
 * @param candles - Array de velas (ordenadas de más antigua a más reciente)
 * @param timeframe - Timeframe (por defecto 1m)
 * @param whaleTrades - (Opcional) Lista de whale trades recientes. Si se pasa, añade un voto extra según el balance de compras/ventas en el último minuto.
 * @returns {"BULLISH" | "BEARISH"} Dirección sugerida
 */
export function decideMixDirection(
  candles: Candle[],
  timeframe: string = "1m",
  whaleTrades?: WhaleTrade[]
): "BULLISH" | "BEARISH" {
  // --- HISTORIAL DE ÉXITO/FRACASO POR COMBINACIÓN ---
  // Se analiza ANTES de devolver la decisión final
  // (esto se aplicará tras calcular signals y antes de devolver dirección)
  function checkShouldInvertDecision(majoritySignal: "BULLISH" | "BEARISH" | null, rsiSignal: "BULLISH" | "BEARISH" | null, macdSignal: "BULLISH" | "BEARISH" | null): boolean {
    try {
      const memory = getAutoMixMemory();
      // Filtra por la combinación de señales actual
      const similares = memory.filter(e =>
        e.majoritySignal === majoritySignal &&
        e.rsiSignal === rsiSignal &&
        e.macdSignal === macdSignal
      );
      // --- 1. BLOQUES DE 3 DERROTAS ---
      let blocksOf3Losses = 0;
      for (let i = 0; i <= similares.length - 3; i++) {
        if (
          (similares[i].result === "LOSS" || similares[i].result === "LIQ") &&
          (similares[i+1].result === "LOSS" || similares[i+1].result === "LIQ") &&
          (similares[i+2].result === "LOSS" || similares[i+2].result === "LIQ")
        ) {
          blocksOf3Losses++;
          i += 2; // Salta al siguiente bloque (no solapa)
        }
      }
      if (blocksOf3Losses >= 2) return true;
      // --- 2. TASA DE DERROTA HISTÓRICA ---
      if (similares.length >= 5) {
        const perdidas = similares.filter(e => e.result === "LOSS" || e.result === "LIQ").length;
        if (perdidas / similares.length > 0.7) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // --- EMA 55/200 Position Vote ---
  function calcEMA(values: number[], period: number): number[] {
    if (values.length < period) return [];
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
  const closes = candles.map(c => c.close);
  let emaPositionVote: "BULLISH" | "BEARISH" | null = null;
  if (closes.length >= 55) {
    const ema55 = calcEMA(closes, 55);
    const ema200 = calcEMA(closes, 200);
    const last6 = closes.slice(-6);
    const lastEma55 = ema55.slice(-6);
    const lastEma200 = ema200.slice(-6);
    const allAbove = last6.every((close, i) => close > lastEma55[i] && close > lastEma200[i]);
    const allBelow = last6.every((close, i) => close < lastEma55[i] && close < lastEma200[i]);
    if (allAbove) emaPositionVote = "BULLISH";
    else if (allBelow) emaPositionVote = "BEARISH";
    else emaPositionVote = null;
  }

  // --- Golden Cross / Death Cross ---
  // (definición única al inicio de decideMixDirection)
function simpleMovingAverage(values: number[], period: number): number[] {
    if (values.length < period) return [];
    const result: number[] = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }
  // (definición única al inicio de decideMixDirection)
type CrossType = "GOLDEN_CROSS" | "DEATH_CROSS" | null;
  // (definición única al inicio de decideMixDirection)
function detectCross(candles: Candle[], shortPeriod = 50, longPeriod = 200): CrossType {
    const closes = candles.map(c => c.close);
    const smaShort = simpleMovingAverage(closes, shortPeriod);
    const smaLong = simpleMovingAverage(closes, longPeriod);
    const offset = smaShort.length - smaLong.length;
    if (offset < 0) return null;
    if (smaLong.length < 2) return null;
    const prevShort = smaShort[smaShort.length - 2];
    const prevLong = smaLong[smaLong.length - 2];
    const currShort = smaShort[smaShort.length - 1];
    const currLong = smaLong[smaLong.length - 1];
    if (prevShort < prevLong && currShort > currLong) {
      return "GOLDEN_CROSS";
    }
    if (prevShort > prevLong && currShort < currLong) {
      return "DEATH_CROSS";
    }
    return null;
  }
  // (definición única al inicio de decideMixDirection)
const crossSignal = detectCross(candles);
  // (definición única al inicio de decideMixDirection)
let crossVote: "BULLISH" | "BEARISH" | null = null;
  if (crossSignal === "GOLDEN_CROSS") crossVote = "BULLISH";
  if (crossSignal === "DEATH_CROSS") crossVote = "BEARISH";


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
  if (rsi > 50) rsiSignal = "BULLISH";
  else if (rsi < 40) rsiSignal = "BEARISH";
  // Guardar en memoria dedicada de RSI
  try {
    saveRsiMemory({ timestamp: Date.now(), rsi, rsiSignal });
  } catch {}

  // --- 2a. Golden Cross / Death Cross ---
  // (definición única al inicio de decideMixDirection)
// (Definición ya incluida arriba, eliminar duplicados aquí)

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

  const closes66 = candles.slice(-66).map(c => c.close);
  const ema12 = calcEMA(closes66, 12);
  const ema26 = calcEMA(closes66, 26);
  let macdLineArr: number[] = [];
  for (let i = 0; i < closes66.length; i++) {
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
  if (valleyVote === "BULLISH") bullishVotes++;
  if (valleyVote === "BEARISH") bearishVotes++;
  if (majoritySignal === "BULLISH") bullishVotes++;
  if (majoritySignal === "BEARISH") bearishVotes++;
  if (macdSignal === "BULLISH") bullishVotes++;
  if (macdSignal === "BEARISH") bearishVotes++;
  // Fibonacci: 1 voto
  if (fibResult.vote === "BULLISH") bullishVotes++;
  if (fibResult.vote === "BEARISH") bearishVotes++;

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

  // --- 8. Voto por Golden Cross/Death Cross ---
  if (crossVote === "BULLISH") bullishVotes++;
  if (crossVote === "BEARISH") bearishVotes++;
  // --- 9. Voto por posición EMA 55/200 ---
  if (emaPositionVote === "BULLISH") bullishVotes++;
  if (emaPositionVote === "BEARISH") bearishVotes++;

  // --- Voto Whale Trades (si se pasa como parámetro) ---
  let whaleVote: "BULLISH" | "BEARISH" | null = null;
  if (whaleTrades && Array.isArray(whaleTrades)) {
    whaleVote = getWhaleVote(whaleTrades, Date.now());
    if (whaleVote === "BULLISH") bullishVotes++;
    if (whaleVote === "BEARISH") bearishVotes++;
  }
  // --- 9. Voto ADX+memoria ---
  let adxMemoryVote: "BULLISH" | "BEARISH" | null = getAdxMemoryVote(candles);
  if (adxMemoryVote === "BULLISH") bullishVotes++;
  if (adxMemoryVote === "BEARISH") bearishVotes++;



  // --- Anti-persistencia: si últimas 5 apuestas fueron iguales y todas pérdidas/liquidadas, fuerza cambio ---
  try {
    const memory = getAutoMixMemory();
    const lastN = memory.slice(-5);
    if (
      lastN.length === 5 &&
      lastN.every((e: AutoMixMemoryEntry) => e.direction === lastN[0].direction) &&
      lastN.every((e: AutoMixMemoryEntry) => e.result === "LOSS" || e.result === "LIQ")
    ) {
      return lastN[0].direction === "BULLISH" ? "BEARISH" : "BULLISH";
    }
  } catch {}

  // --- Desempate con MACD ---
  const totalVotes = bullishVotes + bearishVotes;
  let direction: "BULLISH" | "BEARISH";
  if (totalVotes === 0) direction = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
  else if (bullishVotes === bearishVotes) {
    if (macdSignal) direction = macdSignal;
    else direction = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
  } else {
    const bullishProb = bullishVotes / totalVotes;
    direction = Math.random() < bullishProb ? "BULLISH" : "BEARISH";
  }

  // --- LÓGICA DE INVERSIÓN POR HISTORIAL DE FRACASO ---
  if (checkShouldInvertDecision(majoritySignal, rsiSignal, macdSignal)) {
    direction = direction === "BULLISH" ? "BEARISH" : "BULLISH";
  }
  // Guardar memoria principal incluyendo volumeVote
  try {
    const entry: AutoMixMemoryEntry = {
      betId: 'macd-bet',
      timestamp: Date.now(),
      direction,
      result: null,
      majoritySignal,
      rsiSignal,
      macdSignal,
      valleyVote,
      rsi,
      macd: macdLine,
      macdSignalLine: signalLine,
      volumeVote,
      whaleVote,
      adxMemoryVote,
      crossSignal: crossSignal ?? null,
      wasRandom: false,
    };
    // Guardado de memoria eliminado aquí: ahora solo se guarda tras placeBet con el betId real.
  } catch {}
  return direction;
}

// Para uso futuro: exportar la proporción
export function getMacdBullishRatio(candles: Candle[]): number {
  if (candles.length < 66) return 0.5;
  const last66 = candles.slice(-66);
  const bullishCount = last66.filter(c => c.close > c.open).length;
  return bullishCount / 66;
}
