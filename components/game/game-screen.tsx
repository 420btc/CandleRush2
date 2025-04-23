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
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!nextPhaseTime) return 0
      const now = Date.now()
      return Math.max(0, nextPhaseTime - now)
    }

    const calculateTimeUntilNextCandle = () => {
      if (!nextCandleTime) return 0
      const now = Date.now()
      return Math.max(0, nextCandleTime - now)
    }

    const updateTimes = () => {
      setTimeLeft(calculateTimeLeft())
      setTimeUntilNextCandle(calculateTimeUntilNextCandle())
    }

    updateTimes()
    const interval = setInterval(updateTimes, 100)

    return () => clearInterval(interval)
  }, [nextPhaseTime, nextCandleTime])

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
  const canBet = gamePhase === "BETTING" && currentCandleBets < 2
  const secondsLeft = Math.ceil(timeLeft / 1000)
  const secondsUntilNextCandle = Math.ceil(timeUntilNextCandle / 1000)

  // Mostrar información sobre el límite de apuestas
  const getBetButtonText = (type: string) => {
    if (currentCandleBets >= 2) {
      return `${type} (Límite alcanzado)`
    }
    return type
  }

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen">
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#FFD600]" data-component-name="GameScreen">Candle Rush 2.0</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{user ? user.username : "Invitado"}</span>
            <span className="font-bold text-green-400">${userBalance.toFixed(2)}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Tarjeta principal con gráfico y controles */}
            <Card className="bg-zinc-800 border-zinc-700">
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
                <div className="mt-4 bg-zinc-700/50 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Contador de fase */}
                    <div className="w-full md:w-auto">
                      {gamePhase === "BETTING" && (
                        <div
                          className={`text-center p-2 rounded-lg ${
                            secondsLeft <= 3 ? "bg-red-600 animate-pulse" : "bg-zinc-700"
                          }`}
                        >
                          <p className="text-sm text-white">Tiempo para apostar</p>
                          <p className="text-2xl font-bold">{secondsLeft}s</p>
                          <p className="text-xs text-zinc-300">Apuestas: {currentCandleBets}/2</p>
                        </div>
                      )}

                      {gamePhase === "WAITING" && (
                        <div className="text-center p-2 rounded-lg bg-zinc-700">
                          <p className="text-sm text-white">Próxima vela en</p>
                          <p className="text-2xl font-bold">{secondsUntilNextCandle}s</p>
                          <p className="text-xs text-zinc-300">Esperando resolución</p>
                        </div>
                      )}
                    </div>

                    {/* Botones de apuesta */}
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleBullishBet}
                        disabled={!canBet}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold border-2 transition-colors ${
                          canBet
                            ? "bg-black text-[#22c55e] border-[#FFD600] hover:bg-[#1a1a1a] hover:text-[#22c55e] hover:border-[#FFD600]"
                            : "bg-black text-zinc-400 border-zinc-400 cursor-not-allowed"
                        }`}
                      >
                        <ArrowUpCircle className={`h-5 w-5 ${canBet ? 'text-[#22c55e]' : 'text-zinc-400'}`} />
                        {getBetButtonText("Alcista")}
                      </button>
                      <button
                        onClick={handleBearishBet}
                        disabled={!canBet}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold border-2 transition-colors ${
                          canBet
                            ? "bg-black text-[#ef4444] border-[#FFD600] hover:bg-[#1a1a1a] hover:text-[#ef4444] hover:border-[#FFD600]"
                            : "bg-black text-zinc-400 border-zinc-400 cursor-not-allowed"
                        }`}
                      >
                        <ArrowDownCircle className={`h-5 w-5 ${canBet ? 'text-[#ef4444]' : 'text-zinc-400'}`} />
                        {getBetButtonText("Bajista")}
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
            <Card className="bg-zinc-800 border-zinc-700 lg:hidden">
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
            <Card className="bg-zinc-800 border-zinc-700">
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

            <Card className="bg-zinc-800 border-zinc-700 flex-1">
              <CardHeader className="pb-0">
                <Tabs defaultValue="history">
                  <div className="flex justify-between items-center">
                    <CardTitle>Actividad</CardTitle>
                    <TabsList className="bg-zinc-700">
                      <TabsTrigger value="history" className="data-[state=active]:bg-zinc-600">
                        <History className="h-4 w-4 mr-1" />
                        Historial
                      </TabsTrigger>
                      <TabsTrigger value="achievements" className="data-[state=active]:bg-zinc-600">
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
                            unlockedAchievements.includes(achievement.id) ? "bg-zinc-700" : "bg-zinc-900 opacity-50"
                          }`}
                        >
                          <Trophy
                            className={`h-5 w-5 ${
                              unlockedAchievements.includes(achievement.id) ? "text-yellow-400" : "text-zinc-600"
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
