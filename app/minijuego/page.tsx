"use client";

import React, { useState, useEffect } from "react";
import { InteractiveRobotSpline } from "@/components/interactive-3d-robot";

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h'] as const;
type Timeframe = typeof TIMEFRAMES[number];

export default function MinijuegoPage() {
  // Estado para la temporalidad seleccionada
  const [selectedTf, setSelectedTf] = useState<Timeframe>('1m');
  // Estado para el precio de BTC
  const [btcPrice, setBtcPrice] = useState<string>("-");

  // Hook para obtener el precio en directo de Binance
  useEffect(() => {
    let mounted = true;
    async function fetchBTC() {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
        const data = await res.json();
        if (mounted && data.price) {
          setBtcPrice(Number(data.price).toLocaleString("en-US", { maximumFractionDigits: 2 }));
        }
      } catch {}
    }
    fetchBTC();
    const interval = setInterval(fetchBTC, 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Botón de volver al menú */}
      <a
        href="/menu"
        className="fixed top-4 left-4 z-20 bg-black/70 rounded-full p-2 shadow-lg hover:bg-yellow-400/90 transition-colors group"
        style={{ pointerEvents: 'auto' }}
        aria-label="Volver al menú"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8 text-yellow-400 group-hover:text-black"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </a>
      <div className="relative w-full h-[38vh] md:h-[45vh] lg:h-[50vh] mt-20 md:mt-32 z-0">
        <InteractiveRobotSpline
          scene={ROBOT_SCENE_URL}
          className="absolute inset-0 w-full h-full z-0"
        />
      </div>
      <div
        className="
          absolute top-0 left-0 w-full z-10
          pt-6 md:pt-12 lg:pt-16
          px-4 md:px-8
          pointer-events-none
          flex flex-col items-center justify-start
        "
      >
        <div
          className="
            text-center
            text-white
            drop-shadow-lg
            w-full max-w-2xl
            mx-auto
            mb-2
          "
        >
          <h1
            className="
              text-2xl md:text-3xl lg:text-4xl xl:text-5xl
              font-bold
            "
          >
            Minijuego Candle <span className="text-yellow-400">FOMO</span>
          </h1>
        </div>
      </div>
      {/* Bloque del minijuego al fondo */}
      <div className="fixed bottom-0 left-0 w-full flex justify-center z-30 pb-6 pointer-events-none">
        <div className="w-full max-w-xl bg-black/80 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 backdrop-blur-md border border-yellow-400 pointer-events-auto">
          {/* Selector de temporalidad */}
          <div className="flex flex-wrap justify-center gap-3">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all duration-150 ${selectedTf === tf ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black/50 text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black'}`}
                onClick={() => setSelectedTf(tf)}
                type="button"
              >
                {tf}
              </button>
            ))}
          </div>
          {/* Precio BTC en directo */}
          <div className="flex flex-col items-center">
            <span className="text-yellow-400 text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-xl select-none">
              {btcPrice === "-" ? <span className="animate-pulse">Cargando...</span> : `$${btcPrice}`}
            </span>
            <span className="uppercase text-xs text-zinc-400 mt-1">Precio actual de Bitcoin</span>
          </div>
          {/* Input de predicción */}
          <form className="flex flex-col md:flex-row gap-3 items-center justify-center" onSubmit={e => e.preventDefault()}>
            <input
              type="number"
              placeholder="Tu predicción para el cierre (USD)"
              className="px-4 py-2 rounded-lg bg-zinc-900/80 border-2 border-yellow-400 text-yellow-400 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-zinc-500 w-full md:w-2/3"
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-yellow-400 text-black font-bold text-lg shadow-lg hover:bg-yellow-300 transition-colors"
            >
              Apostar
            </button>
          </form>
          {/* Historial de apuestas */}
          <div className="bg-black/70 rounded-xl p-4 mt-2 max-h-48 overflow-y-auto border border-yellow-400">
            <div className="text-yellow-400 font-bold mb-2 text-center">Tus apuestas</div>
            <ul className="space-y-2">
              {/* Ejemplo de apuesta */}
              <li className="flex flex-col md:flex-row md:items-center md:justify-between bg-zinc-900/60 rounded-lg p-3 border border-yellow-400">
                <div>
                  <span className="font-bold text-yellow-400">1m</span> | 
                  <span className="text-white ml-1">$42,500.00</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 md:mt-0">Cierra: 08/05/2025 23:59</div>
                <div className="text-xs font-bold text-green-400 md:ml-4">Pendiente</div>
              </li>
              {/* Aquí irán las apuestas reales */}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
