"use client"

import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 text-green-400 animate-spin" />
      <p className="mt-4 text-zinc-400">Cargando datos de Binance...</p>
    </div>
  )
}
