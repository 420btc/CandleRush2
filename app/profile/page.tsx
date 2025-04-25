"use client";
import Image from "next/image";
import UserStats from "@/components/game/user-stats";
import BetHistory from "@/components/game/bet-history";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        {/* Avatar y nombre */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden shadow-lg">
            <Image src="/perfil1.png" alt="Foto de perfil" fill className="object-cover" />
          </div>
          <span className="text-2xl font-bold text-yellow-400 mt-2">Usuario Pro</span>
        </div>

        {/* Estadísticas */}
        <div className="w-full bg-zinc-900 border-2 border-yellow-400 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Estadísticas</h2>
          <UserStats />
        </div>

        {/* Historial de apuestas */}
        <div className="w-full bg-zinc-900 border-2 border-yellow-400 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Historial de Apuestas</h2>
          <BetHistory />
        </div>
      </div>
    </main>
  );
}
