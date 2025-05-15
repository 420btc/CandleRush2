"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

// Tipos para el TangledTreeChart
// Importar tipos del componente TangledTreeChart
import type { Node as TreeNode, TangledTreeChartProps } from '@/components/charts/TangledTreeChart';

// Importación dinámica para evitar problemas de SSR
const TangledTreeChart = dynamic<TangledTreeChartProps>(
  () => import('@/components/charts/TangledTreeChart').then((mod) => {
    const Component = mod.default;
    return Component;
  }),
  { ssr: false }
);

import { TrendingUp } from "lucide-react"
import { useLiquidations } from "@/components/game/liquidations";
import HexbinAreaChart from "@/components/charts/HexbinAreaChart";
import { 
  PolarRadiusAxis, 
  PolarAngleAxis, 
  PolarGrid, 
  Radar, 
  RadarChart, 
  RadialBarChart, 
  RadialBar, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  CartesianGrid,
  Label,
  PieChart,
  Pie,
  Sector,
  Cell,
  LabelList,
  ReferenceLine
} from "recharts";

type LabelViewBox = {
  cx?: number;
  cy?: number;
  width?: number;
  height?: number;
  startAngle?: number;
  endAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
};
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import UserStats from "@/components/game/user-stats";
import BetHistory from "@/components/game/bet-history";
import { getAutoMixMemory } from "@/utils/autoMixMemory";
import { useRouter } from "next/navigation";
import { useWhaleTrades } from "@/hooks/useWhaleTrades";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGame } from "@/context/game-context";
import { useAuth } from "@/context/auth-context";
import Login from "@/components/login";
import DisplayCards from "@/components/ui/display-cards";
import { Modal } from "../components/modal";
import { Button } from "../components/button";
import type { Bet } from "@/types/game";
import { Book } from "@/components/ui/book";
import { GrAchievement } from "react-icons/gr";
import { useAchievements } from "@/hooks/useAchievements";

// Componente para mostrar el balance actualizado cada minuto
function BalanceIndicator({ balance }: { balance: number }) {
  const [displayBalance, setDisplayBalance] = useState(balance || 0);
  
  // Actualizar el balance cada minuto
  useEffect(() => {
    // Actualizar inmediatamente
    setDisplayBalance(balance || 0);
    
    // Configurar intervalo para actualización cada minuto
    const intervalId = setInterval(() => {
      setDisplayBalance(balance || 0);
    }, 60000); // 60000ms = 1 minuto
    
    return () => clearInterval(intervalId);
  }, [balance]);
  
  return (
    <div className="flex flex-col items-center justify-center bg-black rounded-lg px-6 py-1 border-2 border-yellow-500 shadow-inner">
      <span className="text-sm font-semibold text-yellow-400 uppercase">Balance</span>
      <span className="text-xl font-bold text-yellow-400">{displayBalance.toLocaleString('es-ES')}</span>
    </div>
  );
}

// Hook para obtener y computar métricas de apuestas del usuario logueado

function useBetChartsData() {
  // Obtener las apuestas reales desde el contexto global
  const { bets } = useGame();
  
  // Definir el tipo para las apuestas
  type BetWithStatus = Bet & { status: string; prediction: string; timestamp: number };

  // Función para obtener la fecha en formato YYYY-MM-DD
  const getDateKey = (timestamp: number) => {
    return new Date(timestamp).toISOString().split('T')[0];
  };

  // Radar: estados de apuesta con persistencia
  const radarData = useMemo(() => {
    const LS_KEY = 'radar_chart_history';
    let historicalData = {};
    
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          historicalData = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Error loading radar data:', error);
      }
    }

    const typedBets = bets as BetWithStatus[];
    const currentData = {
      won: typedBets.filter(b => b.status === 'WON').length,
      lost: typedBets.filter(b => b.status === 'LOST').length,
      liquidated: typedBets.filter(b => b.status === 'LIQUIDATED').length,
      pending: typedBets.filter(b => b.status === 'PENDING').length,
    };

    const combinedData = { ...historicalData, [getDateKey(Date.now())]: currentData };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify(combinedData));
    }

    return [
      { status: 'Ganadas', value: currentData.won },
      { status: 'Perdidas', value: currentData.lost },
      { status: 'Liquidadas', value: currentData.liquidated },
      { status: 'Pendientes', value: currentData.pending },
    ];
  }, [bets]);

  // RadialBar: bullish vs bearish con persistencia
  const radialData = useMemo(() => {
    const LS_KEY = 'radial_chart_history';
    let historicalData = {};
    
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          historicalData = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Error loading radial data:', error);
      }
    }

    const typedBets = bets as BetWithStatus[];
    const currentData = {
      bullish: typedBets.filter(b => b.prediction === 'BULLISH').length,
      bearish: typedBets.filter(b => b.prediction === 'BEARISH').length,
    };

    const combinedData = { ...historicalData, [getDateKey(Date.now())]: currentData };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify(combinedData));
    }

    return [
      { name: 'Bullish', value: currentData.bullish, fill: '#22c55e' },
      { name: 'Bearish', value: currentData.bearish, fill: '#ef4444' },
    ];
  }, [bets]);

  // Pie: ganadas vs perdidas vs liquidadas con persistencia
  const pieData = useMemo(() => {
    const LS_KEY = 'pie_chart_history';
    let historicalData = {};
    
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          historicalData = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Error loading pie data:', error);
      }
    }

    const currentData = {
      won: bets.filter((b: any) => b.status === 'WON').length,
      lost: bets.filter((b: any) => b.status === 'LOST').length,
      liquidated: bets.filter((b: any) => b.status === 'LIQUIDATED').length,
    };

    const combinedData = { ...historicalData, [getDateKey(Date.now())]: currentData };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify(combinedData));
    }

    return [
      { name: 'Ganadas', value: currentData.won, fill: '#22c55e' },
      { name: 'Perdidas', value: currentData.lost, fill: '#ef4444' },
      { name: 'Liquidadas', value: currentData.liquidated, fill: '#eab308' },
    ];
  }, [bets]);

  return { 
    radarData, 
    radialData, 
    pieData, 
    bullish: radialData[0].value, 
    bearish: radialData[1].value, 
    won: pieData[0].value, 
    lost: pieData[1].value, 
    liquidated: pieData[2].value, 
    total: bets.length 
  };
}

// Configs para los charts
interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

// Interface para el payload del tooltip
interface TooltipPayload<T = any> {
  value: number;
  name: string;
  payload: T & { longs?: number; shorts?: number };
  dataKey: string | number | symbol;
  color?: string;
  [key: string]: any;
}

const radarConfig: ChartConfig = {
  Ganadas: { label: 'Ganadas', color: '#22c55e' },
  Perdidas: { label: 'Perdidas', color: '#ef4444' },
  Liquidadas: { label: 'Liquidadas', color: '#eab308' },
  Pendientes: { label: 'Pendientes', color: '#fbbf24' },
  // Agregando una entrada por defecto para evitar errores
  default: { label: 'Default', color: '#888888' }
};

const radialConfig: ChartConfig = {
  Bullish: { label: 'Bullish', color: '#22c55e' },
  Bearish: { label: 'Bearish', color: '#ef4444' },
};

const pieConfig: ChartConfig = {
  Ganadas: { label: 'Ganadas', color: '#22c55e' },
  Perdidas: { label: 'Perdidas', color: '#ef4444' },
  Liquidadas: { label: 'Liquidadas', color: '#000000' },
};

// Datos y configuración para la gráfica radial
const radialChartData = [
  { browser: "chrome", visitors: 275, fill: "#ef4444" }, // rojo
  { browser: "safari", visitors: 200, fill: "#22c55e" }, // verde
  { browser: "firefox", visitors: 187, fill: "#888888" }, // gris
  { browser: "edge", visitors: 173, fill: "#bbbbbb" }, // gris claro
  { browser: "other", visitors: 90, fill: "#e5e7eb" }, // gris muy claro
];

const radialChartConfig: ChartConfig = {
  visitors: {
    label: "Visitantes",
    color: "#000000"
  },
  chrome: {
    label: "Chrome",
    color: "#ef4444"
  },
  safari: {
    label: "Safari",
    color: "#22c55e"
  },
  firefox: {
    label: "Firefox",
    color: "#888888"
  },
  edge: {
    label: "Edge",
    color: "#bbbbbb"
  },
  other: {
    label: "Other",
    color: "#e5e7eb"
  },
  // Asegurando que todas las claves requeridas tengan color
  default: {
    label: "Default",
    color: "#888888"
  }
};

// PieChartCard: Pie chart interactivo para la tercera tarjeta
import * as React from "react";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { ChartStyle } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const pieChartData = [
  { month: "january", desktop: 186, fill: "#ef4444" }, // rojo
  { month: "february", desktop: 305, fill: "#22c55e" }, // verde
  { month: "march", desktop: 237, fill: "#888888" },
  { month: "april", desktop: 173, fill: "#bbbbbb" },
  { month: "may", desktop: 209, fill: "#e5e7eb" },
];

const pieChartConfig: ChartConfig = {
  visitors: {
    label: "Visitors",
    color: "#000000"
  },
  desktop: {
    label: "Desktop",
    color: "#888888"
  },
  january: {
    label: "January",
    color: "#3b82f6"
  },
  february: {
    label: "February",
    color: "#8b5cf6"
  },
  march: {
    label: "March",
    color: "#ec4899"
  },
  april: {
    label: "April",
    color: "#f43f5e"
  },
  may: {
    label: "May",
    color: "#e5e7eb"
  }
};

