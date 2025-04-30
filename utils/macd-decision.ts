import type { Candle } from "@/types/game";
import { saveTrendMemory } from "./autoMixMemory";

/**
 * Decide la dirección de apuesta para AutoMix según las últimas 33 velas del MACD.
 * @param candles - Array de velas (ordenadas de más antigua a más reciente)
 * @returns {"BULLISH" | "BEARISH"} Dirección sugerida
 */
export function decideMixDirection(candles: Candle[]): "BULLISH" | "BEARISH" {
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
  if (rsi > 70) rsiSignal = "BEARISH";
  else if (rsi < 30) rsiSignal = "BULLISH";

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
