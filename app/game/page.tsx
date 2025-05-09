import { Suspense } from "react"
import GameScreen from "@/components/game/game-screen"
import Loading from "@/components/ui/loading"

export default function Game() {
  return (
    <main className="bg-zinc-900 text-white">
      <Suspense fallback={<Loading />}>
        <GameScreen />
      </Suspense>
    </main>
  )
}
