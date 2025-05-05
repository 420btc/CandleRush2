import React, { useMemo } from "react";
import type { Candle } from "@/types/game";
import { calculateADX } from "@/utils/adx";

// Utilidad para calcular el MACD
function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  // EMA helper
  const ema = (period: number, data: number[]) => {
    const k = 2 / (period + 1);
    let emaArray = [];
    let prevEma = data[0];
    emaArray.push(prevEma);
    for (let i = 1; i < data.length; i++) {
      prevEma = data[i] * k + prevEma * (1 - k);
      emaArray.push(prevEma);
    }
    return emaArray;
  };
  const emaFast = ema(fast, closes);
  const emaSlow = ema(slow, closes);
  const macd = emaFast.map((val, i) => val - emaSlow[i]);
  const signalLine = ema(signal, macd);
  const histogram = macd.map((val, i) => val - signalLine[i]);
  return { macd, signal: signalLine, histogram };
}

interface MacdChartProps {
  candles: Candle[];
  viewState: {
    offsetX: number;
    scale: number;
  };
  startIndex?: number;
  candlesToShow?: number;
}

export default function MacdChart({ candles, viewState, startIndex: externalStartIndex, candlesToShow: externalCandlesToShow, height = 180, showCrossCircles = true }: MacdChartProps & { height?: number, showCrossCircles?: boolean }) {
  // Extraer precios de cierre
  const closes = useMemo(() => candles.map(c => c.close), [candles]);
  const { macd, signal, histogram } = useMemo(() => calculateMACD(closes), [closes]);

  // Renderizado simple SVG
  const chartWidth = 1200;
  const chartHeight = height;

  // Sincronizar pan/zoom con el gráfico principal
  const { offsetX, scale } = viewState;
  // Calcular candleWidth igual que en candlestick-chart
  const candleWidth = Math.min(Math.max((chartWidth / (candles.length / scale)) * 1, 2), 15);
  // Determinar cuántas velas caben en pantalla
  const candlesToShow = externalCandlesToShow ?? Math.floor(chartWidth / candleWidth);
  // Calcular el índice inicial igual que en candlestick-chart
  const startIndex = externalStartIndex ?? Math.max(0, Math.floor((candles.length - candlesToShow) - (offsetX / candleWidth)));
  const endIndex = Math.min(candles.length, startIndex + candlesToShow);

  const closesSlice = closes.slice(startIndex, endIndex);
  const { macd: macdSlice, signal: signalSlice, histogram: histSlice } = useMemo(() => calculateMACD(closesSlice), [closesSlice]);

  const barsToShow = closesSlice.length;
  const maxAbs = Math.max(
    ...macdSlice.map(Math.abs),
    ...signalSlice.map(Math.abs),
    ...histSlice.map(Math.abs)
  ) || 1;
  // Para las líneas: sin estiramiento vertical
const points = (arr: number[]) =>
  arr.map((y, i) => [
    (i / (barsToShow - 1)) * chartWidth,
    chartHeight / 2 - (y / maxAbs) * (chartHeight / 2 - 10)
  ]);
// Para el histograma: sí estiramos valles y picos
const histScale = 1.7;
const histoY = (h: number) => chartHeight / 2 - (h / maxAbs) * (chartHeight / 2 - 10) * histScale;

const macdPoints = points(macdSlice);
const signalPoints = points(signalSlice);
const histPoints = histSlice;

  // Calcular ADX para el mismo rango de velas
  const adxArr = useMemo(() => calculateADX(candles.slice(startIndex, endIndex)), [candles, startIndex, endIndex]);
  // Normalizar ADX para escalarlo al chartHeight (0-100)
  const adxPoints = adxArr.map((v, i) => v == null ? null : [
    (i / (barsToShow - 1)) * chartWidth,
    chartHeight - (v / 100) * (chartHeight - 14) - 7 // margen arriba/abajo
  ]).filter(Boolean) as [number, number][];

  // --- RSI ---
  // Cálculo RSI sencillo
  function calculateRSI(prices: number[], period = 14): number[] {
    const rsis: number[] = [];
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
      if (i >= period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsis.push(100 - 100 / (1 + rs));
        // Quitar el más antiguo
        const diffOld = prices[i - period + 1] - prices[i - period];
        if (diffOld >= 0) gains -= diffOld;
        else losses += diffOld;
      }
    }
    return rsis;
  }
  const rsiValues = calculateRSI(closesSlice);
  // Mapeo para que la línea esté pegada a la parte baja del SVG
  const rsiLinePoints = rsiValues.map((rsi, i) => [
    (i / (barsToShow - 1)) * chartWidth,
    chartHeight - 5 - ((rsi - 0) / 100) * 70 // 70px de alto para la franja RSI (más zoom)
  ]);

  return (
    <div className="w-full mt-4">

      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        style={{ background: "#000", display: 'block' }}
      >
        {/* Línea RSI en la parte baja */}
        {rsiLinePoints.length > 1 && (
          <polyline
            fill="none"
            stroke="#2196f3"
            strokeWidth={1}
            points={rsiLinePoints.map(p => p.join(",")).join(" ")}
            opacity={0.95}
            style={{ filter: 'drop-shadow(0 0 2px #000)' }}
          />
        )}
        {/* Índice de valores en la esquina inferior izquierda */}
        {(() => {
          const lastIdx = barsToShow - 1;
          const macdVal = macdSlice[lastIdx]?.toFixed(2) ?? '--';
          const signalVal = signalSlice[lastIdx]?.toFixed(2) ?? '--';
          let adxVal = '--';
          for (let i = barsToShow - 1; i >= 0; i--) {
            if (adxArr[i] != null) { adxVal = adxArr[i]!.toFixed(2); break; }
          }
          // RSI
          const rsiVal = rsiValues.length > 0 ? rsiValues[rsiValues.length-1].toFixed(2) : '--';
          let y = chartHeight - 38;
          const dy = 12;
          return (
            <g opacity={0.55} fontFamily="inherit">
              <text x="2" y={y} fill="#a259ff" fontSize="10" fontWeight="bold">
                MACD: <tspan fill="#fff" fontWeight="normal">{macdVal}</tspan>
              </text>
              <text x="2" y={y+=dy} fill="#FFD600" fontSize="10" fontWeight="bold">
                Signal: <tspan fill="#fff" fontWeight="normal">{signalVal}</tspan>
              </text>
              <text x="2" y={y+=dy} fontSize="10" fontWeight="bold">
                <tspan fill="#22c55e">A</tspan>
                <tspan fill="#ef4444">D</tspan>
                <tspan fill="#22c55e">X</tspan>
                <tspan fill="#fff">: </tspan>
                <tspan fill="#fff" fontWeight="normal">{adxVal}</tspan>
              </text>
              <text x="2" y={y+=dy} fill="#2196f3" fontSize="10" fontWeight="bold">
                RSI: <tspan fill="#fff" fontWeight="normal">{rsiVal}</tspan>
              </text>
            </g>
          );
        })()}
        {/* Línea ADX blanca */}
        {/* ADX coloreado por zonas */}
        {(() => {
          if (barsToShow < 2) return null;
          // Prepara segmentos de color
          const segments: { color: string; points: [number, number][] }[] = [];
          let currentColor = null;
          let currentSegment: [number, number][] = [];
          for (let i = 0; i < barsToShow; i++) {
            const v = adxArr[i];
            if (v == null) continue;
            let color = '#fff';
            let opacity = 0.7;
            if (v > 25) color = '#22c55e'; // verde fuerte
            else if (v < 20) color = '#ef4444'; // rojo débil
            // blanco translúcido para neutro
            const point: [number, number] = [
              (i / (barsToShow - 1)) * chartWidth,
              chartHeight - (v / 100) * (chartHeight - 30) - 15
            ];
            if (currentColor === null) {
              currentColor = color;
              currentSegment = [point];
            } else if (color === currentColor) {
              currentSegment.push(point);
            } else {
              if (currentSegment.length > 1) segments.push({ color: currentColor, points: [...currentSegment] });
              currentColor = color;
              currentSegment = [currentSegment[currentSegment.length-1], point];
            }
          }
          if (currentSegment.length > 1) segments.push({ color: currentColor!, points: currentSegment });
          return segments.map((seg, idx) => (
            <polyline
              key={idx}
              fill="none"
              stroke={seg.color}
              strokeWidth={1}
              points={seg.points.map(p => p.join(",")).join(" ")}
              opacity={0.7}
            />
          ));
        })()}
        {/* Histograma: verde si >0, rojo si <0 */}
        {/* MACD tipo "velas" más marcadas */}
        {histPoints.map((h, i) => {
  const barWidth = Math.max(2, chartWidth / barsToShow - 7); // barras más finas
  const x = (i / barsToShow) * chartWidth - barWidth / 2;
  const y = h >= 0 ? histoY(h) : chartHeight / 2;
  const height = Math.abs(histoY(h) - chartHeight / 2);
  // Determinar si el valle/pico se está abriendo o cerrando
  const prev = i > 0 ? Math.abs(histPoints[i - 1]) : 0;
  const curr = Math.abs(h);
  let fill = '#005c38'; // verde normal ahora oscuro (cierre)
  let shadow = 'drop-shadow(0 1px 3px #005c3888)';
  if (h < 0) {
    fill = '#FF2222';
    shadow = 'drop-shadow(0 1px 3px #FF222233)';
  }
  // Si el valor absoluto sube, usamos color claro (apertura)
  if (curr > prev) {
    fill = h >= 0 ? '#66FFC2' : '#FF6666'; // verde claro para apertura
    shadow = h >= 0 ? 'drop-shadow(0 1px 6px #66FFC266)' : 'drop-shadow(0 1px 6px #FF666699)';
  }
  // Si baja, color normal (más oscuro)
  const isLastGlobal = (i + startIndex) === (candles.length - 1);
  return (
    <rect
      key={i}
      x={x}
      y={y}
      width={barWidth}
      height={height}
      fill={fill}
      opacity={h === 0 ? 0.5 : 1}
      rx={3}
      stroke={isLastGlobal ? '#fff' : undefined}
      strokeWidth={isLastGlobal ? 1 : undefined}
      style={undefined}
    />
  );
})}
        {/* Línea MACD */}
        <polyline
           fill="none"
           stroke="#a259ff"
           strokeWidth={1}
           points={macdPoints.map(p => p.join(",")).join(" ")}
           opacity={0.95}
         />
         <polyline
           fill="none"
           stroke="#FFD600"
           strokeWidth={1}
           points={signalPoints.map(p => p.join(",")).join(" ")}
           opacity={0.85}
         />
         {/* Cruces MACD/Signal: círculos mitad-mitad */}
         {showCrossCircles && macdSlice.slice(1).map((currMacd, i) => {
           const prevMacd = macdSlice[i];
           const prevSignal = signalSlice[i];
           const currSignal = signalSlice[i+1];
           if (
             prevMacd === undefined || prevSignal === undefined ||
             currMacd === undefined || currSignal === undefined
           ) return null;
           const prevDiff = prevMacd - prevSignal;
           const currDiff = currMacd - currSignal;
           if ((prevDiff === 0 || currDiff === 0) || (prevDiff * currDiff > 0)) return null; // No hay cruce
           // Interpolación lineal para el punto exacto
           const t = Math.abs(prevDiff) / (Math.abs(prevDiff) + Math.abs(currDiff));
           const xPrev = (i / (barsToShow - 1)) * chartWidth;
           const xCurr = ((i+1) / (barsToShow - 1)) * chartWidth;
           const yPrev = chartHeight / 2 - (prevMacd / maxAbs) * (chartHeight / 2 - 10);
           const yCurr = chartHeight / 2 - (currMacd / maxAbs) * (chartHeight / 2 - 10);
           const x = xPrev + t * (xCurr - xPrev);
           const y = yPrev + t * (yCurr - yPrev);
           const r = 6;
           // SVG: dos semicircunferencias con path
           return (
             <g key={i+"-cross"}>
               <path
                 d={`M ${x - r},${y} a${r},${r} 0 1,1 ${2*r},0`}
                 fill="none"
                 stroke="#a259ff"
                 strokeWidth={2}
               />
               <path
                 d={`M ${x + r},${y} a${r},${r} 0 1,1 -${2*r},0`}
                 fill="none"
                 stroke="#FFD600"
                 strokeWidth={2}
               />
             </g>
           );
         })}

        {/* Línea central */}
        <line x1={0} y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#fff" strokeDasharray="4 2" opacity={0.2} />
      </svg>
    </div>
  );
}
