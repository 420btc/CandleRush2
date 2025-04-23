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
}

export interface Bet {
  id: string
  prediction: "BULLISH" | "BEARISH"
  amount: number
  timestamp: number
  status: "PENDING" | "WON" | "LOST"
  resolvedAt?: number
  symbol: string
  timeframe: string
}
