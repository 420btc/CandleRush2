import { Suspense } from "react"
import GameScreen from "@/components/game/game-screen"
import { GameProvider } from "@/context/game-context"
import { AuthProvider } from "@/context/auth-context"
import { AchievementProvider } from "@/context/achievement-context"
import { DeviceModeProvider } from "@/context/device-mode-context"
import Loading from "@/components/ui/loading"

export default function Game() {
  return (
    <DeviceModeProvider>
      <AuthProvider>
        <AchievementProvider>
          <GameProvider>
            <main className="min-h-screen bg-zinc-900 text-white">
              <Suspense fallback={<Loading />}>
                <GameScreen />
              </Suspense>
            </main>
          </GameProvider>
        </AchievementProvider>
      </AuthProvider>
    </DeviceModeProvider>
  )
}
