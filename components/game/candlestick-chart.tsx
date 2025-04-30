"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Candle } from "@/types/game"
import { useGame } from "@/context/game-context"
import { useDevice } from "@/context/device-mode-context"

import React from 'react';
import VolumeProfile from './volume-profile';
import { BarChart3 } from 'lucide-react';

interface CandlestickChartProps {
  candles: Candle[];
  currentCandle: Candle | null;
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  verticalScale?: number;
  showVolumeProfile?: boolean;
  setShowVolumeProfile?: (v: boolean | ((v: boolean) => boolean)) => void;
}

interface ViewState {
  offsetX: number
  offsetY: number
  scale: number
  startX: number | null
  startY: number | null
  isDragging: boolean
}

export default function CandlestickChart({ candles, currentCandle, viewState, setViewState, verticalScale = 1, setVerticalScale, showVolumeProfile, setShowVolumeProfile }: CandlestickChartProps & { setVerticalScale?: (v: number) => void }) {

  // --- Botón de enfoque exclusivo última vela ---
  function FocusLastCandleButton() {
    return (
      <button
        className="bg-[#FFD600] hover:bg-[#FFE066] text-white p-2 rounded-full"
        title="Enfocar última vela"
        onClick={handleFocusLastCandle}
        tabIndex={0}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#111" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
    );
  }


  // Referencias para los iconos
  const bullImgRef = useRef<HTMLImageElement | null>(null);
  const bearImgRef = useRef<HTMLImageElement | null>(null);

  // Pre-cargar imágenes sólo una vez
  useEffect(() => {
    const bullImg = new window.Image();
    bullImg.src = '/bull.png';
    bullImgRef.current = bullImg;
    const bearImg = new window.Image();
    bearImg.src = '/bear.png';
    bearImgRef.current = bearImg;
  }, []);

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
        countAudioRef.current.volume = 0.175;
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
    let observer: ResizeObserver | null = null;
    if (canvasRef.current && canvasRef.current.parentElement && 'ResizeObserver' in window) {
      observer = new ResizeObserver(() => {
        updateDimensions();
      });
      observer.observe(canvasRef.current.parentElement);
    } else {
      window.addEventListener("resize", updateDimensions);
    }
    return () => {
      if (observer && canvasRef.current && canvasRef.current.parentElement) {
        observer.unobserve(canvasRef.current.parentElement);
      }
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Estado para la navegación del gráfico
  // Ahora el viewState y setViewState vienen de props, no se definen aquí

  // --- UI: Botón toggle perfil de volumen ---
  // El botón se renderiza sobre el canvas, en la esquina superior derecha
  // El perfil de volumen se renderiza como un overlay SVG

  // Función para enfocar y hacer zoom en la última vela
  const handleFocusLastCandle = useCallback(() => {
    if (!canvasRef.current || !canvasRef.current.parentElement) {
      alert('No se puede enfocar: canvas no disponible');
      console.log('[Zoom Última Vela] canvasRef o parentElement no está definido');
      return;
    }
    const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();
    const allCandles = [...candles];
    if (currentCandle) allCandles.push(currentCandle);
    if (allCandles.length === 0) {
      alert('No hay velas para enfocar');
      console.log('[Zoom Última Vela] No hay velas para enfocar');
      return;
    }
    // --- Cálculo robusto para centrar la última vela en el centro del canvas ---
    const last = allCandles[allCandles.length - 1];
    const targetScale = 10;
    let minPrice = Math.min(...allCandles.map(c => c.low));
    let maxPrice = Math.max(...allCandles.map(c => c.high));
    const pricePadding = (maxPrice - minPrice) * 0.50;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;
    const timeRange = allCandles[allCandles.length - 1].timestamp - allCandles[0].timestamp;
    const safeTimeRange = timeRange === 0 ? 1 : timeRange;
    const xScale = (width / safeTimeRange) * targetScale;
    const yScale = (height / priceRange) * targetScale * (verticalScale ?? 1);
    const lastX = (last.timestamp - allCandles[0].timestamp) * xScale;
    const lastY = height - ((last.close - minPrice) * yScale);
    const centerX = width / 2;
    const centerY = height / 2;
    const targetOffsetX = lastX - centerX;
    const targetOffsetY = lastY - centerY;
    // Log de depuración
    console.log('[Zoom Última Vela] Enfocando última vela:', {
      width, height, last, targetScale, minPrice, maxPrice, priceRange, safeTimeRange, xScale, yScale, lastX, lastY, centerX, centerY, targetOffsetX, targetOffsetY
    });
    // --- Animación suave ---
    const start = performance.now();
    const duration = 1100;
    const initial = { ...viewState };
    const end = {
      offsetX: targetOffsetX,
      offsetY: targetOffsetY,
      scale: targetScale,
      startX: null,
      startY: null,
      isDragging: false,
    };
    function animate(now: number) {
      const elapsed = Math.min(1, (now - start) / duration);
      const t = elapsed < 0.5 ? 2 * elapsed * elapsed : -1 + (4 - 2 * elapsed) * elapsed;
      setViewState({
        offsetX: initial.offsetX + (end.offsetX - initial.offsetX) * t,
        offsetY: initial.offsetY + (end.offsetY - initial.offsetY) * t,
        scale: initial.scale + (end.scale - initial.scale) * t,
        startX: null,
        startY: null,
        isDragging: false,
      });
      if (elapsed < 1) {
        requestAnimationFrame(animate);
      } else {
        setViewState(end);
      }
    }
    requestAnimationFrame(animate);
  }, [dimensions.width, dimensions.height, candles, currentCandle, viewState, verticalScale]);

  // Referencia para el último timestamp renderizado
  const lastRenderRef = useRef<number>(0)

  // Ref para la coordenada X de la última vela
  const lastCandleXRef = useRef<number | null>(null);
  // Ref para guardar el minTime y xScale del último render
  const lastRenderMeta = useRef<{minTime: number, xScale: number, clampedOffsetX: number} | null>(null);

  // Función para dibujar el gráfico completo
  const drawChart = useCallback(() => {
    if (!isInitialized || !canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const allCandles = [...candles];
// Solo agregar currentCandle si ya estamos en el periodo de la nueva vela
if (currentCandle && Date.now() >= currentCandle.timestamp) {
  allCandles.push(currentCandle);
}

    if (allCandles.length === 0) return
    // Validación defensiva: no intentar renderizar si no hay velas
    

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
    const pricePadding = (maxPrice - minPrice) * 0.50
    minPrice -= pricePadding
    maxPrice += pricePadding

    // Calculate scaling factors with view state
    const priceRange = maxPrice - minPrice
    const timeRange = maxTime - minTime
    const xScale = (dimensions.width / timeRange) * viewState.scale
    const yScale = (dimensions.height / priceRange) * viewState.scale * verticalScale

    // VALIDACIÓN DEFENSIVA: Si algún valor es inválido, no renderices
    if (
      !Number.isFinite(minPrice) ||
      !Number.isFinite(maxPrice) ||
      !Number.isFinite(priceRange) ||
      priceRange <= 0 ||
      !Number.isFinite(timeRange) ||
      timeRange <= 0 ||
      !Number.isFinite(xScale) ||
      !Number.isFinite(yScale) ||
      dimensions.width <= 0 ||
      dimensions.height <= 0
    ) {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.save();
      ctx.fillStyle = '#222';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('Datos inválidos', 24, 48);
      ctx.restore();
      return;
    }

    // Paneo completamente libre en ambos ejes
    const clampedOffsetX = viewState.offsetX;
    const clampedOffsetY = viewState.offsetY;

    if (clampedOffsetX !== viewState.offsetX || clampedOffsetY !== viewState.offsetY) {
      setViewState((prev: ViewState) => ({
        ...prev,
        offsetX: clampedOffsetX,
        offsetY: clampedOffsetY,
      }))
    }

    // Calcular la X de la última vela (en píxeles canvas)
    if (allCandles.length > 0) {
      const last = allCandles[allCandles.length - 1];
      const lastX = (last.timestamp - minTime) * xScale - clampedOffsetX;
      lastCandleXRef.current = lastX;
      lastRenderMeta.current = { minTime, xScale, clampedOffsetX };
      // Línea vertical de debug (puedes quitarla en producción)
      ctx.save();
      ctx.strokeStyle = 'rgba(255,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(lastX, 0);
      ctx.lineTo(lastX, dimensions.height);
      ctx.stroke();
      ctx.restore();
    }
    // Draw background
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    // Línea horizontal punteada amarilla translúcida (precio actual)
    if (allCandles.length > 0) {
      const last = allCandles[allCandles.length - 1];
      const lastClose = last.close;
      const yPrice = dimensions.height - ((lastClose - minPrice) * yScale - clampedOffsetY);
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#FFD600';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(0, yPrice);
      ctx.lineTo(dimensions.width, yPrice);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Línea de precio de liquidación para la apuesta activa
    // Asegurarse de que bets es un array y buscar todas las apuestas pendientes con liquidationPrice
    let pendingBets: any[] = [];
    
    if (Array.isArray(bets)) {
      // Primero, registrar todas las apuestas para depuración
      console.log('Todas las apuestas disponibles:', bets.length);
      
      // Filtrar apuestas pendientes con precio de liquidación
      pendingBets = bets.filter(bet => {
        const isPending = bet.status === 'PENDING';
        const hasLiquidationPrice = bet.liquidationPrice !== undefined && 
                                  bet.liquidationPrice !== null && 
                                  !isNaN(Number(bet.liquidationPrice));
        
        // Registrar cada apuesta para depuración
        console.log(`Apuesta ${bet.id}:`, {
          status: bet.status,
          prediction: bet.prediction,
          liquidationPrice: bet.liquidationPrice,
          tipoDeLiquidationPrice: typeof bet.liquidationPrice,
          esAutomatica: bet.id.includes('auto') ? 'Sí' : 'No',
          cumpleFiltro: isPending && hasLiquidationPrice ? 'Sí' : 'No',
          entryPrice: bet.entryPrice
        });
        
        return isPending && hasLiquidationPrice;
      });
    }
    
    console.log('Apuestas pendientes con liquidationPrice:', pendingBets.length);
    
    // Dibujar línea de liquidación para cada apuesta pendiente
    pendingBets.forEach((activeBet: any) => {
      // Convertir explícitamente a número para evitar problemas de tipo
      const liquidationPrice = Number(activeBet.liquidationPrice);
      
      if (
        activeBet &&
        !isNaN(liquidationPrice) &&
        dimensions.height > 0 &&
        dimensions.width > 0 &&
        isFinite(minPrice) &&
        isFinite(yScale)
      ) {
      const yLiquid = dimensions.height - ((liquidationPrice - minPrice) * yScale - clampedOffsetY);
      if (yLiquid >= 0 && yLiquid <= dimensions.height) {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = '#FF2222';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, yLiquid);
        ctx.lineTo(dimensions.width, yLiquid);
        ctx.stroke();
        ctx.setLineDash([]);
        // DEBUG: Mostrar el valor de liquidación en texto pequeño a la izquierda
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#FF2222';
        ctx.globalAlpha = 0.92;
        ctx.fillText(`Liquidación: ${liquidationPrice.toFixed(2)}`, 8, yLiquid - 6);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      }
    });

    // Línea de precio de entrada para las apuestas activas
    // Buscar todas las apuestas pendientes con entryPrice
    const pendingEntryBets = Array.isArray(bets) ? bets.filter((bet: any) => 
      bet.status === 'PENDING' && 
      typeof bet.entryPrice === 'number'
    ) : [];
    
    // Dibujar línea de entrada para cada apuesta pendiente
    pendingEntryBets.forEach((entryBet: any) => {
      if (
        entryBet &&
        typeof entryBet.entryPrice === 'number' &&
        dimensions.height > 0 &&
        dimensions.width > 0 &&
        isFinite(minPrice) &&
        isFinite(yScale)
      ) {
        const yEntry = dimensions.height - ((entryBet.entryPrice - minPrice) * yScale - clampedOffsetY);
        if (yEntry >= 0 && yEntry <= dimensions.height) {
          ctx.save();
          ctx.globalAlpha = 0.92;
          ctx.strokeStyle = '#00FF85'; // verde brillante
          ctx.lineWidth = 1.3;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(0, yEntry);
          ctx.lineTo(dimensions.width, yEntry);
          ctx.stroke();
          ctx.setLineDash([]);
          // Mostrar el valor de entrada en texto pequeño a la izquierda
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = '#00FF85';
          ctx.globalAlpha = 0.92;
          ctx.fillText(`Apertura: ${entryBet.entryPrice.toFixed(2)}`, 8, yEntry - 6);
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }
    });

    // Draw candles with offset
    const candleWidth = Math.min(Math.max((dimensions.width / (allCandles.length / viewState.scale)) * 1, 2), 15)

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

       // === DIBUJAR BARRA DE VOLUMEN ===
       // Calcula la altura máxima de volumen para escalar
       const maxVolume = Math.max(...allCandles.map(c => c.volume || 0), 1);
       const volumeHeight = Math.max(10, (candle.volume / maxVolume) * (dimensions.height * 0.22)); // 22% altura chart
       const volBaseY = dimensions.height - 2; // base de la barra
       ctx.save();
       ctx.globalAlpha = 0.33;
       ctx.fillStyle = candle.close > candle.open ? "#22c55e" : "#ef4444";
       ctx.fillRect(x - candleWidth / 2, volBaseY - volumeHeight, candleWidth, volumeHeight);
       ctx.restore();

       // Determine if bullish or bearish
       const isBullish = candle.close > candle.open
       ctx.fillStyle = isBullish ? "#22c55e" : "#ef4444"
       ctx.strokeStyle = isBullish ? "#22c55e" : "#ef4444"

       // Calcular altura y posición de la vela
        const candleHeight = Math.abs(close - open) || 1 // Mínimo 1px de altura
        const candleY = isBullish ? close : open
        // Obtener apuestas de la vela
        let candleBets = betsByTimestamp.get(candle.timestamp);
        // Si la vela tiene apuestas, dibujar un glow (resplandor)
        if (candleBets && candleBets.length > 0) {
          ctx.save();
          ctx.shadowColor = '#fff666'; // Glow amarillo más suave
          ctx.shadowBlur = 3;
          ctx.globalAlpha = 1.2;
          ctx.fillRect(x - candleWidth / 2, candleY, candleWidth, candleHeight);
          // Si la vela tiene apuestas, dibujar un borde amarillo punteado (estático)
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(x - candleWidth / 2, candleY, candleWidth, candleHeight);
          ctx.setLineDash([]);
          ctx.restore();
        }
        // Draw candle body
        ctx.save();
        ctx.shadowColor = 'transparent'; // Sin glow para el cuerpo
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillRect(x - candleWidth / 2, candleY, candleWidth, candleHeight);

        ctx.restore();

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

       // Dibujar iconos de apuestas si existen para esta vela
       if (candleBets && candleBets.length > 0 && bullImgRef.current && bearImgRef.current) {
        // Dibujar un icono por cada tipo de apuesta (bullish/bearish)
        const hasBullish = candleBets.some((bet: import("@/types/game").Bet) => bet.prediction === "BULLISH")
        const hasBearish = candleBets.some((bet: import("@/types/game").Bet) => bet.prediction === "BEARISH")

        let markerY = high - 20 // Posición encima de la vela
        const iconSize = 20
        // Si ambos existen, separar horizontalmente
        if (hasBullish && hasBearish) {
          ctx.drawImage(bullImgRef.current, x - iconSize, markerY, iconSize, iconSize)
          ctx.drawImage(bearImgRef.current, x, markerY, iconSize, iconSize)
        } else if (hasBullish) {
          ctx.drawImage(bullImgRef.current, x - iconSize/2, markerY, iconSize, iconSize)
        } else if (hasBearish) {
          ctx.drawImage(bearImgRef.current, x - iconSize/2, markerY, iconSize, iconSize)
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
    const ema365 = calculateEMA(365, allCandles);

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
    drawEMA(ema365, '#22c55e'); // Verde

// Mostrar precios actuales de cada EMA en la esquina superior izquierda
const emaLabels = [
{ name: 'EMA10', value: ema10[ema10.length - 1], color: '#a259f7' },
{ name: 'EMA55', value: ema55[ema55.length - 1], color: '#FFD600' },
{ name: 'EMA200', value: ema200[ema200.length - 1], color: '#2196f3' },
{ name: 'EMA365', value: ema365[ema365.length - 1], color: '#22c55e' },
];
let yLabel = 18;
emaLabels.forEach(({ name, value, color }) => {
if (typeof value === 'number' && isFinite(value)) {
ctx.save();
ctx.globalAlpha = 0.7;
ctx.font = 'bold 13px monospace';
ctx.fillStyle = color;
ctx.fillText(`${name}: ${value.toFixed(2)}`, 10, yLabel);
ctx.restore();
yLabel += 18;
}
});

// Reset transformation
ctx.resetTransform()

// Guardar el timestamp de este render
lastRenderRef.current = Date.now()
}, [candles, currentCandle, dimensions, isInitialized, viewState, bets])

// Actualizar solo la vela actual cada segundo
useEffect(() => {
if (!currentCandle || !isInitialized) return
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
    setViewState((prev: ViewState) => ({
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

    setViewState((prev: ViewState) => ({
      ...prev,
      offsetX: Math.min(Math.max(prev.offsetX - deltaX, minOffsetX), maxOffsetX),
      offsetY: Math.max(0, prev.offsetY + deltaY),
      startX: e.clientX,
      startY: e.clientY,
    }));
  };

  const handleMouseUp = () => {
    setViewState((prev: ViewState) => ({
      ...prev,
      isDragging: false,
    }));
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const deltaY = e.deltaY;
    const allCandles = [...candles];
    if (currentCandle) allCandles.push(currentCandle);
    const minScale = 0.5;
    const maxScale = Math.max(5, Math.min(24, 60 / (allCandles.length || 1)));
    setViewState((prev: ViewState) => ({
      ...prev,
      scale: Math.min(maxScale, Math.max(minScale, prev.scale * (1 - deltaY / 1000))),
    }));
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) return;
    setViewState((prev: ViewState) => ({
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

    setViewState((prev: ViewState) => ({
      ...prev,
      offsetX: Math.min(Math.max(prev.offsetX - deltaX, minOffsetX), maxOffsetX),
      offsetY: Math.max(0, prev.offsetY + deltaY),
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
    }));
  };

  const handleTouchEnd = () => {
    setViewState((prev: ViewState) => ({
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
    const allCandles = [...candles];
    if (currentCandle) allCandles.push(currentCandle);
    const minScale = 1;
    const maxScale = Math.max(10, Math.min(24, 60 / (allCandles.length || 1)));
    setViewState((prev: ViewState) => ({
      ...prev,
      scale: Math.min(maxScale, prev.scale * 1.5),
    }));
  };

const handleZoomOut = () => {
    const allCandles = [...candles];
    if (currentCandle) allCandles.push(currentCandle);
    const minScale = 1;
    const maxScale = Math.max(10, Math.min(24, 60 / (allCandles.length || 1)));
    setViewState((prev: ViewState) => ({
      ...prev,
      scale: Math.max(minScale, prev.scale / 1.2),
    }));
  };

return (
    <div className="relative h-full w-full overflow-hidden select-none" style={{ minHeight: 520 }}>

    <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing absolute top-0 left-0 z-10" />
    {/* Overlay: Perfil de Volumen */}
    {showVolumeProfile && dimensions.height > 0 && (
      <div className="absolute top-0 right-0 h-full z-20 pointer-events-none">
        <VolumeProfile
          candles={candles}
          chartHeight={dimensions.height}
          priceMin={(() => {
            let min = Number.MAX_VALUE;
            candles.forEach((c: { low: number }) => { min = Math.min(min, c.low); });
            return min;
          })()}
          priceMax={(() => {
            let max = Number.MIN_VALUE;
            candles.forEach((c: { high: number }) => { max = Math.max(max, c.high); });
            return max;
          })()}
          barWidth={100}
          bins={100}
        />
      </div>
    )}
    {/* Controles de navegación */}
    <div className="absolute bottom-[58px] right-2 flex gap-2 z-40">
      <FocusLastCandleButton />
      <button
        onClick={handleReset}
        className="bg-[#FFD600] hover:bg-[#FFE066] text-white p-2 rounded-full"
        aria-label="Restablecer vista"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#111"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
      </button>
      <button
        onClick={handleZoomIn}
        className="bg-[#FFD600] hover:bg-[#FFE066] text-white p-2 rounded-full"
        aria-label="Acercar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 22 22"
          fill="none"
          stroke="#111"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </button>
      <button
        onClick={handleZoomOut}
        className="bg-[#FFD600] hover:bg-[#FFE066] text-white p-2 rounded-full"
        aria-label="Alejar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#111"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </button>
    </div>
    {/* Loading overlay */}
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
