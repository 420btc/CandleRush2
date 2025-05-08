"use client";

import React, { useState, useEffect, useRef } from "react";
import ScratchCard from 'react-scratchcard-v2';
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
        <div className="w-full h-[38vh] md:h-[45vh] lg:h-[50vh] mt-8 mb-0 z-0 flex flex-row items-center justify-center relative">
          {/* Texto informativo izquierdo */}
          <div className="hidden md:flex flex-col items-end w-1/4 pr-8 select-none">
            <span className="text-lg font-semibold text-white leading-snug">
              <span className="text-yellow-400">1.</span> Elige el marco temporal<br/>
              <span className="text-yellow-400">2.</span> Haz tu predicción<br/>
              <span className="text-yellow-400">3.</span> ¡Apuesta y espera el cierre!
            </span>
          </div>
          {/* Rasca y gana debajo del texto de cómo ganas */}
          
          {/* Centro: robot y overlay */}
          <div className="flex-1 flex items-center justify-center h-full relative">
            <InteractiveRobotSpline
              scene={ROBOT_SCENE_URL}
              className="w-full h-full z-0 transform scale-x-[0.8]"
            />
            {/* Overlay negro para tapar el 'Built with Spline' */}
            <div className="absolute bottom-2 w-56 h-16 bg-black z-10 rounded-tl-xl" style={{ right: 10 }}>
              <div className="absolute left-0 flex items-center justify-center w-12 h-12 bg-yellow-400 rounded-full shadow-md" style={{ top: 'calc(50% + 2px)', left: 3, transform: 'translateY(-50%)' }}>
                {/* Bitcoin Logo SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><linearGradient id="btc-c" x1="50%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stopColor="#FFF" stopOpacity=".5"/><stop offset="100%" stopOpacity=".5"/></linearGradient><circle id="btc-b" cx="16" cy="15" r="15"/><filter id="btc-a" width="111.7%" height="111.7%" x="-5.8%" y="-4.2%" filterUnits="objectBoundingBox"><feOffset dy=".5" in="SourceAlpha" result="shadowOffsetOuter1"/><feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation=".5"/><feComposite in="shadowBlurOuter1" in2="SourceAlpha" operator="out" result="shadowBlurOuter1"/><feColorMatrix in="shadowBlurOuter1" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.199473505 0"/></filter><path id="btc-e" d="M23.1889526,13.0201846 C23.5025526,10.9239385 21.9064911,9.79704615 19.7240911,9.04529231 L20.4320295,6.20566154 L18.7035372,5.77489231 L18.0143065,8.53969231 C17.5599065,8.42646154 17.0931988,8.31963077 16.6294449,8.21378462 L17.3235988,5.43076923 L15.5960911,5 L14.8876603,7.83864615 C14.5115372,7.75298462 14.1423065,7.66830769 13.7839065,7.5792 L13.7858757,7.57033846 L11.4021218,6.97513846 L10.9423065,8.82129231 C10.9423065,8.82129231 12.224768,9.1152 12.1976911,9.13341538 C12.8977526,9.30818462 13.0242757,9.77144615 13.0031065,10.1387077 L12.1967065,13.3736615 C12.2449526,13.3859692 12.3074757,13.4036923 12.3763988,13.4312615 C12.3187988,13.4169846 12.2572603,13.4012308 12.1937526,13.3859692 L11.0634142,17.9176615 C10.9777526,18.1303385 10.7606449,18.4493538 10.2712911,18.3282462 C10.2885218,18.3533538 9.01492185,18.0146462 9.01492185,18.0146462 L8.15682954,19.9932308 L10.4061834,20.5539692 C10.8246449,20.6588308 11.2347372,20.7686154 11.6384295,20.872 L10.9231065,23.7441231 L12.6496295,24.1748923 L13.3580603,21.3332923 C13.8296911,21.4612923 14.2875372,21.5794462 14.7355372,21.6907077 L14.029568,24.5190154 L15.7580603,24.9497846 L16.4733834,22.0830769 C19.4208295,22.6408615 21.6371988,22.4158769 22.5701218,19.7500308 C23.3218757,17.6035692 22.5327065,16.3654154 20.9819372,15.5580308 C22.1112911,15.2976 22.9619988,14.5547077 23.1889526,13.0201846 L23.1889526,13.0201846 Z M19.2396603,18.5581538 C18.7055065,20.7046154 15.0914757,19.5442462 13.9197834,19.2532923 L14.8689526,15.4482462 C16.0406449,15.7406769 19.7979372,16.3196308 19.2396603,18.5581538 Z M19.7743065,12.9891692 C19.2869218,14.9416615 16.2789218,13.9496615 15.303168,13.7064615 L16.1637218,10.2553846 C17.1394757,10.4985846 20.2818757,10.9524923 19.7743065,12.9891692 Z"/><filter id="btc-d" width="123.2%" height="117.5%" x="-11.6%" y="-6.3%" filterUnits="objectBoundingBox"><feOffset dy=".5" in="SourceAlpha" result="shadowOffsetOuter1"/><feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation=".5"/><feColorMatrix in="shadowBlurOuter1" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.204257246 0"/></filter></defs><g fill="none" fillRule="evenodd"><use fill="#000" filter="url(#btc-a)" xlinkHref="#btc-b"/><use fill="#F7931A" xlinkHref="#btc-b"/><use fill="url(#btc-c)" style={{mixBlendMode: 'soft-light'}} xlinkHref="#btc-b"/><circle cx="16" cy="15" r="14.5" stroke="#000" strokeOpacity=".097"/><g fillRule="nonzero"><use fill="#000" filter="url(#btc-d)" xlinkHref="#btc-e"/><use fill="#FFF" fillRule="evenodd" xlinkHref="#btc-e"/></g></g></svg>
              </div>
            </div>
          </div>
          {/* Texto informativo derecho */}
          <div className="hidden md:flex flex-col items-start w-1/4 pl-8 select-none">
  <span className="text-lg font-semibold text-white leading-snug">
    <span className="text-yellow-400">¿Cómo ganas?</span><br/>
    Si tu predicción<br/>
    <span className="text-yellow-400">coincide</span> con el precio<br/>
    ¡<span className="text-yellow-400">ganas el premio!</span>
  </span>
  <div className="w-full flex flex-col items-center mt-2" style={{ marginLeft: '-105px' }}>
    <div className="bg-zinc-900/70 rounded-xl p-3 shadow-md border border-yellow-400 w-[240px] flex flex-col items-center">
      <ScratchCard
        width={220}
        height={100}
        image={'/rasca.png'}
        finishPercent={70}
        onComplete={() => alert('¡Premio desbloqueado!') }
      >
        <div style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 18,
          color: '#facc15',
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 12
        }}>
          ¡Premio desbloqueado!
        </div>
      </ScratchCard>
    </div>
  </div>
</div>
          {/* Rasca y gana debajo del texto de cómo ganas */}
          
        </div>

      </main>
      {/* Bloque del minijuego al fondo */}
      <div className="fixed bottom-[57px] left-0 w-full flex justify-center z-30 pointer-events-none">
        <div className="w-full max-w-2xl bg-black/80 rounded-xl shadow-xl p-4 flex flex-col gap-1 backdrop-blur-md border-2 border-purple-500 pointer-events-auto">
          {/* Selector de temporalidad */}
          <div className="flex flex-wrap justify-center gap-2">
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
          <div className="w-full flex flex-col items-center mb-2 mt-1 select-none">
          </div>
          <div className="flex flex-col items-center">
            <span className="text-yellow-400 text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-xl select-none">
              {btcPrice === "-" ? <span className="animate-pulse">Cargando...</span> : `$${btcPrice}`}
            </span>
            <span className="uppercase text-xs text-zinc-400 mt-1">Precio actual de Bitcoin</span>
          </div>
          {/* Rasca y gana debajo del texto de cómo ganas */}
          
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
          <div className="bg-black/70 rounded-xl p-4 mt-2 h-16 overflow-y-auto border-2 border-purple-500 relative">
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
