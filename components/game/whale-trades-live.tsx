import { useEffect, useState } from "react";

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
        }, ...trades].slice(0, limit));
      } catch {}
    };
    return () => ws.close();
  }, [minUsd, limit]);
  return trades;
}

export default function WhaleTradesLive() {
  const trades = useBinanceWhaleTrades({ minUsd: 10000, limit: 16 });
  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-black/80 p-1 rounded-lg shadow-lg max-w-xs w-full">
        <div className="text-xs text-zinc-400 mb-1 font-bold">Whale Trades (BTCUSDT, ≥ $10,000)</div>
        <ul className="space-y-0.5" style={{ maxHeight: '118px', minHeight: '118px', overflowY: 'auto' }}>
          {trades.length === 0 && <li className="text-zinc-500 italic">No whale trades</li>}
          {trades.map((t) => (
            <li key={t.id}
                className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] font-bold 
                  ${t.usd >= 100000 ? 'bg-yellow-400/80' : (t.side === 'buy' ? 'bg-green-900/80' : 'bg-red-900/80')}`}
                style={{ color: '#fff' }}
            >
              <span className="font-bold" style={{ color: '#fff' }}>
                {t.side === "buy" ? "BUY" : "SELL"}
              </span>
              <span className="mx-1" style={{ color: '#fff' }}>
                {t.side === "buy" ? "🟢" : "🔴"}
              </span>
              <span style={{ color: '#fff' }}>
                ${t.usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="block text-[9px] text-white/80">Precio: {t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </span>
              <span className="ml-2" style={{ color: '#fff' }}>
                {new Date(t.time).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
