"use client"

import React, { useEffect, useState, useRef } from "react"
import { formatTime } from "@/utils/formatTime"
import { useGame } from "@/context/game-context"
import { useAuth } from "@/context/auth-context"
import { useAchievement } from "@/context/achievement-context"
import CandlestickChart from "@/components/game/candlestick-chart";
import MacdChart from "@/components/game/macd-chart";
import VolumeChartOverlay from "@/components/game/volume-chart-overlay";
import GameControls from "@/components/game/game-controls"
import GameTimer from "@/components/game/game-timer"
import BetHistory from "@/components/game/bet-history"
import UserStats from "@/components/game/user-stats"
// import AchievementNotification from "@/components/game/achievement-notification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useDevice } from "@/context/device-mode-context"
import { ArrowUpCircle, ArrowDownCircle, BarChart3, History, Trophy, Wallet } from "lucide-react"
import { FaChartArea } from "react-icons/fa";
import type { Candle, Bet } from "@/types/game";
import ModalMinimapChart from "@/components/game/modal-minimap-chart";
import BetResultModal from "@/components/game/bet-result-modal"
import BetAmountFlyup from "@/components/game/BetAmountFlyup"
import { ModalRuleta } from "@/components/ui/ModalRuleta";
import RouletteButton from "@/components/game/RouletteButton";

import SoundManager from "@/components/game/SoundManager";
import ProgressBar from "@/components/game/progress-bar";

export default function GameScreen() {
  // Estado para el reloj del sistema y el contador de cierre diario
  const [systemTime, setSystemTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [dailyCloseCountdown, setDailyCloseCountdown] = useState<string>(() => {
    const now = new Date();
    const nextClose = new Date(now);
    nextClose.setHours(2, 0, 0, 0); // 2:00 AM
    if (now.getHours() >= 2) {
      // Si ya pasó de las 2:00, calcula para el día siguiente
      nextClose.setDate(nextClose.getDate() + 1);
    }
    const diff = nextClose.getTime() - now.getTime();
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  });
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // Actualiza el countdown de cierre diario a las 2:00 AM
      const nextClose = new Date(now);
      nextClose.setHours(2, 0, 0, 0); // 2:00 AM
      if (now.getHours() >= 2) {
        nextClose.setDate(nextClose.getDate() + 1);
      }
      const diff = nextClose.getTime() - now.getTime();
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setDailyCloseCountdown(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Estado para mostrar/ocultar el volume profile
  const [showVolumeProfile, setShowVolumeProfile] = useState(false);
  const [openMinimap, setOpenMinimap] = useState(false);
  // Context hooks FIRST (fixes userBalance/addCoins before use)
  const {
    gamePhase,
    currentSymbol,
    timeframe,
    candles,
    currentCandle,
    userBalance,
    placeBet,
    changeSymbol,
    changeTimeframe,
    isConnected,
    nextPhaseTime,
    nextCandleTime,
    currentCandleBets,
    bonusInfo,
    setBonusInfo,
    bets,
    addCoins // might be missing in context, handle gracefully
  } = useGame();
  const { user } = useAuth();
  const { achievements, unlockedAchievements } = useAchievement();
  const { toast } = useToast();

  // Estado para ruleta
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const handleRouletteWin = (prize: number) => {
    toast({
      title: `¡Ganaste ${prize} monedas en la ruleta!`,
      variant: "default",
    });
    if (typeof addCoins === 'function') {
      addCoins(prize);
    }
  };
  const { isMobile } = useDevice();

  // Estado para escalar verticalmente la gráfica (solo PC)
  const [verticalScale, setVerticalScale] = useState(1.5);
  // --- NUEVO: Layout 100vh sin márgenes verticales ---
  // Aplica estilos globales solo a esta pantalla
  React.useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    // No tocar overflow (permitir scroll)
    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  // Estado de sincronización de vista para gráficos
  interface ViewState {
    offsetX: number;
    offsetY: number;
    scale: number;
    startX: number | null;
    startY: number | null;
    isDragging: boolean;
  }
  const [viewState, setViewState] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    startX: null,
    startY: null,
    isDragging: false,
  });

  // Sincronización de paneo/zoom para MACD y velas
  const allCandles = currentCandle ? [...candles, currentCandle] : candles;
  const chartWidth = 1200; // Debe coincidir con ambos charts
  const scale = viewState?.scale ?? 1;
  const offsetX = viewState?.offsetX ?? 0;
  const candleWidth = Math.min(Math.max((chartWidth / (allCandles.length / scale)) * 1, 2), 15);
  const candlesToShow = Math.floor(chartWidth / candleWidth);
  // Siempre mostrar la última vela visible al hacer zoom
  const startIndex = Math.max(0, allCandles.length - candlesToShow);
  const endIndex = allCandles.length;

  // Game Over modal state
  const [showGameOver, setShowGameOver] = useState(false);
  const [waitTime, setWaitTime] = useState(600); // 10 min in seconds
  const [waiting, setWaiting] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect userBalance 0
  useEffect(() => {
    if (userBalance === 0 && !showGameOver) {
      setShowGameOver(true);
    }
  }, [userBalance, showGameOver]);

  // Countdown logic for wait button
  useEffect(() => {
    if (waiting && waitTime > 0) {
      waitTimerRef.current = setInterval(() => {
        setWaitTime((t) => t - 1);
      }, 1000);
    } else if (waitTime === 0) {
      setWaiting(false);
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    }
    return () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    };
  }, [waiting, waitTime]);

  // Give coins after ad or wait
  function handleWait() {
    setWaiting(true);
    setWaitTime(600);
  }
  function handleWatchAd() {
    setShowAd(true);
  }
  function handleAdFinished() {
    setShowAd(false);
    setShowGameOver(false);
    if (typeof addCoins === 'function') {
      addCoins(50);
    }
  }
  function handleWaitFinished() {
    setShowGameOver(false);
    setWaiting(false);
    setWaitTime(600);
    if (typeof addCoins === 'function') {
      addCoins(50);
    }
  }
  // Estado para el monto de apuesta
  const [betAmount, setBetAmount] = useState(10); // Solo enteros, sin decimales

  // Sincroniza el monto de apuesta con el balance real
  useEffect(() => {
    if (betAmount > userBalance) {
      setBetAmount(userBalance > 0 ? Math.floor(userBalance) : 0);
    } else if (!Number.isInteger(betAmount)) {
      setBetAmount(Math.floor(betAmount));
    }
  }, [userBalance]);

  

  // Estado para apalancamiento
  // Default leverage is now 2000x
