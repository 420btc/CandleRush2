export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface WhaleTrade {
  timestamp: number;
  price: number;
  quantity: number;
  isBuyerMaker: boolean;
  tradeId: string;
}
