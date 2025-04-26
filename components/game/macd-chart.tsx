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
}

export default function MacdChart({ candles, viewState }: MacdChartProps) {
  // Extraer precios de cierre
  const closes = useMemo(() => candles.map(c => c.close), [candles]);
  const { macd, signal, histogram } = useMemo(() => calculateMACD(closes), [closes]);

  // Renderizado simple SVG
  const chartWidth = 1200;
  const chartHeight = 180;

  // Sincronizar pan/zoom con el gráfico principal
  const { offsetX, scale } = viewState;
  // Determinar el rango de datos a mostrar
  const candlesToShow = Math.floor(candles.length / scale);
  const startIndex = Math.max(0, candles.length - candlesToShow - Math.floor(offsetX / (chartWidth / candlesToShow)));
  const endIndex = candles.length;

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
    <div className="w-full mt-4">
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
  const barWidth = Math.max(5, chartWidth / barsToShow - 3);
  const x = (i / barsToShow) * chartWidth - barWidth / 2;
  const y = h >= 0 ? histoY(h) : chartHeight / 2;
  const height = Math.abs(histoY(h) - chartHeight / 2);
  // Determinar si el valle/pico se está abriendo o cerrando
  const prev = i > 0 ? Math.abs(histPoints[i - 1]) : 0;
  const curr = Math.abs(h);
  let fill = '#00FF85';
  let shadow = 'drop-shadow(0 1px 3px #00FF8533)';
  if (h < 0) {
    fill = '#FF2222';
    shadow = 'drop-shadow(0 1px 3px #FF222233)';
  }
  // Si el valor absoluto sube, usamos color claro
  if (curr > prev) {
    fill = h >= 0 ? '#66FFC2' : '#FF6666';
    shadow = h >= 0 ? 'drop-shadow(0 1px 6px #66FFC299)' : 'drop-shadow(0 1px 6px #FF666699)';
  }
  // Si baja, color normal (más oscuro)
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
    />
  );
})}
        {/* Línea MACD */}
        <polyline
           fill="none"
           stroke="#00FF85"
           strokeWidth={1}
           points={macdPoints.map(p => p.join(",")).join(" ")}
           opacity={0.95}
         />
         <polyline
           fill="none"
           stroke="#fff"
           strokeWidth={1}
           points={signalPoints.map(p => p.join(",")).join(" ")}
           opacity={0.8}
         />
        {/* Línea central */}
        <line x1={0} y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#fff" strokeDasharray="4 2" opacity={0.2} />
      </svg>
    </div>
  );
}
