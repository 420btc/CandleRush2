'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useGame } from '@/context/game-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

const BettingHistoryChart: React.FC = () => {
  const { bets } = useGame();
  const [pendingBets, setPendingBets] = useState<any[]>([]);
  const [isPendingBetsModalOpen, setIsPendingBetsModalOpen] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto mt-12">
      <Card className="bg-yellow-400 border-yellow-500 shadow-2xl rounded-xl">
        <CardHeader className="items-center pb-4">
          <CardTitle>Historial de Apuestas</CardTitle>
          <CardDescription className="text-black">Evolución de tus apuestas ganadas, perdidas, liquidadas y pendientes</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={{
              won: { label: "Ganadas", color: "#22c55e" },
              lost: { label: "Perdidas", color: "#ef4444" },
              liquidated: { label: "Liquidadas", color: "#eab308" },
              pending: { label: "Pendientes", color: "#60a5fa" },
            }}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              data={(() => {
                // Evolución acumulada de apuestas por estado
                const data = [];
                let won = 0;
                let lost = 0;
                let liquidated = 0;
                let pending = 0;
               
                // Primero contamos los totales
                const totalWon = bets.filter(b => b.status === "WON").length;
                const totalLost = bets.filter(b => b.status === "LOST").length;
                const totalLiquidated = bets.filter(b => b.status === "LIQUIDATED").length;
                const totalPending = bets.filter(b => b.status === "PENDING").length;
                const maxTotal = Math.max(totalWon, totalLost, totalLiquidated, totalPending, 1);
               
                // Normalizamos los datos para que todas las áreas tengan la misma escala
                return bets
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((bet, i) => {
                    if (bet.status === "WON") won++;
                    if (bet.status === "LOST") lost++;
                    if (bet.status === "LIQUIDATED") liquidated++;
                    if (bet.status === "PENDING") pending++;
                      // Normalizamos los valores para que vayan de 0 a 100
                    const total = won + lost + liquidated + pending || 1;                      // Variables para las rachas
                    let currentStreak = 0;
                    let streakType = null;
                    let startIndex = i;
                    let scaleFactor = 1;
                    // Revisamos si estamos al final de una racha (últimas 3 apuestas)
                    const lastThreeBets = bets.slice(Math.max(0, i - 2), i + 1);                        // Para rachas ganadoras (mínimo 3)
                    if (lastThreeBets.length === 3 && lastThreeBets.every(b => b.status === "WON")) {                        // Si encontramos 3 victorias seguidas, buscamos el inicio real de la racha
                      startIndex = i - 2; // Comenzamos desde el inicio de las 3 victorias detectadas
                      while (startIndex > 0 && bets[startIndex - 1].status === "WON") {
                        startIndex--;
                      }
                        // Marcar toda la racha desde el inicio hasta la posición actual
                      if (i >= startIndex) {                        // Calculamos la intensidad basada en la longitud de la racha actual
                        const streakLength = i - startIndex + 1;
                        // Nueva escala de intensidad:
                        // 1-5: 25%, 5-10: 50%, 10-15: 75%, 15-20: 100%
                        let intensity;
                          if (streakLength <= 5) {
                            intensity = 25;
                          } else if (streakLength <= 10) {
                            intensity = 50;
                          } else if (streakLength <= 15) {
                            intensity = 75;
                          } else {
                            intensity = 100;
                          }
                        currentStreak = intensity;
                        streakType = 'win';
                      }
                    }

                    // Para rachas perdedoras (mínimo 3)
                    if (!streakType && lastThreeBets.length === 3 && lastThreeBets.every(b => b.status === "LOST")) {
                      // Si encontramos 3 pérdidas seguidas, buscamos el inicio real de la racha
                      let startIndex = i - 2; // Comenzamos desde el inicio de las 3 pérdidas detectadas
                      while (startIndex > 0 && bets[startIndex - 1].status === "LOST") {
                        startIndex--;
                      }
                     
                      // Marcar toda la racha desde el inicio hasta la posición actual
                      if (i >= startIndex) {
                        // Usamos el mismo factor de escala para mantener la proporción
                        const maxPossibleStreak = bets.length;
                        const scaleFactor = 100 / Math.max(5, maxPossibleStreak);
                        currentStreak = (i - startIndex + 1) * scaleFactor;
                        streakType = 'lose';
                      }
                    }
                   
                    // Si no estamos al final pero estamos dentro de una racha existente
                    if (!streakType && i > 0) {
                      // Verificar si estamos en medio de una racha ganadora
                      if (bets[i].status === "WON" && bets[i-1].status === "WON") {
                        let startIndex = i;
                        while (startIndex > 0 && bets[startIndex - 1].status === "WON") {
                          startIndex--;
                        }                        // Solo mostrar si hay al menos 3 en la racha
                        if ((i - startIndex + 1) >= 3) {
                          const streakLength = i - startIndex + 1;
                          // Calcular intensidad basada en la longitud de la racha:
                          // 1-5: 25%, 5-10: 50%, 10-20: 100%
                          let intensity;
                          if (streakLength <= 5) {
                            intensity = 25;
                          } else if (streakLength <= 10) {
                            intensity = 50;
                          } else {
                            intensity = 100;
                          }
                          currentStreak = intensity;
                          streakType = 'win';
                        }
                      }
                      // Verificar si estamos en medio de una racha perdedora
                      else if (bets[i].status === "LOST" && bets[i-1].status === "LOST") {
                        let startIndex = i;
                        while (startIndex > 0 && bets[startIndex - 1].status === "LOST") {
                          startIndex--;
                        }                        // Solo mostrar si hay al menos 3 en la racha
                        if ((i - startIndex + 1) >= 3) {
                          const streakLength = i - startIndex + 1;
                          // Calcular intensidad basada en la longitud de la racha:
                          // 1-5: 25%, 5-10: 50%, 10-20: 100%
                          let intensity;
                          if (streakLength <= 5) {
                            intensity = 25;
                          } else if (streakLength <= 10) {
                            intensity = 50;
                          } else {
                            intensity = 100;
                          }
                          currentStreak = intensity;
                          streakType = 'lose';
                        }
                      }
                    }
                   
                    // Formateamos la hora para mostrarla en el tooltip
                    const betTime = new Date(bet.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });                      return {
                      ronda: i + 1,
                      tiempo: betTime,
                      rachaGanadora: streakType === 'win' ? currentStreak : 0,
                      rachaPerdedora: streakType === 'lose' ? currentStreak : 0,
                      ganadas: (won / maxTotal) * 100,
                      perdidas: (lost / maxTotal) * 100,
                      liquidadas: (liquidated / maxTotal) * 100,
                      pendientes: (pending / maxTotal) * 100,
                      numApuestas: i - startIndex + 1, // Número actual de apuestas en la racha
                      racha: streakType === 'win' ? 'ganadora' : streakType === 'lose' ? 'perdedora' : null,
                      startTime: streakType ? new Date(bets[startIndex].timestamp).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : null,
                      // Datos adicionales para el tooltip
                      betAmount: bet.amount,
                      betStatus: bet.status,
                      betPrediction: bet.prediction,
                      betLeverage: bet.leverage || 1,
                      betSymbol: bet.symbol,                      
                      betTimeframe: bet.timeframe,
                      scaleFactor: scaleFactor, // Agregar el factor de escala a los datos
                    };
                  });
              })()}
            >              
              <defs>
                <linearGradient id="fillWon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillLiquidated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1} />
                </linearGradient>                
                <linearGradient id="fillStreak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="fillLoseStreak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#991b1b" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#991b1b" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                width={40}
                axisLine={false}
                tickLine={false}
              />
              <XAxis
                dataKey="tiempo"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-black/90 p-3 rounded-lg border border-yellow-400 shadow-lg">                        
                        <div className="text-white font-medium mb-1">                          
                          Apuesta #{data.ronda} • {data.tiempo}
                          <span className={`ml-2 ${data.betPrediction === "BULLISH" ? "text-green-400" : "text-red-400"}`}>
                            {data.betPrediction === "BULLISH" ? "Alcista" : "Bajista"}
                          </span>
                          {data.betStatus !== "PENDING" && (
                            <span className={`ml-2 ${
                              data.betStatus === "WON" ? "text-green-400" :
                              data.betStatus === "LOST" ? "text-red-400" :
                              "text-yellow-400"
                            }`}>
                              {data.betStatus === "WON" ? "- Ganada" :
                               data.betStatus === "LOST" ? "- Perdida" :
                               "- Liquidada"}
                            </span>
                          )}
                        </div>
                        {data.betStatus === "PENDING" && (
                          <div className="bg-blue-500/20 p-2 rounded mb-2 border border-blue-500/50">
                            <div className="text-blue-300 font-bold">APUESTA PENDIENTE</div>
                            <div className="text-white text-sm">
                              <div>Predicción: <span className={data.betPrediction === "BULLISH" ? "text-green-400" : "text-red-400"}>
                                {data.betPrediction === "BULLISH" ? "ALCISTA" : "BAJISTA"}
                              </span></div>
                              <div>Monto: {data.betAmount} monedas</div>
                              <div>Apalancamiento: {data.betLeverage}x</div>
                              <div>Par: {data.betSymbol}</div>
                              <div>Timeframe: {data.betTimeframe}</div>
                            </div>
                          </div>                        
                        )}                        
                        {(data.rachaGanadora > 0 || data.rachaPerdedora > 0) && (                          
                          <div className={`${data.rachaGanadora > 0 ? 'bg-green-900/50' : 'bg-red-900/50'} p-2 rounded mb-2 border ${data.rachaGanadora > 0 ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`${data.rachaGanadora > 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
                              ¡{data.rachaGanadora > 0 ? 'RACHA GANADORA!' : 'RACHA PERDEDORA!'}
                            </div>                            
                            <div className="text-white text-sm">
                              {data.numApuestas} apuestas consecutivas
                            </div>
                            <div className="text-white/80 text-xs">
                              Intensidad: {Math.round(data.rachaGanadora || data.rachaPerdedora)}%
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-green-400 text-xs">Ganadas: {Math.round(data.ganadas)}%</div>
                          <div className="text-red-400 text-xs">Perdidas: {Math.round(data.perdidas)}%</div>
                          <div className="text-yellow-400 text-xs">Liquidadas: {Math.round(data.liquidadas)}%</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />              
              <Area                
                dataKey="rachaGanadora"
                type="monotone"
                fill="url(#fillStreak)"
                stroke="#22c55e"
                strokeWidth={3}
                stackId="0"
                fillOpacity={1}
              />
              <Area
                dataKey="rachaPerdedora"
                type="monotone"
                fill="url(#fillLoseStreak)"
                stroke="#991b1b"
                strokeWidth={2}
                stackId="0"
                fillOpacity={1}
              />
              <Area
                dataKey="ganadas"
                type="monotone"
                fill="url(#fillWon)"
                stroke="#22c55e"
                stackId="1"
                fillOpacity={0.8}
              />
              <Area
                dataKey="perdidas"
                type="monotone"
                fill="url(#fillLost)"
                stroke="#ef4444"
                stackId="2"
                fillOpacity={0.6}
              />
              <Area
                dataKey="liquidadas"
                type="monotone"
                fill="url(#fillLiquidated)"
                stroke="#000000"
                strokeWidth={1.5}
                stackId="3"
                fillOpacity={0.7}
              />
              <Area
                dataKey="pendientes"
                type="monotone"
                fill="url(#fillPending)"
                stroke="#60a5fa"
                strokeWidth={1.5}
                stackId="4"
                fillOpacity={0.7}
              />
              <Legend />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        {/* Botón para ver apuestas pendientes */}
        {bets.filter(bet => bet.status === "PENDING").length > 0 && (
          <div className="flex justify-center pb-4">
            <button
              onClick={() => {
                const pendingBets = bets.filter(bet => bet.status === "PENDING");
                setPendingBets(pendingBets);
                setIsPendingBetsModalOpen(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full px-4 py-2 text-sm flex items-center gap-2 transition-all duration-200 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ver {bets.filter(bet => bet.status === "PENDING").length} apuestas pendientes
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BettingHistoryChart;
