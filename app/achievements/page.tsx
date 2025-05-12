"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GrAchievement, GrTrophy, GrMoney, GrTime } from "react-icons/gr";
import { useGame } from "@/context/game-context";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  unlocked: boolean;
  requirement: string;
}

export default function AchievementsPage() {
  const router = useRouter();
  const { bets, userBalance } = useGame();

  // Función para calcular los logros basados en las estadísticas del usuario
  const calculateAchievements = (): Achievement[] => {
    const totalBets = bets.length;
    const wonBets = bets.filter(bet => bet.status === 'WON').length;
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

    return [
      {
        id: "first-trade",
        title: "Primer Trade",
        description: "Realiza tu primera operación",
        icon: <GrAchievement size={24} />,
        progress: totalBets > 0 ? 100 : 0,
        unlocked: totalBets > 0,
        requirement: "Completa 1 trade"
      },
      {
        id: "pro-trader",
        title: "Trader Profesional",
        description: "Alcanza un 60% de winrate",
        icon: <GrTrophy size={24} />,
        progress: Math.min(Math.round(winRate), 100),
        unlocked: winRate >= 60,
        requirement: "60% de trades ganadores"
      },
      {
        id: "whale",
        title: "Ballena Crypto",
        description: "Alcanza un balance de 10,000",
        icon: <GrMoney size={24} />,
        progress: Math.min(Math.round((userBalance / 10000) * 100), 100),
        unlocked: userBalance >= 10000,
        requirement: "Balance de 10,000"
      },
      {
        id: "veteran",
        title: "Trader Veterano",
        description: "Completa 100 operaciones",
        icon: <GrTime size={24} />,
        progress: Math.min(Math.round((totalBets / 100) * 100), 100),
        unlocked: totalBets >= 100,
        requirement: "100 trades completados"
      }
    ];
  };

  const achievements = calculateAchievements();

  return (
    <main className="min-h-screen bg-black py-12 px-4">
      {/* Botón para volver */}
      <button
        onClick={() => router.push('/profile')}
        className="fixed top-6 left-6 z-50 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full p-3 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-yellow-400 mb-4">Mis Logros</h1>
          <p className="text-gray-400">Desbloquea logros mientras mejoras como trader</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {achievements.map((achievement) => (
            <Card 
              key={achievement.id}
              className={`bg-zinc-900 border-2 transition-all duration-300 hover:scale-105 ${
                achievement.unlocked ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'border-zinc-800'
              }`}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-full ${
                  achievement.unlocked ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {achievement.icon}
                </div>
                <div>
                  <CardTitle className={
                    achievement.unlocked ? 'text-yellow-400' : 'text-zinc-500'
                  }>{achievement.title}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        achievement.unlocked ? 'bg-yellow-400' : 'bg-zinc-700'
                      }`}
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{achievement.requirement}</span>
                    <span className={achievement.unlocked ? 'text-yellow-400' : 'text-zinc-500'}>
                      {achievement.progress}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
} 