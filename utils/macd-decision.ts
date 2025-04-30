import type { Candle } from "@/types/game";

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

  // --- 2. Señal RSI (última vela usando 14 previas) ---
  function calcRSI(candles: Candle[], period = 14): number {
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

  // --- 4. Votación ---
  let bullishVotes = 0;
  let bearishVotes = 0;
  if (majoritySignal === "BULLISH") bullishVotes++;
  if (majoritySignal === "BEARISH") bearishVotes++;
  if (rsiSignal === "BULLISH") bullishVotes++;
  if (rsiSignal === "BEARISH") bearishVotes++;
  if (macdSignal === "BULLISH") bullishVotes++;
  if (macdSignal === "BEARISH") bearishVotes++;

  if (bullishVotes > bearishVotes) return "BULLISH";
  if (bearishVotes > bullishVotes) return "BEARISH";
  // Empate: aleatorio
  return Math.random() < 0.5 ? "BULLISH" : "BEARISH";
}

// Para uso futuro: exportar la proporción
export function getMacdBullishRatio(candles: Candle[]): number {
  if (candles.length < 66) return 0.5;
  const last66 = candles.slice(-66);
  const bullishCount = last66.filter(c => c.close > c.open).length;
  return bullishCount / 66;
}
