"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
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
  betsByPair: Record<string, Record<string, Bet[]>> // NUEVO: todas las apuestas globales
  userBalance: number
  isConnected: boolean
  placeBet: (prediction: "BULLISH" | "BEARISH", amount: number, leverage?: number) => void
  changeSymbol: (symbol: string) => void
  changeTimeframe: (timeframe: string) => void
  currentCandleBets: number
  candleSizes: number[]
  bonusInfo: { bonus: number; size: number; message: string } | null
  setBonusInfo: React.Dispatch<React.SetStateAction<{ bonus: number; size: number; message: string } | null>>
  addCoins: (amount: number) => void
  clearBets: () => void
  clearBetsForCurrentPairAndTimeframe: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  // ...existing state...
  const addCoins = (amount: number) => {
    // Sin límite: el usuario puede tener cualquier cantidad de monedas
    setUserBalance((prev) => {
      const newBalance = prev + amount;
      localStorage.setItem("userBalance", String(newBalance));
      return newBalance;
    });
  } // Sin restricciones  }
  const [candleSizes, setCandleSizes] = useState<number[]>([]);
  const [bonusInfo, setBonusInfo] = useState<{ bonus: number; size: number; message: string } | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("LOADING")
  const [nextPhaseTime, setNextPhaseTime] = useState<number | null>(null)
  const [nextCandleTime, setNextCandleTime] = useState<number | null>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null)
  const [currentSymbol, setCurrentSymbol] = useState<string>("BTCUSDT")
  const [timeframe, setTimeframe] = useState<string>("1m")
  // Estructura: { [symbol]: { [timeframe]: Bet[] } }
  const [betsByPair, setBetsByPair] = useState<Record<string, Record<string, Bet[]>>>({});
  const [betsHydrated, setBetsHydrated] = useState(false);
  const bets = betsByPair[currentSymbol]?.[timeframe] || [];
  const [userBalance, setUserBalance] = useState<number>(100) // Saldo inicial reducido a 100$

  // Función para limpiar todas las apuestas
  const clearBets = () => {
    setBetsByPair({});
    localStorage.removeItem("betsByPair");
  };

  // Función para limpiar solo las apuestas del par y timeframe actual
  const clearBetsForCurrentPairAndTimeframe = () => {
    setBetsByPair(prev => {
      const updated = { ...prev };
      if (updated[currentSymbol] && updated[currentSymbol][timeframe]) {
        updated[currentSymbol] = { ...updated[currentSymbol] };
        delete updated[currentSymbol][timeframe];
        // Si ya no quedan timeframes, borra el par
        if (Object.keys(updated[currentSymbol]).length === 0) {
          delete updated[currentSymbol];
        }
      }
      // Actualiza localStorage manualmente
      localStorage.setItem("betsByPair", JSON.stringify(updated));
      return updated;
    });
  };

  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0)
  const [currentCandleBets, setCurrentCandleBets] = useState<number>(0)
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string }[]>([])
  const [pendingResolutions, setPendingResolutions] = useState<{ candle: Candle; time: number }[]>([])
  // --- WIN STREAK STATE ---
  const [winStreak, setWinStreak] = useState<number>(0)
  const [streakMultiplier, setStreakMultiplier] = useState<number>(1)

  // --- PERSISTENCIA LOCAL ---
  // Cargar datos guardados al iniciar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedBets = localStorage.getItem("betsByPair");
    const savedBalance = localStorage.getItem("userBalance");
    if (savedBets) {
      try {
        setBetsByPair(JSON.parse(savedBets));
      } catch (e) {
        localStorage.removeItem("betsByPair");
      }
    }
    if (savedBalance) {
      setUserBalance(Number(savedBalance));
    }
    setBetsHydrated(true);
  }, []);

  // Guardar apuestas y balance en cada cambio
  useEffect(() => {
    if (!betsHydrated) return;
    localStorage.setItem("betsByPair", JSON.stringify(betsByPair));
  }, [betsByPair, betsHydrated]);
  useEffect(() => {
    localStorage.setItem("userBalance", String(userBalance));
  }, [userBalance]);


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

  
  // --- SOLUCIÓN: Al hidratar apuestas y vela actual, si hay apuestas PENDING para la vela actual y no hay resolución pendiente, programar la resolución ---
  useEffect(() => {
    if (!betsHydrated || !currentCandle) return;
    const tfBets = betsByPair[currentSymbol]?.[timeframe] || [];
    const hasPending = tfBets.some(bet => bet.status === "PENDING" && bet.timestamp === currentCandle.timestamp);
    const alreadyPending = pendingResolutions.some(item => item.candle.timestamp === currentCandle.timestamp);
    if (hasPending && !alreadyPending) {
      // Programar la resolución para el cierre real de la vela
      const candleDuration = getTimeframeInMs(timeframe);
      const resolutionTime = currentCandle.timestamp + candleDuration;
      setPendingResolutions(prev => [...prev, { candle: currentCandle, time: resolutionTime }]);
    }
  }, [betsHydrated, betsByPair, currentCandle, timeframe, currentSymbol, pendingResolutions]);

  // --- LIQUIDACIÓN INMEDIATA: Si el precio actual cruza el liquidationPrice, resolver la apuesta ya ---
  useEffect(() => {
    if (!betsHydrated || !currentCandle) return;
    const tfBets = betsByPair[currentSymbol]?.[timeframe] || [];
    let liquidated = false;
    const updatedBets = tfBets.map(bet => {
      if (bet.status !== 'PENDING' || !bet.liquidationPrice || !bet.entryPrice) return bet;
      if (bet.prediction === 'BULLISH') {
        // Liquidar si el precio actual <= liquidationPrice
        if (currentCandle.close <= bet.liquidationPrice) {
          liquidated = true;
          return {
            ...bet,
            status: 'LIQUIDATED' as const,
            wasLiquidated: true,
            resolvedAt: Date.now(),
            winnings: 0,
            bonus: 0,
            multiplier: 1,
          };
        }
      } else {
        // Liquidar si el precio actual >= liquidationPrice
        if (currentCandle.close >= bet.liquidationPrice) {
          liquidated = true;
          return {
            ...bet,
            status: 'LIQUIDATED' as const,
            wasLiquidated: true,
            resolvedAt: Date.now(),
            winnings: 0,
            bonus: 0,
            multiplier: 1,
          };
        }
      }
      return bet;
    });
    if (liquidated) {
      setBetsByPair(prev => {
        const symbolBets = { ...(prev[currentSymbol] || {}) };
        symbolBets[timeframe] = updatedBets;
        return { ...prev, [currentSymbol]: symbolBets };
      });
      // Aquí NO cambiamos la fase ni el contador. Solo se liquida la apuesta.
      // Puedes mostrar un toast/modal si quieres feedback inmediato.
    }
  }, [betsHydrated, betsByPair, currentCandle, timeframe, currentSymbol]);

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

        // IMPORTANTE: NO añadir resoluciones pendientes aquí. Solo se añaden al cerrar una vela real (en el handler de nuevas velas).

        // Determine current phase
        const now = Date.now() + serverTimeOffset
        const timeUntilNextCandle = nextCandleTime - now

        // Siempre forzar el inicio de fase de apuestas al detectar una nueva vela
        if (timeUntilNextCandle > candleDuration - 10000 || now < currentCandleTime + 10000) {
          setGamePhase("BETTING");
          setNextPhaseTime(currentCandleTime + 10000); // 10 segundos después del inicio de la vela
          setCurrentCandle(historicalData[historicalData.length - 1]);
          setCurrentCandleBets(0);
          console.log('[FASE] Nueva vela - BETTING', { currentCandleTime, nextCandleTime, now });
        } else {
          setGamePhase("WAITING");
          setNextPhaseTime(nextCandleTime); // Esperar hasta la próxima vela
          console.log('[FASE] Esperando próxima vela', { currentCandleTime, nextCandleTime, now });
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
        // Calcular tamaño de la vela cerrada
        const size = Math.abs(candle.high - candle.low);
        setCandleSizes((prev) => {
          const arr = [...prev, size];
          if (arr.length > 10) arr.shift();
          return arr;
        });

        // Programar la resolución de apuestas para cuando se cierre la vela
        const candleDuration = getTimeframeInMs(timeframe)
        const resolutionTime = candle.timestamp + candleDuration;

        // Añadir a la lista de resoluciones pendientes
        setPendingResolutions((prev) => [...prev, { candle, time: resolutionTime }])

        // Añadir la vela cerrada al historial
        setCandles((prev) => [...prev, candle])

        // Resetear contador de apuestas para la nueva vela
        setCurrentCandleBets(0)

        // Iniciar estrictamente la fase de apuestas por 10s al abrir nueva vela
        const nextCandleTime = candle.timestamp + candleDuration;
        setNextCandleTime(nextCandleTime);
        setGamePhase("BETTING");
        setNextPhaseTime(candle.timestamp + 10000); // Solo 10s exactos para apostar
        setCurrentCandleBets(0);
        console.log('[FASE] WebSocket: Nueva vela - BETTING', { candle, nextCandleTime });

        toast({
          title: `Vela cerrada: ${candle.close > candle.open ? "ALCISTA ↑" : "BAJISTA ↓"}`,
          description: `Las apuestas se resolverán al final del período (${timeframe})`,
          variant: candle.close > candle.open ? "default" : "destructive",
        });
      } else {
        // Update game phase based on time
        const now = Date.now() + serverTimeOffset
        const candleStartTime = candle.timestamp
        const timeElapsedInCandle = now - candleStartTime

        // Si han pasado más de 10 segundos desde el inicio de la vela, cerrar la fase de apuestas
        // Si han pasado exactamente 10s desde el inicio de la vela, cambiar a WAITING hasta el cierre
        if (gamePhase === "BETTING" && timeElapsedInCandle >= 10000) {
          setGamePhase("WAITING");
          const candleDuration = getTimeframeInMs(timeframe);
          const nextCandleTime = candleStartTime + candleDuration;
          setNextPhaseTime(null); // Ya no hay otra fase antes del cierre
          setNextCandleTime(nextCandleTime);
          toast({
            title: "Fase de apuestas finalizada",
            description: "Ya no se pueden realizar más apuestas para esta vela",
            variant: "default",
          });
        }
      }
    },
    [gamePhase, timeframe, serverTimeOffset, toast],
  )

  // Resolve bets when a candle closes
  const resolveBets = useCallback(
    (candle: Candle) => {
      // --- BONUS Y MENSAJE DE RÉCORDS ---
      const size = Math.abs(candle.high - candle.low);
      let bonusPercent = 0;
      if (size > 600) bonusPercent = 3.0;
      else if (size > 400) bonusPercent = 2.0;
      else if (size > 250) bonusPercent = 1.5;
      else if (size > 150) bonusPercent = 1.0;
      else if (size > 75) bonusPercent = 0.5;
      else if (size > 25) bonusPercent = 0.25;
      else if (size > 0) bonusPercent = 0.10;
      let last10 = candleSizes;
      let message = "";
      if (last10.length > 1 && size > last10[last10.length - 2]) message = "¡Vela más grande en 1 minuto!";
      if (last10.length >= 5 && size > Math.max(...last10.slice(-5))) message = "¡Vela más grande en 5 minutos!";
      if (last10.length === 10 && size > Math.max(...last10)) message = "¡Vela más grande en 10 minutos!";
      // --- FIN BONUS Y MENSAJE DE RÉCORDS ---
      const isBullish = candle.close > candle.open
      let totalWinnings = 0
      let wonCount = 0
      let lostCount = 0
      let lastResultWon = null;

      setBetsByPair((prev) => {
        const symbolBets = { ...(prev[currentSymbol] || {}) };
        let tfBets = (symbolBets[timeframe] || []).map((bet) => {
           if (bet.status !== "PENDING" || bet.symbol !== currentSymbol || bet.timeframe !== timeframe) return bet;

           // Lógica de liquidación automática para apuestas con leverage
           let wasLiquidated = false;
           let liquidationTouched = false;
           if (bet.leverage && bet.liquidationPrice && bet.entryPrice) {
             if (bet.prediction === "BULLISH") {
               // Liquidación si el mínimo de la vela toca o baja del liquidationPrice
               if (candle.low <= bet.liquidationPrice) liquidationTouched = true;
             } else {
               // Liquidación si el máximo de la vela toca o sube del liquidationPrice
               if (candle.high >= bet.liquidationPrice) liquidationTouched = true;
             }
           }
           if (liquidationTouched) {
              lostCount++;
              wasLiquidated = true;
              // --- NUEVO: comisión por liquidación ---
              const liquidationFeePct = 0.10; // 10% de comisión
              const liquidationFee = bet.amount * liquidationFeePct;
              setUserBalance(prev => Math.max(0, prev - liquidationFee));
              return {
                ...bet,
                status: 'LIQUIDATED' as const,
                wasLiquidated: true,
                resolvedAt: Date.now(),
                winnings: 0,
                bonus: 0,
                multiplier: 1,
                liquidationFee,
              } as Bet;
            }

           // Si no fue liquidada, evaluar si ganó o perdió
           const won = (bet.prediction === "BULLISH" && isBullish) || (bet.prediction === "BEARISH" && !isBullish);
           let winnings = 0;
           let bonus = 0;
           // --- WIN STREAK MULTIPLIER LOGIC ---
           let multiplier = 1;
           if (wonCount >= 9) multiplier = 3;
           else if (wonCount >= 6) multiplier = 2;
           else if (wonCount >= 3) multiplier = 1.5;
           // Bonificación escalonada por tamaño de vela
           if (size > 600) bonus = bet.amount * 3.0;
           else if (size > 400) bonus = bet.amount * 2.0;
           else if (size > 250) bonus = bet.amount * 1.5;
           else if (size > 150) bonus = bet.amount * 1.0;
           else if (size > 75) bonus = bet.amount * 0.5;
           else if (size > 25) bonus = bet.amount * 0.25;
           else if (size > 0) bonus = bet.amount * 0.10;
           if (won) {
             // --- NUEVO CÁLCULO: Payout explosivo con apalancamiento ---
             let winningsRaw = 0;
             if (bet.leverage && bet.leverage > 1 && bet.entryPrice) {
                // priceChangePct: variación relativa del precio
                const priceChangePct = ((candle.close - bet.entryPrice) / bet.entryPrice) * (bet.prediction === "BULLISH" ? 1 : -1);
                winningsRaw = bet.amount + bet.amount * priceChangePct * bet.leverage;
                // Si la pérdida es igual o mayor al 100%, liquidar
                if (winningsRaw <= 0) {
                  winningsRaw = 0;
                }
              } else {
                winningsRaw = bet.amount;
              }
             // Si quieres mantener un pequeño efecto de variación de precio, puedes sumar un extra:
             // winningsRaw += bet.amount * priceChangePct * (bet.leverage || 1);
             // Solo ganas si la predicción fue correcta
             winnings = won ? winningsRaw : 0;
             // Aplica bonus y multiplicador de racha solo si ganaste
             if (won) winnings = winnings * multiplier + bonus;
             // --- Eliminado límite de ganancia: ahora puedes ganar cualquier cantidad ---
             totalWinnings += winnings; // Se suma sin límite
             wonCount++;
             lastResultWon = true;
           } else {
             winnings = 0;
             bonus = 0;
             totalWinnings += winnings;
             lostCount++;
             lastResultWon = false;
           }
           // Detectar jackpot: 10+ racha o 3+ apuestas ganadas en una ronda
           if (wonCount >= 10 || (wonCount >= 3 && wonCount === bets.filter(b => b.status === 'PENDING').length)) {
             setBonusInfo({
               bonus: winnings,
               size,
               message: wonCount >= 10 ? '¡JACKPOT! 10+ apuestas en racha' : '¡Racha especial! 3+ apuestas ganadas en una ronda',
             });
           }
           return {
             ...bet,
             status: won ? 'WON' : 'LOST',
             wasLiquidated: false,
             resolvedAt: Date.now(),
             winnings,
             bonus,
             multiplier: won ? multiplier : 1,
           } as Bet;
         });

        // Actualizar balance después de procesar todas las apuestas
        if (totalWinnings > 0) {
          setUserBalance((balance) => balance + totalWinnings);
          toast({
            title: `¡Has ganado $${totalWinnings.toFixed(2)}!`,
            description: `${wonCount} apuesta${wonCount !== 1 ? "s" : ""} ganada${wonCount !== 1 ? "s" : ""}` + (wonCount >= 3 ? ` (Racha x${wonCount >= 9 ? 3 : wonCount >= 6 ? 2 : wonCount >= 3 ? 1.5 : 1})` : ""),
            variant: "default",
          });
        } else if (tfBets.some((bet) => bet.status === "LOST" && bet.resolvedAt === Date.now())) {
          toast({
            title: "Apuestas resueltas",
            description: "No has ganado en esta ronda",
            variant: "destructive",
          });
        }
        symbolBets[timeframe] = tfBets;
        return { ...prev, [currentSymbol]: symbolBets };
      });

      // --- WIN STREAK STATE UPDATE ---
      // If user won all bets en esta resolución, increment streak, else reset
      if (wonCount > 0 && lostCount === 0) {
        setWinStreak((prev) => {
          const newStreak = prev + wonCount;
          // Update multiplier for next round
          let multi = 1;
          if (newStreak >= 9) multi = 3;
          else if (newStreak >= 6) multi = 2;
          else if (newStreak >= 3) multi = 1.5;
          setStreakMultiplier(multi);
          // Jackpot: 10+ racha
          if (newStreak >= 10) {
            setBonusInfo({
              bonus: totalWinnings,
              size,
              message: '¡JACKPOT! 10+ apuestas en racha',
            });
          }
          return newStreak;
        });
      } else if (lostCount > 0) {
        setWinStreak(0);
        setStreakMultiplier(1);
      }

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
    [bets, currentSymbol, timeframe, toast, unlockAchievement, winStreak, streakMultiplier],
  )

  // Efecto para transición automática de fases por temporizador
  useEffect(() => {
    if (!nextPhaseTime || !nextCandleTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (gamePhase === "BETTING" && nextPhaseTime && now >= nextPhaseTime) {
        setGamePhase("WAITING");
        // El timer para la próxima vela ya está corriendo
      } else if (gamePhase === "WAITING" && nextCandleTime && now >= nextCandleTime) {
        // Forzar nueva fase de apuestas y resetear todo
        setGamePhase("BETTING");
        setNextPhaseTime(now + 10000); // 10 segundos de apuestas
        setNextCandleTime(now + getTimeframeInMs(timeframe));
        setCurrentCandleBets(0);
        // Opcional: notificar nueva vela
        toast({
          title: "Nueva vela",
          description: "¡Comienza una nueva ronda de apuestas!",
        });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [gamePhase, nextPhaseTime, nextCandleTime, timeframe, toast]);

  // Place a bet
  const placeBet = useCallback(
    (prediction: "BULLISH" | "BEARISH", amount: number, leverage: number = 1) => {
      if (gamePhase !== "BETTING") {
        toast({
          title: "No puedes apostar ahora",
          description: "Solo puedes apostar en los primeros 10 segundos de cada vela",
          variant: "destructive",
        })
        return
      }

      // Verificar si ya se alcanzó el límite de apuestas para esta vela
      if (currentCandleBets >= 1) {
        toast({
          title: "Límite de apuestas alcanzado",
          description: "Solo puedes hacer 1 apuesta por vela",
          variant: "destructive",
        })
        return
      }

      // Obtener apuestas actuales del par/timeframe
const pairBets = bets;

if (amount <= 0 || amount > userBalance) {
        toast({
          title: "Cantidad inválida",
          description: "No tienes suficiente saldo",
          variant: "destructive",
        })
        return
      }

      // Ajustar el timestamp de la apuesta para que siempre caiga dentro de la vela actual
      const candleTimestamp = currentCandle ? currentCandle.timestamp : Date.now();
      // Calcular entryPrice y liquidationPrice según leverage y porcentaje apostado
      const entryPrice = currentCandle ? currentCandle.close : 0;
      let liquidationPrice: number | undefined = undefined;
      if (leverage > 1 && entryPrice > 0) {
        // Efecto super fuerte: si apuestas más del 30% del balance, la liquidación se acerca mucho
        let baseDistance = 0.99 / leverage;
        let dynamicDistance = baseDistance;
        const betPercent = amount / userBalance;
        if (betPercent > 0.3) {
          // Aplica castigo brutal: hasta 85% de reducción del margen
          const risk = Math.min(1, (betPercent - 0.3) / 0.7);
          dynamicDistance = baseDistance * (1 - 0.85 * risk);
        }
        if (prediction === "BULLISH") {
          liquidationPrice = entryPrice * (1 - dynamicDistance);
        } else {
          liquidationPrice = entryPrice * (1 + dynamicDistance);
        }
      }
      const newBet: Bet = {
        id: uuidv4(),
        prediction,
        amount,
        timestamp: candleTimestamp + Math.floor(Math.random() * 10000), // Simula aleatorio dentro de la vela
        status: "PENDING",
        symbol: currentSymbol,
        timeframe,
        leverage: leverage > 1 ? leverage : undefined,
        entryPrice: entryPrice,
        liquidationPrice: leverage > 1 ? liquidationPrice : undefined,
        wasLiquidated: false,
      }
      console.log('[BET] Intentando apostar', { prediction, amount, gamePhase, currentCandleBets, candleTimestamp, currentCandle });

      setBetsByPair((prev) => {
  const symbolBets = { ...(prev[currentSymbol] || {}) };
  const tfBets = [...(symbolBets[timeframe] || []), newBet];
  symbolBets[timeframe] = tfBets;
  return { ...prev, [currentSymbol]: symbolBets };
})
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
  // Al cerrar sesión, limpiar apuestas y balance
useEffect(() => {
  window.addEventListener("logout", () => {
    setBetsByPair({});
    setUserBalance(100);
    localStorage.removeItem("betsByPair");
    localStorage.removeItem("userBalance");
  });
  return () => window.removeEventListener("logout", () => {});
}, []);

const changeSymbol = useCallback(
    (symbol: string) => {
      if (symbol === currentSymbol) return


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


      setTimeframe(newTimeframe)
      setCandles([])
      setCurrentCandle(null)
      setCurrentCandleBets(0)
      setPendingResolutions([])
      // No tocamos betsByPair, solo cambiamos el timeframe actual
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

  // Solo las apuestas del símbolo y timeframe actual
  // (declarada arriba, no redeclarar aquí)

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
        betsByPair,
        userBalance,
        isConnected,
        placeBet,
        changeSymbol,
        changeTimeframe,
        currentCandleBets,
        candleSizes,
        bonusInfo,
        setBonusInfo,
        addCoins,
        clearBets,
        clearBetsForCurrentPairAndTimeframe,
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
