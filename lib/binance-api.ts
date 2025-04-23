// Utility functions for interacting with Binance API

import type { Candle } from "@/types/game"

// Fetch historical candles from Binance REST API
export async function fetchHistoricalCandles(symbol: string, interval: string, limit = 100): Promise<Candle[]> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    )

    if (!response.ok) {
      throw new Error(`Error fetching candles: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform Binance kline data to our Candle format
    return data.map((kline: any) => ({
      timestamp: kline[0],
      open: Number.parseFloat(kline[1]),
      high: Number.parseFloat(kline[2]),
      low: Number.parseFloat(kline[3]),
      close: Number.parseFloat(kline[4]),
      volume: Number.parseFloat(kline[5]),
      isClosed: true,
    }))
  } catch (error) {
    console.error("Error fetching historical candles:", error)
    throw error
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
