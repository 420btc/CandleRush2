"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Candle, Bet, GamePhase } from "@/types/game"
import { fetchHistoricalCandles, setupWebSocket } from "@/lib/binance-api"
import { useToast } from "@/hooks/use-toast"
import { useAchievement } from "@/context/achievement-context"

// Generate simulated candle data for testing when real data isn't available
function generateSimulatedCandles(count: number, basePrice = 30000): Candle[] {
  const candles: Candle[] = []
  let lastClose = basePrice
  const now = Date.now()
  const minuteMs = 60 * 1000

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * minuteMs
    const open = lastClose
    const change = (Math.random() - 0.5) * basePrice * 0.02 // 2% max change
    const close = open + change
    const high = Math.max(open, close) + Math.random() * basePrice * 0.01
    const low = Math.min(open, close) - Math.random() * basePrice * 0.01
    const volume = Math.random() * 100

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      isClosed: true,
    })

    lastClose = close
  }

  return candles
}

// Función para simular actualizaciones de la vela actual
function simulateCurrentCandleUpdate(currentCandle: Candle | null): Candle | null {
  if (!currentCandle) return null

  // Crear una copia para no mutar el original
  const updatedCandle = { ...currentCandle }

  // Simular pequeños cambios en el precio
  const priceChange = (Math.random() - 0.5) * currentCandle.close * 0.001 // 0.1% max change
  updatedCandle.close = currentCandle.close + priceChange

  // Actualizar high/low si es necesario
  if (updatedCandle.close > updatedCandle.high) {
    updatedCandle.high = updatedCandle.close
  } else if (updatedCandle.close < updatedCandle.low) {
    updatedCandle.low = updatedCandle.close
  }

  return updatedCandle
}

