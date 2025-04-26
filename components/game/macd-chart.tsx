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

export default function MacdChart({ candles }: { candles: Candle[] }) {
  // Extraer precios de cierre
  const closes = useMemo(() => candles.map(c => c.close), [candles]);
  const { macd, signal, histogram } = useMemo(() => calculateMACD(closes), [closes]);

  // Renderizado simple SVG
  const chartWidth = 1200;
  const chartHeight = 180;
  const barsToShow = 120;
  const dataLen = macd.length;
  const maxAbs = Math.max(
    ...macd.slice(-barsToShow).map(Math.abs),
    ...signal.slice(-barsToShow).map(Math.abs),
    ...histogram.slice(-barsToShow).map(Math.abs)
  ) || 1;
  const points = (arr: number[]) =>
    arr.slice(-barsToShow).map((y, i) => [
      (i / (barsToShow - 1)) * chartWidth,
      chartHeight / 2 - (y / maxAbs) * (chartHeight / 2 - 10)
    ]);

  const macdPoints = points(macd);
  const signalPoints = points(signal);
  const histPoints = histogram.slice(-barsToShow);

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
        {histPoints.map((h, i) => (
          <rect
            key={i}
            x={(i / (barsToShow - 1)) * chartWidth - 2}
            y={isNaN(h) || isNaN(maxAbs) ? chartHeight / 2 : (h >= 0 ? chartHeight / 2 - (h / maxAbs) * (chartHeight / 2 - 10) : chartHeight / 2)}
            width={4}
            height={isNaN(h) || isNaN(maxAbs) ? 0 : Math.abs((h / maxAbs) * (chartHeight / 2 - 10))}
            fill={h >= 0 ? "#00ff00" : "#ff0000"}
            opacity={0.7}
          />
        ))}
        {/* Línea MACD */}
        <polyline
          fill="none"
          stroke="#00ff99"
          strokeWidth={2}
          points={macdPoints.map(([x, y]) => `${x},${y}`).join(" ")}
        />
        {/* Línea Signal */}
        <polyline
          fill="none"
          stroke="#FFD600"
          strokeWidth={2}
          points={signalPoints.map(([x, y]) => `${x},${y}`).join(" ")}
        />
        {/* Línea central */}
        <line x1={0} y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#fff" strokeDasharray="4 2" opacity={0.2} />
      </svg>
    </div>
  );
}
