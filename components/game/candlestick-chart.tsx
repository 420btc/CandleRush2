"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Candle } from "@/types/game"
import { useGame } from "@/context/game-context"
import { useDevice } from "@/context/device-mode-context"
import { decideMixDirection } from '@/utils/macd-decision';
import { getSupportResistance } from '@/utils/market-structure';

import React from 'react';
import VolumeProfile from './volume-profile';
import { BarChart3 } from 'lucide-react';
import { generateAutoDrawCandles } from '@/utils/autoDraw';
import { detectMarketStructure } from '@/utils/market-structure';

interface CandlestickChartProps {
  showCrossCircles?: boolean;
  setShowCrossCircles?: (v: boolean | ((v: boolean) => boolean)) => void;
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

interface SupportResistance {
  supports: number[];
  resistances: number[];
}

export default function CandlestickChart({ candles, currentCandle, viewState, setViewState, verticalScale = 1, setVerticalScale, showVolumeProfile, setShowVolumeProfile, showCrossCircles, setShowCrossCircles }: CandlestickChartProps & { setVerticalScale?: (v: number) => void, showCrossCircles?: boolean, setShowCrossCircles?: (v: boolean | ((v: boolean) => boolean)) => void }) {
  // --- Estado para Auto Draw ---
  const [autoDrawActive, setAutoDrawActive] = useState(false);
  const [simCandles, setSimCandles] = useState<Candle[]>([]);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [showFinalPrice, setShowFinalPrice] = useState(false);
  const [showSupportResistance, setShowSupportResistance] = useState(false);

  // Efecto para mostrar el precio final cuando cambia
  useEffect(() => {
    if (finalPrice !== null) {
      setShowFinalPrice(true);
    }
  }, [finalPrice]);

  // Efecto para ocultar el precio cuando se desactiva Auto Draw
  useEffect(() => {
    if (!autoDrawActive) {
      setShowFinalPrice(false);
    }
  }, [autoDrawActive]);

  // Determina cuántas velas simular
  const autoDrawCount = candles.length >= 33 ? 33 : 11;

  // Handler para el botón
  // Nuevo handler: cada click añade UNA vela simulada a la secuencia
  const handleAutoDraw = () => {
    // Si está inactivo, activar y generar la primera simulada
    if (!autoDrawActive) {
      const { candles: simulated, finalPrice: price } = generateAutoDrawCandles([...candles], 1);
      setSimCandles(simulated);
      setFinalPrice(price);
      setAutoDrawActive(true);
      return;
    }
    // Si ya está activo, generar la siguiente simulada (en base a todas las previas)
    const base = [...candles, ...simCandles];
    const { candles: nextSim, finalPrice: price } = generateAutoDrawCandles(base, 1);
    setSimCandles([...simCandles, ...nextSim]);
    setFinalPrice(price);
  };

  // Candles a mostrar (reales + simuladas si activo)
  const displayedCandles = autoDrawActive ? [...candles, ...simCandles] : candles;

  // === SOPORTES Y RESISTENCIAS ===
  // Obtener timeframe desde contexto de juego
  const { timeframe } = useGame();
  // Calcular niveles de soporte y resistencia con la función robusta
  const { supportLevels, resistanceLevels } = detectMarketStructure(displayedCandles, timeframe);

  // === DETECTAR INTERACCIONES DE SIMULADAS ===
  // Solo analizamos las simuladas (no las reales)
  type SRInteraction = {
    type: 'SUPPORT'|'RESISTANCE',
    action: 'RESPECT'|'BREAK',
    candleIdx: number, // índice en displayedCandles
    level: number,
    price: number
  };
  const srInteractions: SRInteraction[] = [];
  if (autoDrawActive && simCandles.length > 0) {
    // Solo para las simuladas
    for (let i = candles.length; i < displayedCandles.length; i++) {
      const prev = displayedCandles[i-1];
      const curr = displayedCandles[i];
      // Check supports
      for (const level of supportLevels) {
        // Respeta soporte: toca y rebota
        if (
          prev.low > level && curr.low <= level && curr.close > level
        ) {
          srInteractions.push({ type:'SUPPORT', action:'RESPECT', candleIdx:i, level, price:curr.low });
        }
        // Rompe soporte: cruza por debajo
        if (
          prev.low > level && curr.low < level && curr.close < level
        ) {
          srInteractions.push({ type:'SUPPORT', action:'BREAK', candleIdx:i, level, price:curr.low });
        }
      }
      // Check resistances
      for (const level of resistanceLevels) {
        // Respeta resistencia: toca y rebota
        if (
          prev.high < level && curr.high >= level && curr.close < level
        ) {
          srInteractions.push({ type:'RESISTANCE', action:'RESPECT', candleIdx:i, level, price:curr.high });
        }
        // Rompe resistencia: cruza por arriba
        if (
          prev.high < level && curr.high > level && curr.close > level
        ) {
          srInteractions.push({ type:'RESISTANCE', action:'BREAK', candleIdx:i, level, price:curr.high });
        }
      }
    }
  }

// Desactivar automáticamente Auto Draw al detectar una nueva vela real
useEffect(() => {
  if (autoDrawActive && simCandles.length > 0) {
    // Si hay una nueva vela real (candles ha crecido), salir de Auto Draw
    // Suponemos que la última simulada ya no está al final de candles
    const lastSim = simCandles[simCandles.length - 1];
    if (candles.length > 0 && lastSim && candles[candles.length - 1].timestamp >= lastSim.timestamp) {
      setAutoDrawActive(false);
      setSimCandles([]);
    }
  }
  // También si el usuario cambia de mercado o se resetea el chart
  if (autoDrawActive && simCandles.length > 0 && candles.length === 0) {
    setAutoDrawActive(false);
    setSimCandles([]);
  }
}, [candles, autoDrawActive, simCandles]);

  
  // Estado para mostrar/ocultar SMC+
  const [showSMC, setShowSMC] = useState(false);

  // --- Botón Auto Draw ---
  // Se muestra arriba a la derecha del gráfico
  // Estilo simple, puedes mejorarlo según tu UI

  // ... (el resto del código sigue igual)


  // }
  // for (const y of resistanceLevels.map(lvl => priceToY(lvl))) {
  //   ctx.strokeStyle = '#ff0059';
  //   ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartWidth, y); ctx.stroke();
  // }
  // ctx.setLineDash([]); ctx.restore();
  //
  // --- Dibujar marcadores de interacción ---
  // for (const {type, action, candleIdx, level, price} of srInteractions) {
  //   const x = candleIdxToX(candleIdx); // función que mapea índice a X
  //   const y = priceToY(level);
  //   ctx.save();
  //   ctx.beginPath();
  //   if (type==='SUPPORT') {
  //     ctx.strokeStyle = action==='BREAK' ? '#ff2222' : '#00ffae';
  //     ctx.fillStyle = action==='BREAK' ? '#ff2222' : '#00ffae';
  //     ctx.arc(x, y, 8, 0, 2*Math.PI);
  //     ctx.globalAlpha = 0.7;
  //     ctx.fill();
  //     ctx.globalAlpha = 1.0;
  //     ctx.lineWidth = 2.5;
  //     ctx.stroke();
  //   } else {
  //     ctx.strokeStyle = action==='BREAK' ? '#ff0059' : '#0099ff';
  //     ctx.fillStyle = action==='BREAK' ? '#ff0059' : '#0099ff';
  //     ctx.arc(x, y, 8, 0, 2*Math.PI);
  //     ctx.globalAlpha = 0.7;
  //     ctx.fill();
  //     ctx.globalAlpha = 1.0;
  //     ctx.lineWidth = 2.5;
  //     ctx.stroke();
  //   }
  //   ctx.font = 'bold 10px monospace';
  //   ctx.textAlign = 'center';
  //   ctx.fillStyle = '#fff';
  //   ctx.fillText(action==='BREAK' ? 'X' : '✓', x, y+4);
  //   ctx.restore();
  // }

  // Log para depuración del prop showCrossCircles
  React.useEffect(() => {
    console.log('[EMA CIRCLES][CandlestickChart] Prop showCrossCircles cambió:', showCrossCircles);
  }, [showCrossCircles]);


  // --- Botón de enfoque exclusivo última vela ---
  // [ELIMINADO] Botón único para mostrar/ocultar cruces EMA/MACD


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

  // --- Renderizado de botones Auto Draw ---
  // Puedes moverlos a donde prefieras en tu UI
  // Aquí los ponemos arriba a la derecha del gráfico
  // Botón toggle: activa/desactiva Auto Draw y limpia simulación
  const autoDrawButtons = (
    <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <button
          onClick={() => {
            if (!autoDrawActive) {
              const { candles: simulated, finalPrice } = generateAutoDrawCandles([...candles], 1);
              setSimCandles(simulated);
              setAutoDrawActive(true);
              setShowFinalPrice(true); // Agregar esta línea
            } else {
              setAutoDrawActive(false);
              setSimCandles([]);
              setShowFinalPrice(false); // Agregar esta línea
            }
          }}
        className="px-2 py-1 rounded-lg font-bold shadow transition bg-[#FFD600] text-black border-2 border-[#FFD600] hover:bg-yellow-300 ring-2 ring-green-400"
        title="Candle Prediction"
        style={{ height: 26, minWidth: 100, fontSize: 13, padding: '0 10px', lineHeight: '24px' }}
        data-component-name="CandlestickChart"
      >
        {autoDrawActive ? 'Desactivar Auto Draw' : 'Activar Auto Draw'}
        Candle Prediction
      </button>
    </div>
  );

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

    const allCandles = [...displayedCandles];
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
    // Dibujar líneas de soportes y resistencias si están activas
    if (showSupportResistance) {
      const { supports, resistances } = getSupportResistance(allCandles);
      
      // Dibujar líneas de soporte (verde)
      supports.forEach((support: number) => {
        const y = dimensions.height - ((support - minPrice) * yScale - clampedOffsetY);
        ctx.save();
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(dimensions.width, y);
        ctx.stroke();
        ctx.restore();
      });

      // Dibujar líneas de resistencia (rojo)
      resistances.forEach((resistance: number) => {
        const y = dimensions.height - ((resistance - minPrice) * yScale - clampedOffsetY);
        ctx.save();
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(dimensions.width, y);
        ctx.stroke();
        ctx.restore();
      });
    }
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

    // Solo mostrar el precio en la línea amarilla si NO estamos en modo Auto Draw
    if (!autoDrawActive) {
      ctx.save();
      ctx.font = '10px monospace';
      ctx.fillStyle = '#FFD600';
      ctx.fillText(`$${lastClose.toFixed(2)}`, dimensions.width - 50, yPrice + 10);
      ctx.restore();
    }

    // Línea punteada gris para el precio simulado
    if (finalPrice !== null && showFinalPrice) {
      const ySimPrice = dimensions.height - ((finalPrice - minPrice) * yScale - clampedOffsetY);
      ctx.save();
      ctx.globalAlpha = 0.8;  // Aumentar la opacidad
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, ySimPrice);
      ctx.lineTo(dimensions.width, ySimPrice);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Añadir texto y precio sobre la línea gris
      ctx.save();
      ctx.font = '10px monospace';
      ctx.fillStyle = '#FFD600';
      const rightPosition = dimensions.width * 0.75;
      ctx.textAlign = 'center';
      
      // Mostrar el texto explicativo arriba
      ctx.fillText('Precio Última Vela Simulada', rightPosition, ySimPrice - 5);
      
      // Mostrar el precio
      ctx.fillText(`$${finalPrice.toFixed(2)}`, rightPosition, ySimPrice + 10);
      ctx.restore();
    }