function PieChartCard() {
  const id = "pie-interactive";
  const [activeMonth, setActiveMonth] = React.useState(pieChartData[0].month);
  const activeIndex = React.useMemo(
    () => pieChartData.findIndex((item) => item.month === activeMonth),
    [activeMonth]
  );
  const months = React.useMemo(() => pieChartData.map((item) => item.month), []);

  return (
    <Card data-chart={id} className="flex flex-col bg-yellow-400 border-yellow-500 shadow-2xl">
      <ChartStyle id={id} config={pieChartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle className="text-black">Pie Chart - Interactive</CardTitle>
          <CardDescription className="text-black">January - June 2024</CardDescription>
        </div>
        <Select value={activeMonth} onValueChange={setActiveMonth}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {months.map((key) => {
              const config = pieChartConfig[key as keyof typeof pieChartConfig];
              if (!config) return null;
              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: ("color" in config && config.color) ? config.color : "#888888" }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <div className="mx-auto w-full max-w-[250px] aspect-square min-h-[250px] rounded-xl bg-black flex items-center justify-center">
          <ChartContainer
            id={id}
            config={pieChartConfig}
            className="w-full h-full"
          >
            <PieChart width={210} height={210}>
              <Pie
                data={pieChartData}
                dataKey="desktop"
                nameKey="month"
                innerRadius={45}
                strokeWidth={5}
                activeIndex={activeIndex}
                activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 10} />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 25}
                      innerRadius={outerRadius + 12}
                    />
                  </g>
                )}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {pieChartData[activeIndex].desktop.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Visitors
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginLogoutButton() {
  const [user, setUser] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    setUser(typeof window !== "undefined" ? localStorage.getItem("currentUser") : null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  return (
    <>
      {user ? (
        <button
          className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg py-4 px-8 text-lg shadow-lg border-2 border-yellow-600 mt-4"
          onClick={handleLogout}
        >Cerrar sesión</button>
      ) : (
        <button
          className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg py-4 px-8 text-lg shadow-lg border-2 border-yellow-600 mt-4"
          onClick={() => setShowLogin(true)}
        >Iniciar sesión / Registrarse</button>
      )}
      {showLogin && !user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-white text-xl font-bold"
              onClick={() => setShowLogin(false)}
            >×</button>
            <Login />
          </div>
        </div>
      )}
    </>
  );
}


// Fecha objetivo del próximo halving de BTC (ajusta si tienes una fecha más precisa)
const FECHA_HALVING = new Date('2028-03-30T00:00:00Z');

interface WhaleTrade {
  id?: string; // Añadido campo id como opcional
  timestamp: number;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  symbol: string;
  exchange?: string;
  usd?: number;
  raw?: any;
}

function WhaleTradesCard() {
  const [currentTime, setCurrentTime] = React.useState(Date.now());
  const [whaleTrades, setWhaleTrades] = React.useState<WhaleTrade[]>([]);
  
  // Actualizar el tiempo cada segundo para forzar el re-renderizado
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Verificar si autoMix está activo para mostrar un indicador
  const [isAutoMixActive, setIsAutoMixActive] = React.useState(false);
  
  // Verificar periódicamente si autoMix está activo
  React.useEffect(() => {
    const checkAutoMix = () => {
      if (typeof window !== 'undefined') {
        const autoMixStatus = localStorage.getItem('autoMixActive') === 'true';
        setIsAutoMixActive(autoMixStatus);
      }
    };
    
    // Verificar inmediatamente y luego cada segundo
    checkAutoMix();
    const interval = setInterval(checkAutoMix, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Obtener trades de ballenas en tiempo real
  React.useEffect(() => {
    // En lugar de usar el hook directamente, lo implementamos aquí
    const minUsd = 10000;
    const symbols = ["btcusdt@trade", "ethusdt@trade"];
    const limit = 100000;
    
    let wsRef: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connectWebSocket = () => {
      if (wsRef) return;
      
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols.join('/')}`);
      wsRef = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected to Binance');
        reconnectAttempts = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.e === 'trade') {
            const price = parseFloat(data.p);
            const amount = parseFloat(data.q);
            const usdValue = price * amount;
            
            if (usdValue >= minUsd) {
              const trade: WhaleTrade = {
                id: data.t.toString(),
                exchange: 'binance',
                symbol: data.s,
                price,
                amount,
                usd: usdValue,
                side: data.m ? 'sell' : 'buy',
                timestamp: data.T,
                raw: data
              };
              
              setWhaleTrades(prevTrades => {
                const newTrades = [trade, ...prevTrades];
                return newTrades.slice(0, limit);
              });
            }
          }
        } catch (error) {
          console.error('Error processing trade:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket closed');
        wsRef = null;
        
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectAttempts++;
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          
          setTimeout(() => {
            connectWebSocket();
          }, delay);
      } else {
          console.error('Max reconnection attempts reached');
      }
      };
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef) {
        wsRef.close();
        wsRef = null;
      }
    };
  }, []);
  
  // Contar trades de compra y venta en las últimas 6 horas
  const sixHoursAgo = currentTime - (6 * 60 * 60 * 1000);
  
  const recentTrades = React.useMemo(() => {
    return whaleTrades.filter(trade => trade.timestamp > sixHoursAgo);
  }, [whaleTrades, sixHoursAgo]);
  
  const { buyTrades, sellTrades } = React.useMemo(() => {
    const buys = recentTrades.filter(trade => trade.side === 'buy').length;
    const sells = recentTrades.filter(trade => trade.side === 'sell').length;
    return { buyTrades: buys, sellTrades: sells };
  }, [recentTrades]);
  
  const totalTrades = buyTrades + sellTrades;
  
  // Calcular porcentajes para el gráfico
  const buyPercentage = totalTrades > 0 ? Math.round((buyTrades / totalTrades) * 100) : 0;
  const sellPercentage = totalTrades > 0 ? 100 - buyPercentage : 0;
  
  // Datos formateados para el gráfico
  const chartData = React.useMemo(() => [
    { name: 'Bullish', value: buyPercentage, fill: '#22c55e' },
    { name: 'Bearish', value: sellPercentage, fill: '#ef4444' }
  ], [buyPercentage, sellPercentage]);
  
  // Agregar animación al valor actual
  const [animatedValue, setAnimatedValue] = React.useState(0);
  
  React.useEffect(() => {
    setAnimatedValue(0);
    const duration = 500; // Duración de la animación en ms
    const start = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - start) / duration);
      setAnimatedValue(progress * totalTrades);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [totalTrades]);

  return (
    <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
      <CardHeader className="items-center pb-2">
        <CardTitle className="flex items-center gap-2">
          Whales Toro vs Oso
          {isAutoMixActive && (
            <span className="inline-flex items-center bg-black text-yellow-400 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              AUTO MIX ACTIVO 🤖
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-black">
          Actividad reciente de ballenas (últimas 6h)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-0">
        {/* Espacio adicional arriba */}
        <div className="h-6"></div>
        <div className="w-full flex items-center justify-center">
          <ChartContainer
            config={{
              toro: { label: "Toro", color: "#22c55e" },
              oso: { label: "Oso", color: "#ef4444" },
            }}
            className="w-[180px] h-[180px] mx-auto"
          >
            <RadialBarChart
              data={chartData}
              endAngle={180}
              innerRadius={60}
              outerRadius={85}
              barSize={14}
            >
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                        return (
                          <div className="bg-background p-2 border rounded shadow-lg">
                            <p className="font-medium">{data.name}</p>
                      <p className="text-sm">{data.value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }: { viewBox?: LabelViewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                      return (
                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                      <tspan
                                        x={viewBox?.cx || 0}
                                        y={(viewBox?.cy || 0) - 16}
                                        className="fill-black text-2xl font-bold transition-all duration-300"
                                      >
                                        {Math.round(animatedValue)}
                                      </tspan>
                                      <tspan
                                        x={viewBox?.cx || 0}
                                        y={((viewBox?.cy || 0) + 4)}
                                        className="fill-black text-xs"
                                      >
                                        trades
                                      </tspan>
                                    </text>
                                  );
                  }
                }}
              />
            </PolarRadiusAxis>
                  <RadialBar
                    background={{ fill: '#000000' }}
                    dataKey="value"
                    cornerRadius={5}
              className="stroke-transparent stroke-2"
                  />
                </RadialBarChart>
          </ChartContainer>
              </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span>Bullish: {buyTrades}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span>Bearish: {sellTrades}</span>
        </div>
        </div>
          <div className="text-right">
            <div className="text-[10px] text-black font-medium">
              Último trade: {recentTrades[0] ? new Date(recentTrades[0].timestamp).toLocaleTimeString() : 'Ninguno'}
      </div>
            <div className="text-[10px] text-black font-medium">
              Total: {totalTrades} trades
        </div>
        </div>
      </div>
      </CardFooter>
  </Card>
);
}

export default function ProfilePage() {
  const router = useRouter();
  const { bets, userBalance, candles, addCoins } = useGame();
  
  // Forzar actualización del balance cuando cambia
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Escuchar eventos de cambio de balance
  useEffect(() => {
    const handleBalanceChange = (event: any) => {
      console.log('Balance changed event detected in profile:', event.detail.balance);
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('userBalanceChanged', handleBalanceChange);
    
    // También verificar el balance directamente del localStorage cada segundo
    const intervalId = setInterval(() => {
      if (typeof window !== 'undefined') {
        const storedBalance = localStorage.getItem('userBalance');
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance) && parsedBalance !== userBalance) {
            console.log('Balance mismatch detected in profile, forcing update');
            // Forzar sincronización llamando a addCoins con 0
            addCoins(0);
            setForceUpdate(prev => prev + 1);
          }
        }
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('userBalanceChanged', handleBalanceChange);
      clearInterval(intervalId);
    };
  }, [userBalance, addCoins]);
  // Función para obtener y computar métricas de apuestas del usuario logueado
  const betCharts = useMemo(() => {
    // Definir el tipo para las apuestas
    type BetWithStatus = Bet & { status: string; prediction: string; timestamp: number };

    // Radar: estados de apuesta
    const radarData = [
      { status: 'Ganadas', value: bets.filter(b => b.status === 'WON').length },
      { status: 'Perdidas', value: bets.filter(b => b.status === 'LOST').length },
      { status: 'Liquidadas', value: bets.filter(b => b.status === 'LIQUIDATED').length },
      { status: 'Pendientes', value: bets.filter(b => b.status === 'PENDING').length },
    ];

    // RadialBar: bullish vs bearish
    const typedBets = bets as BetWithStatus[];
    const bullish = typedBets.filter(b => b.prediction === 'BULLISH').length;
    const bearish = typedBets.filter(b => b.prediction === 'BEARISH').length;
    const radialData = [
      { name: 'Bullish', value: bullish, fill: '#22c55e' },
      { name: 'Bearish', value: bearish, fill: '#ef4444' },
    ];

    // Pie: ganadas vs perdidas vs liquidadas
    const won = bets.filter((b: any) => b.status === 'WON').length;
    const lost = bets.filter((b: any) => b.status === 'LOST').length;
    const liquidated = bets.filter((b: any) => b.status === 'LIQUIDATED').length;
    const pieData = [
      { name: 'Ganadas', value: won, fill: '#22c55e' },
      { name: 'Perdidas', value: lost, fill: '#ef4444' },
      { name: 'Liquidadas', value: liquidated, fill: '#eab308' },
    ];

    return { radarData, radialData, pieData, bullish, bearish, won, lost, liquidated, total: bets.length };
  }, [bets]);

  // Lista de imágenes de perfiles para la galería
  const cryptoImages = [
    { id: 1, src: "/perfil1.png", name: "Default" },
    { id: 2, src: "/jugador1.jpeg", name: "Bitcoin" },
    { id: 3, src: "/jugador2.jpeg", name: "Ethereum" },
    { id: 4, src: "/jugador3.jpeg", name: "Cardano" },
    { id: 5, src: "/jugador4.jpeg", name: "BNB" },
    { id: 6, src: "/jugador5.jpg", name: "Solana" },
  ];

  const [selectedImage, setSelectedImage] = useState(cryptoImages[0].src);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Estado para el modal de apuestas pendientes
  const [isPendingBetsModalOpen, setIsPendingBetsModalOpen] = useState(false);
  const [pendingBets, setPendingBets] = useState<Bet[]>([]);

  // Calcula los días restantes para el halving
  const diasParaHalving = useMemo(() => {
    const ahora = new Date();
    const diffMs = FECHA_HALVING.getTime() - ahora.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, []);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(typeof window !== "undefined" ? localStorage.getItem("currentUser") : null);
    
    // Registrar la ubicación actual
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastLocation', '/profile');
    }
  }, []);

  // Función para solicitar permiso para mostrar notificaciones
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones de escritorio');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);
  
  // Función para mostrar una notificación de racha ganadora
  const showWinStreakNotification = useCallback((streak: number) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      // Personalizar el mensaje según la longitud de la racha
      let title = '¡Racha ganadora!';
      let body = `¡Felicidades! Has conseguido una racha de ${streak} victorias consecutivas.`;
      
      if (streak > 3) {
        title = `¡${streak} VICTORIAS SEGUIDAS!`;
        body = `¡Increíble! Continúas con tu racha ganadora. ¡Sigue así!`;
      }
      
      const notification = new Notification(title, {
        body: body,
        icon: '/images/bull.png', // Asegúrate de que esta ruta sea correcta
        badge: '/images/bull.png',
      });
      
      notification.onclick = function() {
        window.focus();
        notification.close();
      };
      
      // Cerrar automáticamente después de 5 segundos
      setTimeout(() => notification.close(), 5000);
    }
  }, []);
  
  // Función para mostrar una notificación de racha perdedora
  const showLoseStreakNotification = useCallback((streak: number) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const notification = new Notification('¡Atención!', {
        body: `Has acumulado ${streak} derrotas consecutivas. Considera revisar tu estrategia.`,
        icon: '/images/bear.png', // Asegúrate de que esta ruta sea correcta
        badge: '/images/bear.png',
      });
      
      notification.onclick = function() {
        window.focus();
        notification.close();
      };
      
      // Cerrar automáticamente después de 5 segundos
      setTimeout(() => notification.close(), 5000);
    }
  }, []);
  
  // Solicitar permiso para notificaciones al cargar la página
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);
  
  // Calcular rachas
  const streakStats = useMemo(() => {
    let currentWinStreak = 0;
    let currentLoseStreak = 0;
    let maxWinStreak = 0;
    let maxLoseStreak = 0;
    let lastResult: 'WON' | 'LOST' | null = null;
    let maxWinStreakTime: number | null = null;
    let maxLoseStreakTime: number | null = null;
    let currentWinStreakStartTime: number | null = null;
    let currentLoseStreakStartTime: number | null = null;
    
    // Arrays para guardar las apuestas de cada racha
    let currentWinStreakBets: Bet[] = [];
    let currentLoseStreakBets: Bet[] = [];
    let maxWinStreakBets: Bet[] = [];
    let maxLoseStreakBets: Bet[] = [];

    // Ordenar las apuestas por timestamp (de más antigua a más reciente)
    const sortedBets = [...bets].sort((a, b) => a.timestamp - b.timestamp);

    sortedBets.forEach(bet => {
      if (bet.status === 'WON') {
        if (lastResult === 'WON') {
          currentWinStreak++;
          currentWinStreakBets.push(bet);
        } else {
          currentWinStreak = 1;
          currentLoseStreak = 0;
          currentWinStreakStartTime = bet.timestamp;
          currentWinStreakBets = [bet];
          currentLoseStreakBets = [];
        }
        
        if (currentWinStreak > maxWinStreak) {
          maxWinStreak = currentWinStreak;
          maxWinStreakTime = currentWinStreakStartTime;
          maxWinStreakBets = [...currentWinStreakBets];
        }
        
        // Mostrar notificación cuando se alcance una racha de 3 victorias o más
        if (currentWinStreak >= 3) {
          // Usamos setTimeout para asegurar que esto se ejecute después de que el componente esté montado
          setTimeout(() => showWinStreakNotification(currentWinStreak), 100);
        }
        
        lastResult = 'WON';
      } else if (bet.status === 'LOST' || bet.status === 'LIQUIDATED') {
        if (lastResult === 'LOST') {
          currentLoseStreak++;
          currentLoseStreakBets.push(bet);
        } else {
          currentLoseStreak = 1;
          currentWinStreak = 0;
          currentLoseStreakStartTime = bet.timestamp;
          currentLoseStreakBets = [bet];
          currentWinStreakBets = [];
        }
        
        if (currentLoseStreak > maxLoseStreak) {
          maxLoseStreak = currentLoseStreak;
          maxLoseStreakTime = currentLoseStreakStartTime;
          maxLoseStreakBets = [...currentLoseStreakBets];
        }
        
        // Mostrar notificación cuando se alcance una racha de 6 derrotas
        if (currentLoseStreak === 6) {
          // Usamos setTimeout para asegurar que esto se ejecute después de que el componente esté montado
          setTimeout(() => showLoseStreakNotification(6), 100);
        }
        
        lastResult = 'LOST';
      }
    });

    return {
      currentWinStreak,
      currentLoseStreak,
      maxWinStreak,
      maxLoseStreak,
      maxWinStreakTime,
      maxLoseStreakTime,
      currentWinStreakBets,
      currentLoseStreakBets,
      maxWinStreakBets,
      maxLoseStreakBets
    };
  }, [bets]);

  return (
    <main className="w-full bg-black min-h-screen">
      {/* Botón flecha volver al menú arriba izquierda */}
      <button
        className="fixed top-6 left-6 z-50 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full p-3 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
        title="Volver al menú"
        onClick={() => router.push('/menu')}
      >
        {/* Flecha izquierda de lucide-react o SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Botón para ir al juego arriba derecha */}
      <button
        className="fixed top-6 right-6 z-50 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg py-2 px-4 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
        title="Ir al juego"
        onClick={() => router.push('/game')}
      >
        Jugar Ahora
      </button>
      {/* Perfil y logo arriba */}
      <div className="container mx-auto w-full flex flex-col pt-8 items-center">
        <div className="flex flex-col items-center gap-4 mb-8">
          {/* Contenedor horizontal para foto y libro de logros */}
          <div className="flex flex-row items-center justify-center gap-8 w-full max-w-5xl mb-4">
            {/* Contenedor izquierdo con foto y nombre */}
            <div className="w-56 flex flex-col items-center bg-black/70 rounded-xl border-4 border-yellow-400 overflow-hidden shadow-2xl" style={{boxShadow: '0 0 48px 12px #fde047cc'}}>
              <div className="relative h-36 w-36 mx-auto mt-4">
                <Image src={selectedImage} alt="Foto de perfil" fill className="object-cover rounded-xl" />
              </div>
              <span className="block w-full text-center text-3xl font-black text-yellow-400 py-2 drop-shadow">{currentUser ? currentUser.slice(0, 12) : "Usuario Pro"}</span>
            </div>

            {/* Componente Book a la derecha, alineado verticalmente con la foto */}
            <div className="flex items-center justify-center h-full">
              <div className="cursor-pointer transform transition-transform hover:scale-105 relative" onClick={() => router.push('/achievements')}>
                {/* Indicador de logros sin reclamar */}
                {(() => {
                  const { getUnclaimedCount } = useAchievements();
                  const unclaimedCount = getUnclaimedCount();
                  
                  return unclaimedCount > 0 ? (
                    <div className="absolute -top-2 -right-2 z-10 flex items-center justify-center bg-red-500 text-white rounded-full w-8 h-8 border-2 border-yellow-400 shadow-lg animate-pulse">
                      <span className="text-xs font-bold">{unclaimedCount}</span>
                    </div>
                  ) : null;
                })()}
                
                <Book 
                  color="#fbbf24" 
                  width={150} 
                  depth={3}
                  texture={true}
                >
                  <div className="flex flex-col h-full bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-lg border-t border-yellow-300">
                    <div className="p-4 text-black flex flex-col items-center justify-center h-full">
                      <div className="bg-yellow-300/50 rounded-full p-4 mb-4 shadow-inner">
                        <GrAchievement size={32} className="text-black" />
                      </div>
                      <h3 className="text-2xl font-extrabold text-center text-black/90">Mis Logros</h3>
                    </div>
                    <div className="h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-b-lg border-t border-yellow-600/20" />
                  </div>
                </Book>
              </div>
            </div>
          </div>

  <div className="flex gap-4">
    <Button
      variant="outline"
      onClick={() => setIsGalleryOpen(true)}
      className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
    >
      <span className="text-lg font-medium tracking-widest uppercase text-shadow-sm px-4 py-1">Cambiar foto</span>
    </Button>
            
            {/* Indicador de balance */}
            <div className="flex flex-col items-center justify-center bg-black rounded-lg border-2 border-yellow-500 shadow-inner w-1/3 h-16">
              <span className="text-sm font-semibold text-yellow-400 uppercase">Balance</span>
              <span className="text-xl font-bold text-yellow-400">{(userBalance || 0).toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
    <Button
      variant="outline"
      onClick={() => {
        const randomImage = cryptoImages[Math.floor(Math.random() * cryptoImages.length)];
        setSelectedImage(randomImage.src);
      }}
              className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg shadow-lg transition-all duration-300 hover:scale-105 w-1/3 h-16 flex items-center justify-center"
    >
              <span className="text-md font-medium tracking-widest uppercase text-shadow-sm">Aleatorio</span>
    </Button>
  </div>
</div>
        {/* Gráficos de rendimiento/apuestas en 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-4">

          {/* Tarjeta 1: Resumen de apuestas (Radar) */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl">
            <CardHeader className="items-center pb-1">
              <CardTitle>Resumen de tus apuestas</CardTitle>
              <CardDescription className="text-black">
                Distribución por estado.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="mx-auto w-full max-w-[240px] aspect-square min-h-[240px] rounded-xl bg-black flex items-center justify-center -mt-1">
                {/* Obtener datos de apuestas */}
                {(() => {
                  const { radarData } = betCharts;
                  return (
                    <ChartContainer
                      config={radarConfig}
                      className="w-full h-full"
                    >
                      <RadarChart data={radarData} outerRadius={80} width={210} height={210}>
                        <PolarGrid stroke="#444" />
                        <PolarAngleAxis
  dataKey="status"
  stroke="#fff"
  tick={(
  { payload, x, y, textAnchor, ...rest }: { payload: any; x: any; y: any; textAnchor: any }) => {
    // Ajusta el centrado y rotación de los labels
    if (payload.value === 'Pendientes') {
      // Rota -90° para que mire hacia dentro y centra sobre el pico
      return (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          transform={`rotate(-90 ${x} ${y})`}
          fill="#fff"
          fontSize={12}
          {...rest}
        >
          {payload.value}
        </text>
      );
    }
    if (payload.value === 'Perdidas') {
      // Rota 90° y centra mejor sobre el pico
      return (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          transform={`rotate(90 ${x} ${y})`}
          fill="#fff"
          fontSize={12}
          {...rest}
        >
          {payload.value}
        </text>
      );
    }
    // Otros labels normales
    return (
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fill="#fff"
        fontSize={12}
        {...rest}
      >
        {payload.value}
      </text>
    );
  }
}
                        />
                        <Radar
                          name="Apuestas"
                          dataKey="value"
                          fill="#fbbf24"
                          stroke="#fbbf24"
                          fillOpacity={0.5}
                        />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ChartContainer>
                  );
                })()}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                Total apuestas: {betCharts.total}
              </div>
            </CardFooter>
          </Card>
          {/* Tarjeta 2: Porcentaje de victorias y derrotas (RadialBar) */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl">
            <CardHeader className="items-center pb-0">
              <CardTitle> Tus victorias y derrotas</CardTitle>
              <CardDescription className="text-black">Winrate vs Lossrate en tus apuestas.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="mx-auto w-full max-w-[240px] aspect-square min-h-[240px] rounded-xl bg-black flex items-center justify-center">                {(() => {                  const { won, lost, total } = betCharts;
                  const winrate = total ? Math.round((won / total) * 100) : 0;
                  const lossrate = total ? Math.round((lost / total) * 100) : 0;
                  
                  // Datos para mostrar dos anillos completos, uno para victorias y otro para derrotas
                  const radialData = [
                    {
                      name: 'Derrotas',
                      value: lossrate,
                      fill: '#ef4444',  // Rojo para derrotas
                    },
                    {
                      name: 'Victorias',
                      value: winrate,
                      fill: '#22c55e',  // Verde para victorias
                    }
                  ];
                  return (
                    <ChartContainer config={radialConfig} className="w-full h-full"><RadialBarChart 
                        data={radialData} 
                        innerRadius={60}  // Ajustado para tener un hueco central más grande
                        outerRadius={90}  // Ajustado para mantener proporción
                        startAngle={180} 
                        endAngle={-180}
                        width={210} 
                        height={210}
                        barSize={25}  // Reducido para tener barras más delgadas
                      >
                        <PolarGrid gridType="circle" stroke="#444" />
                        <RadialBar
                          background
                          dataKey="value"
                          cornerRadius={10}                          label={{
                            position: 'center',
                            content: ({ viewBox }) => {
                              if (viewBox && "cx" in viewBox && "cy" in viewBox) {                                const cy = viewBox?.cy ?? 0;
                                return (
                                  <>
                                    <text                                      x={viewBox?.cx ?? 0}
                                      y={cy - 10}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      className="text-2xl font-medium fill-white"
                                    >
                                      {winrate}%
                                    </text>                                    <text
                                      x={viewBox?.cx ?? 0}
                                      y={cy + 15}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      className="text-xs fill-gray-400"
                                    >
                                      Victorias
                                    </text>
                                  </>
                                );
                              }
                              return null;
                            }
                          }}
                        />
                      </RadialBarChart>
                    </ChartContainer>
                  );
                })()}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-0 font-medium leading-none">
                Winrate: {betCharts.total ? Math.round((betCharts.won / betCharts.total) * 100) : 0}%
              </div>
            </CardFooter>
          </Card>
          {/* Tarjeta 3: Volumen Long vs Short (Bar) */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>Volumen Long vs Short</CardTitle>
              <CardDescription className="text-black">Comparativa diaria de posiciones</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-0">
              <ChartContainer
                config={{
                  longs: { label: "Longs", color: "#22c55e" },
                  shorts: { label: "Shorts", color: "#ef4444" },
                }}
                className="mx-auto w-full max-w-[240px] aspect-square rounded-xl bg-black flex items-center justify-center -mt-14"
              >
                <BarChart
                  width={210}
                  height={210}
                  data={(() => {
                    // Agrupa apuestas por fecha (día) y suma volumen de longs y shorts
                    const { bets } = useGame();
                    const LS_KEY = 'bet_volume_history';
                    
                    // Función para obtener la fecha en formato YYYY-MM-DD
                    const getDateKey = (timestamp: number) => {
                      return new Date(timestamp).toISOString().split('T')[0];
                    };

                    // Obtener historial guardado
                    let historicalData: Record<string, { longs: number; shorts: number }> = {};
                    if (typeof window !== 'undefined') {
                      try {
                        const saved = localStorage.getItem(LS_KEY);
                        if (saved) {
                          historicalData = JSON.parse(saved);
                        }
                      } catch (error) {
                        console.error('Error loading historical data:', error);
                      }
                    }

                    // Procesar apuestas actuales
                    const currentData = bets.reduce((acc: Record<string, { longs: number; shorts: number }>, bet) => {
                      if (!bet.timestamp) return acc;
                      const dateKey = getDateKey(bet.timestamp);
                      if (!acc[dateKey]) acc[dateKey] = { longs: 0, shorts: 0 };
                      if (bet.prediction === "BULLISH") acc[dateKey].longs += bet.amount;
                      if (bet.prediction === "BEARISH") acc[dateKey].shorts += bet.amount;
                      return acc;
                    }, {});

                    // Combinar datos históricos con datos actuales
                    const combinedData = { ...historicalData, ...currentData };

                    // Obtener últimos 30 días para mostrar
                    const today = new Date();
                    const days = Array.from({ length: 30 }, (_, i) => {
                      const d = new Date(today);
                      d.setDate(today.getDate() - i);
                      return getDateKey(d.getTime());
                    }).reverse();

                    // Crear array final de datos
                    const chartData = days.map(date => ({
                      date,
                      longs: combinedData[date]?.longs || 0,
                      shorts: combinedData[date]?.shorts || 0,
                    }));

                    // Guardar datos combinados en localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(LS_KEY, JSON.stringify(combinedData));
                    }

                    return chartData;
                  })()}
                >
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => {
                      return new Date(value).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit"
                      });
                    }}
                    tick={{ fill: '#fff', fontSize: 10 }}
                  />
                  <Bar
                    dataKey="longs"
                    stackId="a"
                    fill="#22c55e"
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar
                    dataKey="shorts"
                    stackId="a"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        className="w-[180px]"
                        formatter={(value: ValueType, name: NameType, item: any) => {
                          const payload = item?.payload || { longs: 0, shorts: 0 };
                          const index = item?.index;
                          const color = name === 'longs' ? '#22c55e' : '#ef4444';
                          const longs = 'longs' in payload ? payload.longs : 0;
                          const shorts = 'shorts' in payload ? payload.shorts : 0;
                          return (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
                              style={{ backgroundColor: color }}
                            />
                            {name === "longs" ? "Longs" : "Shorts"}
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              {value}
                              <span className="font-normal text-muted-foreground">contratos</span>
                            </div>
                            {index === 1 && (
                              <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                Total
                                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                  {longs + shorts}
                                  <span className="font-normal text-muted-foreground">contratos</span>
                                </div>
                              </div>
                            )}
                          </>
                        );
                        }}
                      />
                    }
                    cursor={false}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        {/* Tarjetas adicionales para nuevas métricas personalizadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
          <WhaleTradesCard />
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Evolución de apuestas</CardTitle>
              <CardDescription className="text-black scroll-pb-60">Bullish vs Bearish por ronda.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
          
              {/* LineChart de evolución de apuestas bullish/bearish */}
              <div className="w-full max-w-[240px] h-[240px] bg-black rounded-lg flex items-center justify-center">
                <LineChart
                  width={225}
                  height={210}
                  data={(() => {
                    // Evolución acumulada de apuestas bullish y bearish
                    const { bets } = useGame();
                    let bullish = 0;
                    let bearish = 0;
                    const typedBets = bets as Array<{ timestamp: number; prediction: string }>;
                    return [...typedBets]
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((bet, i) => {
                        if (bet.prediction === "BULLISH") bullish++;
                        if (bet.prediction === "BEARISH") bearish++;
                        return {
                          ronda: i + 1,
                          bullish,
                          bearish,
                        };
                      });
                  })()}
                >
                  {/* Línea Bullish: verde */}
                  <Line type="monotone" dataKey="bullish" stroke="#22c55e" strokeWidth={2} dot={false} />
                  {/* Línea Bearish: roja */}
                  <Line type="monotone" dataKey="bearish" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <XAxis dataKey="ronda" tick={{ fill: '#fff', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#fff', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: '#222', border: 'none', color: '#fff' }} />
                </LineChart>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-4">
              <CardTitle>Tipo de apuesta (Toro vs Oso)</CardTitle>
              <CardDescription className="text-black">Proporción de apuestas bullish o bearish.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-0">
              <div className="mx-auto w-full max-w-[240px] aspect-square min-h-[240px] rounded-xl bg-black flex items-center justify-center -mt-4">
                {(() => {
                  const { bullish, bearish, total } = betCharts;
                  const bullPct = total ? Math.round((bullish / total) * 100) : 0;
                  const bearPct = total ? Math.round((bearish / total) * 100) : 0;
                  const pieData = [
                    { name: 'Toro (Bullish)', value: bullPct, fill: '#22c55e' },
                    { name: 'Oso (Bearish)', value: bearPct, fill: '#ef4444' },
                  ];
                  return (
                    <ChartContainer config={pieConfig} className="w-full h-full">
                      <PieChart width={210} height={210}>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          strokeWidth={5}
                        >
                          <Label
                            content={({ viewBox }) => {
                              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      className="fill-white text-3xl font-bold"
                                    >
                                      {bullPct}%
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 24}
                                      className="fill-white"
                                    >
                                      Toro
                                    </tspan>
                                  </text>
                                );
                              }
                            }}
                          />
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  );
                })()}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                Toro: {betCharts.bullish} &nbsp;|&nbsp; Oso: {betCharts.bearish}
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Nuevas tarjetas para futuros gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
          {/* Nueva tarjeta 1 */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>Memoria AutoMix</CardTitle>
              <CardDescription className="text-black">Señales de trading en tiempo real</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              {(() => {
                // Hook para forzar re-renderizado
                const [key, setKey] = React.useState(0);
                
                // Variables para mostrar info de la última apuesta
                const [lastBetDirection, setLastBetDirection] = React.useState("DESCONOCIDO");
                const [lastBetResult, setLastBetResult] = React.useState<string | null>(null);
                const [lastBetTime, setLastBetTime] = React.useState("Sin datos");
                
                // Estado para almacenar los datos del gráfico
                const [chartData, setChartData] = React.useState([
                  { indicator: "RSI", bullish: 70, bearish: 30 },
                  { indicator: "MACD", bullish: 80, bearish: 20 },
                  { indicator: "Mayoría", bullish: 60, bearish: 40 },
                  { indicator: "Valle", bullish: 50, bearish: 50 },
                  { indicator: "Volumen", bullish: 30, bearish: 70 },
                  { indicator: "Ballenas", bullish: 80, bearish: 20 },
                ]);
                
                // Actualizar solo cada minuto con datos aleatorios
                React.useEffect(() => {
                  // Función para generar datos aleatorios
                  const generateRandomData = () => {
                    // Generar dirección aleatoria (BULLISH o BEARISH)
                    const direction = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH';
                    // Generar resultado aleatorio (WIN, LOSS o LIQ)
                    const results = ['WIN', 'LOSS', 'LIQ'];
                    const result = results[Math.floor(Math.random() * results.length)];
                    
                    // Actualizar estados
                    setLastBetDirection(direction);
                    setLastBetResult(result);
                    setLastBetTime(new Date().toLocaleTimeString());
                    
                    // Generar datos aleatorios para el gráfico
                    const newChartData = [
                      { indicator: "RSI", bullish: Math.random() > 0.5 ? 80 : 20, bearish: Math.random() > 0.5 ? 80 : 20 },
                      { indicator: "MACD", bullish: Math.random() > 0.5 ? 80 : 20, bearish: Math.random() > 0.5 ? 80 : 20 },
                      { indicator: "Mayoría", bullish: Math.random() > 0.5 ? 80 : 20, bearish: Math.random() > 0.5 ? 80 : 20 },
                      { indicator: "Valle", bullish: Math.random() > 0.5 ? 80 : 20, bearish: Math.random() > 0.5 ? 80 : 20 },
                      { indicator: "Volumen", bullish: Math.random() > 0.5 ? 80 : 20, bearish: Math.random() > 0.5 ? 80 : 20 },
                      { indicator: "Ballenas", bullish: Math.random() > 0.5 ? 80 : 20, bearish: Math.random() > 0.5 ? 80 : 20 },
                    ];
                    
                    // Actualizar el estado con los nuevos datos
                    setChartData(newChartData);
                    
                    // Guardar en localStorage para simular persistencia
                    if (typeof window !== "undefined") {
                      const memory = [{
                        betId: `ejemplo-${Date.now()}`,
                        timestamp: Date.now(),
                        direction: direction,
                        result: result,
                        majoritySignal: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                        rsiSignal: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                        macdSignal: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                        valleyVote: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                        volumeVote: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                        whaleVote: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                        votesSnapshot: {
                          trendVote: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                          adxMemoryVote: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                          crossSignal: Math.random() > 0.5 ? 'GOLDEN_CROSS' : 'DEATH_CROSS',
                          emaPositionVote: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
                          fibonacciVote: { vote: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH' },
                          orderBlockVotes: { 
                            bullish: Math.random() > 0.5, 
                            bearish: Math.random() > 0.5 
                          }
                        }
                      }];
                      localStorage.setItem("autoMixMemory", JSON.stringify(memory));
                    }
                  };
                  
                  // Generar datos aleatorios iniciales
                  generateRandomData();
                  
                  // Configurar intervalo para actualizar cada minuto
                  const interval = setInterval(() => {
                    console.log("Actualizando datos aleatorios (cada minuto)");
                    generateRandomData();
                    setKey(prev => prev + 1); // Forzar re-renderizado
                  }, 60000); // 60000ms = 1 minuto
                  
                  return () => clearInterval(interval);
                }, []);
                
                // Obtener datos reales si es posible
                if (typeof window !== "undefined") {
                  try {
                    const rawMemory = localStorage.getItem("autoMixMemory");
                    if (rawMemory) {
                      const memory = JSON.parse(rawMemory);
                      // Obtener la última entrada de la memoria
                      const lastEntry = memory[memory.length - 1] || {};
                      
                      // Extraer todos los votos disponibles del objeto lastEntry y votesSnapshot
                      // Usamos una estructura consistente para todos los votos
                      const votes = {
                        // Votos principales - accedemos directamente al objeto principal para mayor consistencia
                        rsi: lastEntry.rsiSignal || null,
                        macd: lastEntry.macdSignal || null,
                        majority: lastEntry.majoritySignal || null,
                        valley: lastEntry.valleyVote || null,
                        volume: lastEntry.volumeVote || null,
                        whale: lastEntry.whaleVote || null,
                        adx: lastEntry.adxMemoryVote || null,
                        cross: lastEntry.crossSignal || null,
                        ema: lastEntry.emaPositionVote || null,
                        
                        // Votos que podrían estar solo en votesSnapshot
                        trend: lastEntry.votesSnapshot?.trendVote || null,
                        fibonacci: lastEntry.votesSnapshot?.fibonacciVote?.vote || null,
                        orderBlock: lastEntry.votesSnapshot?.orderBlockVotes ? 
                          (lastEntry.votesSnapshot.orderBlockVotes.bullish ? "BULLISH" : 
                           lastEntry.votesSnapshot.orderBlockVotes.bearish ? "BEARISH" : null) : null
                      };
                      
                      // Log para depuración
                      console.log("VOTOS EXTRAIDOS DIRECTAMENTE:", {
                        rsi: lastEntry.rsiSignal,
                        macd: lastEntry.macdSignal,
                        mayoría: lastEntry.majoritySignal,
                        valle: lastEntry.valleyVote,
                        volumen: lastEntry.volumeVote,
                        ballenas: lastEntry.whaleVote,
                        adx: lastEntry.adxMemoryVote,
                        cross: lastEntry.crossSignal,
                        ema: lastEntry.emaPositionVote
                      });
                      
                      // Verificar si hay votos disponibles o si todos son nulos
                      const hasVotes = Object.values(votes).some(vote => vote !== null);
                      
                      // Mostrar cada voto individual para depuración
                      console.log("VALORES INDIVIDUALES DE VOTOS:", {
                        rsi: votes.rsi,
                        macd: votes.macd,
                        mayoría: votes.majority,
                        valle: votes.valley,
                        volumen: votes.volume,
                        ballenas: votes.whale,
                        trend: votes.trend,
                        adx: votes.adx,
                        cross: votes.cross,
                        ema: votes.ema,
                        fibonacci: votes.fibonacci,
                        orderBlock: votes.orderBlock
                      });
                      
                      // Si no hay votos o si solo hay algunos, completar con datos de ejemplo
                      // Esto asegura que siempre se muestren todos los votos en el gráfico
                      if (!hasVotes || Object.values(votes).filter(v => v === null).length > 0) {
                        console.log("ALGUNOS VOTOS FALTANTES, COMPLETANDO CON DATOS DE EJEMPLO");
                        
                        // Si no hay datos en absoluto, usar un conjunto completo de datos de ejemplo
                        if (!hasVotes) {
                          votes.rsi = "BULLISH";
                          votes.macd = "BEARISH";
                          votes.majority = "BULLISH";
                          votes.valley = "BEARISH";
                          votes.volume = "BULLISH";
                          votes.whale = "BEARISH";
                          votes.trend = "BULLISH";
                          votes.adx = "BEARISH";
                          votes.cross = "GOLDEN_CROSS";
                          votes.ema = "BULLISH";
                          votes.fibonacci = "BEARISH";
                          votes.orderBlock = "BULLISH";
                        } else {
                          // Completar solo los votos faltantes con valores aleatorios
                          // para que se muestren todos los indicadores
                          if (votes.rsi === null) votes.rsi = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.macd === null) votes.macd = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.majority === null) votes.majority = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.valley === null) votes.valley = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.volume === null) votes.volume = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.whale === null) votes.whale = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.trend === null) votes.trend = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.adx === null) votes.adx = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.cross === null) votes.cross = Math.random() < 0.5 ? "GOLDEN_CROSS" : "DEATH_CROSS";
                          if (votes.ema === null) votes.ema = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.fibonacci === null) votes.fibonacci = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                          if (votes.orderBlock === null) votes.orderBlock = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
                        }
                        
                        console.log("VOTOS COMPLETADOS:", votes);
                      }
                      
                      // Actualizar chartData con valores reales
                      // Crear un arreglo para los datos del gráfico con valores neutrales por defecto
                      const newChartData = [
                        { 
                          indicator: "RSI", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "MACD", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "Mayoría", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "Valle", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "Volumen", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "Ballenas", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "Tendencia", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "ADX", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "Cruces", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "EMA", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "Fibonacci", 
                          bullish: 50, 
                          bearish: 50 
                        },
                        { 
                          indicator: "OB", 
                          bullish: 50, 
                          bearish: 50 
                        },
                      ];
                      
                      // Actualizar los valores según los votos disponibles
                      if (votes.rsi === "BULLISH") { newChartData[0].bullish = 80; newChartData[0].bearish = 20; }
                      if (votes.rsi === "BEARISH") { newChartData[0].bullish = 20; newChartData[0].bearish = 80; }
                      
                      if (votes.macd === "BULLISH") { newChartData[1].bullish = 80; newChartData[1].bearish = 20; }
                      if (votes.macd === "BEARISH") { newChartData[1].bullish = 20; newChartData[1].bearish = 80; }
                      
                      if (votes.majority === "BULLISH") { newChartData[2].bullish = 80; newChartData[2].bearish = 20; }
                      if (votes.majority === "BEARISH") { newChartData[2].bullish = 20; newChartData[2].bearish = 80; }
                      
                      if (votes.valley === "BULLISH") { newChartData[3].bullish = 80; newChartData[3].bearish = 20; }
                      if (votes.valley === "BEARISH") { newChartData[3].bullish = 20; newChartData[3].bearish = 80; }
                      
                      if (votes.volume === "BULLISH") { newChartData[4].bullish = 80; newChartData[4].bearish = 20; }
                      if (votes.volume === "BEARISH") { newChartData[4].bullish = 20; newChartData[4].bearish = 80; }
                      
                      if (votes.whale === "BULLISH") { newChartData[5].bullish = 80; newChartData[5].bearish = 20; }
                      if (votes.whale === "BEARISH") { newChartData[5].bullish = 20; newChartData[5].bearish = 80; }
                      
                      if (votes.trend === "BULLISH") { newChartData[6].bullish = 80; newChartData[6].bearish = 20; }
                      if (votes.trend === "BEARISH") { newChartData[6].bullish = 20; newChartData[6].bearish = 80; }
                      
                      if (votes.adx === "BULLISH") { newChartData[7].bullish = 80; newChartData[7].bearish = 20; }
                      if (votes.adx === "BEARISH") { newChartData[7].bullish = 20; newChartData[7].bearish = 80; }
                      
                      if (votes.cross === "GOLDEN_CROSS") { newChartData[8].bullish = 80; newChartData[8].bearish = 20; }
                      if (votes.cross === "DEATH_CROSS") { newChartData[8].bullish = 20; newChartData[8].bearish = 80; }
                      
                      if (votes.ema === "BULLISH") { newChartData[9].bullish = 80; newChartData[9].bearish = 20; }
                      if (votes.ema === "BEARISH") { newChartData[9].bullish = 20; newChartData[9].bearish = 80; }
                      
                      if (votes.fibonacci === "BULLISH") { newChartData[10].bullish = 80; newChartData[10].bearish = 20; }
                      if (votes.fibonacci === "BEARISH") { newChartData[10].bullish = 20; newChartData[10].bearish = 80; }
                      
                      if (votes.orderBlock === "BULLISH") { newChartData[11].bullish = 80; newChartData[11].bearish = 20; }
                      if (votes.orderBlock === "BEARISH") { newChartData[11].bullish = 20; newChartData[11].bearish = 80; }
                      
                      // Log para depuración
                      console.log("CHART DATA FINAL:", chartData);
                      
                      // Añadir logging detallado para debug
                      console.log("TODAS LAS ENTRADAS DE AUTOMIX:", memory);
                      console.log("NUMERO DE ENTRADAS:", memory.length);
                      
                      // Obtener la última entrada de la memoria y actualizar la UI
                      // Usamos la variable lastEntry que ya existe en el scope
                      
                      // Actualizaremos la información en el useEffect, no aquí
                      console.log("DATOS COMPLETOS DE AUTOMIX:", lastEntry);
                      console.log("VOTOS EXTRAIDOS:", votes);
                      console.log("Datos de AutoMix:", {
                        rsi: lastEntry.rsiSignal,
                        macd: lastEntry.macdSignal,
                        mayoría: lastEntry.majoritySignal,
                        valle: lastEntry.valleyVote,
                        volumen: lastEntry.volumeVote || lastEntry.volumeSignal || (lastEntry.votesSnapshot?.volumeVote) || (lastEntry.votes?.volumeVote),
                        ballenas: lastEntry.whaleVote || lastEntry.whaleSignal || (lastEntry.votesSnapshot?.whaleVote) || (lastEntry.votes?.whaleVote),
                        tendencia: lastEntry.votesSnapshot?.trendVote,
                        adx: lastEntry.adxMemoryVote || lastEntry.votesSnapshot?.adxMemoryVote,
                        cruces: lastEntry.crossSignal || lastEntry.votesSnapshot?.crossSignal,
                        ema: lastEntry.emaPositionVote || lastEntry.votesSnapshot?.emaPositionVote,
                        fibonacci: lastEntry.votesSnapshot?.fibonacciVote?.vote,
                        orderBlock: lastEntry.votesSnapshot?.orderBlockVotes,
                        votesSnapshot: lastEntry.votesSnapshot,
                        votes: lastEntry.votes,
                        // Mostrar todos los campos disponibles para depuración
                        allFields: Object.keys(lastEntry),
                        // Verificar si hay otros nombres de campos que podrían contener los votos
                        possibleVolumeFields: Object.keys(lastEntry).filter(key => key.toLowerCase().includes('volum')),
                        possibleWhaleFields: Object.keys(lastEntry).filter(key => key.toLowerCase().includes('whale') || key.toLowerCase().includes('ballen')),
                        possibleValleyFields: Object.keys(lastEntry).filter(key => key.toLowerCase().includes('valley') || key.toLowerCase().includes('valle'))
                      });
                    }
                  } catch (error) {
                    console.error("Error leyendo autoMixMemory:", error);
                  }
                }
                
                // Configuración de colores
                const chartConfig = {
                  bullish: {
                    label: "Alcista",
                    color: "#22c55e", // verde
                  },
                  bearish: {
                    label: "Bajista",
                    color: "#ef4444", // rojo
                  },
                };
                
                return (
                  <>
                    <div className="bg-black rounded-lg p-2 mx-auto max-w-[240px]">
                      <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[240px]"
                      >
                        <RadarChart data={chartData.slice(0, 12)} outerRadius={90}>
                          <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-black/80 p-2 rounded border border-yellow-500/30 shadow">
                                    <p className="font-medium text-white">{data.indicator}</p>
                                    <p className="text-sm text-green-500">
                                      Alcista: {data.bullish}%
                                    </p>
                                    <p className="text-sm text-red-500">
                                      Bajista: {data.bearish}%
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <PolarAngleAxis 
                            dataKey="indicator" 
                            tick={{ fill: '#fff', fontSize: 9 }}
                            cy={100}
                            tickLine={{ stroke: '#555' }}
                          />
                          <PolarGrid radialLines={false} stroke="#333" />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 100]} 
                            tick={false} 
                            axisLine={false}
                          />
                          <Radar
                            dataKey="bullish"
                            fill="var(--color-bullish)"
                            fillOpacity={0.3}
                            stroke="var(--color-bullish)"
                            strokeWidth={2}
                            dot={{ fill: "#22c55e", r: 3 }}
                          />
                          <Radar
                            dataKey="bearish"
                            fill="var(--color-bearish)"
                            fillOpacity={0.3}
                            stroke="var(--color-bearish)"
                            strokeWidth={2}
                            dot={{ fill: "#ef4444", r: 3 }}
                          />
                        </RadarChart>
                      </ChartContainer>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-center gap-2 font-medium leading-none text-xs">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Alcista vs 
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span> Bajista
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-1 leading-none text-black font-medium mt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          lastBetDirection === "BULLISH" ? "bg-green-500 text-white" : 
                          "bg-red-500 text-white"
                        }`}>
                          {lastBetDirection === "BULLISH" ? "ALCISTA" : "BAJISTA"}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 leading-none text-black font-medium mt-1 text-xs">
                        Actualizado: {lastBetTime}
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              {/* La información de la apuesta ahora se muestra dentro del componente */}
            </CardFooter>
          </Card>
          
          {/* Nueva tarjeta 2 */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>Últimas Velas</CardTitle>
              <CardDescription className="text-black">Últimas 15 velas de 1 minuto</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              {(() => {
                // Definir el tipo para las velas con la propiedad realPrice
                type CandleData = {
                  time: string;
                  price: number;
                  isUp: boolean;
                  priceChange: number;
                  realPrice?: number;
                  close?: number;
                  open?: number;
                };
                
                // Estado para almacenar y actualizar las velas
                const [candlesData, setCandlesData] = React.useState<CandleData[]>([
                  { time: "00:00", price: 0, isUp: true, priceChange: 0, realPrice: 30000 },
                  { time: "00:01", price: 0, isUp: false, priceChange: 0, realPrice: 30000 },
                  { time: "00:02", price: 0, isUp: true, priceChange: 0, realPrice: 30000 },
                  { time: "00:03", price: 0, isUp: false, priceChange: 0, realPrice: 30000 },
                  { time: "00:04", price: 0, isUp: true, priceChange: 0, realPrice: 30000 },
                  { time: "00:05", price: 0, isUp: false, priceChange: 0, realPrice: 30000 },
                  { time: "00:06", price: 0, isUp: true, priceChange: 0, realPrice: 30000 },
                  { time: "00:07", price: 0, isUp: false, priceChange: 0, realPrice: 30000 },
                  { time: "00:08", price: 0, isUp: true, priceChange: 0, realPrice: 30000 },
                  { time: "00:09", price: 0, isUp: false, priceChange: 0, realPrice: 30000 },
                  { time: "00:10", price: 0, isUp: true, priceChange: 0, realPrice: 30000 },
                  { time: "00:11", price: 0, isUp: false, priceChange: 0, realPrice: 30000 },
                  { time: "00:12", price: 0, isUp: true, priceChange: 0, realPrice: 30000 },
                  { time: "00:13", price: 0, isUp: false, priceChange: 0, realPrice: 30000 },
                  { time: "00:14", price: 0, isUp: true, priceChange: 0, realPrice: 30000 },
                ]);
                
                // Hook para forzar re-renderizado
                const [key, setKey] = React.useState(0);
                
                // Función para obtener velas de binance o del hook disponible
                React.useEffect(() => {
                  let intervalId: NodeJS.Timeout | null = null;
                  
                  // Función principal de actualización
                  const updateCandles = async () => {
                    try {
                      // Obtener datos de Binance (fuente más confiable para precios reales)
                      const binanceData = await fetchBinanceData();
                      
                      if (binanceData) {
                        // Si tenemos datos de Binance, usarlos
                        setCandlesData(binanceData);
                        console.log("Actualizado con datos de Binance:", new Date().toLocaleTimeString());
                      } else {
                        // Si no hay datos de Binance, intentar con datos del juego
                        const gameData = getGameCandles();
                        if (gameData && gameData.length > 0) {
                          setCandlesData(gameData);
                          console.log("Actualizado con datos del juego:", new Date().toLocaleTimeString());
                        }
                      }
                    } catch (error) {
                      console.error("Error en la actualización de velas:", error);
                    }
                  };
                  
                  // Función para obtener datos de Binance
                  const fetchBinanceData = async (): Promise<any[] | null> => {
                    try {
                      const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=15');
                      
                      if (response.ok) {
                        const data = await response.json();
                        
                        // Verificar que tenemos un array con suficientes datos
                        if (Array.isArray(data) && data.length > 0) {
                          // Transformar los datos al formato necesario
                          return data.map((vela) => {
                            const timestamp = parseInt(vela[0]);
                            const open = parseFloat(vela[1]);
                            const close = parseFloat(vela[4]);
                            const time = new Date(timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            
                            return {
                              time,
                              price: close / 1000, // Mantener el escalado para la visualización
                              priceChange: Math.abs(close - open) / 1000,
                              isUp: close >= open,
                              close: close / 1000,
                              open: open / 1000,
                              realPrice: close // Guardar también el precio real
                            };
                          });
                        }
                      }
                      return null;
                    } catch (error) {
                      console.error("Error obteniendo datos de Binance:", error);
                      return null;
                    }
                  };
                  
                  // Función para obtener datos del juego
                  const getGameCandles = () => {
                    try {
                      if (candles && candles.length >= 15) {
                        // Tomar las últimas 15 velas
                        return candles.slice(-15).map(candle => {
                          const time = new Date(candle.timestamp || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          
                          // Asegurar que siempre hay valores válidos
                          const close = candle.close || 30000;
                          const open = candle.open || (close - 50); // Diferencia pequeña fija
                          
                          return {
                            time,
                            price: close / 1000,
                            priceChange: Math.abs(close - open) / 1000,
                            isUp: close >= open,
                            close: close / 1000,
                            open: open / 1000,
                            realPrice: close
                          };
                        });
                      }
                      return null;
                    } catch (error) {
                      console.error("Error obteniendo datos del juego:", error);
                      return null;
                    }
                  };
                  
                  // Función para programar la actualización al inicio del siguiente minuto
                  const scheduleNextMinuteUpdate = () => {
                    // Cancelar cualquier intervalo existente
                    if (intervalId) {
                      clearInterval(intervalId);
                      intervalId = null;
                    }
                    
                    // Calcular milisegundos hasta el próximo minuto
                    const now = new Date();
                    const nextMinute = new Date(now);
                    nextMinute.setMinutes(now.getMinutes() + 1);
                    nextMinute.setSeconds(0);
                    nextMinute.setMilliseconds(0);
                    
                    const delay = nextMinute.getTime() - now.getTime();
                    
                    // Programar la actualización para el inicio del próximo minuto
                    const timeoutId = setTimeout(() => {
                      // Actualizar datos inmediatamente
                      updateCandles();
                      
                      // Establecer intervalo para actualizaciones al inicio de cada minuto
                      intervalId = setInterval(() => {
                        updateCandles();
                      }, 60000); // Actualizar cada minuto exacto
                      
                    }, delay);
                    
                    return timeoutId;
                  };
                  
                  // Actualizar inmediatamente al montar
                  updateCandles();
                  
                  // Programar las futuras actualizaciones
                  const timeoutId = scheduleNextMinuteUpdate();
                  
                  // Limpieza al desmontar
                  return () => {
                    if (timeoutId) clearTimeout(timeoutId);
                    if (intervalId) clearInterval(intervalId);
                  };
                }, [candles]);
                
                // Configuración de colores para el gráfico
                const chartConfig = {
                  price: {
                    label: "Precio",
                    color: "#ffffff",
                  },
                };
                
                // Calcular el rango de precios para normalizar
                const precios = candlesData.map(c => c.realPrice || (Math.abs(c.price) * 1000));
                const precioMinimo = Math.min(...precios);
                const precioMaximo = Math.max(...precios);
                const rango = precioMaximo - precioMinimo;
                
                // Formatear los datos para el gráfico
                const chartData = candlesData.map(candle => {
                  // Obtener el precio real
                  const precioReal = candle.realPrice || Math.abs(candle.price) * 1000;
                  
                  // Normalizar el precio a un rango de 0-500
                  // Asegurar que incluso cambios pequeños sean visibles (mínimo 10 de altura)
                  let valorNormalizado;
                  if (rango === 0) {
                    // Si todos los precios son iguales, mostrar barras de altura media
                    valorNormalizado = 250;
                  } else {
                    // Normalizar a escala 0-500 con un mínimo de 10 para cambios pequeños
                    valorNormalizado = ((precioReal - precioMinimo) / rango) * 490 + 10;
                  }
                  
                  return {
                    time: candle.time,
                    price: candle.price,
                    priceChange: candle.priceChange,
                    isUp: candle.isUp,
                    // Usar el valor normalizado para la altura de la barra
                    value: valorNormalizado,
                    // Guardar el precio real para el tooltip
                    precioReal: precioReal,
                    // Mantener el signo para distinguir entre alcista/bajista
                    direction: candle.isUp ? 1 : -1
                  };
                });
                
                return (
                  <>
                    <div className="bg-black rounded-lg p-2 mx-auto max-w-[240px]">
                      <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[240px]"
                      >
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                          maxBarSize={20} // Barras más delgadas
                          barGap={5}
                        >
                          <CartesianGrid vertical={false} stroke="#333" />
                          <YAxis 
                            domain={['dataMin', 'dataMax']} 
                            hide 
                          />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={(props) => {
                              const { x, y, payload } = props;
                              // Extraer solo los minutos del tiempo (HH:MM)
                              const minutos = payload.value.split(':')[1];
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text 
                                    x={-4} 
                                    y={0} 
                                    dy={8} 
                                    textAnchor="middle" 
                                    fill="#fff" 
                                    fontSize={8}
                                    transform="rotate(-45)"
                                  >
                                    {minutos}
                                  </text>
                                </g>
                              );
                            }}
                            interval={0} // Mostrar todas las etiquetas
                          />
                          <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                // Usar el precio real que ya calculamos
                                const precioReal = data.precioReal;
                                const cambioReal = data.priceChange * 1000;
                                
                                return (
                                  <div className="bg-black/80 p-2 rounded border border-yellow-500/30 shadow">
                                    <p className="font-medium text-white">{data.time}</p>
                                    <p className="text-xs">
                                      <span className={`font-bold ${
                                        data.isUp ? 'text-green-400' : 'text-red-400'
                                      }`}>
                                        {data.isUp ? 'Alcista' : 'Bajista'}
                                      </span>
                                    </p>
                                    <p className="text-xs text-white">Precio: {precioReal.toLocaleString('es-ES')} USD</p>
                                    <p className="text-xs text-white">Cambio: {cambioReal.toLocaleString('es-ES')} USD</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="value"
                            animationDuration={500}
                            // Usar una función para normalizar los valores
                            // y mantener la dirección (alcista/bajista)
                          >
                            {chartData.map((item, index) => (
                              <Cell
                                key={`cell-${index}`}
                                // Mantener los colores verde/rojo según dirección
                                fill={item.isUp ? "#22c55e" : "#ef4444"}
                                stroke={item.isUp ? "#22c55e" : "#ef4444"}
                                strokeWidth={1}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-center gap-4 font-medium leading-none text-xs">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Alcista
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span> Bajista
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 leading-none text-black font-medium mt-1 text-xs">
                        Actualización cada minuto
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              {/* Información adicional si se requiere */}
            </CardFooter>
          </Card>
          
          {/* Nueva tarjeta 3 */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>Nuestro Balance</CardTitle>
              <CardDescription className="text-black">Evolución de tu balance en tiempo real</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              {(() => {
                // Estado para almacenar el historial de balance
                const [balanceHistory, setBalanceHistory] = React.useState<Array<{
                  time: string;
                  balance: number;
                }>>([]);
                
                // Estado para el balance actual
                const [currentBalance, setCurrentBalance] = React.useState(0);
                
                // Obtener datos del juego y actualizar el balance
                React.useEffect(() => {
                  // Inicializar con el balance actual
                  if (typeof userBalance === 'number') {
                    setCurrentBalance(userBalance);
                  }
                  
                  // Recuperar el historial previo desde localStorage
                  const getStoredHistory = () => {
                    if (typeof window !== 'undefined') {
                      try {
                        const stored = localStorage.getItem('balance_history_infinite');
                        if (stored) {
                          const parsedHistory = JSON.parse(stored);
                          return parsedHistory;
                        }
                      } catch (e) {
                        console.error('Error al recuperar historial de balance:', e);
                      }
                    }
                    return null;
                  };
                  
                  // Crear historial inicial
                  const now = new Date();
                  let initialHistory: Array<{time: string, balance: number}> = [];
                  
                  // Intentar recuperar el historial guardado
                  const storedHistory = getStoredHistory();
                  
                  if (storedHistory && storedHistory.length > 0) {
                    // Usar el historial guardado, pero actualizar el último punto
                    initialHistory = storedHistory;
                    
                    // Verificar si el balance actual es diferente del último guardado
                    if (userBalance !== storedHistory[storedHistory.length - 1].balance) {
                      // Si es diferente, añadir un nuevo punto
                      const timeStr = now.toLocaleTimeString([], {
                        hour: '2-digit', 
                        minute: '2-digit'
                      });
                      
                      initialHistory.push({
                        time: timeStr,
                        balance: userBalance || 1000
                      });
                      
                      // Limitar a 15 puntos máximo para mostrar más detalle
                      if (initialHistory.length > 15) {
                        initialHistory = initialHistory.slice(-15);
                      }
                    }
                  } else {
                    // Si no hay historial guardado, inicializar con puntos predeterminados
                    // que tengan algunas variaciones para mostrar una línea interesante
                    const baseBalance = userBalance || 1000;
                    
                    // Generar puntos iniciales que abarquen los últimos 12 minutos
                    // pero permitiendo múltiples puntos por minuto si hay cambios
                    for (let i = 0; i < 12; i++) {
                      const time = new Date(now);
                      // Distribuir los puntos en los últimos 12 minutos
                      time.setMinutes(now.getMinutes() - (11 - i));
                      
                      const timeStr = time.toLocaleTimeString([], {
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      });
                      
                      // Crear algunas variaciones alrededor del balance actual
                      // Solo para visualización inicial hasta que se acumulen datos reales
                      const randomVariation = Math.random() * 0.15 - 0.075; // Entre -7.5% y +7.5%
                      const adjustedBalance = baseBalance * (1 + randomVariation);
                      
                      initialHistory.push({
                        time: timeStr,
                        balance: Math.round(adjustedBalance)
                      });
                    }
                  }
                  
                  // Establecer el historial inicial
                  setBalanceHistory(initialHistory);
                  
                  // Guardar en localStorage
                  if (typeof window !== 'undefined' && initialHistory.length > 0) {
                    localStorage.setItem('balance_history_infinite', JSON.stringify(initialHistory));
                  }
                  
                  // Configurar monitoreo en tiempo real del balance cada minuto exacto
                  const setupMinuteUpdates = (): (() => void) => {
                    // Calcular tiempo hasta el próximo minuto exacto
                    const now = new Date();
                    const nextMinute = new Date(now);
                    nextMinute.setMinutes(now.getMinutes() + 1);
                    nextMinute.setSeconds(0);
                    nextMinute.setMilliseconds(0);
                    
                    // Ya no necesitamos redondear al minuto exacto, queremos capturar todos los cambios
                    const exactNow = new Date(now);
                    
                    const timeToNextMinute = nextMinute.getTime() - now.getTime();
                    
                    // Programar primera actualización al inicio del próximo minuto
                    const timeoutId = setTimeout(() => {
                      // Registrar balance exacto
                      if (typeof userBalance === 'number') {
                        // Obtener hora actual exacta
                        const currentTime = new Date();
                        const timeStr = currentTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        // Actualizar historial solo si el balance ha cambiado
                        if (userBalance !== currentBalance) {
                          // Actualizar historial con balance actual exacto
                          setBalanceHistory(prev => {
                            const newHistory = [...prev, { time: timeStr, balance: userBalance }];
                            // Mantener hasta 15 puntos para mostrar más detalle
                            if (newHistory.length > 15) {
                              const limitedHistory = newHistory.slice(-15);
                              
                              // Guardar en localStorage
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('balance_history_infinite', JSON.stringify(limitedHistory));
                              }
                              
                              return limitedHistory;
                            }
                            
                            // Guardar en localStorage
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('balance_history_infinite', JSON.stringify(newHistory));
                            }
                            
                            return newHistory;
                          });
                          
                          // Actualizar el balance actual
                          setCurrentBalance(userBalance);
                        }
                      }
                      
                      // Configurar intervalo para actualizar cada minuto exacto
                      const intervalId = setInterval(() => {
                        if (typeof userBalance === 'number') {
                          // Obtener hora actual con segundos para mayor detalle
                          const currentTime = new Date();
                          const timeStr = currentTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          });
                          
                          // Actualizar historial cada vez que el balance cambia
                          if (userBalance !== currentBalance) {
                            // Actualizar historial con balance actual exacto
                            setBalanceHistory(prev => {
                              const newHistory = [...prev, { time: timeStr, balance: userBalance }];
                              // Mantener hasta 15 puntos para mostrar más detalle
                              if (newHistory.length > 15) {
                                const limitedHistory = newHistory.slice(-15);
                                
                                // Guardar en localStorage
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem('balance_history_infinite', JSON.stringify(limitedHistory));
                                }
                                
                                return limitedHistory;
                              }
                              
                              // Guardar en localStorage
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('balance_history_infinite', JSON.stringify(newHistory));
                              }
                              
                              return newHistory;
                            });
                            
                            // Actualizar el balance actual
                            setCurrentBalance(userBalance);
                          }
                        }
                      }, 60000); // Exactamente cada minuto
                      
                      return () => clearInterval(intervalId);
                    }, timeToNextMinute);
                    
                    return () => clearTimeout(timeoutId);
                  };
                  
                  const cleanup = setupMinuteUpdates();
                  
                  return () => {
                    cleanup();
                  };
                }, [userBalance, currentBalance]);
                  // Configuración del gráfico
                const chartConfig = {
                  balance: {
                    label: "Saldo",
                    color: "#22c55e", // Verde
                  }
                };
                
                // Verificar que tenemos datos suficientes para mostrar una tendencia
                const hasEnoughData = balanceHistory.length >= 2 && 
                  balanceHistory.some((item, i) => i > 0 && item.balance !== balanceHistory[0].balance);
                
                // Calcular estadísticas para indicadores
                const trendDirection = hasEnoughData
                  ? (balanceHistory[balanceHistory.length - 1].balance > balanceHistory[0].balance ? "up" : "down")
                  : "up";
                
                const trendPercentage = hasEnoughData
                  ? ((balanceHistory[balanceHistory.length - 1].balance - balanceHistory[0].balance) / balanceHistory[0].balance * 100).toFixed(1)
                  : "0.0";
                
                // Calcular el valor mínimo y máximo para el dominio del eje Y
                const balanceValues = balanceHistory.map(item => item.balance);
                const minBalance = Math.min(...balanceValues);
                const maxBalance = Math.max(...balanceValues);
                
                // Calcular el valor medio para centrar la gráfica
                const midBalance = (minBalance + maxBalance) / 2;
                
                // Calcular cambios punto a punto para determinar el color de cada punto
                const getPointColors = () => {
                  const colors = [];
                  for (let i = 0; i < balanceHistory.length; i++) {
                    if (i === 0) {
                      colors.push(trendDirection === "up" ? "#22c55e" : "#ef4444");
                    } else {
                      const isPointUp = balanceHistory[i].balance >= balanceHistory[i-1].balance;
                      colors.push(isPointUp ? "#22c55e" : "#ef4444");
                    }
                  }
                  return colors;
                };
                
                const pointColors = getPointColors();
                
                // Calcular un rango de visualización adecuado para centrar la línea
                const calculateYDomain = () => {
                  // Si todos los valores son iguales, crear un rango artificial
                  if (minBalance === maxBalance) {
                    const value = minBalance;
                    // Crear un rango de ±10% alrededor del valor
                    return [value * 0.9, value * 1.1];
                  }
                  
                  // Calcular un rango con margen del 20% arriba y abajo
                  const range = maxBalance - minBalance;
                  const margin = range * 0.2;
                  
                  return [minBalance - margin, maxBalance + margin];
                };
                
                const yDomain = calculateYDomain();
                
                return (
                  <>
                    <div className="bg-black rounded-lg p-2 mx-auto max-w-[240px]">
                      <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[240px]"
                      >
                        <LineChart
                          data={balanceHistory}
                          margin={{
                            top: 20,
                            left: 12,
                            right: 12,
                            bottom: 5
                          }}
                        >
                          <CartesianGrid vertical={false} stroke="#333" />
                          <XAxis
                            dataKey="time"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#fff', fontSize: 10 }}
                          />
                          <YAxis
                            domain={yDomain}
                            tickCount={5}
                            width={40}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#fff', fontSize: 10 }}
                            tickFormatter={(value) => value.toLocaleString('es-ES')}
                          />
                          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                          <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-black/80 p-2 rounded border border-yellow-500/30 shadow">
                                    <p className="font-medium text-white">{data.time}</p>                                      <p className="text-sm text-white">
                                      Saldo: <span className="font-bold">{data.balance.toLocaleString('es-ES')}</span>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line
                            dataKey="balance"
                            type="monotone"
                            stroke={trendDirection === "up" ? "#22c55e" : "#ef4444"}
                            strokeWidth={3}
                            dot={(props) => {
                              const { cx, cy, index } = props;
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={4}
                                  fill={pointColors[index]}
                                  stroke="#fff"
                                  strokeWidth={1}
                                />
                              );
                            }}
                            activeDot={{
                              r: 6,
                              stroke: "#fff",
                              strokeWidth: 1
                            }}
                          >
                            {/* Etiquetas de texto sobre los puntos eliminadas */}
                          </Line>
                        </LineChart>
                      </ChartContainer>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-center gap-2 font-medium leading-none text-xs">
                        <span className={`flex items-center gap-1 ${trendDirection === "up" ? "text-green-500" : "text-red-500"}`}>
                          <TrendingUp className={`h-4 w-4 ${trendDirection === "down" ? "transform rotate-180" : ""}`} />
                          {trendDirection === "up" ? "Subiendo" : "Bajando"} un {Math.abs(parseFloat(trendPercentage))}% 
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 leading-none text-black font-medium mt-1 text-xs">
                        Balance actual: {currentBalance.toLocaleString('es-ES')}
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
        
        {/* Sección para gráfico horizontal completo */}
        <div className="w-full max-w-5xl mx-auto mt-12">
          {/* Gráfico de Rachas de Trading */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl rounded-xl mb-4">
            <CardHeader className="items-center py-2">
              <CardTitle className="text-lg">Rachas de Trading</CardTitle>
              <CardDescription className="text-black text-xs">Análisis de tus rachas ganadoras y perdedoras</CardDescription>
            </CardHeader>
            <CardContent className="px-3 py-2">
              <div className="w-full bg-black rounded-xl p-3 text-white grid grid-cols-1 md:grid-cols-2 gap-2">
                {(() => {
                  const { bets } = useGame();
                  
                  // Verificar si hay apuestas disponibles
                  if (!bets || bets.length === 0) {
                    return (
                      <div className="col-span-2 h-[200px] flex items-center justify-center text-white font-medium">
                        No hay datos de apuestas disponibles
                      </div>
                    );
                  }
                  
                  // Filtrar solo apuestas finalizadas (ganadas o perdidas)
                  const finishedBets = bets.filter(bet => bet.status === 'WON' || bet.status === 'LOST');
                  
                  // Ordenar por timestamp
                  const sortedBets = [...finishedBets].sort((a, b) => {
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                  });
                  
                  // Definir interfaces para las rachas
                  interface StreakData {
                    type: string;
                    count: number;
                    amount: number;
                    timestamp: number;
                  }
                  
                  // Calcular rachas
                  const streaks: StreakData[] = [];
                  let currentStreakData: StreakData = { type: '', count: 0, amount: 0, timestamp: 0 };
                  
                  for (const bet of sortedBets) {
                    const betResult = bet.status === 'WON' ? 'win' : 'loss';
                    const betTime = new Date(bet.timestamp).getTime();
                    
                    if (currentStreakData.count === 0) {
                      // Iniciar una nueva racha
                      currentStreakData = { 
                        type: betResult, 
                        count: 1, 
                        amount: bet.status === 'WON' ? bet.amount : -bet.amount,
                        timestamp: betTime
                      };
                    } else if (currentStreakData.type === betResult) {
                      // Continuar la racha actual
                      currentStreakData.count++;
                      currentStreakData.amount += bet.status === 'WON' ? bet.amount : -bet.amount;
                    } else {
                      // Guardar la racha anterior y comenzar una nueva
                      streaks.push({...currentStreakData});
                      currentStreakData = { 
                        type: betResult, 
                        count: 1, 
                        amount: bet.status === 'WON' ? bet.amount : -bet.amount,
                        timestamp: betTime
                      };
                    }
                  }
                  
                  // Añadir la última racha si existe
                  if (currentStreakData.count > 0) {
                    streaks.push({...currentStreakData});
                  }
                  
                  // Calcular estadísticas
                  const longestWinStreak = streaks.filter(s => s.type === 'win')
                    .reduce((max, streak) => streak.count > max.count ? streak : max, { count: 0, timestamp: 0, type: '', amount: 0 });
                    
                  const longestLossStreak = streaks.filter(s => s.type === 'loss')
                    .reduce((max, streak) => streak.count > max.count ? streak : max, { count: 0, timestamp: 0, type: '', amount: 0 });
                    
                  const currentStreak = streaks.length > 0 ? streaks[streaks.length - 1] : { type: '', count: 0, amount: 0, timestamp: 0 };
                  
                  // Calcular totales
                  const totalBets = sortedBets.length;
                  const totalWins = sortedBets.filter(bet => bet.status === 'WON').length;
                  const totalLosses = sortedBets.filter(bet => bet.status === 'LOST').length;
                  
                  // Formatear timestamp para mostrar en el gráfico
                  const formatTimestamp = (timestamp: number): string => {
                    if (!timestamp) return '';
                    const date = new Date(timestamp);
                    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                  };
                  
                  // Generar puntos para visualización de rachas
                  const generateStreakDots = (count: number, type: string, timestamp: number): React.ReactElement => {
                    const dots: React.ReactElement[] = [];
                    
                    // Formatear la fecha para mostrar hora y minuto
                    const formatDate = (timestamp: number): string => {
                      const date = new Date(timestamp);
                      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    };
                    
                    // Calcular timestamps para cada apuesta individual (simulados)
                    const calculateIndividualTimestamps = (baseTimestamp: number, count: number): number[] => {
                      const timestamps: number[] = [];
                      // Para simular apuestas individuales, calculamos el inicio de la racha
                      // y luego vamos sumando minutos para cada apuesta siguiente
                      const startTime = baseTimestamp - ((count - 1) * 60000); // Tiempo de la primera apuesta
                      
                      for (let i = 0; i < count; i++) {
                        // Cada apuesta es 1 minuto después que la anterior (de izquierda a derecha)
                        timestamps.push(startTime + (i * 60000));
                      }
                      return timestamps;
                    };
                    
                    const individualTimestamps = calculateIndividualTimestamps(timestamp, count);
                    
                    for (let i = 0; i < count; i++) {
                      const betTime = formatDate(individualTimestamps[i]);
                      dots.push(
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full ${type === 'win' ? 'bg-green-500' : 'bg-red-500'} cursor-pointer relative group`}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {betTime}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="flex gap-0.5 mt-1 justify-center">
                        {dots}
                      </div>
                    );
                  };
                  
                  return (
                    <>
                      {/* Gráfico circular */}
                      <div className="flex justify-center items-center">
                        <div className="relative w-[150px] h-[150px]">
                          {/* Círculo exterior */}
                          <div 
                            className="absolute inset-0 rounded-full border-[12px]"
                            style={{
                              borderColor: currentStreak.type === 'win' ? '#22c55e' : '#ef4444',
                              borderRightColor: 'transparent',
                              transform: `rotate(${(currentStreak.count / 20) * 360}deg)`,
                              transition: 'transform 1s ease-in-out'
                            }}
                          />

                          
                          {/* Círculo medio */}
                          <div 
                            className="absolute inset-[15px] rounded-full border-[12px]"
                            style={{
                              borderColor: '#fbbf24',
                              borderRightColor: 'transparent',
                              transform: `rotate(${(longestWinStreak.count / 20) * 360}deg)`,
                              transition: 'transform 1s ease-in-out'
                            }}
                          />

                          
                          {/* Círculo interior */}
                          <div 
                            className="absolute inset-[40px] rounded-full border-[10px]"
                            style={{
                              borderColor: '#ef4444',
                              borderRightColor: 'transparent',
                              transform: `rotate(${(longestLossStreak.count / 20) * 360}deg)`,
                              transition: 'transform 1s ease-in-out'
                            }}
                          />

                          
                          {/* Fondo negro */}
                          <div className="absolute inset-[60px] rounded-full bg-black" />
                        </div>
                      </div>
                      
                      {/* Leyenda */}
                      <div className="flex flex-col justify-center gap-1 pl-48 text-xs">
                        <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-md">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-xs font-medium">Racha Actual</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-md">
                          <div className="w-3 h-3 rounded-full bg-yellow-400" />
                          <span className="text-xs font-medium">Racha Máxima</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-md">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-xs font-medium">Racha Perdedora</span>
                        </div>
                      </div>
                      
                      {/* Estadísticas */}
                      <div className="bg-black/80 p-2 rounded-lg col-span-2 md:col-span-1 border border-yellow-500/20 shadow-lg">
                        <h3 className="text-yellow-400 font-medium text-center text-sm">Racha Actual</h3>
                        <div className={`text-3xl font-bold text-center ${currentStreak.type === 'win' ? 'text-green-500' : 'text-red-500'}`}>
                          {currentStreak.count}
                        </div>
                        <div className="text-xs text-center text-gray-300">
                          {currentStreak.type === 'win' ? 'victorias' : 'derrotas'}
                        </div>
                        {generateStreakDots(Math.min(currentStreak.count, 15), currentStreak.type, currentStreak.timestamp)}
                      </div>
                      
                      <div className="bg-black/80 p-2 rounded-lg border border-yellow-500/20 shadow-lg">
                        <h3 className="text-yellow-400 font-medium text-center text-sm">Mejor Racha</h3>
                        <div className="text-3xl font-bold text-center text-green-500">
                          {longestWinStreak.count}
                        </div>
                        <div className="text-xs text-center text-gray-300">
                          victorias
                        </div>
                        {generateStreakDots(Math.min(longestWinStreak.count, 15), 'win', longestWinStreak.timestamp)}
                      </div>
                      
                      <div className="bg-black/80 p-2 rounded-lg border border-yellow-500/20 shadow-lg">
                        <h3 className="text-yellow-400 font-medium text-center text-sm">Peor Racha</h3>
                        <div className="text-3xl font-bold text-center text-red-500">
                          {longestLossStreak.count}
                        </div>
                        <div className="text-xs text-center text-gray-300">
                          derrotas
                        </div>
                        {generateStreakDots(Math.min(longestLossStreak.count, 15), 'loss', longestLossStreak.timestamp)}
                      </div>
                      
                      <div className="bg-black/80 p-2 rounded-lg border border-yellow-500/20 shadow-lg">
                        <h3 className="text-yellow-400 font-medium text-center text-sm">Promedio</h3>
                        <div className="text-3xl font-bold text-center text-blue-500">
                          {totalBets}
                        </div>
                        <div className="text-xs text-center text-gray-300">
                          apuestas
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl rounded-xl">
            <CardHeader className="items-center pb-4">
              <CardTitle>Tu Tangle Map</CardTitle>
              <CardDescription className="text-black">Visualización del árbol de apuestas</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6 bg-yellow-400 rounded-b-xl">
              <div className="w-full h-[530px] flex items-center justify-center">
                {(() => {
                  const { bets } = useGame();
                  // Estado para forzar la actualización del componente cada segundo
                  const [ticker, setTicker] = useState(0);
                  
                  // Efecto para actualizar el componente cada segundo
                  useEffect(() => {
                    const interval = setInterval(() => {
                      setTicker(prev => prev + 1);
                    }, 1000);
                    
                    return () => clearInterval(interval);
                  }, []);
                  const getBetType = (status: string): 'win' | 'loss' | 'liquidation' | 'pending' => {
                    if (status === 'WON') return 'win';
                    if (status === 'LOST') return 'loss';
                    if (status === 'LIQUIDATED') return 'liquidation';
                    return 'pending';
                  };

                  const formatTime = (timestamp: number) => {
                    const date = new Date(timestamp);
                    return `${date.getHours()}:${date.getMinutes()}`;
                  };
                  
                  // Calcular el tiempo restante para apuestas pendientes (en segundos y minutos)
                  const calculateRemainingTime = (bet: any) => {
                    if (bet.status !== 'PENDING') return undefined;
                    
                    try {
                      // Duración de la apuesta en segundos (1 minuto)
                      const betDurationSeconds = 60;
                      
                      // Tiempo de creación de la apuesta
                      const creationTime = new Date(bet.timestamp).getTime();
                      
                      // Tiempo actual
                      const currentTime = Date.now();
                      
                      // Tiempo transcurrido desde la creación (en segundos)
                      const elapsedSeconds = Math.floor((currentTime - creationTime) / 1000);
                      
                      // Tiempo restante (en segundos)
                      // Si es negativo o cero, la apuesta ya debería haberse resuelto
                      const remainingSeconds = Math.max(0, betDurationSeconds - elapsedSeconds);
                      
                      // Convertir a formato mm:ss
                      const minutes = Math.floor(remainingSeconds / 60);
                      const seconds = remainingSeconds % 60;
                      
                      return {
                        total: remainingSeconds,
                        minutes,
                        seconds,
                        formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`
                      };
                    } catch (error) {
                      // En caso de error, devolver un valor por defecto
                      return {
                        total: 0,
                        minutes: 0,
                        seconds: 0,
                        formatted: '0:00'
                      };
                    }
                  };
                  
                  // Filtrar las apuestas de las últimas 2 horas (120 minutos)
                  const twoHoursAgo = Date.now() - (120 * 60 * 1000);
                  const recentBets = bets.filter(bet => {
                    const betTime = new Date(bet.timestamp).getTime();
                    return betTime >= twoHoursAgo;
                  });

                  // Agrupar las apuestas por tipo
                  const bullishBets = recentBets.filter(bet => bet.prediction === 'BULLISH' && bet.status !== 'LIQUIDATED' && bet.status !== 'PENDING');
                  const bearishBets = recentBets.filter(bet => bet.prediction === 'BEARISH' && bet.status !== 'LIQUIDATED' && bet.status !== 'PENDING');
                  const pendingBets = recentBets.filter(bet => bet.status === 'PENDING');
                  const liquidatedBets = recentBets.filter(bet => bet.status === 'LIQUIDATED');
                  const currentBalance = userBalance || 0;

                  const treeData = {
                    id: 'root',
                    type: 'balance' as const,
                    timestamp: Date.now(),
                    value: userBalance,
                    label: `$${userBalance.toLocaleString()}`,
                    children: [
                      // Subnodo para apuestas alcistas
                      {
                        id: 'bullish',
                        type: 'bullish' as const,
                        timestamp: Date.now(),
                        value: bullishBets.reduce((sum, bet) => sum + bet.amount, 0),
                        label: 'Alcistas',
                        children: bullishBets.map(bet => {
                          const remainingTime = calculateRemainingTime(bet);
                          return {
                            id: bet.id,
                            type: getBetType(bet.status),
                            timestamp: new Date(bet.timestamp).getTime(),
                            value: bet.amount,
                            // Añadir etiqueta con tiempo restante para apuestas pendientes
                            label: bet.status === 'PENDING' && remainingTime ? `${remainingTime?.formatted || ''}` : undefined,
                            info: {
                              prediction: bet.prediction,
                              entryPrice: bet.entryPrice,
                              status: bet.status,
                              amount: bet.amount,
                              remainingTime: remainingTime
                            }
                          };
                        })
                      },
                      // Subnodo para apuestas bajistas
                      {
                        id: 'bearish',
                        type: 'bearish' as const,
                        timestamp: Date.now(),
                        value: bearishBets.reduce((sum, bet) => sum + bet.amount, 0),
                        label: 'Bajistas',
                        children: bearishBets.map(bet => {
                          const remainingTime = calculateRemainingTime(bet);
                          return {
                            id: bet.id,
                            type: getBetType(bet.status),
                            timestamp: new Date(bet.timestamp).getTime(),
                            value: bet.amount,
                            // Añadir etiqueta con tiempo restante para apuestas pendientes
                            label: bet.status === 'PENDING' && remainingTime ? `${remainingTime?.formatted || ''}` : undefined,
                            info: {
                              prediction: bet.prediction,
                              entryPrice: bet.entryPrice,
                              status: bet.status,
                              amount: bet.amount,
                              remainingTime: remainingTime
                            }
                          };
                        })
                      },
                      // Subnodo para apuestas pendientes
                      {
                        id: 'pending',
                        type: 'pending' as const,
                        timestamp: Date.now(),
                        value: pendingBets.reduce((sum, bet) => sum + bet.amount, 0),
                        label: 'Pendientes',
                        children: pendingBets.map(bet => {
                          const remainingTime = calculateRemainingTime(bet);
                          return {
                            id: bet.id,
                            type: getBetType(bet.status),
                            timestamp: new Date(bet.timestamp).getTime(),
                            value: bet.amount,
                            label: remainingTime ? `${remainingTime.formatted}` : undefined,
                            info: {
                              prediction: bet.prediction,
                              entryPrice: bet.entryPrice,
                              status: bet.status,
                              amount: bet.amount,
                              remainingTime: remainingTime
                            }
                          };
                        })
                      },
                      // Subnodo para apuestas liquidadas
                      {
                        id: 'liquidated',
                        type: 'liquidated' as const,
                        timestamp: Date.now(),
                        value: liquidatedBets.reduce((sum, bet) => sum + bet.amount, 0),
                        label: 'Liquidadas',
                        children: liquidatedBets.map(bet => {
                          const remainingTime = calculateRemainingTime(bet);
                          return {
                            id: bet.id,
                            type: getBetType(bet.status),
                            timestamp: new Date(bet.timestamp).getTime(),
                            value: bet.amount,
                            // Añadir etiqueta con tiempo restante para apuestas pendientes
                            label: bet.status === 'PENDING' && remainingTime ? `${remainingTime?.formatted || ''}` : undefined,
                            info: {
                              prediction: bet.prediction,
                              entryPrice: bet.entryPrice,
                              status: bet.status,
                              amount: bet.amount,
                              remainingTime: remainingTime
                            }
                          };
                        })
                      }
                    ].filter(group => group.children && group.children.length > 0) // Filtrar grupos vacíos
                  };
                  
                  return bets.length > 0 ? (
                    <div className="flex flex-col items-center w-full">
                      <p className="text-sm text-gray-500 mb-2">
                        Mostrando apuestas de las últimas 2 horas 
                        ({recentBets.length} de {bets.length} apuestas)
                      </p>
                      <div className="flex justify-between w-full mb-8">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm">Ganadas</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <span className="text-sm">Perdidas</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-black mr-2"></div>
                            <span className="text-sm">Liquidadas</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                            <span className="text-sm">Pendientes</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-700 mr-2"></div>
                            <span className="text-sm">Alcistas</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-700 mr-2"></div>
                            <span className="text-sm">Bajistas</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          Total: {bets.length} apuestas
                        </div>
                      </div>
                      <TangledTreeChart 
                        width={800} 
                        height={520} 
                        data={treeData}
                        linkColor="#000000"
                        linkWidth={2}
                        nodeColors={{
                          win: '#22c55e',
                          loss: '#ef4444',
                          liquidation: '#000000',
                          pending: '#a855f7',
                          balance: '#3b82f6',
                          bullish: '#15803d',  // Verde oscuro
                          bearish: '#b91c1c',  // Rojo oscuro
                          liquidated: '#000000' // Negro
                        }}
                        showTooltip={true}
                        tooltipContent={(node: TreeNode) => (
                          <div className="bg-black p-2 rounded-lg border border-yellow-500 text-white text-sm">
                            <p className="font-bold mb-1">{node.label}</p>
                            {node.info && (
                              <>
                                <p>Predicción: {node.info.prediction}</p>
                                <p>Entrada: {node.info.entryPrice}$</p>
                                <p>Monto: {node.info.amount}$</p>
                                <p className={`font-semibold ${
                                  node.info.status === 'WON' ? 'text-green-400' :
                                  node.info.status === 'LOST' ? 'text-red-400' :
                                  node.info.status === 'PENDING' ? 'text-purple-400' :
                                  'text-gray-400'
                                }`}>
                                  {node.info.status === 'WON' ? 'Ganada' :
                                   node.info.status === 'LOST' ? 'Perdida' :
                                   node.info.status === 'PENDING' ? 'Pendiente' :
                                   'Liquidada'}
                                  {node.info.status === 'PENDING' && node.info.remainingTime && 
                                    ` (${node.info.remainingTime.formatted} restantes)`
                                  }
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="text-zinc-600 font-medium">
                      No hay datos de apuestas disponibles
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico Hexbin Area */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl rounded-xl mt-6">
            <CardHeader className="items-center pb-4">
              <CardTitle>Gráfico Hexbin Area</CardTitle>
              <CardDescription className="text-black">
                Visualización de apuestas por precio y tiempo con Hexbin Area
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <div className="w-full h-[800px] bg-yellow-400 rounded-xl overflow-hidden">
                {(() => {
                  const { bets } = useGame();
                  
                  // Verificar si hay apuestas disponibles
                  if (!bets || bets.length === 0) {
                    return (
                      <div className="w-full h-full flex items-center justify-center text-black font-medium bg-yellow-400 rounded-xl">
                        No hay datos de apuestas disponibles
                      </div>
                    );
                  }
                  
                  // Preparar los datos para el gráfico de hexbin
                  const hexbinData = bets.map(bet => ({
                    id: bet.id || '',
                    amount: bet.amount || 0,
                    price: bet.entryPrice || 0,
                    timestamp: new Date(bet.timestamp).getTime(),
                    prediction: bet.prediction as 'BULLISH' | 'BEARISH',
                    status: bet.status as 'WON' | 'LOST' | 'PENDING' | 'LIQUIDATED'
                  }));
                  
                  // Filtrar apuestas sin precio de entrada
                  const filteredData = hexbinData.filter(bet => bet.price > 0);
                  
                  return filteredData.length > 0 ? (
                    <div className="w-full h-full p-4 bg-yellow-400 rounded-xl">
                      <HexbinAreaChart 
                        data={filteredData}
                        width={window.innerWidth > 1024 ? 900 : window.innerWidth - 80}
                        height={750}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black font-medium bg-yellow-300/50 rounded-xl">
                      No hay suficientes datos para generar el gráfico de distribución
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Nuevo gráfico de mapa de calor y liquidaciones */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl rounded-xl mt-6">
            <CardHeader className="items-center pb-4">
              <CardTitle>Mapa de Calor y Liquidaciones</CardTitle>
              <CardDescription className="text-black">Distribución de apuestas y liquidaciones por hora del día</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-0 sm:px-6">
              <ChartContainer
                config={{
                  heatValue: { label: "Intensidad", color: "#ef4444" },
                  liquidations: { label: "Liquidaciones", color: "#ffffff" },
                  liveLiquidations: { label: "Liquidaciones en vivo", color: "#00ff00" }
                }}
                className="aspect-auto h-[200px] w-full"
              >
                <BarChart
                  data={(() => {
                    // Definir tipo para los datos de hora
                    type HourDataType = {
                      hour: number;
                      heatValue: number;
                      liquidations: number;
                      bets: number;
                      liveLiquidations: number;
                    };
                    
                    // Definimos la interfaz para las liquidaciones
                    interface LiveLiquidation {
                      orderId: string;
                      symbol: string;
                      side: 'LONG' | 'SHORT';
                      price: number;
                      quantity: number;
                      timestamp: number;
                      sizeUsd: number;
                      exchange: string;
                    }
                    
                    // Obtener datos de liquidaciones en vivo directamente sin depender del contexto
                    // Usamos un try-catch para manejar posibles errores
                    let liveLiquidations: LiveLiquidation[] = [];
                    try {
                      const result = useLiquidations({ 
                        symbol: 'BTCUSDT', 
                        minSize: 0, 
                        maxSize: 500, 
                        limit: 99, 
                        smallLimit: 10
                      });
                      
                      // Verificamos que el resultado y las liquidaciones existan
                      if (result && result.liquidations) {
                        liveLiquidations = result.liquidations;
                      }
                    } catch (error) {
                      console.error('Error al obtener liquidaciones:', error);
                      // Si hay un error, usamos un array vacío
                      liveLiquidations = [];
                    }
                    
                    // Generar datos para el mapa de calor por hora del día
                    const { bets } = useGame();
                    const hourData: HourDataType[] = Array(24).fill(0).map((_, i) => ({
                      hour: i,
                      heatValue: 0,
                      liquidations: 0,
                      liveLiquidations: 0,
                      bets: 0
                    }));
                    
                    // Contar apuestas por hora
                    bets.forEach(bet => {
                      const date = new Date(bet.timestamp);
                      const hour = date.getHours();
                      hourData[hour].bets += 1;
                      
                      // Contar liquidaciones
                      if (bet.status === 'LIQUIDATED') {
                        hourData[hour].liquidations += 1;
                      }
                    });
                    
                    // Contar liquidaciones en vivo (siempre habilitadas en el perfil)
                    // Verificamos que liveLiquidations exista y sea un array
                    if (Array.isArray(liveLiquidations) && liveLiquidations.length > 0) {
                      // Usamos un try-catch dentro del forEach para evitar errores
                      liveLiquidations.forEach(liq => {
                        try {
                        const date = new Date(liq.timestamp);
                        const hour = date.getHours();
                          // Verificamos que hour sea un índice válido
                          if (hour >= 0 && hour < 24 && hourData[hour]) {
                            hourData[hour].liveLiquidations += 1;
                            
                            // También sumamos a la intensidad del mapa de calor
                            hourData[hour].heatValue += 10; // Añadimos un valor fijo para que se note
                          }
                        } catch (error) {
                          console.error('Error al procesar liquidación:', error);
                        }
                      });
                    }
                    
                    // Normalizar los valores de calor (0-100)
                    // Usamos un try-catch para evitar errores durante la normalización
                    try {
                      const maxBets = Math.max(...hourData.map(d => d.bets || 0), 1);
                      hourData.forEach(d => {
                        // Verificamos que d y sus propiedades existan
                        if (d) {
                          // Aseguramos que todos los valores sean números válidos
                          const betsValue = (d.bets || 0) / maxBets * 100;
                          const liqValue = (d.liveLiquidations || 0) * 5;
                          // Aseguramos que el valor no exceda 100
                          d.heatValue = Math.min(betsValue + liqValue, 100);
                        }
                      });
                    } catch (error) {
                      console.error('Error al normalizar valores de calor:', error);
                      // Si hay un error, asignamos valores por defecto
                      hourData.forEach(d => {
                        if (d) d.heatValue = d.bets > 0 ? 50 : 0;
                      });
                    }
                    
                    return hourData;
                  })()} 
                  barCategoryGap={1}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} stroke="#000000" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}h`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#fff', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    width={40}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#fff', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'dataMax + 1']}
                    tickCount={5}
                    width={40}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#fff', fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-black/80 p-2 rounded border border-yellow-500/30 shadow">
                            <p className="font-medium text-white">{data.hour}:00 - {data.hour}:59</p>
                            <p className="text-xs text-yellow-400">Intensidad: {Math.round(data.heatValue)}%</p>
                            <p className="text-xs text-red-400">Liquidaciones: {data.liquidations}</p>
                            <p className="text-xs text-green-400">Liquidaciones en vivo: {data.liveLiquidations}</p>
                            <p className="text-xs text-white">Total apuestas: {data.bets}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="heatValue" 
                    yAxisId="left"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    opacity={0.9}
                  >
                    {/* Usar colores rojos para las barras */}
                    <Cell fill="#ef4444" />
                    <Cell fill="#dc2626" />
                    <Cell fill="#b91c1c" />
                    <Cell fill="#991b1b" />
                    <Cell fill="#7f1d1d" />
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="liquidations"
                    yAxisId="right"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={{ fill: '#ffffff', r: 4 }}
                    activeDot={{ r: 6, fill: '#ffffff', stroke: '#000' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="liveLiquidations"
                    yAxisId="right"
                    stroke="#00ff00"
                    strokeWidth={2}
                    dot={{ fill: '#00ff00', r: 4 }}
                    activeDot={{ r: 6, fill: '#00ff00', stroke: '#000' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tarjeta 3: Burbujas de Cambio de Precio de Bitcoin - Implementación Simple */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl rounded-xl mt-6">
            <CardHeader className="items-center pb-4">
              <CardTitle>Cambio de Precio de Bitcoin</CardTitle>
              <CardDescription className="text-black">Visualización del cambio de precio por vela (tamaño = magnitud del cambio)</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <div className="w-full h-[500px] bg-yellow-400 rounded-xl overflow-hidden p-4">
                {/* Implementación simple de burbujas */}
                {(() => {
                  const { candles } = useGame();
                  const [bubbleData, setBubbleData] = useState<Array<{
                    id: number;
                    time: string;
                    value: number;
                    isUp: boolean;
                    change: number;
                    price: number;
                    open: number;
                    high: number;
                    low: number;
                    percentChange: number;
                    volume: number;
                  }>>([]);
                  
                  useEffect(() => {
                    if (!candles || candles.length === 0) return;
                    
                    // Obtener las últimas 10 velas para mostrar datos históricos reales
                    const recentCandles = [...candles].slice(-10);
                    
                    // Procesar datos reales para cada burbuja
                    const newBubbleData = recentCandles.map(candle => {
                      // Datos reales de cada vela
                      const open = candle.open || 0;
                      const close = candle.close || 0;
                      const high = candle.high || 0;
                      const low = candle.low || 0;
                      const volume = candle.volume || 0;
                      
                      // Calcular el cambio de precio real
                      const change = close - open;
                      const absChange = Math.abs(change);
                      const percentChange = (change / open) * 100;
                      const isUp = change >= 0;
                      
                      // Formatear la hora para mostrar en la burbuja
                      const timestamp = candle.timestamp || Date.now();
                      const time = new Date(timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      // Devolver objeto con datos completos y reales
                      return {
                        id: timestamp,
                        time,
                        value: absChange,       // Para el tamaño de la burbuja
                        isUp,                  // Para el color (verde/rojo)
                        change,                // Cambio absoluto
                        percentChange,         // Cambio porcentual
                        price: close,          // Precio de cierre
                        open,                  // Precio de apertura
                        high,                  // Precio máximo
                        low,                   // Precio mínimo
                        volume                 // Volumen
                      };
                    });
                    
                    // Ordenar por timestamp para asegurar que están en orden cronológico
                    newBubbleData.sort((a, b) => a.id - b.id);
                    
                    // Actualizar el estado con los datos reales
                    setBubbleData(newBubbleData);
                    
                    // Crear una nueva burbuja cada minuto con datos reales actualizados
                    const interval = setInterval(() => {
                      if (candles && candles.length > 0) {
                        // Obtener la vela más reciente para datos actualizados
                        const latestCandle = candles[candles.length - 1];
                        
                        // Extraer datos reales
                        const open = latestCandle.open || 0;
                        const close = latestCandle.close || 0;
                        const high = latestCandle.high || 0;
                        const low = latestCandle.low || 0;
                        const volume = latestCandle.volume || 0;
                        
                        // Calcular cambios reales
                        const change = close - open;
                        const absChange = Math.abs(change);
                        const percentChange = (change / open) * 100;
                        const isUp = change >= 0;
                        
                        // Timestamp y hora actuales
                        const timestamp = Date.now();
                        const time = new Date(timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        // Crear nueva burbuja con datos reales actualizados
                        const newBubble = {
                          id: timestamp,
                          time,
                          value: absChange,
                          isUp,
                          change,
                          percentChange,
                          price: close,
                          open,
                          high,
                          low,
                          volume
                        };
                        
                        // Añadir la nueva burbuja y mantener solo las últimas 10
                        setBubbleData(prev => {
                          const updated = [...prev, newBubble];
                          return updated.slice(-10);
                        });
                      }
                    }, 60000);
                    
                    // Actualizar la última burbuja cada 5 segundos para reflejar cambios en tiempo real
                    const updateInterval = setInterval(() => {
                      if (candles && candles.length > 0) {
                        // Obtener la vela más reciente con datos actualizados
                        const latestCandle = candles[candles.length - 1];
                        
                        // Extraer datos reales actualizados
                        const open = latestCandle.open || 0;
                        const close = latestCandle.close || 0;
                        const high = latestCandle.high || 0;
                        const low = latestCandle.low || 0;
                        const volume = latestCandle.volume || 0;
                        
                        // Calcular cambios reales actualizados
                        const change = close - open;
                        const absChange = Math.abs(change);
                        const percentChange = (change / open) * 100;
                        const isUp = change >= 0;
                        
                        // Actualizar solo la última burbuja con datos reales
                        setBubbleData(prev => {
                          if (prev.length === 0) return prev;
                          
                          const updated = [...prev];
                          const lastIndex = updated.length - 1;
                          
                          // Actualizar con datos reales
                          updated[lastIndex] = {
                            ...updated[lastIndex],
                            value: absChange,
                            isUp,
                            change,
                            percentChange,
                            price: close,
                            high,
                            low,
                            volume
                          };
                          
                          return updated;
                        });
                      }
                    }, 5000); // Actualizar cada 5 segundos para datos en tiempo real
                    
                    return () => {
                      clearInterval(interval);
                      clearInterval(updateInterval);
                    };
                  }, [candles]);
                  
                  // Mostrar mensaje si no hay datos
                  if (!candles || candles.length === 0 || bubbleData.length === 0) {
                    return (
                      <div className="w-full h-full flex items-center justify-center text-black font-bold">
                        No hay datos de velas disponibles
                      </div>
                    );
                  }
                  
                  // Calcular tamaño de burbuja
                  const getBubbleSize = (value: number) => {
                    const minSize = 40;
                    const maxSize = 120;
                    const scaleFactor = 8000;
                    const size = minSize + (value * scaleFactor);
                    return Math.min(size, maxSize); // Limitar tamaño máximo
                  };
                  
                  return (
                    <>
                      {/* Leyenda */}
                      <div className="bg-black/50 p-2 rounded-lg inline-block mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-black text-xs font-bold">Precio subió</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-black text-xs font-bold">Precio bajó</span>
                        </div>
                      </div>
                      
                      {/* Contenedor de burbujas con fondo amarillo fijo */}
                      <div className="relative w-full h-[400px] bg-yellow-400 rounded-lg p-4">
                        {bubbleData.map((bubble, index) => {
                          // Distribuir horizontalmente por tiempo (más reciente a la derecha)
                          const xPercent = (index / (bubbleData.length - 1)) * 100;
                          const xPos = 10 + (xPercent * 0.8); // 10% a 90% del ancho
                          
                          // Distribuir verticalmente con algo de variación
                          const yPos = 30 + (Math.sin(index * 0.8) + 1) * 30;
                          
                          // Tamaño basado en el cambio de precio
                          const size = getBubbleSize(bubble.value);
                          
                          return (
                            <div 
                              key={bubble.id}
                              className="absolute rounded-full flex items-center justify-center
                                      text-white font-bold text-xs cursor-pointer group"
                              style={{
                                left: `${xPos}%`,
                                top: `${yPos}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                backgroundColor: bubble.isUp ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                                transform: 'translate(-50%, -50%)',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                                zIndex: bubbleData.length - index
                              }}
                            >
                              {/* Tooltip con información real detallada */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                                          bg-black/90 text-white text-xs rounded-lg p-2 w-48
                                          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                <div className="font-bold text-center mb-1">{bubble.time}</div>
                                <div className="flex justify-between">
                                  <span>Cierre:</span>
                                  <span className="font-mono">${bubble.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Apertura:</span>
                                  <span className="font-mono">${bubble.open.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Máximo:</span>
                                  <span className="font-mono">${bubble.high.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Mínimo:</span>
                                  <span className="font-mono">${bubble.low.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Cambio:</span>
                                  <span className={`font-mono ${bubble.isUp ? 'text-green-500' : 'text-red-500'}`}>
                                    {bubble.change > 0 ? '+' : ''}{bubble.change.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Cambio %:</span>
                                  <span className={`font-mono ${bubble.isUp ? 'text-green-500' : 'text-red-500'}`}>
                                    {bubble.percentChange > 0 ? '+' : ''}{bubble.percentChange.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs opacity-75 mt-1">
                                  <span>Vol:</span>
                                  <span className="font-mono">{(bubble.volume || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Línea de tiempo */}
                      <div className="mt-4 bg-black/50 p-2 rounded-lg">
                        <div className="flex justify-between">
                          {bubbleData.filter((_, i) => i % 2 === 0).map(bubble => (
                            <div key={`time-${bubble.id}`} className="text-black text-xs font-bold">
                              {bubble.time}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>


        </div>
        
        {/* Tarjetas destacadas debajo de los charts principales */}
        <div className="flex justify-center w-full mt-20 mb-20">
          <div className="w-full max-w-4xl">
            <DisplayCards
              cards={[
                {
                  className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  title: "Noticias",
                  description: "Coinbase compra Deribit por 2.900 millones",
                  className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  title: "Halving Countdown",
                  description: `Faltan ${diasParaHalving} días para el halving de BTC`,
                  className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
                },
              ]}
            />
          </div>
        </div>
        {/* Botón volver y login abajo del todo */}
        <div className="flex justify-center mt-20">
          <div className="flex flex-row gap-9 items-center">
  <LoginLogoutButton />
</div>
        </div>
      </div>
      {/* Modal de galería de perfiles */}
      <Modal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Selecciona tu foto de perfil</h2>
          <div className="grid grid-cols-3 gap-4">
            {cryptoImages.map((image) => (
              <div
                key={image.id}
                className="relative cursor-pointer"
                onClick={() => {
                  setSelectedImage(image.src);
                  setIsGalleryOpen(false);
                }}
              >
                <div className="relative h-24 w-24">
                  <Image
                    src={image.src}
                    alt={image.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <p className="text-sm text-white mt-2 text-center">{image.name}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
      
      {/* Modal de apuestas pendientes */}
      <Modal isOpen={isPendingBetsModalOpen} onClose={() => setIsPendingBetsModalOpen(false)}>
        <div className="p-6 max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Apuestas Pendientes</h2>
            <button 
              onClick={() => setIsPendingBetsModalOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {pendingBets.length > 0 ? (
            <div className="space-y-4">
              {pendingBets.map((bet, index) => (
                <div key={bet.id} className="bg-black/60 border border-blue-500/50 rounded-lg p-4 shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-400 font-bold text-lg">Apuesta #{index + 1}</span>
                    <span className="text-gray-300 text-sm">{new Date(bet.timestamp).toLocaleTimeString('es-ES')}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-black/80 p-2 rounded">
                      <span className="text-gray-400 text-xs">Predicción</span>
                      <div className={`font-bold ${bet.prediction === "BULLISH" ? "text-green-500" : "text-red-500"}`}>
                        {bet.prediction === "BULLISH" ? "ALCISTA" : "BAJISTA"}
                      </div>
                    </div>
                    
                    <div className="bg-black/80 p-2 rounded">
                      <span className="text-gray-400 text-xs">Monto</span>
                      <div className="font-bold text-yellow-400">{bet.amount} monedas</div>
                    </div>
                    
                    <div className="bg-black/80 p-2 rounded">
                      <span className="text-gray-400 text-xs">Apalancamiento</span>
                      <div className="font-bold text-white">{bet.leverage || 1}x</div>
                    </div>
                    
                    <div className="bg-black/80 p-2 rounded">
                      <span className="text-gray-400 text-xs">Par</span>
                      <div className="font-bold text-white">{bet.symbol || "BTCUSDT"}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Timeframe: {bet.timeframe || "1m"}</span>
                    <span>ID: {bet.id.substring(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No tienes apuestas pendientes</div>
              <button 
                onClick={() => {
                  setIsPendingBetsModalOpen(false);
                  router.push('/game');
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg px-4 py-2 mt-2"
              >
                Ir a jugar
              </button>
            </div>
          )}
        </div>
      </Modal>
      {/* Footer visible y fijo al final */}
      <footer className="w-full bg-zinc-900 text-center py-8 mt-10 border-t border-zinc-800">
        <span className="text-zinc-400 font-medium"> 2025 CandleRush — Todos los derechos reservados</span>
      </footer>
    </main>
  );
}