"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/context/game-context"
import { useAuth } from "@/context/auth-context"
import { useAchievement } from "@/context/achievement-context"
import CandlestickChart from "@/components/game/candlestick-chart"
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
import BetResultModal from "@/components/game/bet-result-modal"

import SoundManager from "@/components/game/SoundManager";

export default function GameScreen() {
  // Estado para el monto de apuesta
  const [betAmount, setBetAmount] = useState(10);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [bonusDetail, setBonusDetail] = useState<string | null>(null);
  const [betResult, setBetResult] = useState<null | {
    won: boolean;
    amount: number;
    bet: {
      prediction: "BULLISH" | "BEARISH";
      amount: number;
      timestamp: number;
      symbol: string;
      timeframe: string;
    };
    candle: {
      open: number;
      close: number;
      high: number;
      low: number;
    };
    diff: number;
  }>(null);
  const [showBetModal, setShowBetModal] = useState(false);

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
    bets
  } = useGame()
  const { user } = useAuth()
  const { achievements, unlockedAchievements } = useAchievement()
  const { toast } = useToast()
  const { isMobile } = useDevice()
  const [showAchievement, setShowAchievement] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [timeUntilNextCandle, setTimeUntilNextCandle] = useState<number>(0)

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
      (!betResult || betResult.bet.timestamp !== lastResolved.timestamp || betResult.bet.prediction !== lastResolved.prediction)
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
            prediction: lastResolved.prediction,
            amount: lastResolved.amount,
            timestamp: lastResolved.timestamp,
            symbol: lastResolved.symbol,
            timeframe: lastResolved.timeframe,
          },
          candle: {
            open: resolvedCandle.open,
            close: resolvedCandle.close,
            high: resolvedCandle.high,
            low: resolvedCandle.low,
          },
          diff,
        });
        setTimeout(() => setShowBetModal(true), 10); // abrir modal tras render
        setTimeout(() => setTriggerLose(isLost), 20);
        setTimeout(() => setTriggerWin(isWin), 20);
        setTimeout(() => setShowBetModal(false), 2800);
        setTimeout(() => setTriggerLose(false), 1000);
        setTimeout(() => setTriggerWin(false), 1000);
      }
    }
  }, [bets, candles, betResult]);

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
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 100)
    return () => clearInterval(interval)
  }, [nextPhaseTime])

  // Timer for next candle (always runs)
  useEffect(() => {
    const calculateTimeUntilNextCandle = () => {
      if (!nextCandleTime) return 0
      const now = Date.now()
      return Math.max(0, nextCandleTime - now)
    }
    setTimeUntilNextCandle(calculateTimeUntilNextCandle())
    const interval = setInterval(() => {
      setTimeUntilNextCandle(calculateTimeUntilNextCandle())
    }, 100)
    return () => clearInterval(interval)
  }, [nextCandleTime])

  const handleBullishBet = () => {
    if (gamePhase !== "BETTING") {
      toast({
        title: "No puedes apostar ahora",
        description: "Espera a la fase de apuestas",
        variant: "destructive",
      });
      return;
    }
    if (betAmount < 10 || betAmount > userBalance) {
      toast({
        title: "Monto inválido",
        description: `Debes apostar entre 10 y tu saldo disponible`,
        variant: "destructive",
      });
      return;
    }
    placeBet("BULLISH", betAmount);
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
    if (betAmount < 10 || betAmount > userBalance) {
      toast({
        title: "Monto inválido",
        description: `Debes apostar entre 10 y tu saldo disponible`,
        variant: "destructive",
      });
      return;
    }
    placeBet("BEARISH", betAmount);
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

  return (
    <>
      <BetResultModal open={showBetModal} onOpenChange={setShowBetModal} result={showBetModal ? betResult : null} />
      <div className="w-full max-w-none mx-0 px-4 bg-black min-h-screen flex flex-col">
      {bonusMessage && (
        <div className="w-full flex justify-center mt-4">
          <div className="bg-yellow-400 border-2 border-yellow-600 text-black font-bold rounded-xl px-4 py-3 text-center shadow-lg animate-pulse max-w-xl">
            {bonusMessage.split('\n').map((line, i) => <div key={i}>{line}</div>)}
            {bonusDetail && <div className="text-xs mt-1">{bonusDetail}</div>}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-6">
          <header className="flex flex-col lg:flex-row justify-between items-center border-[#FFD600] rounded-xl px-4 py-2 mb-2 shadow-lg min-h-[50px] w-full">
            <div className="flex items-center gap-6 w-full lg:w-auto">
              <h1 className="text-3xl font-bold text-[#FFD600] tracking-tight" data-component-name="GameScreen">Candle Rush 2.0</h1>
              <nav className="flex gap-4 ml-4">
                <button
                  className="text-white font-semibold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-2 py-1"
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
                  onClick={() => window.location.href = '/levels'}
                >
                  Niveles
                </button>
                <button
                  className="text-white font-semibold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-2 py-1"
                  onClick={() => window.location.href = '/profile'}
                >
                  Perfil
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#FFD600]">{user ? user.username : "Invitado"}</span>
              <span className="font-bold text-[#FFD600]">${userBalance.toFixed(2)}</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 flex-grow h-full min-h-[700px]">
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
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
                          <span className="text-[4rem] font-extrabold text-white drop-shadow-lg ml-2">
                            {currentCandle ? `$${currentCandle.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
                          </span>
                          <span className="text-xl text-[#FFD600] ml-2">({timeframe})</span>
                        </div>
                        {/* Estado de apuestas a la derecha */}
                        <div className="flex flex-col items-end justify-center text-right min-w-[220px]">
                          <span className={`text-4xl font-extrabold uppercase tracking-wide drop-shadow-lg mb-1 ${gamePhase === 'BETTING' ? 'text-green-400' : 'text-red-400'}`}>{gamePhase === 'BETTING' ? 'Apuestas Abiertas' : 'Apuestas Cerradas'}</span>
                        </div>
                      </div>
                      {/* Contador grande centrado debajo */}
                      <div className="w-full flex justify-center">
                        <span className="text-[4rem] leading-none font-black text-white drop-shadow-xl my-2">
                          {gamePhase === 'BETTING' ? secondsLeft : secondsUntilNextCandle}s
                        </span>
                      </div>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px] w-full relative overflow-hidden">
                    {/* Fondo portada detrás del chart con opacidad y blur */}
                    <img src="/portada.png" alt="Portada Chart" className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-15 blur-[4px] z-0" style={{zIndex:0}} />
                    <div className="relative z-10">
                      <CandlestickChart candles={candles} currentCandle={currentCandle} />
                    </div>
                    <div className="absolute top-2 right-2 z-20">
                      <SoundManager muted={muted} onToggleMute={() => setMuted(m => !m)} triggerLose={triggerLose} triggerWin={triggerWin} />
                    </div>
                  </div>

                  {/* Controles justo debajo del gráfico */}
                  <div className="mt-2 bg-black/50 rounded-lg p-2 border-[#FFD600]">
                    <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
                      {/* Bloque de información de fase eliminado (ahora está arriba) */}

                      {/* Selector de monto y botones de apuesta */}
                      <div className="flex flex-col items-center gap-4 w-full">
                        {/* Joystick-style console: all controls grouped */}
                        <div className="w-full flex flex-col sm:flex-row items-center justify-between bg-zinc-900 border-4 border-[#FFD600] rounded-3xl shadow-2xl p-6 gap-6">
                          {/* Symbol and Interval selectors */}
                          <div className="flex flex-row gap-4 w-full justify-center">
                            <GameControls
                              onSymbolChange={changeSymbol}
                              onTimeframeChange={changeTimeframe}
                              currentSymbol={currentSymbol}
                              currentTimeframe={timeframe}
                            />
                          </div>
                          {/* Bet amount controls */}
                          <div className="flex flex-col items-center w-full gap-2">
                            <div className="flex justify-between w-full text-[#FFD600] text-xs font-bold">
                              <span>Mín: 10</span>
                              <span>Apostar: <span className="text-white text-lg">{betAmount}</span></span>
                              <span>Máx: {Math.floor(userBalance)}</span>
                            </div>
                            <div className="flex gap-2 w-full justify-center">
                              <button
                                className="bg-[#FFD600] text-black font-bold px-3 py-1 rounded-full shadow hover:bg-yellow-400 transition"
                                onClick={() => setBetAmount((prev) => Math.max(10, prev - 10))}
                                disabled={betAmount <= 10}
                              >
                                -10
                              </button>
                              <input
                                type="number"
                                min={10}
                                max={userBalance}
                                value={betAmount}
                                onChange={e => setBetAmount(Math.max(10, Math.min(Number(e.target.value), Math.floor(userBalance))))}
                                className="w-20 text-center rounded bg-black border-2 border-[#FFD600] text-[#FFD600] font-bold text-lg focus:ring-[#FFD600] focus:border-[#FFD600] outline-none"
                              />
                              <button
                                className="bg-[#FFD600] text-black font-bold px-3 py-1 rounded-full shadow hover:bg-yellow-400 transition"
                                onClick={() => setBetAmount((prev) => Math.min(Math.floor(userBalance), prev + 10))}
                                disabled={betAmount >= userBalance}
                              >
                                +10
                              </button>
                              <button
                                className="bg-[#FFD600] text-black font-bold px-4 py-1 rounded-full shadow hover:bg-yellow-400 transition ml-2"
                                onClick={() => setBetAmount(Math.floor(userBalance))}
                                disabled={userBalance < 10}
                              >
                                All In
                              </button>
                            </div>
                            {/* Slider for bet amount */}
                            <input
                              type="range"
                              min={10}
                              max={Math.floor(userBalance)}
                              step={1}
                              value={betAmount}
                              onChange={e => setBetAmount(Number(e.target.value))}
                              className="w-full h-2 bg-[#FFD600]/30 rounded-lg appearance-none cursor-pointer accent-[#FFD600] mt-2"
                              disabled={userBalance < 10 || gamePhase !== 'BETTING' || secondsLeft <= 0 || currentCandleBets >= 1}
                            />
                          </div>
                          {/* Betting buttons */}
                          <div className="flex gap-4 justify-center w-full mt-2">
                            <button
                              className="px-4 py-2 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold border-4 border-[#FFD600] text-lg shadow transition-all disabled:bg-green-600 disabled:opacity-60 min-w-[120px]"
                              onClick={() => handleBullishBet()}
                              disabled={gamePhase !== 'BETTING' || secondsLeft <= 0 || currentCandleBets >= 1 || userBalance < 10 || betAmount < 10}
                            >
                              Apostar alcista
                            </button>
                            <button
                              className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold border-4 border-[#FFD600] text-lg shadow transition-all disabled:bg-red-600 disabled:opacity-60 min-w-[120px]"
                              onClick={() => handleBearishBet()}
                              disabled={gamePhase !== 'BETTING' || secondsLeft <= 0 || currentCandleBets >= 1 || userBalance < 10 || betAmount < 10}
                            >
                              Apostar bajista
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historial de apuestas en pantalla grande */}
              <Card className="bg-black border-[#FFD600] lg:hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historial de Apuestas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BetHistory />
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card className="bg-black border-[#FFD600]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserStats />
                </CardContent>
              </Card>

              <Card className="bg-black border-[#FFD600] flex-1">
                <CardHeader className="pb-0">
                  <Tabs defaultValue="history">
                    <div className="flex justify-between items-center">
                      <CardTitle>Actividad</CardTitle>
                      <TabsList className="bg-black">
                        <TabsTrigger value="history" className="data-[state=active]:bg-[#FFD600]">
                          <History className="h-4 w-4 mr-1" />
                          Historial
                        </TabsTrigger>
                        <TabsTrigger value="achievements" className="data-[state=active]:bg-[#FFD600]">
                          <Trophy className="h-4 w-4 mr-1" />
                          Logros
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="history">
                    <TabsContent value="history" className="mt-0">
                      <BetHistory />
                    </TabsContent>
                    <TabsContent value="achievements" className="mt-0">
                      <div className="space-y-2">
                        {achievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className={`p-2 rounded-lg flex items-center gap-2 ${
                              unlockedAchievements.includes(achievement.id) ? "bg-[#FFD600]" : "border-[#FFD600] opacity-50"
                            }`}
                          >
                            <Trophy
                              className={`h-5 w-5 ${
                                unlockedAchievements.includes(achievement.id) ? "text-[#FFD600]" : "text-[#FFD600]"
                              }`}
                            />
                            <div>
                              <p className="font-medium">{achievement.title}</p>
                              <p className="text-xs text-zinc-400">{achievement.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* AchievementNotification eliminado para evitar doble modal de logro al ganar. */}
        <footer className="w-full bg-[#111] border-t-2 border-[#FFD600] text-[#FFD600] text-center py-3 shadow-inner mt-2">
          &copy; 2025 Candle Rush 2.0
        </footer>
      </div>
    </>
  )
}