    // Si hay precio final y está visible, mostrarlo
    if (finalPrice !== null && showFinalPrice) {
      ctx.save();
      ctx.font = '10px monospace';
      
      // // Mostrar el texto explicativo arriba
      // ctx.fillText('Precio Última Vela Simulada', rightPosition, yPrice - 5);
      
      // // Mostrar el precio
      // ctx.fillText(text, rightPosition, yPrice + 10);
      // ctx.restore();
    }
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

        // === DIFERENCIAR VELAS SIMULADAS ===
        const isSimulated = (candle as any).isSimulated === true;
        if (isSimulated) {
          // Borde azul brillante y opacidad 0.7
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = isBullish ? "#22c55e" : "#ef4444";
          ctx.fillRect(x - candleWidth / 2, candleY, candleWidth, candleHeight);
          ctx.strokeStyle = '#2196f3';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 2]);
          ctx.strokeRect(x - candleWidth / 2, candleY, candleWidth, candleHeight);
          ctx.setLineDash([]);
          ctx.restore();
        } else {
          // Velas reales normales
          ctx.save();
          ctx.shadowColor = 'transparent'; // Sin glow para el cuerpo
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
          ctx.fillRect(x - candleWidth / 2, candleY, candleWidth, candleHeight);
          ctx.restore();
        }

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

    // Calcular EMAs SIEMPRE usando las velas mostradas (reales + simuladas si aplica)
    let ema10: (number|null)[] = [], ema55: (number|null)[] = [], ema200: (number|null)[] = [], ema365: (number|null)[] = [];
    ema10 = calculateEMA(10, allCandles);
    ema55 = calculateEMA(55, allCandles);
    ema200 = calculateEMA(200, allCandles);
    ema365 = calculateEMA(365, allCandles);

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

    // Dibujar EMAs solo si NO está activo Auto Draw
    if (!autoDrawActive) {
      drawEMA(ema10, '#a259f7'); // Morado
      drawEMA(ema55, '#FFD600'); // Dorado
      drawEMA(ema200, '#2196f3'); // Azul
      drawEMA(ema365, '#22c55e'); // Verde
    }

    // === DIBUJAR CÍRCULOS EN CRUCES DE EMAS ===
    // Helper para detectar cruces
    // Dibuja un círculo de cruce con dos colores (mitad y mitad)
    function drawEMACrossCircles(
      emaA: (number|null)[],
      emaB: (number|null)[],
      colorA: string,
      colorB: string
    ) {
      if (!ctx) return;
      for (let i = 1; i < emaA.length; i++) {
        if (emaA[i-1] === null || emaB[i-1] === null || emaA[i] === null || emaB[i] === null) continue;
        // Detectar cruce: producto de diferencias cambia de signo
        const prevDiff = emaA[i-1]! - emaB[i-1]!;
        const currDiff = emaA[i]! - emaB[i]!;
        if ((prevDiff === 0 || currDiff === 0) || (prevDiff * currDiff > 0)) continue; // No hay cruce
        // Calcular punto de cruce por interpolación lineal
        const t = Math.abs(prevDiff) / (Math.abs(prevDiff) + Math.abs(currDiff));
        const candlePrev = allCandles[i-1];
        const candleCurr = allCandles[i];
        const crossTimestamp = candlePrev.timestamp + t * (candleCurr.timestamp - candlePrev.timestamp);
        const crossPrice = emaA[i-1]! + t * (emaA[i]! - emaA[i-1]!);
        const x = (crossTimestamp - minTime) * xScale - clampedOffsetX;
        const y = dimensions.height - ((crossPrice - minPrice) * yScale - clampedOffsetY);
        // Dibuja el círculo mitad-mitad
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI, false);
        ctx.lineWidth = 2;
        ctx.strokeStyle = colorA;
        ctx.shadowColor = 'transparent';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 6, Math.PI, 2 * Math.PI, false);
        ctx.lineWidth = 2;
        ctx.strokeStyle = colorB;
        ctx.shadowColor = 'transparent';
        ctx.stroke();
        ctx.restore();
      }
    }
    // Dibujar círculos de cruces solo si NO está activo Auto Draw
    if (showCrossCircles === true && !autoDrawActive) {
      drawEMACrossCircles(ema10, ema55, '#a259f7', '#FFD600');
      drawEMACrossCircles(ema55, ema200, '#FFD600', '#2196f3');
      drawEMACrossCircles(ema200, ema365, '#2196f3', '#22c55e');
      drawEMACrossCircles(ema10, ema200, '#a259f7', '#2196f3');
      drawEMACrossCircles(ema10, ema365, '#a259f7', '#22c55e');
      drawEMACrossCircles(ema55, ema365, '#FFD600', '#22c55e');
    } else {
      console.log('[EMA CIRCLES] NO se muestran círculos EMA porque showCrossCircles !== true:', showCrossCircles);
    }
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
ctx.globalAlpha = 1;
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
    <div className="relative w-full h-full select-none">
      {/* --- Botón Auto Draw --- */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-0.5">
        {autoDrawActive && (
          <button
            onClick={() => { setAutoDrawActive(false); setSimCandles([]); }}
            style={{
              height: 16,
              width: 16,
              minWidth: 16,
              fontSize: 10,
              padding: 0,
              lineHeight: '14px',
              background: '#dc2626',
              color: 'white',
              border: '1px solid #991b1b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Salir de Candle Prediction"
          >
            ×
          </button>
        )}
        <button
          onClick={handleAutoDraw}
          className={`px-1 py-0.5 rounded-lg font-bold shadow transition bg-[#FFD600] text-black border-1 border-[#FFD600] hover:bg-yellow-300 ${autoDrawActive ? 'ring-1 ring-green-400' : ''}`}
          style={{
            height: 16,
            minWidth: 60,
            fontSize: 10,
            padding: '0 5px',
            lineHeight: '14px'
          }}
          title="Simular próximas velas"
        >
          Candle Predictor
        </button>
        <button
          onClick={() => setShowSupportResistance(!showSupportResistance)}
          className="px-1 py-0.5 rounded-lg font-bold shadow transition bg-[#FFD600] text-black border-1 border-[#FFD600] hover:bg-yellow-300"
          title="Mostrar/Ocultar Soportes y Resistencias"
          style={{
            height: 16,
            minWidth: 60,
            fontSize: 10,
            padding: '0 5px',
            lineHeight: '14px'
          }}
        >
          <span style={{ color: '#00FF00' }}>S</span>/<span style={{ color: '#FF0000' }}>R</span>
        </button>
      </div>

      {/* --- Canvas principal --- */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ pointerEvents: 'auto' }}
      />
      {/* Overlay: Perfil de Volumen */}
      {showVolumeProfile && dimensions.height > 0 && !autoDrawActive && (
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
      {/* Controles de navegación y SMC+ */}
      <div className="absolute bottom-14 right-1 flex gap-1 z-50" data-component-name="CandlestickChart">
        <button
          onClick={() => setShowSMC(v => !v)}
          className={`bg-[#111] border-2 border-[#FFD600] hover:bg-[#FFD600] hover:text-black text-[#FFD600] font-bold px-3 py-1 rounded-full transition-colors duration-200 ${showSMC ? 'bg-[#FFD600] text-black' : ''}`}
          style={{ minWidth: 60 }}
          aria-label="Mostrar/Ocultar SMC+"
        >
          {showSMC ? 'SMC+ ON' : 'SMC+ OFF'}
        </button>
        {/* Estilos adicionales para móvil */}
        <style jsx>{`
          @media (max-width: 768px) {
            div[data-component-name="CandlestickChart"] {
              bottom: 20px;
              right: 10px;
            }
            button {
              padding: 0.5rem;
            }
          }
        `}</style>
        {/* [ELIMINADO] <ToggleCrossCirclesButton /> */}
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
      {/* Indicador SMC+ */}
      {showSMC && (
  <div className="absolute inset-0 pointer-events-none z-30">
    <canvas
      ref={el => {
        if (!el || !canvasRef.current) return;
        const ctx = el.getContext('2d');
        if (!ctx) return;
        el.width = canvasRef.current.width;
        el.height = canvasRef.current.height;
        ctx.clearRect(0, 0, el.width, el.height);
        // --- SMC LOGIC: Detect pivots (swing highs/lows), label HH/HL/LH/LL, draw lines, detect BOS/CHoCH ---
        // Usa los mismos valores de escala y offset que el canvas principal
        // Si el canvas principal guarda los valores en refs (ej: lastRenderMeta), úsalos
        let meta = null;
        if (typeof lastRenderMeta !== 'undefined' && lastRenderMeta.current) {
          meta = lastRenderMeta.current;
        }
        const allCandles = [...candles];
        if (currentCandle) allCandles.push(currentCandle);
        if (allCandles.length < 5) return;
        let minTime, xScale, clampedOffsetX;
        // Usa los valores del gráfico principal si existen
        if (meta) {
          minTime = meta.minTime;
          xScale = meta.xScale;
          clampedOffsetX = meta.clampedOffsetX;
        } else {
          minTime = allCandles[0].timestamp;
          const maxTime = allCandles[allCandles.length - 1].timestamp;
          const timeRange = maxTime - minTime || 1;
          const chartWidth = el.width;
          xScale = (chartWidth / timeRange) * viewState.scale;
          clampedOffsetX = Math.max(0, Math.min(viewState.offsetX, Math.max(0, chartWidth - chartWidth / viewState.scale)));
        }
        const chartWidth = el.width;
        const chartHeight = el.height;
        // Para precios
        let minPrice = Math.min(...allCandles.map(c=>c.low));
        let maxPrice = Math.max(...allCandles.map(c=>c.high));
        const pricePadding = (maxPrice - minPrice) * 0.5;
        minPrice -= pricePadding;
        maxPrice += pricePadding;
        const priceRange = maxPrice - minPrice;
        const yScale = (chartHeight / priceRange) * viewState.scale * (verticalScale ?? 1);
        const clampedOffsetY = viewState.offsetY;
        // Detect pivots (swing highs/lows)
        const length = 3; // Puedes hacer esto configurable
        function isSwingHigh(i:number) {
          for (let j=1;j<=length;j++) {
            if (i-j<0 || i+j>=allCandles.length) return false;
            if (allCandles[i].high <= allCandles[i-j].high) return false;
            if (allCandles[i].high <= allCandles[i+j].high) return false;
          }
          return true;
        }
        function isSwingLow(i:number) {
          for (let j=1;j<=length;j++) {
            if (i-j<0 || i+j>=allCandles.length) return false;
            if (allCandles[i].low >= allCandles[i-j].low) return false;
            if (allCandles[i].low >= allCandles[i+j].low) return false;
          }
          return true;
        }
        // Recopila pivotes
        const pivots: {i:number, type:'high'|'low', price:number, ts:number}[] = [];
        for (let i=length; i<allCandles.length-length; i++) {
          if (isSwingHigh(i)) pivots.push({i, type:'high', price: allCandles[i].high, ts: allCandles[i].timestamp});
          if (isSwingLow(i)) pivots.push({i, type:'low', price: allCandles[i].low, ts: allCandles[i].timestamp});
        }
        // Clasifica estructura: HH/HL/LH/LL
        let lastType = '';
        let lastPrice = 0;
        let lastLabel = '';
        const structureLabels: {x:number, y:number, label:string, color:string}[] = [];
        for (let k=0; k<pivots.length; k++) {
          const prev = pivots[k-1];
          const curr = pivots[k];
          if (!curr) continue;
          let label = '';
          let color = '';
          if (curr.type==='high') {
            if (prev && prev.type==='high') {
              if (curr.price > prev.price) { label = 'HH'; color='#43e97b'; }
              else { label = 'LH'; color='#f87171'; }
            } else label = 'H';
          } else if (curr.type==='low') {
            if (prev && prev.type==='low') {
              if (curr.price < prev.price) { label = 'LL'; color='#f87171'; }
              else { label = 'HL'; color='#43e97b'; }
            } else label = 'L';
          }
          // Calcula posición
          const x = (curr.ts - minTime) * xScale - clampedOffsetX;
          const y = chartHeight - ((curr.price - minPrice) * yScale - clampedOffsetY);
          if (label) structureLabels.push({x, y, label, color});
        }
        // Dibuja líneas entre pivotes
        ctx.save();
        ctx.strokeStyle = '#00FFD0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k=0; k<pivots.length; k++) {
          const curr = pivots[k];
          const x = (curr.ts - minTime) * xScale - clampedOffsetX;
          const y = chartHeight - ((curr.price - minPrice) * yScale - clampedOffsetY);
          if (k===0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        // Order Blocks: solo los dos últimos HH y los dos últimos LL
        const orderBlocks: {type:'bull'|'bear', x1:number, x2:number, y:number, height:number, color:string}[] = [];
        // Encuentra los tres últimos HH y LL, pero filtra los que estén demasiado cerca (menos de 20 velas de diferencia)
        function dedupeByProximity(labels: {x:number, y:number, label:string, color:string, i?:number}[], minDistance: number, count: number) {
          const filtered: typeof labels = [];
          for (let k = labels.length - 1; k >= 0 && filtered.length < count; k--) {
            const curr = labels[k];
            if (!curr) continue;
            // No añadir si ya hay uno muy cerca
            if (filtered.some(l => Math.abs((l.i ?? 0) - (curr.i ?? 0)) < minDistance)) continue;
            filtered.push(curr);
          }
          return filtered.reverse();
        }
        const hhLabels = structureLabels.map((l, idx) => ({...l, i: idx})).filter(l=>l.label==='HH');
        const llLabels = structureLabels.map((l, idx) => ({...l, i: idx})).filter(l=>l.label==='LL');
        const lastHHs = dedupeByProximity(hhLabels, 20, 3);
        const lastLLs = dedupeByProximity(llLabels, 20, 3);
        // Dibuja order blocks en los tres últimos HH (zona de venta)
        for (const hh of lastHHs) {
          orderBlocks.push({type:'bear', x1:hh.x-35, x2:hh.x+35, y:hh.y-18, height:24, color:'rgba(255,0,0,0.18)'});
        }
        // Dibuja order blocks en los tres últimos LL (zona de compra)
        for (const ll of lastLLs) {
          orderBlocks.push({type:'bull', x1:ll.x-35, x2:ll.x+35, y:ll.y-6, height:24, color:'rgba(0,255,100,0.18)'});
        }
        for (const ob of orderBlocks) {
          ctx.save();
          ctx.fillStyle = ob.color;
          ctx.strokeStyle = ob.type==='bear' ? '#ff5555' : '#43e97b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(ob.x1, ob.y, ob.x2-ob.x1, ob.height);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        // Zonas de liquidez: áreas horizontales en los LL y HH
        for (const lbl of structureLabels) {
          if (lbl.label==='LL') {
            ctx.save();
            ctx.fillStyle = 'rgba(0,255,255,0.10)';
            ctx.fillRect(0, lbl.y+6, chartWidth, 10);
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#1e90ff';
            ctx.fillText('Weak Low', chartWidth-50, lbl.y+18);
            ctx.restore();
          }
          if (lbl.label==='HH') {
            ctx.save();
            ctx.fillStyle = 'rgba(255,0,0,0.10)';
            ctx.fillRect(0, lbl.y-20, chartWidth, 10);
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#ff5555';
            ctx.fillText('Strong High', chartWidth-60, lbl.y-12);
            ctx.restore();
          }
        }
        // Dibuja etiquetas HH/HL/LH/LL
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (const {x, y, label, color} of structureLabels) {
          ctx.fillStyle = color;
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 3;
          ctx.strokeText(label, x, y-8);
          ctx.fillText(label, x, y-8);
        }
        ctx.restore();
        // Detect BOS/CHoCH
        for (let k=2; k<structureLabels.length; k++) {
          const prev = structureLabels[k-1];
          const curr = structureLabels[k];
          if (!prev || !curr) continue;
          // BOS: Un HH que rompe el último HH, o LL que rompe el último LL
          if ((prev.label==='HH' && curr.label==='HH' && curr.y < prev.y) || (prev.label==='LL' && curr.label==='LL' && curr.y > prev.y)) {
            ctx.save();
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#FFD600';
            ctx.textAlign = 'center';
            ctx.fillText('BOS', curr.x, curr.y-20);
            ctx.restore();
          }
          // CHoCH: Cambio de tendencia
          if ((prev.label==='HH' && curr.label==='LL') || (prev.label==='LL' && curr.label==='HH')) {
            ctx.save();
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#60a5fa';
            ctx.textAlign = 'center';
            ctx.fillText('CHoCH', curr.x, curr.y-20);
            ctx.restore();
          }
        }
      }}
      className="absolute top-0 left-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  </div>
)}
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
