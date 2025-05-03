import { useEffect, useState } from 'react';

interface Liquidation {
  orderId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  price: number;
  quantity: number;
  timestamp: number;
  sizeUsd: number;
  exchange: string;
}

// Bybit WebSocket
export function useBybitLiquidations({ symbol = 'BTCUSDT', minSize = 0, maxSize = Infinity, limit = 99 }) {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 5000; // 5 segundos

    const connect = () => {
      console.log('Connecting to Bybit... (attempt:', retryCount + 1, ')');
      ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');

      ws.onopen = () => {
        console.log('Connected to Bybit!');
        setIsConnected(true);
        retryCount = 0;
        const subscribeMsg = {
          op: 'subscribe',
          args: ['liquidation.BTCUSDT']
        };
        console.log('Sending subscription:', subscribeMsg);
        ws.send(JSON.stringify(subscribeMsg));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.topic?.startsWith('liquidation.')) {
            const data = msg.data;
            const liq = {
              orderId: data.orderId,
              symbol: data.symbol,
              side: data.side === 'Buy' ? 'LONG' as const : 'SHORT' as const,
              price: parseFloat(data.price),
              quantity: parseFloat(data.qty),
              timestamp: data.timestamp,
              sizeUsd: parseFloat(data.price) * parseFloat(data.qty),
              exchange: 'Bybit'
            };
            setLiquidations(prev => [liq, ...prev].slice(0, limit));
          }
        } catch (error) {
          console.error('Error processing Bybit liquidation:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(connect, retryDelay);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(connect, retryDelay);
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
  }, [symbol, minSize, maxSize, limit]);

  return { liquidations, isConnected };
}

