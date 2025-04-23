"use client"

import { useEffect, useState } from "react"
import { useAchievement } from "@/context/achievement-context"
import { Trophy, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface AchievementNotificationProps {
  achievementId: string
  onClose: () => void
}

export default function AchievementNotification({ achievementId, onClose }: AchievementNotificationProps) {
  const { achievements } = useAchievement()
  const [achievement, setAchievement] = useState<any>(null)

  useEffect(() => {
    const found = achievements.find((a) => a.id === achievementId)
    if (found) {
      setAchievement(found)
    }
  }, [achievementId, achievements])

  if (!achievement) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 bg-zinc-800 border border-yellow-500/50 rounded-lg shadow-lg p-4 max-w-sm"
      >
        <button onClick={onClose} className="absolute top-2 right-2 text-zinc-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <Trophy className="h-6 w-6 text-yellow-400" />
          </div>

          <div>
            <h3 className="font-bold text-yellow-400">¡Logro desbloqueado!</h3>
            <p className="font-medium">{achievement.title}</p>
            <p className="text-sm text-zinc-400">{achievement.description}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
