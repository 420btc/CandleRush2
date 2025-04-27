"use client";
import React, { useMemo } from "react";
import type { Candle } from "@/types/game";

interface DollarDiffCounterProps {
  currentCandle: Candle | null;
  realtimePrice: number | null; // Use the latest price (e.g., currentCandle.close or live price)
}

const DollarDiffCounter: React.FC<DollarDiffCounterProps> = ({ currentCandle, realtimePrice }) => {
  const open = currentCandle?.open ?? null;
  const price = realtimePrice ?? currentCandle?.close ?? null;
  const diff = open !== null && price !== null ? price - open : null;
  const diffAbs = diff !== null ? Math.abs(diff) : null;

  // Color: green if up, red if down, white if no change
  let color = "text-white";
  if (diff !== null) {
    if (diff > 0) color = "text-green-400";
    else if (diff < 0) color = "text-red-400";
  }

  return (
    <div className="flex flex-col items-center justify-center select-none" style={{ minWidth: 120 }}>
      <span className="text-xs text-zinc-400 mb-1 uppercase tracking-wide">Cambio actual</span>
      <span className={`font-mono text-5xl font-extrabold drop-shadow-xl ${color}`}
        style={{ letterSpacing: '0.02em', lineHeight: 1.1 }}>
        {diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(2)}` : "-"}
      </span>

    </div>
  );
};

export default DollarDiffCounter;
