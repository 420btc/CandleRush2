import type { Candle } from "@/types/game";

/**
 * Decide la dirección de apuesta para AutoMix según las últimas 33 velas del MACD.
 * @param candles - Array de velas (ordenadas de más antigua a más reciente)
 * @returns {"BULLISH" | "BEARISH"} Dirección sugerida
 */
export function decideMixDirection(candles: Candle[]): "BULLISH" | "BEARISH" {
  if (candles.length < 66) return Math.random() < 0.5 ? "BULLISH" : "BEARISH";

  // Tomar las últimas 66 velas
  const last66 = candles.slice(-66);
  // Contar verdes (alcistas) y rojas (bajistas)
  const bullishCount = last66.filter(c => c.close > c.open).length;
  const bearishCount = last66.length - bullishCount;

  // Probabilidad 90% según mayoría
  if (bullishCount > bearishCount) {
    return Math.random() < 0.95 ? "BULLISH" : "BEARISH";
  } else if (bearishCount > bullishCount) {
    return Math.random() < 0.95 ? "BEARISH" : "BULLISH";
  } else {
    // Si empate, aleatorio
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
