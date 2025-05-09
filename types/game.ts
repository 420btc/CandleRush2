// Game related types

export type GamePhase = "LOADING" | "BETTING" | "RESOLVING" | "WAITING"

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  isClosed?: boolean
  isFinal?: boolean  // Marca la última vela simulada
  isSimulated?: boolean // Marca si la vela es simulada
  /**
   * Tipo de ruptura (breakout) si la vela fue generada como ruptura: 'weak' | 'medium' | 'strong'.
   */
  breakoutType?: 'weak' | 'medium' | 'strong';
  /**
   * Marca si la vela fue generada como evento de volatilidad aleatoria.
   */
  volatileRandom?: boolean;
}

export interface Bet {
  esAutomatica?: 'Sí' | 'No';
  autoType?: 'MIX' | 'AUTO' | 'MANUAL';
  id: string
  prediction: "BULLISH" | "BEARISH"
  amount: number
  timestamp: number
  candleTimestamp: number; // NUEVO: timestamp exacto de la vela a la que pertenece la apuesta
  status: "PENDING" | "WON" | "LOST" | "LIQUIDATED"
  resolvedAt?: number
  symbol: string
  timeframe: string
  // --- Apalancamiento (solo para apuestas nuevas) ---
  leverage?: number; // 1x, 5x, 10x, ..., 100x
  entryPrice?: number; // precio de entrada
  liquidationPrice?: number; // precio de liquidación
  wasLiquidated?: boolean; // true si fue liquidada antes del cierre
  winnings?: number; // ganancia real de la apuesta
  liquidationFee?: number; // penalización por liquidación
}

