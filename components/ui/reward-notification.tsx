"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Coins } from "lucide-react"

interface RewardNotificationProps {
  amount: number
  onClose: () => void
}

export default function RewardNotification({ amount, onClose }: RewardNotificationProps) {
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
            <Coins className="h-6 w-6 text-yellow-400" />
          </div>

          <div>
            <h3 className="font-bold text-yellow-400">¡Recompensas reclamadas!</h3>
            <p className="font-medium">Has recibido {amount} monedas</p>
            <p className="text-sm text-zinc-400">Las monedas han sido añadidas a tu balance</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 