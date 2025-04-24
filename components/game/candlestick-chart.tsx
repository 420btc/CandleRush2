"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Candle } from "@/types/game"
import { useGame } from "@/context/game-context"
import { useDevice } from "@/context/device-mode-context"

interface CandlestickChartProps {
  candles: Candle[]
  currentCandle: Candle | null
}

interface ViewState {
  offsetX: number
  offsetY: number
  scale: number
  startX: number | null
  startY: number | null
  isDragging: boolean
}

export default function CandlestickChart({ candles, currentCandle }: CandlestickChartProps) {
  // ...
  const [countPlayed, setCountPlayed] = useState(false);
  const { nextCandleTime } = useGame();
  const countAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevMsLeftRef = useRef<number>(null);

  // Precargar el audio al montar
  useEffect(() => {
    countAudioRef.current = new Audio('/count.mp3');
    countAudioRef.current.preload = 'auto';
  }, []);

  // Sonido count.mp3 EXACTAMENTE cuando msLeft cruza de >6000 a <=6000
  useEffect(() => {
    if (!nextCandleTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const msLeft = nextCandleTime - now;
      const prevMsLeft = prevMsLeftRef.current;
      // Detectar cruce exacto de >6000 a <=6000
      if (
        prevMsLeft !== null &&
        prevMsLeft > 4000 &&
        msLeft <= 4000 &&
        msLeft > 0 &&
        !countPlayed &&
        countAudioRef.current
      ) {
        countAudioRef.current.currentTime = 0;
        countAudioRef.current.volume = 0.7;
        countAudioRef.current.play();
        setCountPlayed(true);
      }
      if ((msLeft > 4000 || msLeft <= 5000) && countPlayed) {
        setCountPlayed(false); // reset para el siguiente ciclo
      }
      prevMsLeftRef.current = msLeft;
    }, 50);
    return () => clearInterval(interval);
  }, [nextCandleTime, countPlayed]);
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isMobile } = useDevice()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const { bets } = useGame()

  // Restaurar efecto para inicializar dimensiones del canvas correctamente
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
        canvasRef.current.width = width * window.devicePixelRatio;
        canvasRef.current.height = height * window.devicePixelRatio;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
        setIsInitialized(true);
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Estado para la navegación del gráfico
  const [viewState, setViewState] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    startX: null,
    startY: null,
    isDragging: false,
  })

  // Referencia para el último timestamp renderizado
  const lastRenderRef = useRef<number>(0)

  // Función para dibujar el gráfico completo
  const drawChart = useCallback(() => {
    if (!isInitialized || !canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const allCandles = [...candles]
    if (currentCandle) {
      allCandles.push(currentCandle)
    }

    if (allCandles.length === 0) return

    // Aplicar escala de dispositivo para pantallas de alta resolución
    ctx.resetTransform()
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // Find min and max values for scaling
    let minPrice = Number.MAX_VALUE
    let maxPrice = Number.MIN_VALUE
    let minTime = Number.MAX_VALUE
    let maxTime = Number.MIN_VALUE

    allCandles.forEach((candle) => {
      minPrice = Math.min(minPrice, candle.low)
      maxPrice = Math.max(maxPrice, candle.high)
      minTime = Math.min(minTime, candle.timestamp)
      maxTime = Math.max(maxTime, candle.timestamp)
    })

    // Add some padding to price range
    const pricePadding = (maxPrice - minPrice) * 0.1
    minPrice -= pricePadding
    maxPrice += pricePadding

    // Calculate scaling factors with view state
    const priceRange = maxPrice - minPrice
    const timeRange = maxTime - minTime
    const xScale = (dimensions.width / timeRange) * viewState.scale
    const yScale = (dimensions.height / priceRange) * viewState.scale

    // Limitar el offset para que el gráfico no se salga del recuadro
    const maxOffsetX = Math.max(0, timeRange * viewState.scale - timeRange)
    const maxOffsetY = Math.max(0, priceRange * viewState.scale - priceRange)

    // Permitir pan hacia la izquierda hasta la mitad del canvas
const minOffsetX = -dimensions.width / 2
const clampedOffsetX = Math.min(Math.max(minOffsetX, viewState.offsetX), maxOffsetX)
    const clampedOffsetY = Math.min(Math.max(0, viewState.offsetY), maxOffsetY)

    if (clampedOffsetX !== viewState.offsetX || clampedOffsetY !== viewState.offsetY) {
      setViewState((prev) => ({
        ...prev,
        offsetX: clampedOffsetX,
        offsetY: clampedOffsetY,
      }))
    }

    // Draw background
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)


    // Draw candles with offset
    const candleWidth = Math.min(Math.max((dimensions.width / (allCandles.length / viewState.scale)) * 0.8, 2), 15)

    // Crear un mapa de apuestas por timestamp para acceso rápido
    const betsByTimestamp = new Map()
    bets.forEach((bet) => {
      // Encontrar la vela correspondiente a esta apuesta
      const candleForBet = allCandles.find((candle) => {
        // Verificar si la apuesta se hizo durante esta vela
        // Asumimos que cada vela dura según el timeframe
        const candleEndTime = candle.timestamp + 60000 // Asumimos 1 minuto por simplicidad
        return bet.timestamp >= candle.timestamp && bet.timestamp < candleEndTime
      })

      if (candleForBet) {
        if (!betsByTimestamp.has(candleForBet.timestamp)) {
          betsByTimestamp.set(candleForBet.timestamp, [])
        }
        betsByTimestamp.get(candleForBet.timestamp).push(bet)
      }
    })

    allCandles.forEach((candle) => {
      const x = (candle.timestamp - minTime) * xScale - clampedOffsetX

      // Calcular posición Y con el offset vertical
      const open = dimensions.height - ((candle.open - minPrice) * yScale - clampedOffsetY)
      const close = dimensions.height - ((candle.close - minPrice) * yScale - clampedOffsetY)
      const high = dimensions.height - ((candle.high - minPrice) * yScale - clampedOffsetY)
      const low = dimensions.height - ((candle.low - minPrice) * yScale - clampedOffsetY)

      // Solo dibujar velas visibles (optimización)
      if (x + candleWidth / 2 < 0 || x - candleWidth / 2 > dimensions.width || low < 0 || high > dimensions.height) {
        return
      }

      // Determine if bullish or bearish
      const isBullish = candle.close > candle.open
      ctx.fillStyle = isBullish ? "#22c55e" : "#ef4444"
      ctx.strokeStyle = isBullish ? "#22c55e" : "#ef4444"

      // Draw candle body
      const candleHeight = Math.abs(close - open) || 1 // Mínimo 1px de altura
      const candleY = isBullish ? close : open
      ctx.fillRect(x - candleWidth / 2, candleY, candleWidth, candleHeight)

      // Draw wicks
      ctx.beginPath()
      ctx.moveTo(x, high)
      ctx.lineTo(x, isBullish ? close : open)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x, isBullish ? open : close)
      ctx.lineTo(x, low)
      ctx.stroke()

      // Highlight current candle
      if (candle === currentCandle) {
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.strokeRect(x - candleWidth / 2 - 1, candleY - 1, candleWidth + 2, candleHeight + 2)
      }

      // Dibujar marcadores de apuestas si existen para esta vela
      const candleBets = betsByTimestamp.get(candle.timestamp)
      if (candleBets && candleBets.length > 0) {
        // Dibujar un marcador por cada tipo de apuesta (bullish/bearish)
        const hasBullish = candleBets.some((bet: import("@/types/game").Bet) => bet.prediction === "BULLISH")
        const hasBearish = candleBets.some((bet: import("@/types/game").Bet) => bet.prediction === "BEARISH")

        let markerY = high - 15 // Posición encima de la vela

        if (hasBullish) {
          // Dibujar marcador verde (alcista)
          ctx.fillStyle = "#22c55e"
          ctx.beginPath()
          ctx.arc(x, markerY, 3.5, 0, Math.PI * 2)
          ctx.fill()
          markerY -= 10 // Espacio para el siguiente marcador
        }

        if (hasBearish) {
          // Dibujar marcador rojo (bajista)
          ctx.fillStyle = "#ef4444"
          ctx.beginPath()
          ctx.arc(x, markerY, 3.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    })

    // === DIBUJAR EMAS ===
    // Función para calcular la EMA
    function calculateEMA(period: number, data: Candle[]): (number | null)[] {
      const k = 2 / (period + 1);
      let emaArray: (number | null)[] = [];
      let emaPrev: number | null = null;
      for (let i = 0; i < data.length; i++) {
        const price = data[i].close;
        if (i < period - 1) {
          emaArray.push(null); // No hay suficientes datos
        } else if (i === period - 1) {
          // Primer valor: media simple
          const sma = data.slice(0, period).reduce((sum: number, c: Candle) => sum + c.close, 0) / period;
          emaArray.push(sma);
          emaPrev = sma;
        } else if (emaPrev !== null) {
          const ema: number = price * k + emaPrev * (1 - k);
          emaArray.push(ema);
          emaPrev = ema;
        }
      }
      return emaArray;
    }

    // Calcular EMAs con todos los datos posibles
    const ema10 = calculateEMA(10, allCandles);
    const ema55 = calculateEMA(55, allCandles);
    const ema200 = calculateEMA(200, allCandles);

    // Función para dibujar una línea de EMA
    function drawEMA(emaArray: (number | null)[], color: string) {
      if (!ctx) return;
      ctx.save();
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < emaArray.length; i++) {
        if (emaArray[i] !== null) {
          const candle = allCandles[i];
          const x = (candle.timestamp - minTime) * xScale - clampedOffsetX;
          const y = dimensions.height - ((emaArray[i]! - minPrice) * yScale - clampedOffsetY);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.restore();
    }

    // Dibujar EMAs
    drawEMA(ema10, '#a259f7'); // Morado
    drawEMA(ema55, '#FFD600'); // Dorado
    drawEMA(ema200, '#2196f3'); // Azul

    // Draw chart title and info
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`${currentCandle ? currentCandle.close.toFixed(2) : ""}`, 10, 20)

    // Reset transformation
    ctx.resetTransform()

    // Guardar el timestamp de este render
    lastRenderRef.current = Date.now()
  }, [candles, currentCandle, dimensions, isInitialized, viewState, bets])

  // Actualizar solo la vela actual cada segundo
  useEffect(() => {
    if (!currentCandle || !isInitialized) return

    const updateCurrentCandle = () => {
      // Solo actualizar si han pasado al menos 500ms desde el último render completo
      if (Date.now() - lastRenderRef.current < 500) return

      if (!canvasRef.current) return
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      // Redibujar todo el gráfico
      drawChart()
    }

    const interval = setInterval(updateCurrentCandle, 1000)
    return () => clearInterval(interval)
  }, [currentCandle, isInitialized, drawChart])

  // Dibujar el gráfico cuando cambian los datos o la vista
  useEffect(() => {
    drawChart()
  }, [candles, currentCandle, dimensions, viewState, drawChart])

  // Eventos de mouse/touch para navegación
  const handleMouseDown = (e: MouseEvent) => {
    setViewState((prev) => ({
      ...prev,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
    }));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!viewState.isDragging || viewState.startX === null || viewState.startY === null) return;
    const deltaX = e.clientX - viewState.startX;
    const deltaY = e.clientY - viewState.startY;

    // Calcular límites de pan
    const allCandles = [...candles];
    if (currentCandle) allCandles.push(currentCandle);
    const timeRange = allCandles.length > 1 ? allCandles[allCandles.length - 1].timestamp - allCandles[0].timestamp : 1;
    const minOffsetX = -dimensions.width / 2;
    const maxOffsetX = Math.max(0, timeRange * viewState.scale - timeRange);

    setViewState((prev) => ({
      ...prev,
      offsetX: Math.min(Math.max(prev.offsetX - deltaX, minOffsetX), maxOffsetX),
      offsetY: Math.max(0, prev.offsetY + deltaY),
      startX: e.clientX,
      startY: e.clientY,
    }));
  };

  const handleMouseUp = () => {
    setViewState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const deltaY = e.deltaY;
    setViewState((prev) => ({
      ...prev,
      scale: Math.min(5, Math.max(0.5, prev.scale * (1 - deltaY / 1000))),
    }));
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) return;
    setViewState((prev) => ({
      ...prev,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      isDragging: true,
    }));
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!viewState.isDragging || viewState.startX === null || viewState.startY === null) return;
    const deltaX = e.touches[0].clientX - viewState.startX;
    const deltaY = e.touches[0].clientY - viewState.startY;

    // Calcular límites de pan
    const allCandles = [...candles];
    if (currentCandle) allCandles.push(currentCandle);
    const timeRange = allCandles.length > 1 ? allCandles[allCandles.length - 1].timestamp - allCandles[0].timestamp : 1;
    const minOffsetX = -dimensions.width / 2;
    const maxOffsetX = Math.max(0, timeRange * viewState.scale - timeRange);

    setViewState((prev) => ({
      ...prev,
      offsetX: Math.min(Math.max(prev.offsetX - deltaX, minOffsetX), maxOffsetX),
      offsetY: Math.max(0, prev.offsetY + deltaY),
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
    }));
  };

  const handleTouchEnd = () => {
    setViewState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Mouse events
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    // Touch events
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canvasRef, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const handleReset = () => {
    setViewState({
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      startX: null,
      startY: null,
      isDragging: false,
    });
  };

  const handleZoomIn = () => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.min(5, prev.scale * 1.2),
    }));
  };

  const handleZoomOut = () => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.max(0.2, prev.scale / 1.2),
    }));
  };

  return (
    <div className="relative h-full w-full overflow-hidden">

      <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      {/* Controles de navegación */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={handleReset}
          className="bg-zinc-700 hover:bg-zinc-600 text-white p-2 rounded-full"
          aria-label="Restablecer vista"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
        </button>
      </div>
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FFD600]/50">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FFD600] border-t-green-400"></div>
            <p className="mt-2 text-[#FFD600]">Cargando gráfico...</p>
          </div>
        </div>
      )}
    </div>
  )
}
