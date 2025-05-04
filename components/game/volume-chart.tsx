import React from "react";

// Calculate RSI for a given period
const calculateRSI = (prices: number[], period = 14): number[] => {
  const gains: number[] = [];
  const losses: number[] = [];
  const rsis: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(-change);
    }

    if (i >= period - 1) {
      const avgGain = gains.slice(i - period + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1).reduce((a, b) => a + b, 0) / period;
      const rs = avgGain / (avgLoss || 1);
      rsis.push(100 - (100 / (1 + rs)));
    }
  }

  return rsis;
};

export type VolumeChartProps = {
  candles: { volume: number; close: number; open: number }[];
  width?: number;
  height?: number;
};

export default function VolumeChart({ candles, width = 400, height = 120 }: VolumeChartProps) {
  if (!candles || candles.length === 0) return null;

  const maxVolume = Math.max(...candles.map(c => c.volume));
  const barWidth = width / candles.length;
  const effectiveHeight = height;
  const prices = candles.map(candle => candle.close);
  const rsiValues = calculateRSI(prices);
  const maxRSI = 100;
  const minRSI = 0;

  return (
    <svg width={width} height={height} style={{ opacity: 0.9, position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
      {/* Volume bars */}
      {candles.map((candle, i) => {
        if (candle.volume === 0) return null;
        const barHeight = (candle.volume / maxVolume) * effectiveHeight;
        const isBull = candle.close >= candle.open;
        return (
          <rect
            key={i}
            x={i * barWidth}
            y={height - barHeight}
            width={Math.max(barWidth - 1, 2)}
            height={barHeight}
            fill={isBull ? "#22d3ee" : "#f43f5e"}
            style={{ filter: isBull ? 'drop-shadow(0 2px 8px #22d3eeAA)' : 'drop-shadow(0 2px 8px #f43f5eAA)' }}
            rx={2}
          />
        );
      })}
      {/* RSI Line */}
      <path
        d={`M${0},${height - ((rsiValues[0] || 50) - minRSI) / (maxRSI - minRSI) * height} ${rsiValues.map((rsi, i) => 
          `L${i * (width / candles.length)},${height - ((rsi || 50) - minRSI) / (maxRSI - minRSI) * height}`
        ).join(" ")}`}
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2,2"
        style={{
          opacity: 0.9,
          filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))'
        }}
      />
    </svg>
  );
}
