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
        <span style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          {/* Glow background */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              height: '75%',
              borderRadius: '30%',
              filter: 'blur(22px)',
              opacity: color === 'white' ? 0.12 : 0.38,
              background: color === '#00FF85' ? '#00FF85' : color === '#FF2222' ? '#FF2222' : '#888',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
          {/* Value text */}
          <span
            className="font-extrabold"
            style={{
              color,
              fontFamily: 'inherit',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 'calc(3rem + 6px)',
              letterSpacing: '0.01em',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              zIndex: 1,
            }}
          >
            <span style={{ display: 'inline-block', width: '1.1em', textAlign: 'center' }}>
              {diff !== null ? (diff > 0 ? '+' : diff < 0 ? '-' : '😔') : '-'}
            </span>
            <span style={{ display: 'inline-block' }}>{diff !== null ? Math.abs(diff).toFixed(2) : ''}</span>
          </span>
        </span>
      </div>
    </div>
  );
};

export default DollarDiffCounter;
