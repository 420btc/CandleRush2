"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Definir el tipo para las estadísticas del juego
interface GameStats {
  winRate: number
  totalVolume: number
  profitPercentage: number
  totalBets: number
  maxConsecutiveWins: number
}

interface Achievement {
  id: string
  title: string
  description: string
  reward: number
  condition: string
  category: string
  icon?: string | React.ReactNode
}

interface AchievementContextType {
  achievements: Achievement[]
  unlockedAchievements: string[]
  claimedAchievements: string[]
  unlockAchievement: (id: string) => void
  claimAchievement: (id: string) => number
  gameStats: GameStats
}

const defaultGameStats: GameStats = {
  winRate: 50,
  totalVolume: 10000,
  profitPercentage: 25,
  totalBets: 45,
  maxConsecutiveWins: 4
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined)

// List of available achievements
const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_bet",
    title: "Primera apuesta",
    description: "Realiza tu primera apuesta",
    reward: 50,
    condition: "Realizar la primera apuesta",
    category: "basico"
  },
  {
    id: "winning_streak",
    title: "Racha ganadora",
    description: "Gana 10 apuestas en total",
    reward: 100,
    condition: "Ganar 10 apuestas",
    category: "intermedio"
  },
  {
    id: "high_roller",
    title: "Apostador audaz",
    description: "Realiza 5 apuestas simultáneas",
    reward: 200,
    condition: "Tener 5 apuestas pendientes a la vez",
    category: "avanzado"
  },
  {
    id: "crypto_master",
    title: "Maestro de cripto",
    description: "Apuesta en 5 pares diferentes",
    reward: 150,
    condition: "Apostar en 5 pares de criptomonedas diferentes",
    category: "intermedio"
  },
  {
    id: "profitable",
    title: "Rentable",
    description: "Alcanza un balance de 2000",
    reward: 0,
    condition: "Llegar a un balance de 2000",
    category: "experto"
  },
]

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([])
  const [gameStats, setGameStats] = useState<GameStats>(defaultGameStats)

  useEffect(() => {
    // Load achievements from localStorage
    const savedUnlocked = localStorage.getItem("unlockedAchievements")
    const savedClaimed = localStorage.getItem("claimedAchievements")
    const savedGameStats = localStorage.getItem("gameStats")

    if (savedUnlocked) {
      try {
        setUnlockedAchievements(JSON.parse(savedUnlocked))
      } catch (error) {
        console.error("Error parsing unlocked achievements:", error)
      }
    }

    if (savedClaimed) {
      try {
        setClaimedAchievements(JSON.parse(savedClaimed))
      } catch (error) {
        console.error("Error parsing claimed achievements:", error)
      }
    }

    if (savedGameStats) {
      try {
        setGameStats(JSON.parse(savedGameStats))
      } catch (error) {
        console.error("Error parsing game stats:", error)
      }
    }
  }, [])

  const unlockAchievement = (id: string) => {
    if (unlockedAchievements.includes(id)) return

    const achievement = ACHIEVEMENTS.find((a) => a.id === id)
    if (!achievement) return

    setUnlockedAchievements((prev) => {
      const updated = [...prev, id]
      localStorage.setItem("unlockedAchievements", JSON.stringify(updated))
      return updated
    })
  }

  const claimAchievement = (id: string) => {
    if (claimedAchievements.includes(id)) return 0
    if (!unlockedAchievements.includes(id)) return 0

    const achievement = ACHIEVEMENTS.find((a) => a.id === id)
    if (!achievement) return 0

    setClaimedAchievements((prev) => {
      const updated = [...prev, id]
      localStorage.setItem("claimedAchievements", JSON.stringify(updated))
      return updated
    })

    return achievement.reward
  }

  // Función para actualizar las estadísticas del juego
  const updateGameStats = (newStats: Partial<GameStats>) => {
    setGameStats(prevStats => {
      const updatedStats = { ...prevStats, ...newStats };
      localStorage.setItem("gameStats", JSON.stringify(updatedStats));
      return updatedStats;
    });
  };

  return (
    <AchievementContext.Provider
      value={{
        achievements: ACHIEVEMENTS,
        unlockedAchievements,
        claimedAchievements,
        unlockAchievement,
        claimAchievement,
        gameStats
      }}
    >
      {children}
    </AchievementContext.Provider>
  )
}

export function useAchievement() {
  const context = useContext(AchievementContext)
  if (context === undefined) {
    throw new Error("useAchievement must be used within an AchievementProvider")
  }
  return context
}
