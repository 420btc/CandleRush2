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

  // Color: igual que el precio grande de BTC
  let color = "white";
  if (diff !== null) {
    if (diff > 0.01) color = "#00FF85";
    else if (diff < -0.01) color = "#FF2222";
  }

  return (
    <div
      className="flex flex-col items-center justify-center select-none px-1"
      style={{ minWidth: 180, width: 180, maxWidth: 180, position: 'relative' }}
    >
      <div style={{ position: 'relative', left: '-40px', width: '100%' }}>
        <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide text-center whitespace-nowrap mb-0.5 block" style={{ position: 'relative', left: 0 }}>
          Cambio actual
        </span>
        <span
          className="font-extrabold"
          style={{
            color,
            fontFamily: 'inherit',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'calc(3rem + 6px)', // double the previous size
            letterSpacing: '0.01em',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <span style={{ display: 'inline-block', width: '1.1em', textAlign: 'center' }}>
            {diff !== null ? (diff > 0 ? '+' : diff < 0 ? '-' : '😔') : '-'}
          </span>
          <span style={{ display: 'inline-block' }}>{diff !== null ? Math.abs(diff).toFixed(2) : ''}</span>
        </span>
      </div>
    </div>
  );
};

export default DollarDiffCounter;
