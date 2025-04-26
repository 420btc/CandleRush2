"use client";
import React from "react";
import type { Candle } from "@/types/game";

interface VolumeProfileProps {
  candles: Candle[];
  chartHeight: number;
  priceMin: number;
  priceMax: number;
  barWidth?: number; // px
  bins?: number; // número de niveles de precio
}

// Calcula el perfil de volumen agrupando por niveles de precio
export function computeVolumeProfile(candles: Candle[], priceMin: number, priceMax: number, bins: number) {
  const binSize = (priceMax - priceMin) / bins;
  const profile = Array.from({ length: bins }, () => 0);
  candles.forEach(candle => {
    // Usamos el precio medio de la vela para asignar el volumen
    const price = (candle.open + candle.close) / 2;
    const idx = Math.min(
      bins - 1,
      Math.max(0, Math.floor((price - priceMin) / binSize))
    );
    profile[idx] += candle.volume ?? 0;
  });
  return profile;
}

const BLUE = "#3B82F6"; // azul tailwind-500

const VolumeProfile: React.FC<VolumeProfileProps> = ({ candles, chartHeight, priceMin, priceMax, barWidth = 28, bins = 24 }) => {
  const profile = computeVolumeProfile(candles, priceMin, priceMax, bins);
  const maxVol = Math.max(...profile, 1);
  return (
    <svg
      width={barWidth}
      height={chartHeight}
      style={{ position: 'absolute', right: 0, top: 0, pointerEvents: 'none', zIndex: 3 }}
    >
      {profile.map((vol, i) => {
        const y = (chartHeight / bins) * i;
        const h = chartHeight / bins;
        const w = (vol / maxVol) * (barWidth - 4); // margen
        return (
          <rect
            key={i}
            x={barWidth - w}
            y={y + 1}
            width={w}
            height={h - 2}
            rx={h/3}
            fill={BLUE}
            fillOpacity={0.75}
          />
        );
      })}
    </svg>
  );
};

export default VolumeProfile;
