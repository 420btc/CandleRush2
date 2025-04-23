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
import AchievementNotification from "@/components/game/achievement-notification"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useDevice } from "@/context/device-mode-context"
import { ArrowUpCircle, ArrowDownCircle, BarChart3, History, Trophy, Wallet } from "lucide-react"

export default function GameScreen() {
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
  } = useGame()
  const { user } = useAuth()
  const { achievements, unlockedAchievements } = useAchievement()
  const { toast } = useToast()
  const { isMobile } = useDevice()
  const [showAchievement, setShowAchievement] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [timeUntilNextCandle, setTimeUntilNextCandle] = useState<number>(0)

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
      })
      return
    }

    placeBet("BULLISH", 10)
  }

  const handleBearishBet = () => {
    if (gamePhase !== "BETTING") {
      toast({
        title: "No puedes apostar ahora",
        description: "Espera a la fase de apuestas",
        variant: "destructive",
      })
      return
    }

    placeBet("BEARISH", 10)
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
    <div className="w-full max-w-none mx-0 px-4 bg-black min-h-screen">
      
      <div className="flex flex-col gap-6">
        <header className="flex flex-col lg:flex-row justify-between items-center border-[#FFD600] rounded-xl px-6 py-4 mb-4 shadow-lg min-h-[80px] w-full">
  <div className="flex items-center gap-6 w-full lg:w-auto">
    {/* Enlace a Candle Rush 1.0 btcer.fun */}
    <a
      href="https://btcer.fun"
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs md:text-sm font-bold text-[#FFD600] hover:underline hover:text-[#ffb700] transition mr-2"
      style={{ whiteSpace: 'nowrap' }}
    >
      Candle Rush 1.0&nbsp;&rarr;&nbsp;btcer.fun
    </a>
    <h1 className="text-3xl font-bold text-[#FFD600] tracking-tight" data-component-name="GameScreen">Candle Rush 2.0</h1>
    <nav className="flex gap-4 ml-4">
      <button className="text-white font-semibold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-2 py-1">Menu</button>
      <button className="text-white font-semibold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-2 py-1">Cómo jugar</button>
      <button className="text-white font-semibold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-2 py-1">Niveles</button>
      <button className="text-white font-semibold hover:text-[#FFD600] transition border-[#FFD600] rounded-lg px-2 py-1">Perfil</button>
    </nav>
  </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#FFD600]">{user ? user.username : "Invitado"}</span>
            <span className="font-bold text-[#FFD600]">${userBalance.toFixed(2)}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Tarjeta principal con gráfico y controles */}
            <Card className="bg-black border-[#FFD600]">
              <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {currentSymbol} ({timeframe})
                  </CardTitle>
                  <GameTimer />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Gráfico */}
                <div className="h-[600px] w-full">
                  <CandlestickChart candles={candles} currentCandle={currentCandle} />
                </div>

                {/* Controles justo debajo del gráfico */}
                <div className="mt-4 bg-black/50 rounded-lg p-4 border-[#FFD600]">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Bloque unificado de información de fase */}
                    <div className="w-full md:w-auto">
                      {gamePhase === "BETTING" && secondsLeft > 0 ? (
                        <div className="text-center p-2 rounded-lg bg-black min-h-[90px] flex flex-col justify-center border-[#FFD600]">
                          <p className="text-sm text-[#FFD600]">Tiempo para apostar</p>
                          <p className="text-2xl font-bold">{secondsLeft}s</p>
                          <p className="text-xs text-[#FFD600]">Apuestas: {currentCandleBets}/1</p>
                        </div>
                      ) : gamePhase === "WAITING" && secondsUntilNextCandle > 0 ? (
                        <div className="text-center p-2 rounded-lg bg-black min-h-[90px] flex flex-col justify-center border-[#FFD600]">
                          <p className="text-sm text-[#FFD600]">Próxima vela en</p>
                          <p className="text-2xl font-bold">{secondsUntilNextCandle}s</p>
                          <p className="text-xs text-[#FFD600]">Esperando próxima ronda</p>
                        </div>
                      ) : (
                        <div className="text-center p-2 rounded-lg bg-black min-h-[90px] flex flex-col justify-center border-[#FFD600]">
                          <p className="text-sm text-[#FFD600]">Sincronizando...</p>
                        </div>
                      )}
                    </div>

                    {/* Botones de apuesta */}
                    <div className="flex gap-4 justify-center">
                      <button
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold border-[#FFD600] disabled:bg-green-600 disabled:opacity-60"
                        onClick={handleBullishBet}
                        disabled={gamePhase !== "BETTING" || secondsLeft <= 0 || currentCandleBets >= 1 || userBalance < 10}
                      >
                        Apostar alcista
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold border-[#FFD600] disabled:bg-red-600 disabled:opacity-60"
                        onClick={handleBearishBet}
                        disabled={gamePhase !== "BETTING" || secondsLeft <= 0 || currentCandleBets >= 1 || userBalance < 10}
                      >
                        Apostar bajista
                      </button>
                    </div>

                    {/* Controles del juego */}
                    <div className="w-full md:w-auto">
                      <GameControls
                        onSymbolChange={changeSymbol}
                        onTimeframeChange={changeTimeframe}
                        currentSymbol={currentSymbol}
                        currentTimeframe={timeframe}
                      />
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

      {showAchievement && (
        <AchievementNotification achievementId={showAchievement} onClose={() => setShowAchievement(null)} />
      )}
    </div>
  )
}
