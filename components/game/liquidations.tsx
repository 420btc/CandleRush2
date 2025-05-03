import { useEffect, useState } from 'react';

// Interface para las liquidaciones
interface Liquidation {
  orderId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  price: number;
  quantity: number;
  timestamp: number;
  sizeUsd: number;
}

export function useLiquidations({ symbol = 'BTCUSDT', minSize = 0, maxSize = Infinity, limit = 99, smallLimit = 5 } = {}) {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 5000; // 5 segundos

    const connect = () => {
      ws = new WebSocket(`wss://fstream.binance.com/ws/${symbol.toLowerCase()}@forceOrder`);

      ws.onopen = () => {
        console.log('Connected to Binance Futures Liquidations');
        setIsConnected(true);
        retryCount = 0;
        setLiquidations([]); // Limpiar liquidaciones al reconectar
      };

      ws.onmessage = (ev) => {
        try {
          console.log('Raw message received:', ev.data);
          const msg = JSON.parse(ev.data);
          console.log('Parsed message:', msg);
          
          if (msg.data) {
            const data = msg.data;
            console.log('Raw liquidation data:', data);
            
            const liq = {
              orderId: data.o,
              symbol: data.s,
              side: data.S,
              price: parseFloat(data.p),
              quantity: parseFloat(data.q),
              timestamp: data.T,
              sizeUsd: parseFloat(data.p) * parseFloat(data.q)
            } as Liquidation;
            
            console.log('Processed liquidation:', liq);

            // Actualizar estado con la nueva liquidación
            setLiquidations(prev => {
              const newLiquidations = [liq, ...prev].slice(0, maxSize === 500 ? smallLimit : limit);
              console.log('Updated liquidations:', newLiquidations);
              return newLiquidations;
            });
          }
        } catch (error) {
          console.error('Error processing liquidation:', error);
          console.error('Error details:', error instanceof Error ? error.stack : error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Disconnected from Binance Futures Liquidations');
        setIsConnected(false);
        if (retryCount < maxRetries) {
          setTimeout(() => {
            retryCount++;
            console.log(`Reconnecting... Attempt ${retryCount}/${maxRetries}`);
            connect();
          }, retryDelay);
        } else {
          console.error('Max retries reached. Could not connect to Binance Futures Liquidations');
        }
      };

      return () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [symbol, minSize, maxSize, limit, smallLimit]);

  return { liquidations, isConnected };
}
