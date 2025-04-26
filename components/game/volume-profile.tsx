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
    // Aplicar factor de escala x1.5 al volumen
    profile[idx] += (candle.volume ?? 0) * 1.5;
  });
  return profile;
}

const YELLOW = "#FFD600"; // amarillo fuerte

const VolumeProfile: React.FC<VolumeProfileProps> = ({ candles, chartHeight, priceMin, priceMax, barWidth = 7, bins = 40 }) => {
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
        const isMax = vol === maxVol;
        return (
          <rect
            key={i}
            x={barWidth - w}
            y={y + 1}
            width={w}
            height={h - 2}
            rx={h/3}
            fill={YELLOW}
            fillOpacity={isMax ? 1 : 0.75}
            style={isMax ? { filter: 'drop-shadow(0 0 16px #FFD600), drop-shadow(0 0 32px #FFD600CC)' } : {}}
          />
        );
      })}
    </svg>
  );
};

export default VolumeProfile;
