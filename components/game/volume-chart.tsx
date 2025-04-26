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

  return (
    <svg width={width} height={height} style={{ opacity: 0.3, position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
      {candles.map((candle, i) => {
        const barHeight = (candle.volume / maxVolume) * height;
        const isBull = candle.close >= candle.open;
        return (
          <rect
            key={i}
            x={i * barWidth}
            y={height - barHeight}
            width={barWidth - 1}
            height={barHeight}
            fill={isBull ? "#4ade80" : "#f87171"}
          />
        );
      })}
    </svg>
  );
}
