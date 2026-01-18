// Utility functions for interacting with Binance API

import type { Candle } from "@/types/game"

// Fetch historical candles from Binance REST API with fallback to Bybit
export async function fetchHistoricalCandles(symbol: string, interval: string, limit = 1000): Promise<Candle[]> {
  try {
    // Intentar Binance primero con headers para evitar bloqueos simples
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.map((kline: any) => ({
        timestamp: kline[0],
        open: Number.parseFloat(kline[1]),
        high: Number.parseFloat(kline[2]),
        low: Number.parseFloat(kline[3]),
        close: Number.parseFloat(kline[4]),
        volume: Number.parseFloat(kline[5]),
        isClosed: Date.now() > kline[6],
      }));
    } else {
      console.warn(`Binance API error: ${response.status} ${response.statusText}`);
      throw new Error(`Binance Status: ${response.status}`);
    }
  } catch (error) {
    console.warn("Binance fetch failed, trying Bybit fallback...", error);
    
    // Fallback a Bybit V5 API
    try {
      // Mapear intervalos de Binance a Bybit
      const intervalMap: Record<string, string> = {
        '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30', 
        '1h': '60', '2h': '120', '4h': '240', '6h': '360', '12h': '720', 
        '1d': 'D', '1w': 'W'
      };
      
      const bybitInterval = intervalMap[interval] || '1';
      // Bybit usa símbolos sin formato especial normalmente, pero BTCUSDT es igual.
      
      const bybitUrl = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`;
      
      const response = await fetch(bybitUrl, {
         headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Bybit error: ${response.status} ${text}`);
      }
      
      const json = await response.json();
      
      if (json.retCode !== 0) {
        throw new Error(`Bybit API error: ${json.retMsg}`);
      }
      
      // Transformar datos de Bybit a formato Candle
      // Bybit response: list: [ [startTime, open, high, low, close, volume, turnover], ... ]
      // Nota: Bybit devuelve los datos en orden inverso (más reciente primero), Binance los devuelve más antiguo primero.
      const list = json.result.list || [];
      
      const candles = list.map((item: string[]) => ({
        timestamp: Number.parseInt(item[0]),
        open: Number.parseFloat(item[1]),
        high: Number.parseFloat(item[2]),
        low: Number.parseFloat(item[3]),
        close: Number.parseFloat(item[4]),
        volume: Number.parseFloat(item[5]),
        isClosed: true, // Asumimos cerrado si es histórico
      }));
      
      // Revertir para tener orden ascendente (antiguo -> nuevo) como Binance
      return candles.reverse();
      
    } catch (fallbackError: any) {
      console.error("All APIs failed:", fallbackError);
      throw new Error(`Failed to fetch candles from both Binance and Bybit. Last error: ${fallbackError.message}`);
    }
  }
}

// Setup WebSocket connection to Binance
export function setupWebSocket(symbol: string, interval: string) {
  let ws: WebSocket | null = null
  let messageHandlers: ((data: any) => void)[] = []
  let openHandlers: (() => void)[] = []
  let closeHandlers: (() => void)[] = []
  let errorHandlers: ((error: Event) => void)[] = []

  // Create WebSocket connection
  const connect = () => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`)

      ws.onopen = () => {
        openHandlers.forEach((handler) => handler())
      }

      ws.onclose = () => {
        closeHandlers.forEach((handler) => handler())

        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (ws?.readyState === WebSocket.CLOSED) {
            connect()
          }
        }, 5000)
      }

      ws.onerror = (error) => {
        errorHandlers.forEach((handler) => handler(error))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          messageHandlers.forEach((handler) => handler(data))
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }
    } else {
      console.warn("WebSocket not available in this environment")
    }
  }

  // Initial connection
  connect()

  // Cleanup function
  const cleanup = () => {
    if (ws) {
      ws.close()
      ws = null
    }

    messageHandlers = []
    openHandlers = []
    closeHandlers = []
    errorHandlers = []
  }

  // Event handlers
  const onMessage = (handler: (data: any) => void) => {
    messageHandlers.push(handler)
  }

  const onOpen = (handler: () => void) => {
    openHandlers.push(handler)
    if (ws?.readyState === WebSocket.OPEN) {
      handler()
    }
  }

  const onClose = (handler: () => void) => {
    closeHandlers.push(handler)
  }

  const onError = (handler: (error: Event) => void) => {
    errorHandlers.push(handler)
  }

  return {
    cleanup,
    onMessage,
    onOpen,
    onClose,
    onError,
  }
}