interface GameContextType {
  gamePhase: GamePhase
  nextPhaseTime: number | null
  nextCandleTime: number | null
  candles: Candle[]
  currentCandle: Candle | null
  currentSymbol: string
  timeframe: string
  bets: Bet[]
  userBalance: number
  isConnected: boolean
  placeBet: (prediction: "BULLISH" | "BEARISH", amount: number) => void
  changeSymbol: (symbol: string) => void
  changeTimeframe: (timeframe: string) => void
  currentCandleBets: number
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gamePhase, setGamePhase] = useState<GamePhase>("LOADING")
  const [nextPhaseTime, setNextPhaseTime] = useState<number | null>(null)
  const [nextCandleTime, setNextCandleTime] = useState<number | null>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null)
  const [currentSymbol, setCurrentSymbol] = useState<string>("BTCUSDT")
  const [timeframe, setTimeframe] = useState<string>("1m")
  const [bets, setBets] = useState<Bet[]>([])
  const [userBalance, setUserBalance] = useState<number>(1000)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0)
  const [currentCandleBets, setCurrentCandleBets] = useState<number>(0)
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string }[]>([])
  const [pendingResolutions, setPendingResolutions] = useState<{ candle: Candle; time: number }[]>([])

  const { toast } = useToast()
  const { unlockAchievement } = useAchievement()

  // Limpiar notificaciones después de un tiempo
  useEffect(() => {
    if (notifications.length === 0) return

    const timer = setTimeout(() => {
      setNotifications([])
    }, 5000)

    return () => clearTimeout(timer)
  }, [notifications])

  // Verificar resoluciones pendientes
  useEffect(() => {
    if (pendingResolutions.length === 0) return

    const checkInterval = setInterval(() => {
      const now = Date.now()
      const resolutionsToProcess = pendingResolutions.filter((item) => now >= item.time)

      if (resolutionsToProcess.length > 0) {
        resolutionsToProcess.forEach((item) => {
          resolveBets(item.candle)
        })

        // Eliminar las resoluciones procesadas
        setPendingResolutions((prev) => prev.filter((item) => !resolutionsToProcess.some((r) => r.time === item.time)))
      }
    }, 1000)

    return () => clearInterval(checkInterval)
  }, [pendingResolutions])

  // Load historical candles
  const loadHistoricalCandles = useCallback(async () => {
    try {
      setGamePhase("LOADING")

      let historicalData: Candle[] = []

      try {
        historicalData = await fetchHistoricalCandles(currentSymbol, timeframe)
      } catch (error) {
        console.warn("Failed to fetch real data, using simulated data:", error)
        // Use simulated data if real data fetch fails
        historicalData = generateSimulatedCandles(50, currentSymbol.includes("BTC") ? 30000 : 2000)
      }

      if (historicalData.length > 0) {
        // Calculate server time offset
        let serverTime: number
        try {
          serverTime = await fetch("https://api.binance.com/api/v3/time")
            .then((res) => res.json())
            .then((data) => data.serverTime)
        } catch (error) {
          console.warn("Failed to fetch server time, using local time")
          serverTime = Date.now()
        }

        const localTime = Date.now()
        const offset = serverTime - localTime
        setServerTimeOffset(offset)

        // Set historical candles
        setCandles(historicalData.slice(0, -1))
        setCurrentCandle(historicalData[historicalData.length - 1])

        // Resetear contador de apuestas para la nueva vela
        setCurrentCandleBets(0)

        // Calculate next phase time based on the current candle's timestamp
        const currentCandleTime = historicalData[historicalData.length - 1].timestamp
        const candleDuration = getTimeframeInMs(timeframe)
        const nextCandleTime = currentCandleTime + candleDuration

        // Guardar el tiempo de la próxima vela
        setNextCandleTime(nextCandleTime)

        // Determine current phase
        const now = Date.now() + serverTimeOffset
        const timeUntilNextCandle = nextCandleTime - now

        // Modificado: Solo permitir apuestas durante los primeros 10 segundos de cada vela
        if (timeUntilNextCandle > candleDuration - 10000) {
          // Primeros 10 segundos de la vela
          setGamePhase("BETTING")
          setNextPhaseTime(currentCandleTime + 10000) // 10 segundos después del inicio de la vela
        } else {
          // Resto del tiempo
          setGamePhase("WAITING")
          setNextPhaseTime(nextCandleTime) // Esperar hasta la próxima vela
        }
      }
    } catch (error) {
      console.error("Error loading historical candles:", error)
      toast({
        title: "Error al cargar datos históricos",
        description: "Por favor, intenta de nuevo más tarde",
        variant: "destructive",
      })
    }
  }, [currentSymbol, timeframe, toast])

  // Initialize WebSocket connection
  useEffect(() => {
    let wsCleanup: (() => void) | null = null

    const initializeWebSocket = async () => {
      try {
        // First load historical data
        await loadHistoricalCandles()

        // Then setup WebSocket
        const { cleanup, onMessage, onOpen, onClose, onError } = setupWebSocket(currentSymbol.toLowerCase(), timeframe)

        wsCleanup = cleanup

        onOpen(() => {
          setIsConnected(true)
          console.log("WebSocket connected")
        })

        onClose(() => {
          setIsConnected(false)
          console.log("WebSocket disconnected")
        })

        onError((error) => {
          console.error("WebSocket error:", error)
          setIsConnected(false)
        })

        onMessage((data) => {
          handleWebSocketMessage(data)
        })
      } catch (error) {
        console.error("Error initializing:", error)
      }
    }

    initializeWebSocket()

    return () => {
      if (wsCleanup) wsCleanup()
    }
  }, [currentSymbol, timeframe, loadHistoricalCandles])

  // Simular actualizaciones de la vela actual cada segundo cuando no hay conexión WebSocket
  useEffect(() => {
    if (isConnected || !currentCandle) return

    const interval = setInterval(() => {
      setCurrentCandle((prevCandle) => simulateCurrentCandleUpdate(prevCandle))
    }, 1000)

    return () => clearInterval(interval)
  }, [isConnected, currentCandle])

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback(
    (data: any) => {
      if (!data || !data.k) return

      const candleData = data.k

      // Create candle object
      const candle: Candle = {
        timestamp: candleData.t,
        open: Number.parseFloat(candleData.o),
        high: Number.parseFloat(candleData.h),
        low: Number.parseFloat(candleData.l),
        close: Number.parseFloat(candleData.c),
        volume: Number.parseFloat(candleData.v),
        isClosed: candleData.x,
      }

      // Update current candle
      setCurrentCandle(candle)

      // If candle is closed, add it to history and schedule resolution
      if (candle.isClosed) {
        // Programar la resolución de apuestas para cuando se cierre la vela
        const candleDuration = getTimeframeInMs(timeframe)
        const resolutionTime = candle.timestamp + candleDuration

        // Añadir a la lista de resoluciones pendientes
        setPendingResolutions((prev) => [...prev, { candle, time: resolutionTime }])

        // Añadir la vela cerrada al historial
        setCandles((prev) => [...prev, candle])

        // Resetear contador de apuestas para la nueva vela
        setCurrentCandleBets(0)

        // Start new betting phase for the next candle
        const nextCandleTime = candle.timestamp + candleDuration
        setNextCandleTime(nextCandleTime)

        setGamePhase("BETTING")
        // Solo permitir apuestas durante los primeros 10 segundos
        setNextPhaseTime(candle.timestamp + 10000)

        // Notificar al usuario sobre el cierre de la vela
        toast({
          title: `Vela cerrada: ${candle.close > candle.open ? "ALCISTA ↑" : "BAJISTA ↓"}`,
          description: `Las apuestas se resolverán al final del período (${timeframe})`,
          variant: candle.close > candle.open ? "default" : "destructive",
        })
      } else {
        // Update game phase based on time
        const now = Date.now() + serverTimeOffset
        const candleStartTime = candle.timestamp
        const timeElapsedInCandle = now - candleStartTime

        // Si han pasado más de 10 segundos desde el inicio de la vela, cerrar la fase de apuestas
        if (gamePhase === "BETTING" && timeElapsedInCandle > 10000) {
          setGamePhase("WAITING")

          // Calcular tiempo hasta el cierre de la vela
          const candleDuration = getTimeframeInMs(timeframe)
          const nextCandleTime = candleStartTime + candleDuration
          setNextPhaseTime(nextCandleTime)
          setNextCandleTime(nextCandleTime)

          // Notificar al usuario que la fase de apuestas ha terminado
          toast({
            title: "Fase de apuestas finalizada",
            description: "Ya no se pueden realizar más apuestas para esta vela",
            variant: "default",
          })
        }
      }
    },
    [gamePhase, timeframe, serverTimeOffset, toast],
  )

  // Resolve bets when a candle closes
  const resolveBets = useCallback(
    (candle: Candle) => {
      const isBullish = candle.close > candle.open
      let totalWinnings = 0
      let wonCount = 0

      setBets((prev) => {
        const updatedBets = prev.map((bet) => {
          // Solo procesar apuestas pendientes que coincidan con el símbolo y timeframe
          if (bet.status !== "PENDING" || bet.symbol !== currentSymbol || bet.timeframe !== timeframe) return bet

          const won = (bet.prediction === "BULLISH" && isBullish) || (bet.prediction === "BEARISH" && !isBullish)

          // Calcular ganancias
          if (won) {
            const winnings = bet.amount * 0.9
            totalWinnings += winnings
            wonCount++
          }

          return {
            ...bet,
            status: won ? "WON" : "LOST",
            resolvedAt: Date.now(),
          }
        })

        // Actualizar balance después de procesar todas las apuestas
        if (totalWinnings > 0) {
          setUserBalance((balance) => balance + totalWinnings)

          // Notificar al usuario sobre sus ganancias
          toast({
            title: `¡Has ganado $${totalWinnings.toFixed(2)}!`,
            description: `${wonCount} apuesta${wonCount !== 1 ? "s" : ""} ganada${wonCount !== 1 ? "s" : ""}`,
            variant: "default",
          })
        } else if (updatedBets.some((bet) => bet.status === "LOST" && bet.resolvedAt === Date.now())) {
          // Notificar al usuario sobre sus pérdidas si hay apuestas perdidas recién resueltas
          toast({
            title: "Apuestas resueltas",
            description: "No has ganado en esta ronda",
            variant: "destructive",
          })
        }

        return updatedBets
      })

      // Check for achievements
      const pendingBets = bets.filter((bet) => bet.status === "PENDING")
      if (pendingBets.length >= 5) {
        unlockAchievement("high_roller")
      }

      const wonBets = bets.filter((bet) => bet.status === "WON").length
      if (wonBets >= 10) {
        unlockAchievement("winning_streak")
      }
    },
    [bets, currentSymbol, timeframe, toast, unlockAchievement],
  )

  // Place a bet
  const placeBet = useCallback(
    (prediction: "BULLISH" | "BEARISH", amount: number) => {
      if (gamePhase !== "BETTING") {
        toast({
          title: "No puedes apostar ahora",
          description: "Solo puedes apostar en los primeros 10 segundos de cada vela",
          variant: "destructive",
        })
        return
      }

      // Verificar si ya se alcanzó el límite de apuestas para esta vela
      if (currentCandleBets >= 2) {
        toast({
          title: "Límite de apuestas alcanzado",
          description: "Solo puedes hacer 2 apuestas por vela",
          variant: "destructive",
        })
        return
      }

      if (amount <= 0 || amount > userBalance) {
        toast({
          title: "Cantidad inválida",
          description: "No tienes suficiente saldo",
          variant: "destructive",
        })
        return
      }

      const newBet: Bet = {
        id: uuidv4(),
        prediction,
        amount,
        timestamp: Date.now(),
        status: "PENDING",
        symbol: currentSymbol,
        timeframe,
      }

      setBets((prev) => [...prev, newBet])
      setUserBalance((prev) => prev - amount)

      // Incrementar contador de apuestas para la vela actual
      setCurrentCandleBets((prev) => prev + 1)

      // Check for first bet achievement
      if (bets.length === 0) {
        unlockAchievement("first_bet")
      }

      // Notificar al usuario
      toast({
        title: `Apuesta ${prediction === "BULLISH" ? "alcista" : "bajista"} realizada`,
        description: `Has apostado $${amount.toFixed(2)} en ${currentSymbol} (${timeframe})`,
      })
    },
    [gamePhase, userBalance, currentSymbol, timeframe, bets.length, currentCandleBets, toast, unlockAchievement],
  )

  // Change symbol
  const changeSymbol = useCallback(
    (symbol: string) => {
      if (symbol === currentSymbol) return

      // Check if there are pending bets
      const hasPendingBets = bets.some((bet) => bet.status === "PENDING" && bet.symbol === currentSymbol)

      if (hasPendingBets) {
        toast({
          title: "No puedes cambiar de par",
          description: "Tienes apuestas pendientes en este par",
          variant: "destructive",
        })
        return
      }

      setCurrentSymbol(symbol)
      setCandles([])
      setCurrentCandle(null)
      setCurrentCandleBets(0)
      setPendingResolutions([])
    },
    [currentSymbol, bets, toast],
  )

  // Change timeframe
  const changeTimeframe = useCallback(
    (newTimeframe: string) => {
      if (newTimeframe === timeframe) return

      // Check if there are pending bets
      const hasPendingBets = bets.some(
        (bet) => bet.status === "PENDING" && bet.symbol === currentSymbol && bet.timeframe === timeframe,
      )

      if (hasPendingBets) {
        toast({
          title: "No puedes cambiar de intervalo",
          description: "Tienes apuestas pendientes en este intervalo",
          variant: "destructive",
        })
        return
      }

      setTimeframe(newTimeframe)
      setCandles([])
      setCurrentCandle(null)
      setCurrentCandleBets(0)
      setPendingResolutions([])
    },
    [timeframe, currentSymbol, bets, toast],
  )

  // Helper function to convert timeframe to milliseconds
  const getTimeframeInMs = (tf: string): number => {
    const value = Number.parseInt(tf.slice(0, -1))
    const unit = tf.slice(-1)

    switch (unit) {
      case "m":
        return value * 60 * 1000
      case "h":
        return value * 60 * 60 * 1000
      case "d":
        return value * 24 * 60 * 60 * 1000
      default:
        return 60 * 1000 // Default to 1m
    }
  }

  return (
    <GameContext.Provider
      value={{
        gamePhase,
        nextPhaseTime,
        nextCandleTime,
        candles,
        currentCandle,
        currentSymbol,
        timeframe,
        bets,
        userBalance,
        isConnected,
        placeBet,
        changeSymbol,
        changeTimeframe,
        currentCandleBets,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
