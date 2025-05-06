"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { getAutoMixMemory } from "@/utils/autoMixMemory"
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
  betsByPair: Record<string, Record<string, Bet[]>>
  setBetsByPair: React.Dispatch<React.SetStateAction<Record<string, Record<string, Bet[]>>>>
  userBalance: number
  isConnected: boolean
  placeBet: (prediction: "BULLISH" | "BEARISH", amount: number, leverage?: number, options?: { esAutomatica?: 'Sí' | 'No'; autoType?: 'MIX' | 'AUTO' | 'MANUAL' }) => Bet
  changeSymbol: (symbol: string) => void
  changeTimeframe: (timeframe: string) => void
  currentCandleBets: number
  candleSizes: number[]
  bonusInfo: { bonus: number; size: number; message: string } | null
  setBonusInfo: React.Dispatch<React.SetStateAction<{ bonus: number; size: number; message: string } | null>>
  addCoins: (amount: number) => void
  clearBets: () => void
  clearBetsForCurrentPairAndTimeframe: () => void;
  autoBullish: boolean;
  autoBearish: boolean;
  autoMix: boolean;
  toggleAutoBullish: () => void;
  toggleAutoBearish: () => void;
  toggleAutoMix: () => void;
  currentUser: string | null;
  setCurrentUser: (u: string | null) => void;
  achievements: string[];
  setAchievements: (a: string[]) => void;
  autoMixMemory: any[];
  setAutoMixMemory: (m: any[]) => void;
  saveUserData: (username: string, data: any) => void;
  loadUserData: (username: string) => any;
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  // --- PERSISTENCIA POR USUARIO ---
  const [currentUser, setCurrentUser] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null);
  const [userBalance, setUserBalance] = useState<number>(100);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [autoMixMemory, setAutoMixMemory] = useState<any[]>([]); // Ajusta el tipo según tu definición
  const [betsByPair, setBetsByPair] = useState<Record<string, Record<string, any[]>>>({});

  // --- LIMPIEZA DE ESTADO AL CAMBIAR USUARIO (LOGOUT/LOGIN) ---
  useEffect(() => {
    // Si el usuario cambia (logout o login), limpia apuestas y otros estados
    clearBets();
    setUserBalance(100); // Resetear balance a valor inicial
    setAchievements([]); // Limpiar logros
    setAutoMixMemory([]); // Limpiar memoria de mix
  }, [currentUser]);

  function saveUserData(username: string, data: any) {
    localStorage.setItem(`userData_${username}`, JSON.stringify(data));
  }
  function loadUserData(username: string) {
    const raw = localStorage.getItem(`userData_${username}`);
    const isGuest = username.startsWith('invitado-') || username.startsWith('guest-');
    const now = Date.now();
    const EXPIRATION_MS = 48 * 60 * 60 * 1000; // 48 horas
    if (raw) {
      const data = JSON.parse(raw);
      if (isGuest) {
        // Verifica expiración
        if (!data.guestExpiresAt || now > data.guestExpiresAt) {
          // Expirado: reinicia datos
          const guestData = {
            balance: 100,
            betsByPair: {},
            achievements: [],
            autoMixMemory: [],
            guestExpiresAt: now + EXPIRATION_MS,
          };
          localStorage.setItem(`userData_${username}`, JSON.stringify(guestData));
          return guestData;
        }
      }
      return data;
    }
    // Si no existe, crea datos nuevos
    const initialData = {
      balance: 100,
      betsByPair: {},
      achievements: [],
      autoMixMemory: [],
      ...(isGuest ? { guestExpiresAt: now + EXPIRATION_MS } : {}),
    };
    localStorage.setItem(`userData_${username}`, JSON.stringify(initialData));
    return initialData;
  }

  // --- Restaurar datos al login ---
  useEffect(() => {
    if (currentUser) {
      const data = loadUserData(currentUser);
      setUserBalance(data.balance ?? 100);
      // Corrige betsByPair: añade candleTimestamp si falta
      const migratedBetsByPair = {} as typeof data.betsByPair;
      for (const pair in (data.betsByPair ?? {})) {
        migratedBetsByPair[pair] = {};
        for (const tf in data.betsByPair[pair]) {
          migratedBetsByPair[pair][tf] = data.betsByPair[pair][tf].map((bet: any) => ({
            ...bet,
            candleTimestamp: bet.candleTimestamp ?? bet.timestamp,
          }));
        }
      }
      setBetsByPair(migratedBetsByPair);
      setAchievements(data.achievements ?? []);
      // Corrige autoMixMemory: añade valleyVote y otros campos si faltan
      const migratedAutoMixMemory = (data.autoMixMemory ?? []).map((entry: any) => ({
        valleyVote: entry.valleyVote ?? null,
        ...entry,
      }));
      setAutoMixMemory(migratedAutoMixMemory);
    }
  }, [currentUser]);

  // --- Sincroniza datos del usuario cada vez que cambian cosas clave ---
  useEffect(() => {
    if (currentUser) {
      saveUserData(currentUser, {
        balance: userBalance,
        betsByPair,
        achievements,
        autoMixMemory,
      });
    }
  }, [currentUser, userBalance, betsByPair, achievements, autoMixMemory]);
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
  const [autoBullish, setAutoBullish] = useState<boolean>(false);
  const [autoBearish, setAutoBearish] = useState<boolean>(false);
  const [autoMix, setAutoMix] = useState<boolean>(false);
  const toggleAutoMix = () => {
    setAutoMix((prev) => {
      const newVal = !prev;
      if (newVal) {
        setAutoBullish(false);
        setAutoBearish(false);
      }
      return newVal;
    });
  };
  const [nextPhaseTime, setNextPhaseTime] = useState<number | null>(null)
  const [nextCandleTime, setNextCandleTime] = useState<number | null>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null)
  const [currentSymbol, setCurrentSymbol] = useState<string>("BTCUSDT")
  const [timeframe, setTimeframe] = useState<string>("1m")
  // Estructura: { [symbol]: { [timeframe]: Bet[] } }
  // (eliminado: declaración duplicada de betsByPair y setBetsByPair, ahora está al inicio de GameProvider)
  const [betsHydrated, setBetsHydrated] = useState(false);
  // Usar useRef para mantener una referencia actualizada a las apuestas actuales
  const betsRef = useRef<Bet[]>([]);
  // Ref global para controlar apuestas automáticas por vela
  const autoBetDoneRef = useRef<{ [key: string]: boolean }>({});
  // Calcular bets a partir de betsByPair y mantener la referencia actualizada
  const bets = useMemo(() => {
    const currentBets = betsByPair[currentSymbol]?.[timeframe] || [];
    betsRef.current = currentBets;
    return currentBets;
  }, [betsByPair, currentSymbol, timeframe]);