// Huobi WebSocket
export function useHuobiLiquidations({ symbol = 'BTCUSDT', minSize = 0, maxSize = Infinity, limit = 99 }) {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 5000; // 5 segundos
    let pingInterval: NodeJS.Timeout;

    const handlePingPong = () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Enviar ping
        const pingId = Date.now().toString();
        ws.send(JSON.stringify({ op: 'ping', args: [pingId] }));
        console.log('Sent ping to Huobi:', pingId);

        // Esperar pong durante 5 segundos
        const pongTimeout = setTimeout(() => {
          console.log('No pong received, closing connection');
          if (ws) ws.close();
        }, 5000);

        // Limpiar timeout cuando recibimos pong
        const cleanTimeout = () => {
          if (pongTimeout) clearTimeout(pongTimeout);
        };

        return cleanTimeout;
      }
    };

    const connect = () => {
      console.log('Connecting to Huobi... (attempt:', retryCount + 1, ')');
      ws = new WebSocket('wss://api.huobi.pro/ws/v2');

      ws.onopen = () => {
        console.log('Connected to Huobi!');
        setIsConnected(true);
        retryCount = 0;
        
        // Iniciar ping/pong
        pingInterval = setInterval(() => {
          const cleanTimeout = handlePingPong();
          ws.onmessage = (ev) => {
            try {
              console.log('Received message:', ev.data);
              
              // Convertir Blob a string si es necesario
              const data = ev.data instanceof Blob ? 
                new Response(ev.data).text().then(text => text) : 
                ev.data;
              
              // Parsear el mensaje
              const msg = typeof data === 'string' ? JSON.parse(data) : data;
              console.log('Parsed message:', msg);
              
              // Manejo de pong
              if (msg.op === 'pong') {
                console.log('Received pong from Huobi');
                if (cleanTimeout) cleanTimeout();
                return;
              }

              // Verificar si es una respuesta de suscripción
              if (msg.ping) {
                console.log('Received ping, sending pong');
                ws.send(JSON.stringify({ pong: msg.ping }));
                return;
              }
              
              // Verificar si es una respuesta de suscripción exitosa
              if (msg.subbed) {
                console.log('Successfully subscribed to liquidations');
                return;
              }
              
              // Verificar si es una actualización de liquidaciones para Huobi
              if (msg.ch && msg.ch.startsWith('market.btcusdt.liquidation')) {
                const data = msg.tick;
                console.log('Received liquidation data:', data);
                const liq = {
                  orderId: data.id,
                  symbol: data.symbol,
                  side: data.direction === 'buy' ? 'LONG' as const : 'SHORT' as const,
                  price: parseFloat(data.price),
                  quantity: parseFloat(data.amount),
                  timestamp: data.ts,
                  sizeUsd: parseFloat(data.price) * parseFloat(data.amount),
                  exchange: 'Huobi'
                };
                console.log('New liquidation:', liq);
                setLiquidations(prev => [liq, ...prev].slice(0, limit));
              }
              
              // Verificar si es una actualización de liquidaciones para Bybit
              if (msg.data && Array.isArray(msg.data)) {
                msg.data.forEach((item: any) => {
                  if (item.symbol === 'BTCUSDT') {
                    console.log('Received Bybit liquidation:', item);
                    const liq = {
                      orderId: item.orderId,
                      symbol: item.symbol,
                      side: item.side === 'Buy' ? 'LONG' as const : 'SHORT' as const,
                      price: parseFloat(item.price),
                      quantity: parseFloat(item.size),
                      timestamp: item.time * 1000, // Convertir a milisegundos
                      sizeUsd: parseFloat(item.price) * parseFloat(item.size),
                      exchange: 'Bybit'
                    };
                    console.log('New Bybit liquidation:', liq);
                    setLiquidations(prev => [liq, ...prev].slice(0, limit));
                  }
                });
              }
            } catch (error) {
              console.error('Error processing message:', error);
              console.error('Message data:', ev.data);
            }
          };
        }, 30000); // Cada 30 segundos

        // Suscripción inicial
        const subscribeMsg = {
          "sub": `market.btcusdt.liquidation`,
          "id": "id1"
        };
        console.log('Sending subscription:', subscribeMsg);
        ws.send(JSON.stringify(subscribeMsg));
      };

      ws.onclose = (event: CloseEvent) => {
        clearInterval(pingInterval);
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Reconnecting... Attempt ${retryCount}/${maxRetries}`);
          setTimeout(connect, retryDelay);
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
  }, [symbol, minSize, maxSize, limit]);

  return { liquidations, isConnected };
}

// KuCoin WebSocket
export function useKuCoinLiquidations({ symbol = 'BTCUSDT', minSize = 0, maxSize = Infinity, limit = 99 }) {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 5000; // 5 segundos

    const connect = () => {
      console.log('Connecting to KuCoin... (attempt:', retryCount + 1, ')');
      ws = new WebSocket('wss://ws-api.kucoin.com/endpoint');

      ws.onopen = () => {
        console.log('Connected to KuCoin!');
        setIsConnected(true);
        retryCount = 0;
        const subscribeMsg = {
          "id": Date.now().toString(),
          "type": "subscribe",
          "topic": `/contractMarket/liquidation:${symbol}`,
          "privateChannel": false,
          "response": true
        };
        console.log('Sending subscription:', subscribeMsg);
        ws.send(JSON.stringify(subscribeMsg));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'message' && msg.data) {
            const data = msg.data;
            const liq = {
              orderId: data.orderId,
              symbol: data.symbol,
              side: data.side === 'buy' ? 'LONG' as const : 'SHORT' as const,
              price: parseFloat(data.price),
              quantity: parseFloat(data.size),
              timestamp: Date.now(),
              sizeUsd: parseFloat(data.price) * parseFloat(data.size),
              exchange: 'KuCoin'
            };
            setLiquidations(prev => [liq, ...prev].slice(0, limit));
          }
        } catch (error) {
          console.error('Error processing KuCoin liquidation:', error);
        }
      };

      ws.onclose = () => setIsConnected(false);

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
  }, [symbol, minSize, maxSize, limit]);

  return { liquidations, isConnected };
}

// Hook combinado para todas las exchanges
export function useAllLiquidations({ symbol = 'BTCUSDT', minSize = 0, maxSize = Infinity, limit = 99, smallLimit = 5 }) {
  const [allLiquidations, setAllLiquidations] = useState<Liquidation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const { liquidations: bybitLiquidations, isConnected: bybitConnected } = useBybitLiquidations({ symbol, limit });
  const { liquidations: huobiLiquidations, isConnected: huobiConnected } = useHuobiLiquidations({ symbol, limit });
  const { liquidations: kucoinLiquidations, isConnected: kucoinConnected } = useKuCoinLiquidations({ symbol, limit });

  // Combinar todas las liquidaciones
  useEffect(() => {
    console.log('Bybit connected:', bybitConnected, 'Huobi connected:', huobiConnected, 'KuCoin connected:', kucoinConnected);
    console.log('Bybit liquidations:', bybitLiquidations.length, 'Huobi liquidations:', huobiLiquidations.length, 'KuCoin liquidations:', kucoinLiquidations.length);
    
    const combined = [...bybitLiquidations, ...huobiLiquidations, ...kucoinLiquidations]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxSize === 500 ? smallLimit : limit);
    
    setAllLiquidations(combined);
    setIsConnected(bybitConnected || huobiConnected || kucoinConnected);
  }, [bybitLiquidations, huobiLiquidations, kucoinLiquidations, bybitConnected, huobiConnected, kucoinConnected, maxSize, smallLimit]);

  return { liquidations: allLiquidations, isConnected };
}
