"use client";

import React, { useState, useEffect } from "react";
import { InteractiveRobotSpline } from "@/components/interactive-3d-robot";
import { BetFlyToRobotAnimation } from "@/components/ui/BetFlyToRobotAnimation";

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h'] as const;
type Timeframe = typeof TIMEFRAMES[number];

export default function MinijuegoPage() {
  // Estado para la temporalidad seleccionada
  const [selectedTf, setSelectedTf] = useState<Timeframe>('1m');
  // Estado para el precio de BTC
  const [btcPrice, setBtcPrice] = useState<string>("-");

  // Estado para el input de predicción
  const [prediction, setPrediction] = useState<string>("");
  // Estado para animación de apuesta
  const [flyAnimPrice, setFlyAnimPrice] = useState<number | string | null>(null);

  // Estado para la cuenta atrás
  const [countdown, setCountdown] = useState<number>(10);
  // Estado para el tiempo restante de la vela
  const [candleTimeLeft, setCandleTimeLeft] = useState<number>(60);
  // Estado para monedas ganadas
  const [coins, setCoins] = useState<number>(0);
  // Estado para apuestas pendientes
  type BetStatus = 'pendiente' | 'resuelta' | 'fuera de rango';
  interface Bet {
    price: string;
    frame: Timeframe;
    status: BetStatus;
  }
  interface Bet {
    price: string;
    frame: Timeframe;
    status: BetStatus;
    result?: 'ganada' | 'perdida';
    close?: string; // precio de cierre
  }
  const [pendingBets, setPendingBets] = useState<Bet[]>([]);

  // Eliminar apuesta con precio 42500 si existe
  useEffect(() => {
    setPendingBets(bets => bets.filter(bet => bet.price !== '42500'));
    // Solo ejecuta una vez al montar
    // eslint-disable-next-line
  }, []);

  // Estado para mostrar modal de apuesta
  const [showBetModal, setShowBetModal] = useState<{ price: string, frame: Timeframe }|null>(null);

  // Sincronizar con el inicio de cada vela real y countdown de apuesta
  useEffect(() => {
    // Obtener duración del timeframe en segundos
    const tfSeconds: Record<Timeframe, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400 };
    const tf = tfSeconds[selectedTf];

    function getCurrentCandleStart() {
      const now = Math.floor(Date.now() / 1000);
      return now - (now % tf);
    }

    let interval: NodeJS.Timeout;
    function tick() {
      const now = Math.floor(Date.now() / 1000);
      const candleStart = getCurrentCandleStart();
      const timeInCandle = now - candleStart;
      setCandleTimeLeft(tf - timeInCandle);
      setCountdown(timeInCandle < 10 ? 10 - timeInCandle : 0);
      // Resolver apuestas si justo termina la vela
      if (timeInCandle === tf - 1) {
        setPendingBets(bets => bets.map(bet => {
          if (bet.status === 'pendiente') {
            // Simular precio de cierre: usar btcPrice actual
            const closePrice = btcPrice.replace(/,/g, '');
            if (bet.price === closePrice) {
              setCoins(coins => coins + 1000);
              return { ...bet, status: 'resuelta', result: 'ganada', close: closePrice };
            } else {
              return { ...bet, status: 'resuelta', result: 'perdida', close: closePrice };
            }
          }
          return bet;
        }));
      }
      // Marcar como fuera de rango si no se resolvió y ya terminó la vela
      setPendingBets(bets => bets.map(bet => {
        if (bet.status === 'pendiente' && timeInCandle >= tf) {
          return { ...bet, status: 'fuera de rango' };
        }
        return bet;
      }));
    }
    tick();
    interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [selectedTf, btcPrice]);

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
      <main className="flex flex-col items-center justify-start min-h-screen w-full bg-black overflow-x-hidden">
        <div className="w-full flex flex-col items-center mt-8 select-none">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-xl italic" style={{ fontStyle: 'italic' }}>
            <span className="text-white">Minijuego</span> <span className="text-white">Candle</span> <span className="text-yellow-400">FOMO</span>
          </h1>
        </div>
        <div className="relative w-full h-[38vh] md:h-[45vh] lg:h-[50vh] mt-8 mb-0 z-0">
          <InteractiveRobotSpline
            scene={ROBOT_SCENE_URL}
            className="absolute inset-0 w-full h-full z-0 transform scale-x-[0.8]"
          />
          {/* Overlay negro para tapar el 'Built with Spline' */}
          <div className="absolute bottom-2 right-32 w-56 h-16 bg-black z-10 rounded-tl-xl" />
        </div>
      </main>
      {/* Bloque del minijuego al fondo */}
      <div className="fixed bottom-0 left-0 w-full flex justify-center z-30 pointer-events-none">
        <div className="w-full max-w-2xl bg-black/80 rounded-xl shadow-xl p-4 flex flex-col gap-3 backdrop-blur-md border border-yellow-400 pointer-events-auto">
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
          <div className="w-full flex flex-col items-center mb-6 mt-4 select-none">
          </div>
          <div className="flex flex-col items-center">
            <span className="text-yellow-400 text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-xl select-none">
              {btcPrice === "-" ? <span className="animate-pulse">Cargando...</span> : `$${btcPrice}`}
            </span>
            <span className="uppercase text-xs text-zinc-400 mt-1">Precio actual de Bitcoin</span>
          </div>
          {/* Input de predicción */}
          <form
            className="flex flex-col md:flex-row gap-2 items-stretch justify-center w-full max-w-md mx-auto"
            onSubmit={e => {
              e.preventDefault();
              if (!prediction || countdown <= 0) return;
              setFlyAnimPrice(prediction);
              setPendingBets(bets => [{ price: prediction, frame: selectedTf, status: 'pendiente' }, ...bets]);
              setShowBetModal({ price: prediction, frame: selectedTf });
              setPrediction("");
            }}
          >
            <div className="flex flex-col flex-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-semibold text-sm">Tu predicción para el cierre</span>
                <span className="text-xs text-zinc-400">{countdown > 0 ? `⏳ ${countdown}s` : "⏰ Cierre de apuestas"}</span>
              </div>
              <input
                type="number"
                placeholder="USD"
                value={prediction}
                onChange={e => setPrediction(e.target.value)}
                className="px-4 py-2 rounded-lg bg-zinc-900/80 border-2 border-yellow-400 text-yellow-400 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-zinc-500 w-full"
                disabled={countdown <= 0}
              />
            </div>
            <button
              type="submit"
              disabled={countdown <= 0 || !prediction}
              className={`px-6 rounded-lg font-bold text-lg border-2 border-yellow-400 transition-all duration-150 shadow-xl ${countdown > 0 ? 'animate-shake animate-apostar-rainbow' : ''} bg-yellow-400 text-black hover:bg-yellow-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed h-full min-h-[48px]`}
              style={countdown > 0 ? { animationDuration: '0.7s, 0.7s' } : {}}
            >
              Apostar
              <style jsx>{`
                @keyframes apostar-rainbow {
                  0% { background: #fde047; color: #000; }
                  20% { background: #fff200; color: #000; }
                  40% { background: #fff; color: #fde047; }
                  60% { background: #fbbf24; color: #000; }
                  80% { background: #ffe066; color: #000; }
                  100% { background: #fde047; color: #000; }
                }
                .animate-apostar-rainbow {
                  animation: apostar-rainbow 0.7s linear infinite;
                }
              `}</style>
            </button>
          </form>

          {/* Animación de apuesta volando hacia el robot */}
          {flyAnimPrice && (
            <BetFlyToRobotAnimation
              price={flyAnimPrice}
              onFinish={() => setFlyAnimPrice(null)}
            />
          )}

          {/* Modal de apuesta realizada */}
          {showBetModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
              <div className="bg-zinc-950 border-4 border-yellow-400 rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-xs">
                <div className="text-yellow-400 text-4xl font-extrabold mb-2">Apuesta realizada</div>
                <div className="text-lg text-white mb-1">Predicción: <span className="text-yellow-400 font-bold">${showBetModal.price}</span></div>
                <div className="text-sm text-zinc-400 mb-4">Frame: <span className="text-yellow-400">{showBetModal.frame}</span></div>
                <button className="mt-2 px-6 py-2 rounded-lg bg-yellow-400 text-black font-bold border-2 border-yellow-400 hover:bg-yellow-300 transition-all duration-150" onClick={()=>setShowBetModal(null)}>OK</button>
              </div>
            </div>
          )}

          {/* Lista de apuestas pendientes */}
          {pendingBets.length > 0 && (
            <div className="bg-black/70 rounded-xl p-4 mt-4 border border-yellow-400">
              <div className="text-yellow-400 font-bold mb-2 text-center">Apuestas pendientes</div>
              <ul className="flex flex-col gap-2">
                {pendingBets.map((bet, i) => {
                  const canDelete = bet.status === 'resuelta' || bet.status === 'fuera de rango';
                  return (
                    <li key={i} className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 rounded-lg border border-yellow-400">
                      <span className="text-yellow-400 font-bold">${bet.price}</span>
                      <span className="text-xs text-zinc-400">{bet.frame}</span>
                      <span className={`text-xs font-bold ${bet.result === 'ganada' ? 'text-green-400' : bet.result === 'perdida' ? 'text-red-400' : 'text-yellow-400'}`}>{
                        bet.status === 'pendiente' ? 'Esperando resolución...' : bet.status === 'resuelta' ? (bet.result === 'ganada' ? '¡Ganada!' : 'Perdida') : bet.status === 'fuera de rango' ? 'Fuera de rango' : ''
                      }</span>
                      {bet.close && bet.status === 'resuelta' && (
                        <span className="text-xs text-zinc-400 ml-2">Cierre: ${bet.close}</span>
                      )}
                      {canDelete && (
                        <button
                          className="ml-3 p-1 rounded hover:bg-yellow-400/20"
                          title="Borrar apuesta"
                          onClick={() => setPendingBets(bets => bets.filter((_, idx) => idx !== i))}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 hover:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Animación de apuesta volando hacia el robot */}
          {flyAnimPrice && (
            <BetFlyToRobotAnimation
              price={flyAnimPrice}
              onFinish={() => setFlyAnimPrice(null)}
            />
          )}
          {/* Historial de apuestas */}
          <div className="bg-black/70 rounded-xl p-4 mt-2 max-h-48 overflow-y-auto border border-yellow-400 relative">
            {/* X flotante para borrar todas */}
            <button
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/60 hover:bg-yellow-400/80 transition-colors"
              title="Borrar todas las apuestas"
              onClick={() => setPendingBets([])}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-400 hover:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-yellow-400 font-bold mb-2 text-center">Tus apuestas</div>
            <ul className="flex flex-col gap-2">
              {pendingBets.map((bet, i) => (
                <li key={"historial-"+i} className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 rounded-lg border border-yellow-400">
                  <span className="text-yellow-400 font-bold">${bet.price}</span>
                  <span className="text-xs text-zinc-400">{bet.frame}</span>
                  <span className={`text-xs font-bold ${bet.result === 'ganada' ? 'text-green-400' : bet.result === 'perdida' ? 'text-red-400' : 'text-yellow-400'}`}>{
                    bet.status === 'pendiente' ? 'Esperando resolución...' : bet.status === 'resuelta' ? (bet.result === 'ganada' ? '¡Ganada!' : 'Perdida') : bet.status === 'fuera de rango' ? 'Fuera de rango' : ''
                  }</span>
                  {bet.close && bet.status === 'resuelta' && (
                    <span className="text-xs text-zinc-400 ml-2">Cierre: ${bet.close}</span>
                  )}
                  <button
                    className="ml-3 p-1 rounded hover:bg-yellow-400/20"
                    title="Borrar apuesta"
                    onClick={() => setPendingBets(bets => bets.filter((_, idx) => idx !== i))}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 hover:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
   );
}
