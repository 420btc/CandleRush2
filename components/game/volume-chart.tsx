import React from "react";

export type VolumeChartProps = {
  candles: { volume: number; close: number; open: number }[];
  width?: number;
  height?: number;
};

export default function VolumeChart({ candles, width = 400, height = 60 }: VolumeChartProps) {
  if (!candles || candles.length === 0) return null;

  const maxVolume = Math.max(...candles.map(c => c.volume));
  const barWidth = width / candles.length;
const effectiveHeight = height;

return (
  <svg width={width} height={height} style={{ opacity: 0.9, position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
    {candles.map((candle, i) => {
      if (candle.volume === 0) return null;
      const barHeight = (candle.volume / maxVolume) * effectiveHeight;
      const isBull = candle.close >= candle.open;
      return (
        <rect
          key={i}
          x={i * barWidth}
          y={height - barHeight}
          width={Math.max(barWidth - 1, 3)}
          height={barHeight}
          fill={isBull ? "#22d3ee" : "#f43f5e"}
          style={{ filter: isBull ? 'drop-shadow(0 2px 8px #22d3eeAA)' : 'drop-shadow(0 2px 8px #f43f5eAA)' }}
          rx={2}
        />
      );
    })}
  </svg>
);
}
