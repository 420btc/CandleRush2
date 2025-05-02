// Hook React para escuchar whale trades en tiempo real desde aggr.trade
import { useEffect, useRef, useState } from "react";

export interface WhaleTrade {
  id: string;
  exchange: string;
  symbol: string;
  price: number;
  amount: number;
  side: "buy" | "sell";
  timestamp: number;
  raw?: any;
}

export function useWhaleTrades({
  minUsd = 100000,
  exchanges = ["binance", "bybit", "okx", "bitmex", "bitfinex", "kraken"],
  symbols = ["BTCUSDT", "ETHUSDT"]
}: {
  minUsd?: number;
  exchanges?: string[];
  symbols?: string[];
} = {}) {
  const [trades, setTrades] = useState<WhaleTrade[]>([]);
  const wsRef = useRef<WebSocket|null>(null);

  useEffect(() => {
    // Puedes cambiar por tu propio backend si tienes aggr-server corriendo
    const ws = new WebSocket("wss://api.aggr.trade/ws");
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // Ejemplo de formato esperado: { type: 'trade', data: { ... } }
        if (data.type === "trade") {
          const t = data.data;
          if (!exchanges.includes(t.exchange)) return;
          if (!symbols.includes(t.symbol)) return;
          const usd = t.price * t.amount;
          if (usd < minUsd) return;
          setTrades(trades => [{
            id: t.id || `${t.exchange}-${t.symbol}-${t.timestamp}`,
            exchange: t.exchange,
            symbol: t.symbol,
            price: t.price,
            amount: t.amount,
            side: t.side,
            timestamp: t.timestamp,
            raw: t
          }, ...trades].slice(0, 50)); // máximo 50
        }
      } catch {}
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => { ws.close(); };
  }, [minUsd, JSON.stringify(exchanges), JSON.stringify(symbols)]);

  return trades;
}
