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
    <div
      className="flex flex-col items-center justify-center select-none min-w-[90px] sm:min-w-[120px] px-1"
      style={{ width: '100%' }}
    >
      <span className="text-[10px] sm:text-xs text-zinc-400 mb-0.5 sm:mb-1 uppercase tracking-wide text-center whitespace-nowrap">
        Cambio actual
      </span>
      <span
        className={`font-mono text-3xl sm:text-5xl font-extrabold drop-shadow-xl ${color}`}
        style={{ letterSpacing: '0.01em', lineHeight: 1.1, wordBreak: 'break-all', width: '100%', textAlign: 'center' }}
      >
        {diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(2)}` : "-"}
      </span>
    </div>
  );
};

export default DollarDiffCounter;
