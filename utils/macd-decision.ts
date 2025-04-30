import type { Candle } from "@/types/game";

/**
 * Decide la dirección de apuesta para AutoMix según las últimas 33 velas del MACD.
 * @param candles - Array de velas (ordenadas de más antigua a más reciente)
 * @returns {"BULLISH" | "BEARISH"} Dirección sugerida
 */
export function decideMixDirection(candles: Candle[]): "BULLISH" | "BEARISH" {
  if (candles.length < 66) return Math.random() < 0.5 ? "BULLISH" : "BEARISH";

  // 95% de las veces: usar mayoría de las últimas 65 velas (excluyendo la última)
  if (Math.random() < 0.95) {
    const last65 = candles.slice(-66, -1); // Penúltima hacia atrás
    const bullishCount = last65.filter(c => c.close > c.open).length;
    const bearishCount = last65.length - bullishCount;
    if (bullishCount > bearishCount) return "BULLISH";
    if (bearishCount > bullishCount) return "BEARISH";
    // Empate: aleatorio
    return Math.random() < 0.5 ? "BULLISH" : "BEARISH";
  } else {
    // 5% de las veces: usar solo la última vela
    const last = candles[candles.length - 1];
    if (last.close > last.open) return "BULLISH";
    if (last.close < last.open) return "BEARISH";
    // Doji: aleatorio
    return Math.random() < 0.5 ? "BULLISH" : "BEARISH";
  }
}

// Para uso futuro: exportar la proporción
export function getMacdBullishRatio(candles: Candle[]): number {
  if (candles.length < 66) return 0.5;
  const last66 = candles.slice(-66);
  const bullishCount = last66.filter(c => c.close > c.open).length;
  return bullishCount / 66;
}
