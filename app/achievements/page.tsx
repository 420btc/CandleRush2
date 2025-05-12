"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievement } from "@/context/achievement-context";
import { useGame } from "@/context/game-context";
import {
  TrendingUp,
  Star,
  Zap,
  Award,
  Medal,
  BarChart4,
  Target,
  TrendingDown,
  BookOpenCheck,
  Rocket
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// Colores para diferentes categorías de logros
const COLORS: Record<string, string> = {
  basico: '#10b981', // verde esmeralda
  intermedio: '#3b82f6', // azul
  avanzado: '#8b5cf6', // púrpura
  experto: '#f59e0b', // ámbar
  automix: '#ec4899', // rosa
  especial: '#f43f5e', // rojo rosa
};

export default function AchievementsPage() {
  const router = useRouter();
  const { achievements, unlockedAchievements, gameStats } = useAchievement();
  const { userBalance } = useGame();
  const [activeTab, setActiveTab] = useState('todos');
  const [showAll, setShowAll] = useState(false);

  // Datos para gráficos
  const achievementData = useMemo(() => [
    { category: 'Básicos', total: achievements.filter(a => a.category === 'basico').length, unlocked: achievements.filter(a => a.category === 'basico' && unlockedAchievements.includes(a.id)).length },
    { category: 'Intermedios', total: achievements.filter(a => a.category === 'intermedio').length, unlocked: achievements.filter(a => a.category === 'intermedio' && unlockedAchievements.includes(a.id)).length },
    { category: 'Avanzados', total: achievements.filter(a => a.category === 'avanzado').length, unlocked: achievements.filter(a => a.category === 'avanzado' && unlockedAchievements.includes(a.id)).length },
    { category: 'Experto', total: achievements.filter(a => a.category === 'experto').length, unlocked: achievements.filter(a => a.category === 'experto' && unlockedAchievements.includes(a.id)).length },
    { category: 'AutoMix', total: achievements.filter(a => a.category === 'automix').length, unlocked: achievements.filter(a => a.category === 'automix' && unlockedAchievements.includes(a.id)).length },
    { category: 'Especial', total: achievements.filter(a => a.category === 'especial').length, unlocked: achievements.filter(a => a.category === 'especial' && unlockedAchievements.includes(a.id)).length },
  ], [achievements, unlockedAchievements]);

  // Datos para el gráfico de radar
  const radarData = useMemo(() => [
    { subject: 'Winrate', value: Math.min(gameStats.winRate / 100, 1) || 0.1 },
    { subject: 'Volumen', value: Math.min(gameStats.totalVolume / 100000, 1) || 0.1 },
    { subject: 'Ganancias', value: Math.min(gameStats.profitPercentage / 100, 1) || 0.1 },
    { subject: 'Experiencia', value: Math.min(gameStats.totalBets / 100, 1) || 0.1 },
    { subject: 'Rachas', value: Math.min(gameStats.maxConsecutiveWins / 10, 1) || 0.1 },
  ], [gameStats]);

  // Datos para el gráfico de progresión usando useMemo para evitar regeneración en cada renderizado
  const progressionData = useMemo(() => {
    // Usar valores predeterminados en lugar de valores aleatorios
    return Array.from({ length: 10 }).map((_, i) => ({
      day: `Día ${i + 1}`,
      logros: Math.min(unlockedAchievements.length, i * 2)
    }));
  }, [unlockedAchievements.length]); // Solo regenerar cuando cambie el número de logros desbloqueados

  // Función para obtener un icono según la categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basico': return <Star className="h-5 w-5" />;
      case 'intermedio': return <Award className="h-5 w-5" />;
      case 'avanzado': return <Zap className="h-5 w-5" />;
      case 'experto': return <Medal className="h-5 w-5" />;
      case 'automix': return <Rocket className="h-5 w-5" />;
      case 'especial': return <BookOpenCheck className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  // Filtrar logros según la pestaña activa
  const filteredAchievements = useMemo(() => {
    return activeTab === 'todos' 
      ? achievements 
      : activeTab === 'desbloqueados' 
        ? achievements.filter(a => unlockedAchievements.includes(a.id))
        : achievements.filter(a => a.category === activeTab);
  }, [activeTab, achievements, unlockedAchievements]);

  // Ordenar logros: primero desbloqueados, luego por categoría
  const sortedAchievements = useMemo(() => {
    return [...filteredAchievements].sort((a, b) => {
      // Primero, ordenar por estado de desbloqueo
      const aUnlocked = unlockedAchievements.includes(a.id);
      const bUnlocked = unlockedAchievements.includes(b.id);
      
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      
      // Si ambos están desbloqueados/bloqueados, ordenar por categoría
      return a.category.localeCompare(b.category);
    });
  }, [filteredAchievements, unlockedAchievements]);

  // Limitar los logros mostrados si showAll es falso
  const displayedAchievements = useMemo(() => {
    return showAll ? sortedAchievements : sortedAchievements.slice(0, 12);
  }, [showAll, sortedAchievements]);

  // Calcular el progreso general
  const totalProgress = useMemo(() => {
    return Math.round((unlockedAchievements.length / achievements.length) * 100);
  }, [unlockedAchievements.length, achievements.length]);

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

      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-7xl font-black text-yellow-400 mb-6 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
            Mis Logros
          </h1>
          <p className="text-gray-400 text-xl">Desbloquea logros mientras mejoras como trader</p>
          
          {/* Barra de progreso general */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 font-medium">
              <span className="text-zinc-400">Progreso total</span>
              <span className="text-yellow-400">{unlockedAchievements.length}/{achievements.length} ({totalProgress}%)</span>
            </div>
          </div>
        </div>
        
        {/* Tarjetas de gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Tarjeta 1: Distribución de logros */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl">
            <CardHeader>
              <CardTitle className="!text-black flex items-center gap-2 font-bold">
                <BarChart4 className="h-5 w-5" />
                Distribución de Logros
              </CardTitle>
              <CardDescription className="!text-black">Logros por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={achievementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {achievementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Tarjeta 2: Progresión de logros */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl">
            <CardHeader>
              <CardTitle className="!text-black flex items-center gap-2 font-bold">
                <TrendingUp className="h-5 w-5" />
                Progresión de Logros
              </CardTitle>
              <CardDescription className="!text-black">Evolución temporal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={progressionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="logros" 
                      stroke="#8b5cf6" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Tarjeta 3: Perfil de trading */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl">
            <CardHeader>
              <CardTitle className="!text-black flex items-center gap-2 font-bold">
                <Target className="h-5 w-5" />
                Perfil de Trading
              </CardTitle>
              <CardDescription className="!text-black">Tus fortalezas como trader</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    outerRadius={90} 
                    width={500} 
                    height={250} 
                    data={radarData}
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <PolarGrid stroke="#000" strokeWidth={1} />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: "#000", fontSize: 12, fontWeight: "bold" }}
                      stroke="#000"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 1]} 
                      tick={false} 
                      axisLine={false}
                      stroke="#000"
                    />
                    <Radar
                      name="Habilidades"
                      dataKey="value"
                      stroke="#000"
                      fill="#000"
                      fillOpacity={0.5}
                      strokeWidth={2}
                      animationDuration={500}
                      animationEasing="ease-out"
                      dot={{ fill: "#000", strokeWidth: 0, r: 3 }}
                      activeDot={{ fill: "#fbbf24", stroke: "#000", strokeWidth: 2, r: 5 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [((value as number) * 100).toFixed(0) + '%', 'Nivel']} 
                      contentStyle={{ backgroundColor: '#000', color: '#fff', border: '1px solid #fbbf24', borderRadius: '8px', padding: '8px' }}
                      labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                      cursor={false}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#000', fontWeight: 'bold' }}
                      formatter={(value) => <span className="text-black font-bold">Nivel de {value}</span>}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pestañas para filtrar los logros */}
        <Tabs defaultValue="todos" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-7 gap-2 bg-zinc-900 p-1">
            <TabsTrigger value="todos" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              Todos ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="desbloqueados" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              Desbloqueados ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="basico" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              Básicos
            </TabsTrigger>
            <TabsTrigger value="intermedio" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              Intermedios
            </TabsTrigger>
            <TabsTrigger value="avanzado" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              Avanzados
            </TabsTrigger>
            <TabsTrigger value="experto" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              Expertos
            </TabsTrigger>
            <TabsTrigger value="automix" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              AutoMix
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de logros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            const progress = isUnlocked ? 100 : 0; // Simplified progress
            const categoryColor = COLORS[achievement.category] || COLORS.basico;
            
            return (
              <Card 
                key={achievement.id}
                className={`bg-zinc-900 border-2 transition-all duration-300 hover:scale-105 ${
                  isUnlocked 
                    ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                    : 'border-zinc-800 opacity-70'
                }`}
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`p-3 rounded-full ${
                    isUnlocked ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    <div className="text-xl">{getCategoryIcon(achievement.category)}</div>
                  </div>
                  <div>
                    <CardTitle className="!text-yellow-400">
                      {achievement.title}
                    </CardTitle>
                    <CardDescription className="text-white">{achievement.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isUnlocked ? 'bg-yellow-400' : 'bg-zinc-700'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">{achievement.condition}</span>
                      <span className={isUnlocked ? 'text-yellow-400' : 'text-zinc-500'}>
                        {isUnlocked ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-4">
                  <div className="flex items-center text-xs">
                    <span 
                      className="px-2 py-1 rounded-full text-black font-semibold" 
                      style={{ backgroundColor: categoryColor }}
                    >
                      {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
                    </span>
                    {isUnlocked && (
                      <span className="ml-auto text-yellow-400 font-bold">
                        +{achievement.reward} monedas
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        {/* Botón para mostrar más/menos logros */}
        {sortedAchievements.length > 12 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll(current => !current)}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-full"
            >
              {showAll ? "Mostrar menos" : `Mostrar ${sortedAchievements.length - 12} más`}
            </button>
          </div>
        )}
      </div>
    </main>
  );
} 