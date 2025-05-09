"use client";
import { useEffect, useState } from "react";
import { useWindowWidth } from "@/hooks/use-window-width";
import { BitcoinSparkles } from "@/components/ui/bitcoin-sparkles";
import { TextParticle } from "@/components/ui/text-particle";
import Link from "next/link";
import { SplineScene } from "@/components/ui/splite";
import { MenuPreview } from "@/components/ui/menu-preview";
import { SiBitcoinsv } from "react-icons/si";


const menuItems = [
  {
    label: "Jugar",
    description: "Ir al juego principal",
    href: "/game",
    icon: (
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    previewImage: "/previews/preview1.png",
  },
  {
    label: "Perfil",
    description: "Ver y editar tu perfil",
    href: "/profile",
    icon: (
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-purple-500"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a8.38 8.38 0 0 1 13 0" /></svg>
    ),
    previewImage: "/previews/preview2.png",
  },
  {
    label: "MINIJUEGO",
    description: "Juega a un juego rápido",
    href: "/minijuego",
    icon: (
      <SiBitcoinsv className="w-10 h-10 text-yellow-500" />
    ),
    previewImage: "/previews/preview4.png",
  },
  {
    label: "Cómo Jugar",
    description: "Aprende las reglas y mecánicas",
    href: "/how-to-play",
    icon: (
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
    ),
    previewImage: "/previews/preview3.png",
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
  const [showSplash, setShowSplash] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const splashCount = parseInt(sessionStorage.getItem("splashShown") || "0", 10);
      if (splashCount < 6) {
        setShowSplash(true);
        sessionStorage.setItem("splashShown", String(splashCount + 1));
        setTimeout(() => setShowSplash(false), 4000);
      }
    }
  }, []);
  const width = useWindowWidth();
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
    <main className={`min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden ${showSplash ? 'overflow-hidden' : ''}`} style={{background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.82) 100%)'}}>
      {/* Splash Intro Overlay */}
      {showSplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" style={{backdropFilter: 'blur(8px)'}}>
          <img
            src="/intro.png"
            alt="Intro"
            style={{
              width: "90vw",
              height: "auto",
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              display: "block"
            }}
          />
        </div>
      )}
       {/* Fondo portada solo para el menú */}
       <div className={`absolute inset-0 z-0 opacity-70 pointer-events-none select-none transform scale-131 ${showSplash ? 'blur-lg' : ''}`}>
         <img src="/portada.png" alt="Portada" className="w-full h-full object-cover" draggable="false" />
       </div>
      <div className="relative z-10 w-full flex flex-col items-center -mt-2.5">
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-yellow-400 text-5xl md:text-7xl font-black select-none tracking-tight italic uppercase" style={{
            fontStyle: 'italic',
            textShadow: '3px 3px 6px rgba(0, 0, 0, 0.85)'
          }}>
            CANDLE RUSH 2
          </span>
          <div className="flex items-center gap-4">
            <SiBitcoinsv className="text-yellow-400 text-4xl md:text-6xl" style={{
              textShadow: '3px 3px 6px rgba(0, 0, 0, 0.85)'
            }} />
            <div className="relative max-w-xs w-full overflow-hidden">
  <BitcoinSparkles />
  <div className="absolute inset-0 flex items-center justify-center w-full h-full">
    <TextParticle
      text={`$${Number(btcPrice.replace(/,/g, '')).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
      fontSize={width > 1024 ? 64 : width > 768 ? 48 : 28}
      particleSize={2}
      particleColor="#FFD600"
      backgroundColor="transparent"
      className="w-full truncate text-4xl md:text-5xl lg:text-6xl font-black max-w-xs"
      fontFamily="Arial Black, Arial, sans-serif"
      particleDensity={4}
    />
  </div>
</div>
          </div>
      </div>
      {/* Spline 3D Scene */}
      <div className="w-full h-[400px]">
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
      </div>
      <div className="flex flex-col w-full max-w-lg space-y-2 relative">
        {menuItems.map((item) => (
          <div key={item.label} className="relative">
            {item.label === "Jugar" && (
              <Link
                href="/infomix"
                className="absolute -top-1 right-0 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-medium hover:bg-yellow-300 transition-colors"
              >
                Conoce a AutoMix 🤖
              </Link>
            )}
            <MenuPreview previewImage={item.previewImage}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 p-3 rounded-xl bg-black border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors shadow-lg cursor-pointer"
                style={{ 
                  boxShadow: '0 0 20px #FFD60055',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.85)'
                }}
              >
                <span className="transition-transform group-hover:scale-110" style={{
                  width: 32,
                  height: 32,
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.85)'
                }}>{item.icon}</span>
                <span className="flex items-center">
                  <span className="text-yellow-400 text-xl md:text-2xl font-black select-none tracking-tight italic uppercase group-hover:text-black transition-colors" style={{
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.85)'
                  }}>
                    {item.label}
                  </span>
                </span>
              </Link>
            </MenuPreview>
          </div>
        ))}
      </div>
      <footer className="w-full fixed bottom-0 left-0 bg-black text-yellow-500 text-xs opacity-70 select-none py-2 text-center z-50 shadow-lg border-t border-yellow-400">
        v1.0.3 &copy; CandleRush 2025 &middot; <a href="https://x.com/CarlosFreire0" target="_blank" rel="noopener noreferrer" className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors">By Carlos Freire</a>
      </footer>
      <div className="h-12" />
      </div>
    </main>
  );
}