// --- FIN PERSISTENCIA ---

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

  // Manejar evento de eliminación de apuesta
  useEffect(() => {
    const handleDeleteBet = (event: CustomEvent<{ betId: string }>) => {
      const { betId } = event.detail;
      setBetsByPair(prev => {
        const updated = { ...prev };
        if (updated[currentSymbol] && updated[currentSymbol][timeframe]) {
          const currentBets = updated[currentSymbol][timeframe];
          const filteredBets = currentBets.filter(bet => bet.id !== betId);
          updated[currentSymbol] = { ...updated[currentSymbol] };
          updated[currentSymbol][timeframe] = filteredBets;
          // Actualizar localStorage manualmente
          localStorage.setItem("betsByPair", JSON.stringify(updated));
        }
        return updated;
      });
    };

    window.addEventListener('deleteBet', handleDeleteBet as EventListener);
    return () => window.removeEventListener('deleteBet', handleDeleteBet as EventListener);
  }, [currentSymbol, timeframe]);

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
    if (pendingResolutions.length === 0) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const resolutionsToProcess = pendingResolutions.filter((item) => {
        // Solo resolver si la vela está realmente cerrada
        const isClosed = item.candle.isClosed;
        const isDue = now >= item.time;
        if (!isClosed && isDue) {
          console.warn('[RESOLVER] Vela aún no cerrada, se pospone resolución', item.candle);
        }
        return isClosed && isDue;
      });

      if (resolutionsToProcess.length > 0) {
        resolutionsToProcess.forEach((item) => {
          console.log('[RESOLVER] Resolviendo apuestas por cierre de vela', item.candle);
          resolveBets(item.candle);
        });

        // Eliminar solo las resoluciones procesadas
        setPendingResolutions((prev) => prev.filter((item) => !resolutionsToProcess.some((r) => r.time === item.time)));
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [pendingResolutions]);

  
  // --- SOLUCIÓN: Al hidratar apuestas y vela actual, si hay apuestas PENDING para la vela actual y no hay resolución pendiente, programar la resolución ---
  useEffect(() => {
    if (!betsHydrated || !currentCandle) return;
    // Solo programar resolución si la vela está cerrada
    if (!currentCandle.isClosed) return;
    const tfBets = betsByPair[currentSymbol]?.[timeframe] || [];
    const hasPending = tfBets.some(bet => bet.status === "PENDING" && bet.timestamp === currentCandle.timestamp);
    const alreadyPending = pendingResolutions.some(item => item.candle.timestamp === currentCandle.timestamp);
    if (hasPending && !alreadyPending) {
      // Programar la resolución para el cierre real de la vela
      const candleDuration = getTimeframeInMs(timeframe);
      const resolutionTime = currentCandle.timestamp + candleDuration;
      console.log('[RESOLVER] Programando resolución por cierre de vela', {candle: currentCandle, resolutionTime});
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

// Toast récord solo 6 veces al día por usuario
if (message) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `record_toast_count_${today}`;
    let count = 0;
    try {
      count = parseInt(localStorage.getItem(key) || '0', 10) || 0;
    } catch {}
    if (count < 6) {
      toast({
        title: message,
        description: '',
        variant: 'default',
        duration: 6000,
        isClosable: true,
      });
      try {
        localStorage.setItem(key, String(count + 1));
      } catch {}
    }
  } catch {}
}

      const isBullish = candle.close > candle.open
      let totalWinnings = 0
      let wonCount = 0
      let lostCount = 0
      let lastResultWon = null;

      setBetsByPair((prev) => {
        const symbolBets = { ...(prev[currentSymbol] || {}) };
        let tfBets = (symbolBets[timeframe] || []).map((bet) => {
           // SOLO resolver apuestas de la vela que se está cerrando (usando candleTimestamp)
           if (bet.status !== "PENDING" || bet.symbol !== currentSymbol || bet.timeframe !== timeframe || bet.candleTimestamp !== candle.timestamp) return bet;

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
        // Reinicia el contador también si la vela cambió realmente
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
    (prediction: "BULLISH" | "BEARISH", amount: number, leverage: number = 1, options?: { esAutomatica?: 'Sí' | 'No', autoType?: 'MIX' | 'AUTO' | 'MANUAL' }): Bet => {
      if (gamePhase !== "BETTING") {
        toast({
          title: "No puedes apostar ahora",
          description: "Solo puedes apostar en los primeros 10 segundos de cada vela",
          variant: "destructive",
        })
        throw new Error("No puedes apostar ahora");
      }

      // Verificar si ya se alcanzó el límite de apuestas para esta vela
      if (currentCandleBets >= 1) {
        toast({
          title: "Límite de apuestas alcanzado",
          description: "Solo puedes hacer 1 apuesta por vela",
          variant: "destructive",
        })
        throw new Error("Límite de apuestas alcanzado");
      }

      // Obtener apuestas actuales del par/timeframe
const pairBets = bets;

if (amount <= 0 || amount > userBalance) {
        toast({
          title: "Cantidad inválida",
          description: "No tienes suficiente saldo",
          variant: "destructive",
        })
        throw new Error("Cantidad inválida");
      }

      // Ajustar el timestamp de la apuesta para que siempre caiga dentro de la vela actual
      const candleTimestamp = currentCandle ? currentCandle.timestamp : Date.now();
      // Calcular entryPrice y liquidationPrice según leverage y porcentaje apostado
      const entryPrice = currentCandle ? currentCandle.close : 0;
      let liquidationPrice: number | undefined = undefined;
      
      // Asegurarse de que siempre se calcule el precio de liquidación cuando hay apalancamiento
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
        
        // Registro de depuración para verificar el cálculo del precio de liquidación
        console.log('Creando apuesta con liquidación:', { 
          prediction, 
          entryPrice, 
          liquidationPrice, 
          leverage, 
          dynamicDistance,
          isAuto: autoBullish || autoBearish
        });
      }
      const newBet: Bet = {
        id: uuidv4(),
        prediction,
        amount,
        timestamp: candleTimestamp + Math.floor(Math.random() * 10000), // Simula aleatorio dentro de la vela
        candleTimestamp: candleTimestamp, // NUEVO: timestamp exacto de la vela
        status: "PENDING",
        symbol: currentSymbol,
        timeframe,
        leverage: leverage > 1 ? leverage : undefined,
        entryPrice: entryPrice,
        liquidationPrice: leverage > 1 ? liquidationPrice : undefined,
        wasLiquidated: false,
        esAutomatica: options?.esAutomatica,

        autoType: options?.autoType,
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
      return newBet;
    },
    [gamePhase, userBalance, currentSymbol, timeframe, bets.length, currentCandleBets, toast, unlockAchievement],
  )

  // Change symbol
  // Al cerrar sesión, limpiar usuario activo, pero NO borrar datos persistentes
useEffect(() => {
  window.addEventListener("logout", () => {
    setCurrentUser(null);
    setBetsByPair({});
    setUserBalance(100);
    setAchievements([]);
    setAutoMixMemory([]);
    localStorage.removeItem("currentUser");
    // NO borres userData_{username}
  });
  return () => window.removeEventListener("logout", () => {});
}, []);

const changeSymbol = useCallback(
    (symbol: string) => {
      if (symbol === currentSymbol) return


      // Si no hay apuestas activas ni pendientes en el nuevo par/timeframe, desactiva MIX
      const hasActiveBets = betsByPair[symbol]?.[timeframe]?.some(bet => bet.status === "PENDING") ?? false;
      if (!hasActiveBets) setAutoMix(false);
      setCurrentSymbol(symbol)
      setCandles([])
      setCurrentCandle(null)
      setCurrentCandleBets(0)
      setPendingResolutions([])
      // Al cambiar símbolo, siempre reinicia el contador de apuestas de la vela
    },
    [currentSymbol, bets, toast],
  )

  // Change timeframe
  const changeTimeframe = useCallback(
    (newTimeframe: string) => {
      if (newTimeframe === timeframe) return


      // Si no hay apuestas activas ni pendientes en el nuevo timeframe, desactiva MIX
      const hasActiveBets = betsByPair[currentSymbol]?.[newTimeframe]?.some(bet => bet.status === "PENDING") ?? false;
      if (!hasActiveBets) setAutoMix(false);
      setTimeframe(newTimeframe)
      setCandles([])
      setCurrentCandle(null)
      setCurrentCandleBets(0)
      setPendingResolutions([])
      // Al cambiar timeframe, siempre reinicia el contador de apuestas de la vela
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

  // Toggle auto betting functions
  const toggleAutoBullish = useCallback(() => {
    setAutoBullish(prev => {
      const newValue = !prev;
      // Si activamos bullish, desactivamos bearish para evitar conflictos
      if (newValue) setAutoBearish(false);
      return newValue;
    });
  }, []);

  const toggleAutoBearish = useCallback(() => {
    setAutoBearish(prev => {
      const newValue = !prev;
      // Si activamos bearish, desactivamos bullish para evitar conflictos
      if (newValue) setAutoBullish(false);
      return newValue;
    });
  }, []);
  
  // Automatic betting system
  // --- HISTORIAL PARA MIX ---
  const mixHistoryRef = useRef<string[]>([]);
  const betAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Solo permitir apuestas automáticas si la vela está inicializada (close distinto de open)
    // Solo permitir una apuesta automática/MIX por vela
    if (gamePhase !== "BETTING" || !currentCandle || currentCandleBets >= 1 || userBalance < 1) {
      if (currentCandleBets >= 1) {
        console.log('[AUTO BET] Ya existe una apuesta en esta vela, no se crea otra automática.');
      }
      return;
    }
    // Evita crear apuestas automáticas si la vela recién se ha creado y su close es igual al de la anterior
    const prevCandle = candles.length > 0 ? candles[candles.length - 1] : null;
    if (prevCandle && currentCandle.close === prevCandle.close) {
      // No crear apuesta automática si la vela nueva aún no está inicializada (close igual a la anterior)
      return;
    }
    // Validación extra: no crear apuesta si ya hay una apuesta MIX pendiente para este timestamp
    if (autoMix) {
      const tfBets = betsByPair[currentSymbol]?.[timeframe] || [];
      const lastMixBet = tfBets.filter(bet => bet.id.startsWith('auto_') && bet.status === 'PENDING').sort((a, b) => b.timestamp - a.timestamp)[0];
      if (lastMixBet && currentCandle.timestamp <= lastMixBet.timestamp) {
        // Ya existe una apuesta automática para esta vela o la anterior, no crear otra
        return;
      }
      // --- DECISIÓN DE DIRECCIÓN BASADA EN MACD ---
      // Obtener el monto configurado por el usuario (ejemplo: de localStorage o estado global)
      let userAmount = 1;
      try {
        const stored = localStorage.getItem('autoMixAmount');
        if (stored) {
          const parsed = parseFloat(stored);
          if (!isNaN(parsed) && parsed > 0) userAmount = parsed;
        }
      } catch {}
      // Usar siempre el monto configurado por el usuario, solo limitar por saldo disponible
      Promise.all([
  import("@/utils/macd-decision"),
  import("@/utils/autoMixMemory")
]).then(([macdMod, memMod]) => {
  const { decideMixDirection } = macdMod;
  const { shouldInvertDecision } = memMod;
  // Obtener señales detalladas
  const candlesSlice = candles.slice();
  const last65 = candlesSlice.slice(-66, -1);
  const bullishCount = last65.filter(c => c.close > c.open).length;
  const bearishCount = last65.length - bullishCount;
  let majoritySignal: "BULLISH" | "BEARISH" | null = null;
  if (bullishCount > bearishCount) majoritySignal = "BULLISH";
  else if (bearishCount > bullishCount) majoritySignal = "BEARISH";
  // RSI
  function calcRSI(candles: any[], period = 14): number {
    if (candles.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    if (gains + losses === 0) return 50;
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  const rsi = calcRSI(candlesSlice);
  let rsiSignal: "BULLISH" | "BEARISH" | null = null;
  if (rsi > 70) rsiSignal = "BEARISH";
  else if (rsi < 30) rsiSignal = "BULLISH";
  // MACD
  function calcEMA(values: number[], period: number): number[] {
    const k = 2 / (period + 1);
    let emaArr: number[] = [];
    let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    emaArr[period - 1] = ema;
    for (let i = period; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
      emaArr[i] = ema;
    }
    return emaArr;
  }
  const closes = candlesSlice.slice(-66).map((c: any) => c.close);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  let macdLineArr: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (ema12[i] !== undefined && ema26[i] !== undefined) {
      macdLineArr[i] = ema12[i] - ema26[i];
    } else {
      macdLineArr[i] = 0;
    }
  }
  const signalLineArr = calcEMA(macdLineArr.filter(x => x !== undefined), 9);
  const macd = macdLineArr[macdLineArr.length - 1];
  const macdSignalLine = signalLineArr[signalLineArr.length - 1];
  let macdSignal: "BULLISH" | "BEARISH" | null = null;
  if (macd > macdSignalLine) macdSignal = "BULLISH";
  else if (macd < macdSignalLine) macdSignal = "BEARISH";

  // Decisión base
  let direction = decideMixDirection(candles);
  // Consultar memoria: si la combinación es perdedora, invertir
  if (shouldInvertDecision(majoritySignal, rsiSignal, macdSignal)) {
    direction = direction === "BULLISH" ? "BEARISH" : "BULLISH";
    console.log('[AUTO MIX] Dirección invertida por memoria');
  }
  let finalAmount = userAmount;
  finalAmount = Math.min(finalAmount, userBalance);
  // Leer leverage de localStorage (igual que la UI)
  let leverage = 2000;
  try {
    const storedLev = localStorage.getItem('autoMixLeverage');
    if (storedLev) {
      const parsed = parseFloat(storedLev);
      if (!isNaN(parsed) && parsed > 0) leverage = parsed;
    }
  } catch {}
  // --- SONIDO DE APUESTA ---
  if (betAudioRef.current) {
    betAudioRef.current.currentTime = 0;
    betAudioRef.current.play();
  }
  const bet = placeBet(direction as "BULLISH" | "BEARISH", finalAmount, leverage, { esAutomatica: 'Sí', autoType: 'MIX' });
  // Guardar memoria (async, no bloquea)
  import("@/utils/autoMixMemory").then(({ saveAutoMixMemory }) => {
    const newEntry = {
      betId: bet?.id || `auto_${Date.now()}`,
      timestamp: Date.now(),
      direction: direction as "BULLISH" | "BEARISH",
      result: null,
      majoritySignal,
      rsiSignal,
      macdSignal,
      rsi,
      macd,
      macdSignalLine,
      valleyVote: null, // Valor por defecto para compatibilidad
      volumeVote: null, // Valor por defecto requerido
      consecutiveBets: 1
    };
    saveAutoMixMemory(newEntry);
  });
  console.log('[AUTO MIX] Apuesta automática MIX creada (MACD+MEM)', { direction, finalAmount, leverage, candle: currentCandle.timestamp, majoritySignal, rsiSignal, macdSignal, rsi, macd, macdSignalLine });
}).catch(() => {
        const direction = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
        let finalAmount = userAmount;
        finalAmount = Math.min(finalAmount, userBalance);
        // Leer leverage de localStorage (igual que la UI)
        let leverage = 2000;
        try {
          const storedLev = localStorage.getItem('autoMixLeverage');
          if (storedLev) {
            const parsed = parseFloat(storedLev);
            if (!isNaN(parsed) && parsed > 0) leverage = parsed;
          }
        } catch {}
        // --- SONIDO DE APUESTA ---
        if (betAudioRef.current) {
          betAudioRef.current.currentTime = 0;
          betAudioRef.current.play();
        }
        const bet = placeBet(direction as "BULLISH" | "BEARISH", finalAmount, leverage, { esAutomatica: 'Sí', autoType: 'MIX' });
        import("@/utils/autoMixMemory").then(({ saveAutoMixMemory }) => {
          const newEntry = {
            betId: bet?.id || `auto_${Date.now()}`,
            timestamp: Date.now(),
            direction: direction as "BULLISH" | "BEARISH",
            result: null,
            majoritySignal: null,
            rsiSignal: null,
            macdSignal: null,
            rsi: 0,
            macd: 0,
            macdSignalLine: 0,
            valleyVote: null,
            volumeVote: null,
            wasRandom: true,
            consecutiveBets: 1
          };
         console.log('[AUTO MIX][MEMORY] Guardando entrada:', newEntry);
    saveAutoMixMemory(newEntry);
    setTimeout(() => {
      try {
        const mem = getAutoMixMemory();
        console.log('[AUTO MIX][MEMORY] Estado actual de memoria tras guardar:', mem.slice(-5));
      } catch (e) {
        console.error('[AUTO MIX][MEMORY] Error leyendo memoria tras guardar', e);
      }
    }, 200);

        });
        console.log('[AUTO MIX] Apuesta automática MIX creada (fallback aleatorio)', { direction, finalAmount, leverage, candle: currentCandle.timestamp });
      });
      return;
    }
    // Rest of the automatic betting logic...
  }, [gamePhase, currentCandle, currentCandleBets, userBalance, autoMix, currentSymbol, timeframe, betsByPair]);

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
        setBetsByPair,
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
        autoBullish,
        autoBearish,
        autoMix,
        toggleAutoBullish,
        toggleAutoBearish,
        toggleAutoMix,
        currentUser,
        setCurrentUser,
        achievements,
        setAchievements,
        autoMixMemory,
        setAutoMixMemory,
        saveUserData,
        loadUserData,
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
