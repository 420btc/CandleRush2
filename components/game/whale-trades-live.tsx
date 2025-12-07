import { useEffect, useState } from "react";
import { useLiquidations } from "./liquidations";
import SmallLiquidations from './small-liquidations';

// Hook para trades de ballenas en Binance Spot
function useBinanceWhaleTrades({ minUsd = 10000, limit = 16 } = {}) {
  const [trades, setTrades] = useState<any[]>([]);
  useEffect(() => {
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const price = parseFloat(msg.p);
        const amount = parseFloat(msg.q);
        const usd = price * amount;
        if (usd < minUsd) return;
        setTrades(trades => [{
          id: msg.t,
          price,
          amount,
          usd,
          side: msg.m ? "sell" : "buy",
          time: msg.T,
          type: 'trade'
        }, ...trades].slice(0, limit));
      } catch { }
    };
    return () => ws.close();
  }, [minUsd, limit]);
  return trades;
}

export default function WhaleTradesLive() {
  const [showSmallLiquidations, setShowSmallLiquidations] = useState(false);
  const trades = useBinanceWhaleTrades({ minUsd: 10000, limit: 5 });
  const { liquidations: liquidationList, isConnected } = useLiquidations({ symbol: 'BTCUSDT', minSize: 10000, limit: 5 });

  // Combinar trades y liquidaciones en un solo array
  const events = [...trades, ...liquidationList]
    .sort((a, b) => b.time - a.time)
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-black/80 p-1 rounded-lg shadow-lg w-full">
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs text-zinc-400 font-bold">Whale Alert <span style={{ color: '#FFD600' }}>Binance</span> BTC &gt;10K</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSmallLiquidations(!showSmallLiquidations)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors w-5 h-5 rounded-full border border-yellow-400 flex items-center justify-center"
            >
              <span className="text-[10px]">{showSmallLiquidations ? '💀' : '💀'}</span>
            </button>
            <span className="text-[9px] text-white">
              Liqs: <span className="text-yellow-300">{liquidationList.length}</span>
            </span>
          </div>
        </div>
        <ul className="space-y-1 w-full">
          {events.length === 0 && <li className="text-zinc-500 italic">No whale trades or liquidations</li>}
          {events.map((event) => (
            <li key={event.id || event.orderId}
              className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] font-bold 
                  ${event.type === 'trade'
                  ? (event.usd >= 100000 ? 'bg-yellow-400/80' : (event.side === 'buy' ? 'bg-green-900/80' : 'bg-red-900/80'))
                  : (event.side === 'LONG' ? 'bg-red-900/80' : 'bg-green-900/80')}`}
              style={{ color: '#fff' }}
            >
              <span className="font-bold" style={{ color: '#fff' }}>
                {event.type === 'trade'
                  ? (event.side === "buy" ? "BUY" : "SELL")
                  : (event.side === "LONG" ? "LIQ LONG" : "LIQ SHORT")}
              </span>
              <span className="mx-1" style={{ color: '#fff' }}>
                {event.type === 'trade'
                  ? (event.side === "buy" ? "🟢" : "🔴")
                  : (event.side === "LONG" ? "🔴" : "🟢")}
              </span>
              <span style={{ color: '#fff' }}>
                <span style={{ color: '#FFD600' }}>
                  ${(event.type === 'trade' ? event.usd : event.sizeUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="block text-[9px] text-white/80">Precio: {event.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </span>
              <span className="ml-2" style={{ color: '#fff' }}>
                {new Date(event.time).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {showSmallLiquidations && (
        <div className="mt-2">
          <SmallLiquidations />
        </div>
      )}
    </div>
  );
}
