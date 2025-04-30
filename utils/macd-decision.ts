import type { Candle } from "@/types/game";

/**
 * Decide la dirección de apuesta para AutoMix según las últimas 33 velas del MACD.
 * @param candles - Array de velas (ordenadas de más antigua a más reciente)
 * @returns {"BULLISH" | "BEARISH"} Dirección sugerida
 */
export function decideMixDirection(candles: Candle[]): "BULLISH" | "BEARISH" {
  if (candles.length < 33) return Math.random() < 0.5 ? "BULLISH" : "BEARISH";

  // Tomar las últimas 33 velas
  const last33 = candles.slice(-33);
  // Contar verdes (alcistas) y rojas (bajistas)
  const bullishCount = last33.filter(c => c.close > c.open).length;
  const bearishCount = last33.length - bullishCount;

  // Probabilidad 90% según mayoría
  if (bullishCount > bearishCount) {
    return Math.random() < 0.9 ? "BULLISH" : "BEARISH";
  } else if (bearishCount > bullishCount) {
    return Math.random() < 0.9 ? "BEARISH" : "BULLISH";
  } else {
    // Si empate, aleatorio
    return Math.random() < 0.5 ? "BULLISH" : "BEARISH";
  }
}

// Para uso futuro: exportar la proporción
export function getMacdBullishRatio(candles: Candle[]): number {
  if (candles.length < 33) return 0.5;
  const last33 = candles.slice(-33);
  const bullishCount = last33.filter(c => c.close > c.open).length;
  return bullishCount / 33;
}
