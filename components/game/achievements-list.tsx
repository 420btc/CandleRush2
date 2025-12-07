"use client"

import React from "react"
import { useAchievement } from "@/context/achievement-context"
import { Trophy, Lock } from "lucide-react"

export default function AchievementsList() {
    const { achievements, unlockedAchievements } = useAchievement();

    // Agrupar logros: Desbloqueados primero, luego el resto
    const sortedAchievements = [...achievements].sort((a, b) => {
        const isUnlockedA = unlockedAchievements.some(u => u.id === a.id);
        const isUnlockedB = unlockedAchievements.some(u => u.id === b.id);
        if (isUnlockedA && !isUnlockedB) return -1;
        if (!isUnlockedA && isUnlockedB) return 1;
        return 0;
    });

    return (
        <div className="w-full h-full p-2">
            {/* Información resumen */}
            <div className="flex items-center justify-between mb-3 px-1 text-white">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="font-bold text-lg">Tus Logros</span>
                </div>
                <span className="text-sm font-mono text-zinc-400">
                    {unlockedAchievements.length} / {achievements.length}
                </span>
            </div>

            {/* Grid de logros */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-2 pr-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '300px' }}>
                {sortedAchievements.map(achievement => {
                    const isUnlocked = unlockedAchievements.some(u => u.id === achievement.id);

                    return (
                        <div
                            key={achievement.id}
                            className={`
                aspect-square rounded-lg flex flex-col items-center justify-center relative group cursor-help transition-all duration-200 border-2
                ${isUnlocked
                                    ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-900/40 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)] hover:scale-105'
                                    : 'bg-zinc-900/50 border-zinc-800 grayscale opacity-50 hover:opacity-100'}
              `}
                            title={`${achievement.title}\n${achievement.description}\nRecompensa: $${achievement.reward}`}
                        >
                            {isUnlocked ? (
                                <>
                                    <div className="text-2xl sm:text-3xl drop-shadow-md filter brightness-110 mb-1">
                                        {achievement.icon ? achievement.icon : '🏆'}
                                    </div>
                                    {/* Indicador pequeño de recompensa */}
                                    <span className="text-[10px] font-bold text-yellow-300 bg-black/60 px-1 rounded-full absolute bottom-1">
                                        ${achievement.reward}
                                    </span>
                                </>
                            ) : (
                                <Lock className="w-6 h-6 text-zinc-600" />
                            )}
                        </div>
                    );
                })}
            </div>
            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 214, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 214, 0, 0.5);
        }
      `}</style>
        </div>
    );
}
