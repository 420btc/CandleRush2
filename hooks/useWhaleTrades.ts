// Hook React para escuchar whale trades en tiempo real desde Binance
import { useEffect, useRef, useState } from "react";

export interface WhaleTrade {
  id: string;
  exchange: string;
  symbol: string;
  price: number;
  amount: number;
  usd: number;
  side: "buy" | "sell";
  timestamp: number;
  raw?: any;
}

export function useWhaleTrades({
  minUsd = 10000,
  symbols = ["btcusdt@trade"],
  refreshInterval = 1000,
  limit = 1000
}: {
  minUsd?: number;
  symbols?: string[];
  refreshInterval?: number;
  limit?: number;
} = {}) {
  const [trades, setTrades] = useState<WhaleTrade[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = () => {
    if (wsRef.current) return;

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols.join('/')}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to Binance');
      reconnectAttempts.current = 0; // Reset reconnection attempts on successful connection
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Verificar si es un mensaje de trade de Binance
        if (data.e === 'trade') {
          const price = parseFloat(data.p);
          const amount = parseFloat(data.q);
          const usdValue = price * amount;
          
          // Filtrar por valor mínimo en USD
          if (usdValue >= minUsd) {
            const trade: WhaleTrade = {
              id: data.t.toString(),
              exchange: 'binance',
              symbol: data.s,
              price,
              amount,
              usd: usdValue,
              side: data.m ? 'sell' : 'buy', // m es true para órdenes de venta
              timestamp: data.T,
              raw: data
            };
            
            setTrades(prevTrades => {
              const newTrades = [trade, ...prevTrades];
              return newTrades.slice(0, limit); // Usar el límite configurable
            });
          }
        }
      } catch (error) {
        console.error('Error processing trade:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      wsRef.current = null;
      
      // Intentar reconectar si no hemos alcanzado el máximo de intentos
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
        
        setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };
  };

  useEffect(() => {
    connectWebSocket();

    // Limpiar al desmontar
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [minUsd, symbols.join(',')]); // Reconectar si cambian los parámetros

  return trades;
}
