import React from "react";
import VolumeChart from "./volume-chart";
import type { Candle } from "@/types/game";

export default function VolumeChartOverlay({ candles, width = 1200, height = 120 }: { candles: Candle[], width?: number, height?: number }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 99 }}>
      <VolumeChart candles={candles} width={width} height={height} />
    </div>
  );
}
