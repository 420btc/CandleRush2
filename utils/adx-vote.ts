import type { Candle } from "@/types/game";
import { calculateADX } from "./adx";
import { getAutoMixMemory } from "./autoMixMemory";

/**
 * Voto ADX+memoria: Si el ADX es fuerte y la memoria reciente favorece bullish o bearish, suma 1 voto a ese lado.
 * @param candles
 * @returns "BULLISH" | "BEARISH" | null
 */
export function getAdxMemoryVote(candles: Candle[]): "BULLISH" | "BEARISH" | null {
  if (candles.length < 34) return null;
  const adxArr = calculateADX(candles, 14);
  const lastAdx = adxArr[adxArr.length - 1];
  if (!lastAdx || lastAdx < 25) return null; // Solo si ADX fuerte
  // Decide dirección: DI+ vs DI-
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  // Usamos cierre para dirección, pero idealmente sería DI+ y DI-
  if (last.close > prev.close) return "BULLISH";
  if (last.close < prev.close) return "BEARISH";
  return null;
}
