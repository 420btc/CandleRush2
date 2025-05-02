import { WhaleTrade } from "@/hooks/useWhaleTrades";

/**
 * Calcula el voto whale según el balance de compras/ventas grandes en el último minuto.
 * @param trades Lista de whale trades recientes (de useWhaleTrades)
 * @param now Timestamp actual (ms). Por defecto Date.now()
 * @returns "BULLISH", "BEARISH" o null si no hay datos suficientes
 */
export function getWhaleVote(trades: WhaleTrade[], now: number = Date.now()): "BULLISH" | "BEARISH" | null {
  const lastMinute = trades.filter(t => now - t.timestamp < 60_000);
  if (lastMinute.length === 0) return null;
  const buyUsd = lastMinute.filter(t => t.side === "buy").reduce((sum, t) => sum + t.price * t.amount, 0);
  const sellUsd = lastMinute.filter(t => t.side === "sell").reduce((sum, t) => sum + t.price * t.amount, 0);
  if (buyUsd > sellUsd) return "BULLISH";
  if (sellUsd > buyUsd) return "BEARISH";
  return null;
}
