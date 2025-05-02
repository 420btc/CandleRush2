import { useEffect, useState } from 'react';

// Interface para las liquidaciones
interface Liquidation {
  orderId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  price: number;
  quantity: number;
  timestamp: number;
}

export function useLiquidations({ symbol = 'BTCUSDT', minSize = 10000, maxSize = Infinity, limit = 99, smallLimit = 5 } = {}) {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);

  useEffect(() => {
    // Crear websocket para liquidaciones
    const ws = new WebSocket(`wss://fstream.binance.com/ws/${symbol.toLowerCase()}@forceOrder`);

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.data) {
          const data = msg.data;
          const liq: Liquidation = {
            orderId: data.o,
            symbol: data.s,
            side: data.S,
            price: parseFloat(data.p),
            quantity: parseFloat(data.q),
            timestamp: data.T,
          };
          
          // Calcular tamaño en USD y filtrar por tamaño mínimo y máximo
          const sizeUsd = liq.price * liq.quantity;
          if (sizeUsd < minSize || sizeUsd > maxSize) return;

          // Actualizar estado con la nueva liquidación
          setLiquidations(prev => [
            { ...liq, sizeUsd },
            ...prev
          ].slice(0, maxSize === 500 ? smallLimit : limit));
        }
      } catch (error) {
        console.error('Error processing liquidation:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [symbol, minSize, maxSize, limit]);

  return liquidations;
}
