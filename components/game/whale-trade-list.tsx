import React from "react";
import { useWhaleTrades, WhaleTrade } from "@/hooks/useWhaleTrades";

export default function WhaleTradeList({
  minUsd = 100000,
  exchanges,
  symbols
}: {
  minUsd?: number;
  exchanges?: string[];
  symbols?: string[];
}) {
  const trades = useWhaleTrades({ minUsd, exchanges, symbols });
  return (
    <div className="bg-black/80 p-1 rounded-lg shadow-lg max-w-xs w-full">
      <div className="text-xs text-zinc-400 mb-1 font-bold">Whale Trades ({'>'}{minUsd.toLocaleString()} USD)</div>
      <ul className="space-y-0.5" style={{ maxHeight: '108px', minHeight: '108px', overflowY: 'auto' }}>
        {trades.map((t) => (
          <li key={t.id}
              className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] font-bold 
                ${t.side === "buy" ? "bg-green-700" : "bg-red-700"}
              `}
              style={{ color: '#fff' }}
            >
            <span className="font-bold" style={{ color: '#fff' }} title={t.exchange}>{t.side === "buy" ? "BUY" : "SELL"}</span>
            <span className="mx-1" style={{ color: '#fff' }}>{t.side === "buy" ? "🟢" : "🔴"}</span>
            <span style={{ color: '#fff' }}>${(t.price * t.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="ml-2" style={{ color: '#fff' }}>{new Date(t.timestamp).toLocaleTimeString()}</span>
          </li>
        ))}
        {trades.length === 0 && <li className="text-zinc-500 italic">No whale trades</li>}
      </ul>
    </div>
  );
}