const [leverage, setLeverage] = useState(2000);

  // Calcular precio de liquidación en tiempo real
  const entryPrice = currentCandle?.close || 0;
  const liquidationPrice = leverage > 1 && entryPrice > 0
    ? ((prediction: "BULLISH" | "BEARISH") => {
        if (prediction === "BULLISH") {
          return entryPrice * (1 - 0.99 / leverage);
        } else {
          return entryPrice * (1 + 0.99 / leverage);
        }
      })
    : null; // función para calcular según tipo

  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [bonusDetail, setBonusDetail] = useState<string | null>(null);
  const [betResult, setBetResult] = useState<null | {
    won: boolean;
    amount: number;
    bet: import("@/types/game").Bet;
    candle: {
      open: number;
      close: number;
      high: number;
      low: number;
    };
    diff: number;
  }>(null);
  // Nuevo: recordar la última apuesta notificada
  const [lastNotifiedBetTimestamp, setLastNotifiedBetTimestamp] = useState<number | null>(null);
  const [showBetModal, setShowBetModal] = useState(false);


  const [showAchievement, setShowAchievement] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [bettingPhaseDuration, setBettingPhaseDuration] = useState<number>(10000)
  const [timeUntilNextCandle, setTimeUntilNextCandle] = useState<number>(0)
  const [waitingPhaseDuration, setWaitingPhaseDuration] = useState<number>(49000)

  // Estado de sonido
  const [muted, setMuted] = useState(false);
  // Trigger para sonido de derrota y victoria
  const [triggerLose, setTriggerLose] = useState(false);
  const [triggerWin, setTriggerWin] = useState(false);

  // Mostrar modal de resultado de apuesta al resolver (ganar o perder)
  // Solo actualizar el modal y sonidos cuando cambie el resultado, nunca en el render
  useEffect(() => {
    if (!bets || !candles.length) return;
    // Buscar la última apuesta resuelta
    const lastResolved = bets
      .filter((b) => b.status !== "PENDING" && b.resolvedAt)
      .sort((a, b) => ((b.resolvedAt ?? 0) - (a.resolvedAt ?? 0)))[0];
    if (
      lastResolved &&
      lastResolved.timestamp !== lastNotifiedBetTimestamp // Solo si es nueva
    ) {
      // Buscar la vela correspondiente
      const resolvedCandle = candles.find(c => Math.abs(c.timestamp - lastResolved.timestamp) < 2 * 60 * 1000) || candles[candles.length - 1];
      if (resolvedCandle) {
        const diff = resolvedCandle.close - resolvedCandle.open;
        const isLost = lastResolved.status === "LOST";
        const isWin = lastResolved.status === "WON";
        setBetResult({
          won: isWin,
          amount: isWin ? (lastResolved.amount * 0.9) : lastResolved.amount,
          bet: {
            id: String(lastResolved.id),
            prediction: lastResolved.prediction,
            amount: lastResolved.amount,
            timestamp: lastResolved.timestamp,
            symbol: lastResolved.symbol,
            timeframe: lastResolved.timeframe,
            status: lastResolved.status,
            resolvedAt: lastResolved.resolvedAt,
            leverage: lastResolved.leverage,
            entryPrice: lastResolved.entryPrice,
            liquidationPrice: lastResolved.liquidationPrice,
            wasLiquidated: lastResolved.wasLiquidated,
            winnings: lastResolved.winnings,
          },
          candle: {
            open: resolvedCandle.open,
            close: resolvedCandle.close,
            high: resolvedCandle.high,
            low: resolvedCandle.low,
          },
          diff,
        });
        setShowBetModal(true);
        setLastNotifiedBetTimestamp(lastResolved.timestamp); // Marcar como notificada
        setTimeout(() => setShowBetModal(false), 2800);
        setTimeout(() => setTriggerLose(isLost), 20);
        setTimeout(() => setTriggerWin(isWin), 20);
        setTimeout(() => setTriggerLose(false), 1000);
        setTimeout(() => setTriggerWin(false), 1000);
      }
    }
  }, [bets, candles, lastNotifiedBetTimestamp]);

  useEffect(() => {
    if (bonusInfo && (bonusInfo.bonus > 0 || bonusInfo.message)) {
      let msg = `Ganaste un bonus de +${Math.round((bonusInfo.bonus / (bonusInfo.size ? bonusInfo.size : 1)) * 100)}% por vela de $${bonusInfo.size.toFixed(2)}`;
      if (bonusInfo.message) msg += `\n${bonusInfo.message}`;
      setBonusMessage(msg);
      setBonusDetail(`Bonus: +${bonusInfo.bonus.toFixed(2)} monedas`);
      setTimeout(() => {
        setBonusMessage(null);
        setBonusDetail(null);
        setBonusInfo(null);
      }, 3000);
    }
  }, [bonusInfo, setBonusInfo]);

  useEffect(() => {
    if (unlockedAchievements.length > 0) {
      const latestAchievement = unlockedAchievements[unlockedAchievements.length - 1]
      setShowAchievement(latestAchievement)

      const timer = setTimeout(() => {
        setShowAchievement(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [unlockedAchievements])

  useEffect(() => {
    if (!isConnected) {
      toast({
        title: "Conexión perdida",
        description: "Intentando reconectar...",
        variant: "destructive",
      })
    }
  }, [isConnected, toast])

  // Calcular tiempo restante para apuestas y para la próxima vela
  // Timer for betting phase
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!nextPhaseTime) return 0
      const now = Date.now()
      return Math.max(0, nextPhaseTime - now)
    }
    setTimeLeft(calculateTimeLeft())
    // Guardar duración inicial SOLO al cambiar nextPhaseTime
    if (nextPhaseTime) setBettingPhaseDuration(nextPhaseTime - Date.now())
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 100)
    return () => clearInterval(interval)
  }, [nextPhaseTime, currentSymbol, timeframe])

  // Timer for next candle (always runs)
  useEffect(() => {
    const calculateTimeUntilNextCandle = () => {
      if (!nextCandleTime) return 0
      const now = Date.now()
      return Math.max(0, nextCandleTime - now)
    }
    setTimeUntilNextCandle(calculateTimeUntilNextCandle())
    // Guardar duración inicial SOLO al cambiar nextCandleTime
    if (nextCandleTime) setWaitingPhaseDuration(nextCandleTime - Date.now())
    const interval = setInterval(() => {
      setTimeUntilNextCandle(calculateTimeUntilNextCandle())
    }, 100)
    return () => clearInterval(interval)
  }, [nextCandleTime, currentSymbol, timeframe])

  const [showFlyup, setShowFlyup] = useState(false);
  const [lastFlyupAmount, setLastFlyupAmount] = useState(0);

  const betAudioRef = useRef<HTMLAudioElement | null>(null);
  // Ref para sonido de interacción (pulsar)
  const pulsarAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleBullishBet = () => {
    if (gamePhase !== "BETTING") {
      toast({
        title: "No puedes apostar ahora",
        description: "Espera a la fase de apuestas",
        variant: "destructive",
      });
      return;
    }
    if (betAmount < 1 || betAmount > userBalance) {
      toast({
        title: "Monto inválido",
        description: `Debes apostar entre 1 y tu saldo disponible`,
        variant: "destructive",
      });
      return;
    }
    // Sonido de apostar
    if (betAudioRef.current) {
      betAudioRef.current.currentTime = 0;
      betAudioRef.current.play();
    }
    placeBet("BULLISH", betAmount, leverage);
    setLastFlyupAmount(betAmount);
    setShowFlyup(true);
  }

  const handleBearishBet = () => {
    if (gamePhase !== "BETTING") {
      toast({
        title: "No puedes apostar ahora",
        description: "Espera a la fase de apuestas",
        variant: "destructive",
      });
      return;
    }
    if (betAmount < 1 || betAmount > userBalance) {
      toast({
        title: "Monto inválido",
        description: `Debes apostar entre 1 y tu saldo disponible`,
        variant: "destructive",
      });
      return;
    }
    // Sonido de apostar
    if (betAudioRef.current) {
      betAudioRef.current.currentTime = 0;
      betAudioRef.current.play();
    }
    placeBet("BEARISH", betAmount, leverage);
    setLastFlyupAmount(betAmount);
    setShowFlyup(true);
  }

  // Determinar si estamos en los primeros 10 segundos de una vela
  const canBet = gamePhase === "BETTING" && currentCandleBets < 1
  const secondsLeft = Math.ceil(timeLeft / 1000)
  const secondsUntilNextCandle = Math.ceil(timeUntilNextCandle / 1000)

  // Mostrar información sobre el límite de apuestas
  const getBetButtonText = (type: string) => {
    if (currentCandleBets >= 1) {
      return `${type} (Límite alcanzado)`
    }
    return type
  }

  // Preload pulsar.mp3
  useEffect(() => {
    pulsarAudioRef.current = new Audio('/pulsar.mp3');
    pulsarAudioRef.current.preload = 'auto';
  }, []);

  // Función para reproducir el sonido de interacción
  const playPulsar = () => {
    if (pulsarAudioRef.current) {
      pulsarAudioRef.current.currentTime = 0;
      pulsarAudioRef.current.volume = 0.5;
      pulsarAudioRef.current.play();
    }
  };

  return (
    <>
      <audio ref={betAudioRef} src="/bet.mp3" preload="auto" />
      {/* Ref oculta para pulsar, por si hace falta en móviles */}
      <audio ref={pulsarAudioRef} src="/pulsar.mp3" preload="auto" style={{display:'none'}} />
      <BetAmountFlyup amount={lastFlyupAmount} trigger={showFlyup} onComplete={() => setShowFlyup(false)} />
      {/* Game Over Modal */}
      {showGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-zinc-900 rounded-2xl p-8 flex flex-col items-center border-4 border-yellow-400 shadow-2xl">
            <h2 className="text-3xl font-bold text-red-500 mb-4">Game Over</h2>
            <p className="text-white mb-6">Te has quedado sin monedas.</p>
            <div className="flex gap-4">
              <button
                className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-full shadow-lg disabled:opacity-50"
                onClick={handleWait}
                disabled={waiting}
              >
                {waiting ? `Espera ${Math.floor(waitTime / 60)}:${String(waitTime % 60).padStart(2, '0')}` : 'Esperar 10 minutos'}
              </button>
              <button
                className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-full shadow-lg"
                onClick={handleWatchAd}
              >
                Ver anuncio
              </button>
            </div>
            {/* Enable continue after wait is over */}
            {waitTime === 0 && (
              <button
                className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-full shadow-lg"
                onClick={handleWaitFinished}
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      )}
      {/* Simulated Ad Modal */}
      {showAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-zinc-900 rounded-2xl p-8 flex flex-col items-center border-4 border-yellow-400 shadow-2xl">
            <div className="w-80 h-44 flex items-center justify-center bg-black rounded-lg mb-4">
              <span className="text-yellow-300 text-xl">Simulando anuncio...</span>
            </div>
            <button
              className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-full shadow-lg"
              onClick={handleAdFinished}
            >
              Terminar anuncio y recibir monedas
            </button>
          </div>
        </div>
      )}
      <BetResultModal
  open={showBetModal}
  onOpenChange={setShowBetModal}
  result={(() => {
    if (showBetModal && betResult && betResult.bet && typeof betResult.bet.id === 'string' && 'status' in betResult.bet && 'prediction' in betResult.bet && 'amount' in betResult.bet && 'timestamp' in betResult.bet && 'symbol' in betResult.bet && 'timeframe' in betResult.bet) {
      return { bet: betResult.bet, candle: betResult.candle };
    } else if (showBetModal && bets.length > 0) {
      const last = bets[bets.length - 1];
      return {
        bet: {
          id: String(last.id),
          prediction: last.prediction,
          amount: last.amount,
          timestamp: last.timestamp,
          symbol: last.symbol,
          timeframe: last.timeframe,
          status: last.status,
          resolvedAt: last.resolvedAt,
          leverage: last.leverage,
          entryPrice: last.entryPrice,
          liquidationPrice: last.liquidationPrice,
          wasLiquidated: last.wasLiquidated,
          winnings: last.winnings,
        },
        candle: betResult?.candle || {
          open: last.entryPrice || 0,
          close: last.entryPrice || 0,
          high: last.entryPrice || 0,
          low: last.entryPrice || 0,
        }
      };
    }
    return null;
  })()}
/>
      <ModalRuleta open={rouletteOpen} onClose={() => setRouletteOpen(false)} onWin={handleRouletteWin} />
      <div
        className="w-full max-w-full mx-0 px-2 sm:px-4 bg-black min-h-screen flex flex-col"
        style={
          Object.assign(
            {},
            isMobile
              ? {
                  width: '100vw',
                  height: '100dvh', // Usa 100dvh para evitar problemas con barras del navegador móvil
                  minHeight: 0,
                  margin: 0,
                  overflow: 'auto',
                }
              : {},
            {
              transform: 'scaleX(1.0) scaleY(0.87)',
              transformOrigin: 'top center',
            }
          )
        }
      >
      {bonusMessage && (
        <div className="w-full flex justify-center mt-4">
          <div className="bg-yellow-400 border-2 border-yellow-600 text-black font-bold rounded-xl px-4 py-3 text-center shadow-lg animate-pulse max-w-xl">
            {bonusMessage.split('\n').map((line, i) => <div key={i}>{line}</div>)}
            {bonusDetail && <div className="text-xs mt-1">{bonusDetail}</div>}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-6">
        {/* SoundManager flotante */}
        <div className="fixed bottom-1 right-4 z-50">
        </div>
           <header className="flex flex-col lg:flex-row justify-between items-center border-[#FFD600] rounded-xl p-1 pt-1 pb-1 mb-0 shadow-lg min-h-[32px] w-full" style={{ background: 'none' }}>
  <div className="flex items-center w-full justify-between relative">
  {/* Título a la izquierda */}
  <div className="flex items-center">
    <h1 className="text-base md:text-lg font-extrabold text-[#FFD600] tracking-tight ml-8" data-component-name="GameScreen" style={{ transform: 'scale(1.7)', lineHeight: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textShadow: '0 0 12px #FFD60088' }}>Candle Rush 2.0</h1>
  </div>
  {/* Nav centrado absolutamente */}
  {/* Relojes centrados y botón ruleta a la derecha de los relojes */}
  <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/3 flex flex-row items-center gap-8 z-10">
    <div className="flex flex-col items-center" style={{ minWidth: '110px' }}>
      <span className="text-xs font-semibold text-[#FFD600] mb-0.5" style={{letterSpacing: '0.01em'}}>Hora local</span>
      <span className="text-3xl sm:text-4xl font-extrabold text-[#FFD600] select-none leading-tight" style={{ minWidth: '90px', display: 'inline-block', letterSpacing: '0.02em', textShadow: '0 0 12px #FFD60088', textAlign: 'center', fontSize: '2rem' }}>{systemTime}</span>
    </div>
    <div className="flex flex-col items-center" style={{ minWidth: '110px' }}>
      <span className="text-xs font-semibold text-[#a259ff] mb-0.5" style={{letterSpacing: '0.01em'}}>Cierre diario</span>
      <span className="text-3xl sm:text-4xl font-extrabold text-[#a259ff] select-none leading-tight" style={{ minWidth: '90px', display: 'inline-block', letterSpacing: '0.02em', textShadow: '0 0 12px #FFD60088', textAlign: 'center', fontSize: '2rem' }}>{dailyCloseCountdown}</span>
    </div>
    {/* Botón ruleta */}
    <div className="ml-4 flex items-center">
      <RouletteButton onClick={() => setRouletteOpen(true)} />
    </div>
  </div>
  {/* Nav a la derecha */}
  <div className="flex items-center gap-2 ml-auto">
    <button
      className="text-white font-bold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-4 py-2 md:px-2 md:py-1"
      onClick={() => window.location.href = '/menu'}
    >
      Menú
    </button>
    <button
      className="text-white font-semibold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-2 py-1"
      onClick={() => window.location.href = '/how-to-play'}
    >
      Cómo jugar
    </button>
    <button
      className="text-white font-semibold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-2 py-1"
      onClick={() => window.location.href = '/profile'}
    >
      Perfil
    </button>
  </div>
</div>
  <div className="flex items-center gap-2">
    {user ? (
      <>
        <button
          onClick={() => window.location.href = '/profile'}
          className="text-sm font-bold text-[#FFD600] hover:underline hover:text-yellow-300 transition px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
          style={{ background: 'rgba(255, 214, 0, 0.08)' }}
          title="Ver perfil"
          data-component-name="GameScreen"
        >
          {user.username}
        </button>
        <span className="font-bold text-[#FFD600]">${userBalance.toFixed(2)}</span>
      </>
    ) : (
      <>
        <span className="text-sm font-bold text-[#FFD600]">Invitado</span>
        <span className="font-bold text-[#FFD600]">$0.00</span>
      </>
    )}
    <a
                href="https://btcer.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm font-bold text-[#FFD600] hover:underline hover:text-[#ffb700] transition ml-4"
                style={{ whiteSpace: 'nowrap' }}
              >
                Candle Rush 1.0&nbsp;&rarr;&nbsp;btcer.fun
              </a>
              
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 sm:gap-3 flex-grow h-full min-h-[0] lg:h-[calc(100vh-120px)]">
            <div className="lg:col-span-4 flex flex-col gap-4 h-full lg:h-full">
              {/* Tarjeta principal con gráfico y controles */}
              <Card className="bg-black border-[#FFD600]">
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex flex-col w-full">
                      <div className="flex flex-row items-start justify-between w-full gap-6">
                        {/* Precio BTC grande a la izquierda */}
                        <div className="flex items-center gap-4">
                          <BarChart3 className="h-5 w-5" />
                          <span className="text-3xl font-bold text-[#FFD600] tracking-tight flex items-center gap-2">
                            {currentSymbol}
                          </span>
                          <span
  className="text-2xl sm:text-[4rem] font-extrabold text-white drop-shadow-lg ml-2"
  style={{ minWidth: '230px', textAlign: 'right', display: 'inline-block' }}
>
  {currentCandle ? `$${currentCandle.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
</span>
                          <span className="text-xl text-[#FFD600] ml-2">({timeframe})</span>
{/* Reloj grande en amarillo */}

                        </div>
                        {/* Estado de apuestas a la derecha */}
                        <div className="flex flex-col items-end justify-center text-right min-w-[220px]">
                          {/* Solo en desktop: mantener arriba */}
<span className={`hidden sm:inline text-4xl font-extrabold uppercase tracking-wide drop-shadow-lg mb-1 ${gamePhase === 'BETTING' ? 'text-green-400' : 'text-red-400'}`}>{gamePhase === 'BETTING' ? 'Apuestas Abiertas' : 'Apuestas Cerradas'}</span>
<button
  className="hidden sm:inline mt-0 mb-1 self-end rounded-full p-1 bg-yellow-400 hover:bg-yellow-300 shadow-lg border-2 border-yellow-300 transition text-black"
  style={{ fontSize: 0, outline: showVolumeProfile ? '2.5px solid #FFD600' : 'none' }}
  onClick={() => setShowVolumeProfile(v => !v)}
  title="Mostrar/ocultar perfil de volumen"
  type="button"
  aria-label="Mostrar/ocultar perfil de volumen"
>
  <BarChart3 className="w-5 h-5" />
</button>
                        </div>
                      </div>

                      {/* Barra de progreso de tiempo encima del contador */}
                      <div className="w-full flex justify-center">
                        <ProgressBar
                          gamePhase={gamePhase}
                          timeLeft={gamePhase === 'BETTING' ? timeLeft : timeUntilNextCandle}
                          phaseDuration={gamePhase === 'BETTING' ? bettingPhaseDuration : waitingPhaseDuration}
                        />
                      </div>
                      {/* Contador grande centrado debajo */}
                      <div className="w-full flex justify-center">
                        <span className="text-[4rem] leading-none font-black text-white drop-shadow-xl my-2">
  {gamePhase === 'BETTING' ? formatTime(timeLeft) : formatTime(timeUntilNextCandle)}
</span>

                      </div>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px] md:h-[600px] w-full relative overflow-hidden">
                    {/* Fondo portada detrás del chart con opacidad y blur */}
                    <img src="/portada.png" alt="Portada Chart" className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-15 blur-[4px] z-0" style={{zIndex:0}} />
                    <CardContent className="relative p-0 bg-black rounded-b-2xl overflow-hidden">
                      <div className="relative w-full h-[420px]">
                        <CandlestickChart
                          candles={candles}
                          currentCandle={currentCandle}
                          viewState={viewState}
                          setViewState={setViewState}
                          verticalScale={verticalScale}
                          showVolumeProfile={showVolumeProfile}
                          setShowVolumeProfile={setShowVolumeProfile}
                        />
                      </div>
                      <div className="relative w-full h-[180px] mt-2">
                        <MacdChart
                          candles={allCandles}
                          viewState={{
                            offsetX,
                            scale,
                          }}
                          startIndex={startIndex}
                          candlesToShow={candlesToShow}
                          height={isMobile ? 80 : 180}
                        />
                      </div>
                    </CardContent>
                  </div>

                  {/* Controles justo debajo del gráfico */}
                  <div className="mt-2 bg-black/50 rounded-lg p-2 border-[#FFD600]">
                    <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
                      {/* Bloque de información de fase eliminado (ahora está arriba) */}

                      {/* Selector de monto y botones de apuesta */}
                      <div className="flex flex-col items-center gap-4 w-full">
                        {/* Joystick-style console: all controls grouped */}
<div className="w-full flex flex-col sm:flex-row items-center justify-between bg-black border-4 border-[#FFD600] rounded-3xl shadow-2xl p-6 gap-6">
  {/* SOLO EN MOVIL: Estado de apuestas y botón volumen */}
  <div className="w-full flex sm:hidden flex-row justify-between items-center mb-2">
    <span className={`text-xs font-extrabold uppercase tracking-wide drop-shadow-lg ${gamePhase === 'BETTING' ? 'text-green-400' : 'text-red-400'}`}>{gamePhase === 'BETTING' ? 'Apuestas Abiertas' : 'Apuestas Cerradas'}</span>
    <button
      className="rounded-full p-0.5 bg-yellow-400 hover:bg-yellow-300 shadow border-2 border-yellow-300 transition text-black ml-2"
      style={{ fontSize: 0, outline: showVolumeProfile ? '2px solid #FFD600' : 'none' }}
      onClick={() => setShowVolumeProfile(v => !v)}
      title="Mostrar/ocultar perfil de volumen"
      type="button"
      aria-label="Mostrar/ocultar perfil de volumen"
    >
      <BarChart3 className="w-4 h-4" />
    </button>
  </div>
                          {/* Symbol and Interval selectors */}
                          <div className="flex flex-row gap-4 w-full justify-center">
                            <GameControls
                              onSymbolChange={changeSymbol}
                              onTimeframeChange={changeTimeframe}
                              currentSymbol={currentSymbol}
                              currentTimeframe={timeframe}
                              gamePhase={gamePhase}
                              isConnected={isConnected}
                            />
                          </div>
                          {/* Bet amount controls */}
                          <div className="flex flex-col items-center w-full gap-2">
                            <div className="flex justify-between w-full text-[#FFD600] text-xs font-bold">
                              <span>Mín: 1</span>
                              <span>Apostar: <span className="text-white text-lg">{betAmount}</span></span>
                              <span>Máx: {Math.floor(userBalance)}</span>
                            </div>
                            <div className="flex gap-2 w-full justify-center">
                              {/* Selector de apalancamiento */}
                              <div className="flex flex-col items-center mx-2">
                                <label htmlFor="leverage" className="text-[#FFD600] text-xs font-bold mb-1">Apalancamiento</label>
                                <select
  id="leverage"
  className="rounded bg-black border-2 border-[#FFD600] text-[#FFD600] font-bold text-sm sm:text-lg px-1 py-1 sm:px-2 sm:py-1 focus:ring-[#FFD600] focus:border-[#FFD600] outline-none min-w-[40px] sm:min-w-[70px]"
  value={leverage || 100}
  onChange={e => { playPulsar(); setLeverage(Number(e.target.value)); }}
>

                                  {[300, 500, 1000, 2000, 3000, 5000].map(x => (
                                    <option key={x} value={x}>{x}x</option>
                                  ))}
                                </select>
                              </div>

                              <button
                                className="bg-[#FFD600] text-black font-bold px-3 py-1 rounded-full shadow hover:bg-yellow-400 transition"
                                onClick={() => { playPulsar(); setBetAmount((prev) => Math.max(1, Math.floor(prev - 1))); }}
                                disabled={betAmount <= 1}
                              >
                                -1
                              </button>
                              <input
  type="number"
  min={1}
  max={Math.floor(userBalance)}
  step={1}
  value={betAmount}
  onChange={(e) => {
    const intVal = Math.floor(Number(e.target.value));
    setBetAmount(Math.max(1, Math.min(intVal, Math.floor(userBalance))));
  }}
  className="w-16 sm:w-20 text-center rounded bg-black border-2 border-[#FFD600] text-[#FFD600] font-bold text-base sm:text-lg focus:ring-[#FFD600] focus:border-[#FFD600] outline-none py-1 sm:py-1"
/>
                              <button
                                className="bg-[#FFD600] text-black font-bold px-3 py-1 rounded-full shadow hover:bg-yellow-400 transition"
                                onClick={() => { playPulsar(); setBetAmount((prev) => Math.min(Math.floor(userBalance), Math.floor(prev + 1))); }}
                                disabled={betAmount >= Math.floor(userBalance)}
                              >
                                +1
                              </button>
                              <button
  className="bg-[#FFD600] text-black font-bold px-2 py-1 rounded-full shadow hover:bg-yellow-400 transition ml-2 text-sm sm:text-lg sm:px-4 sm:py-1 min-w-[40px] sm:min-w-[80px]"
  onClick={() => { playPulsar(); setBetAmount(Math.floor(userBalance)); }}
  onClick={() => setBetAmount(Math.floor(userBalance))}
  disabled={userBalance < 1}
>
  All In
</button>
                            </div>
                            {/* Precio de liquidación estimado */}
                            {leverage && currentCandle && (
                              <div className="mt-1 text-xs text-yellow-400 text-center w-full">
  <span
    style={{
      fontSize: '1.08rem',
      fontWeight: 800,
      letterSpacing: '0.01em',
      textShadow: '0 0 6px #FFD60066, 0 0 1px #000',
      verticalAlign: 'middle',
      display: 'inline-block',
      marginRight: '0.2em',
    }}
  >
    Precio de liquidación:
  </span>
  <span className="font-mono ml-1">
    {['BULLISH','BEARISH'].map(type => (
  <span
    key={type}
    style={{
      fontSize: '1rem',
      fontWeight: 900,
      letterSpacing: '0.01em',
      lineHeight: 1.05,
      textShadow: '0 0 6px #FFD60088, 0 0 1px #000',
      verticalAlign: 'middle',
      display: 'inline-block',
      color: type === 'BULLISH' ? '#22c55e' : '#ef4444', // green for Long, red for Short
      marginRight: type === 'BULLISH' ? '1.2em' : 0 // spacing between
    }}
  >
    {type === 'BULLISH' ? 'Long' : 'Short'}: $
    {type === 'BULLISH'
      ? (currentCandle.close * (1 - 0.99/leverage)).toFixed(2)
      : (currentCandle.close * (1 + 0.99/leverage)).toFixed(2)
    }
    {type === 'BULLISH' ? ' ' : ''}
  </span>
))}
  </span>
</div>
                            )}

                            <input
                              type="range"
                              min={1}
                              max={userBalance}
                              step={0.01}
                              value={betAmount}
                              onChange={e => setBetAmount(Number(e.target.value))}
                              className="w-full h-2 bg-[#FFD600]/30 rounded-lg appearance-none cursor-pointer accent-[#FFD600] mt-2"
                              disabled={userBalance < 1 || gamePhase !== 'BETTING' || secondsLeft <= 0 || currentCandleBets >= 1}
                            />
                          </div>
                          {/* Betting buttons */}
                          <div className="flex gap-4 justify-center w-full mt-2">
                            <button
  className="px-4 py-2 sm:px-8 sm:py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold border-4 border-[#FFD600] text-lg sm:text-2xl shadow-lg shadow-yellow-400/80 transition-all disabled:bg-green-600 disabled:opacity-60 min-w-[100px] sm:min-w-[160px] flex items-center justify-center gap-2"
  onClick={() => handleBullishBet()}
  disabled={gamePhase !== 'BETTING' || secondsLeft <= 0 || currentCandleBets >= 1 || userBalance < 1 || betAmount < 1}
>
                              <img src="/bull.png" alt="Bullish" style={{ width: 32, height: 32, objectFit: 'contain', marginRight: 6 }} />
                              <span className="font-black tracking-widest text-white">BULL</span>
                            </button>
                            <button
  className="px-4 py-2 sm:px-8 sm:py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold border-4 border-[#FFD600] text-lg sm:text-2xl shadow-lg shadow-yellow-400/80 transition-all disabled:bg-red-600 disabled:opacity-60 min-w-[100px] sm:min-w-[160px] flex items-center justify-center gap-2"
  onClick={() => handleBearishBet()}
  disabled={gamePhase !== 'BETTING' || secondsLeft <= 0 || currentCandleBets >= 1 || userBalance < 1 || betAmount < 1}
>
                              <img src="/bear.png" alt="Bearish" style={{ width: 32, height: 32, objectFit: 'contain', marginRight: 6 }} />
                              <span className="font-black tracking-widest text-white">BEAR</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>




            </div>

            <div className="flex flex-col h-full min-h-0 flex-1 lg:h-full m-0 p-0 gap-0">
              <Card className="bg-black border-[#FFD600]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-between w-full">
  <span className="flex items-center gap-2">
    <Wallet className="h-5 w-5" />
    Estadísticas
  </span>
  <div className="ml-auto">
    <SoundManager muted={muted} onToggleMute={() => setMuted(m => !m)} triggerLose={triggerLose} triggerWin={triggerWin} />
  </div>
</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserStats />
                </CardContent>
              </Card>

              <Card className="bg-black border-[#FFD600] w-full h-full flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-0">
  <div className="flex items-center justify-center w-full relative">
  <button
    aria-label="Ver gráfico"
    title="Ver gráfico"
    className="p-0.5 rounded hover:bg-green-600 bg-green-500/90 text-white flex items-center justify-center transition h-[44px] w-[44px] mr-2 absolute left-0"
    style={{ minWidth: 0, minHeight: 0 }}
    onClick={() => setOpenMinimap(true)}
  >
    <FaChartArea className="h-[22px] w-[22px]" />
  </button>
  <ModalMinimapChart
    open={openMinimap}
    onOpenChange={setOpenMinimap}
    candles={candles}
    bets={bets}
    timeframe={timeframe}
  />
  <CardTitle className="whitespace-nowrap text-center" style={{ position: 'relative', top: '-10px' }}>Actividad</CardTitle>
  <button
    aria-label="Eliminar historial de apuestas"
    title="Eliminar historial de apuestas"
    className="p-0.5 rounded hover:bg-red-800 bg-red-700/80 text-white flex items-center justify-center transition h-[44px] w-[44px] ml-2 absolute right-0"
    style={{ minWidth: 0, minHeight: 0 }}
    onClick={() => { if(window.confirm('¿Seguro que deseas eliminar todo el historial de apuestas?')) window.dispatchEvent(new CustomEvent('clearBets')); }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m5 0H6" /></svg>
  </button>
</div>
</CardHeader>
<CardContent className="flex-1 min-h-0 h-full p-0">
  <BetHistory />
</CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* AchievementNotification eliminado para evitar doble modal de logro al ganar. */}

      </div>
    </>
  )
}

// (SoundManager flotante eliminado de la parte inferior)

