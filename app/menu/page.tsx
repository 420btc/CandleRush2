"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SplineScene } from "@/components/ui/splite";
import { SiBitcoinsv } from "react-icons/si";


const menuItems = [
  {
    label: "Jugar",
    description: "Ir al juego principal",
    href: "/game",
    icon: (
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    label: "Perfil",
    description: "Ver y editar tu perfil",
    href: "/profile",
    icon: (
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-purple-500"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a8.38 8.38 0 0 1 13 0" /></svg>
    ),
  },
  {
    label: "Cómo Jugar",
    description: "Aprende las reglas y mecánicas",
    href: "/how-to-play",
    icon: (
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
    ),
  },
];

// Reloj digital elegante
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="mt-2 text-white text-base font-mono tracking-widest select-none drop-shadow-lg">
      {time.toLocaleTimeString()}
    </div>
  );
}

// WhaleTrades Binance Spot WebSocket (solo BTCUSDT, >10k USD, scrollable)
function useBinanceWhaleTrades({ minUsd = 10000, limit = 16 } = {}) {
  const [trades, setTrades] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
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
    return () => { active = false; ws.close(); };
  }, [minUsd, limit]);
  return trades;
}

function WhaleTrades() {
  const trades = useBinanceWhaleTrades({ minUsd: 10000, limit: 16 });
  return (
    <div className="flex flex-col items-center w-full mb-8">
      <div className="bg-black/80 p-2 rounded-lg shadow-lg max-w-xs w-full">
        <div className="text-xs text-zinc-400 mb-1 font-bold">Whale Trades (BTCUSDT, &ge; $10,000)</div>
        <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {trades.length === 0 && <li className="text-zinc-500 italic">No whale trades</li>}
          {trades.map((t) => (
            <li key={t.id}
                className={`flex items-center justify-between px-2 py-1 rounded text-xs ${t.side === "buy" ? "bg-green-900/40" : "bg-red-900/40"}`}>
              <span className="font-bold">{t.side === "buy" ? "Buy" : "Sell"}</span>
              <span className="mx-1">{t.side === "buy" ? "🟢" : "🔴"}</span>
              <span>${t.usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="ml-2 text-zinc-400">{new Date(t.time).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const [btcPrice, setBtcPrice] = useState<string>("-");
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    async function fetchBTC() {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
        const data = await res.json();
        const newPrice = Number(data.price).toLocaleString("en-US", { maximumFractionDigits: 2 });
        // Solo actualizamos si el precio es diferente
        if (newPrice !== btcPrice) {
          setBtcPrice(newPrice);
        }
      } catch (e) {
        // No mostramos ningún mensaje de error
      }
    }
    fetchBTC();
    const interval = setInterval(fetchBTC, 1000); // Actualizar cada segundo
    return () => clearInterval(interval);
  }, [isClient, btcPrice]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden" style={{background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.82) 100%)'}}>
       {/* Fondo portada solo para el menú */}
       <div className="absolute inset-0 z-0 opacity-70 pointer-events-none select-none transform scale-131">
         <img src="/portada.png" alt="Portada" className="w-full h-full object-cover" draggable="false" />
       </div>
      <div className="relative z-10 w-full flex flex-col items-center -mt-2.5">
      <div className="flex flex-col items-center mb-10">
        <span className="text-yellow-400 text-4xl md:text-6xl font-black drop-shadow-lg select-none tracking-tight italic uppercase mb-2" style={{fontStyle: 'italic'}}>
          CANDLE RUSH 2
        </span>
        <div className="flex items-center gap-4 mb-2">
          <SiBitcoinsv className="text-yellow-400 text-4xl md:text-6xl" />
          <span className="text-yellow-400 text-4xl md:text-6xl font-black drop-shadow-lg select-none tracking-tight transition-none">
            ${btcPrice}
          </span>
        </div>
      </div>
      {/* Spline 3D Scene */}
      <div className="w-full h-[400px]">
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
      </div>
      <div className="flex flex-col w-full max-w-lg space-y-4 relative">
        {menuItems.map((item) => (
          <div key={item.label} className="relative">
            {item.label === "Jugar" && (
              <Link
                href="/infomix"
                className="absolute -top-2 right-0 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-medium hover:bg-yellow-300 transition-colors"
              >
                Conoce a AutoMix 🤖
              </Link>
            )}
            <Link
              href={item.href}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-black border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors shadow-2xl cursor-pointer text-yellow-200 hover:border-yellow-300 text-lg font-extrabold tracking-tight"
              style={{ boxShadow: '0 0 40px #FFD60055' }}
            >
            <span className="transition-transform group-hover:scale-125 drop-shadow-lg" style={{width:32,height:32}}>{item.icon}</span>
            <span className="flex flex-col">
              <span className="text-lg font-extrabold group-hover:text-black text-yellow-200">{item.label}</span>
              <span className="text-yellow-300 text-sm group-hover:text-black font-medium">{item.description}</span>
            </span>
          </Link>
        </div>)
        )}
      </div>
      <footer className="w-full fixed bottom-0 left-0 bg-black text-yellow-500 text-xs opacity-70 select-none py-2 text-center z-50 shadow-lg border-t border-yellow-400">
        v1.0.3 &copy; CandleRush 2025 &middot; <span className="text-yellow-400 font-semibold">By Carlos Freire</span>
      </footer>
      {/* Reloj digital */}
      <Clock />
      </div>
    </main>
  );
}
