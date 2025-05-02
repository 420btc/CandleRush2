import { useState } from 'react';
import { useLiquidations } from './liquidations';

// Componente para mostrar las liquidaciones menores a 500 USD
export default function SmallLiquidations() {
  const liquidations = useLiquidations({ symbol: 'BTCUSDT', minSize: 0, maxSize: 500, limit: 99, smallLimit: 5 });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-black/80 p-1 rounded-lg shadow-lg max-w-xs w-full">
        <div className="text-xs text-zinc-400 mb-1 font-bold">Small Liquidations <span style={{ color: '#FFD600' }}>Binance</span> Futures BTCUSDT &lt;500</div>
        <ul className="space-y-0.5" style={{ maxHeight: '60px', minHeight: '60px', overflowY: 'auto' }}>
          {liquidations.length === 0 && <li className="text-zinc-500 italic">No small liquidations</li>}
          {liquidations.map((liq) => (
            <li key={liq.orderId}
                className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] font-bold 
                  ${liq.side === 'LONG' ? 'bg-red-900/80' : 'bg-green-900/80'}`}
                style={{ color: '#fff' }}
            >
              <span className="font-bold" style={{ color: '#fff' }}>
                {liq.side === "LONG" ? "LIQ LONG" : "LIQ SHORT"}
              </span>
              <span className="mx-1" style={{ color: '#fff' }}>
                {liq.side === "LONG" ? "🔴" : "🟢"}
              </span>
              <span style={{ color: '#FFD600' }}>
                ${liq.sizeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="block text-[9px] text-white/80">Precio: {liq.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </span>
              <span className="ml-2" style={{ color: '#fff' }}>
                {new Date(liq.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
