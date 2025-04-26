import React, { useMemo } from "react";
import type { Candle } from "@/types/game";

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

export default function MacdChart({ candles, viewState, startIndex: externalStartIndex, candlesToShow: externalCandlesToShow, height = 180 }: MacdChartProps & { height?: number }) {
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

  return (
    <div className="w-full mt-4" style={{ pointerEvents: 'none' }}>
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        style={{ background: "#000", display: 'block' }}
      >
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
        {/* Línea central */}
        <line x1={0} y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#fff" strokeDasharray="4 2" opacity={0.2} />
      </svg>
    </div>
  );
}
