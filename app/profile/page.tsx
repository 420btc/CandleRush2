"use client";

// Ya no necesitamos extender Window

import Image from "next/image";
import { TrendingUp } from "lucide-react"
import { useLiquidations } from "@/components/game/liquidations";
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
import { useRouter } from "next/navigation";
import { useWhaleTrades } from "@/hooks/useWhaleTrades";
import { useState, useEffect, useMemo } from "react";
import { useGame } from "@/context/game-context";
import { useAuth } from "@/context/auth-context";
import Login from "@/components/login";
import DisplayCards from "@/components/ui/display-cards";
import { Modal } from "../components/modal";
import { Button } from "../components/button";
import type { Bet } from "@/types/game";
import { Book } from "@/components/ui/book";
import { GrAchievement } from "react-icons/gr";

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
      <CardContent className="flex-1 flex items-center justify-center p-0">
        <div className="w-full h-full flex items-center justify-center" style={{ marginTop: '-20px' }}>
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
            <div className="text-xs text-muted-foreground">
              Último trade: {recentTrades[0] ? new Date(recentTrades[0].timestamp).toLocaleTimeString() : 'Ninguno'}
      </div>
            <div className="text-xs text-muted-foreground">
              Total: {totalTrades} trades (5 min)
        </div>
        </div>
      </div>
      </CardFooter>
  </Card>
);
}

export default function ProfilePage() {
  const router = useRouter();
  const { bets, userBalance, candles } = useGame();
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

  // Calcular rachas
  const streakStats = useMemo(() => {
    let currentWinStreak = 0;
    let currentLoseStreak = 0;
    let maxWinStreak = 0;
    let maxLoseStreak = 0;
    let lastResult: 'WON' | 'LOST' | null = null;

    bets.forEach(bet => {
      if (bet.status === 'WON') {
        if (lastResult === 'WON') {
          currentWinStreak++;
        } else {
          currentWinStreak = 1;
          currentLoseStreak = 0;
        }
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        lastResult = 'WON';
      } else if (bet.status === 'LOST' || bet.status === 'LIQUIDATED') {
        if (lastResult === 'LOST') {
          currentLoseStreak++;
        } else {
          currentLoseStreak = 1;
          currentWinStreak = 0;
        }
        maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
        lastResult = 'LOST';
      }
    });

    return {
      currentWinStreak,
      currentLoseStreak,
      maxWinStreak,
      maxLoseStreak
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
          <div className="flex items-start justify-center gap-8 w-full max-w-5xl">
            {/* Contenedor izquierdo con foto y nombre */}
  <div className="w-56 flex flex-col items-center bg-black/70 rounded-xl border-4 border-yellow-400 overflow-hidden shadow-2xl" style={{boxShadow: '0 0 48px 12px #fde047cc'}}>
    <div className="relative h-36 w-36 mx-auto mt-4">
      <Image src={selectedImage} alt="Foto de perfil" fill className="object-cover rounded-xl" />
    </div>
    <span className="block w-full text-center text-3xl font-black text-yellow-400 py-2 drop-shadow">{currentUser ? currentUser.slice(0, 12) : "Usuario Pro"}</span>
  </div>

            {/* Componente Book a la derecha */}
            <div className="flex-1 max-w-xl flex items-center justify-start">
              <div className="cursor-pointer transform transition-transform hover:scale-105" onClick={() => router.push('/achievements')}>
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
              <div className="mx-auto w-full max-w-[240px] aspect-square min-h-[240px] rounded-xl bg-black flex items-center justify-center">
                {(() => {
                  const { won, lost, total } = betCharts;
                  const winrate = total ? Math.round((won / total) * 100) : 0;
                  const lossrate = total ? Math.round((lost / total) * 100) : 0;
                  const radialData = [
                    { name: 'Victorias', value: winrate, fill: '#22c55e' },
                    { name: 'Derrotas', value: lossrate, fill: '#ef4444' },
                  ];
                  return (
                    <ChartContainer config={radialConfig} className="w-full h-full">
                      <RadialBarChart data={radialData} innerRadius={30} outerRadius={90} width={210} height={210}>
                        <PolarGrid gridType="circle" stroke="#444" />
                        <RadialBar background dataKey="value" cornerRadius={10} />
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
                
                // Actualizar cada minuto en lugar de cada 5 segundos
                React.useEffect(() => {
                  const interval = setInterval(() => {
                    setKey(prev => prev + 1);
                    
                    // Actualizar los datos dentro del intervalo
                    if (typeof window !== "undefined") {
                      try {
                        const rawMemory = localStorage.getItem("autoMixMemory");
                        if (rawMemory) {
                          const memory = JSON.parse(rawMemory);
                          // Obtener la última entrada de la memoria
                          const lastEntry = memory[memory.length - 1] || {};
                          
                          // Actualizar información de la última apuesta
                          setLastBetDirection(lastEntry.direction || "DESCONOCIDO");
                          setLastBetResult(lastEntry.result);
                          setLastBetTime(lastEntry.timestamp ? new Date(lastEntry.timestamp).toLocaleTimeString() : "Sin datos");
                        }
                      } catch (error) {
                        console.error("Error leyendo autoMixMemory:", error);
                      }
                    }
                  }, 60000); // 60000ms = 1 minuto
                  
                  // También actualizar al montar el componente
                  if (typeof window !== "undefined") {
                    try {
                      const rawMemory = localStorage.getItem("autoMixMemory");
                      if (rawMemory) {
                        const memory = JSON.parse(rawMemory);
                        const lastEntry = memory[memory.length - 1] || {};
                        
                        setLastBetDirection(lastEntry.direction || "DESCONOCIDO");
                        setLastBetResult(lastEntry.result);
                        setLastBetTime(lastEntry.timestamp ? new Date(lastEntry.timestamp).toLocaleTimeString() : "Sin datos");
                      }
                    } catch (error) {
                      console.error("Error leyendo autoMixMemory:", error);
                    }
                  }
                  
                  return () => clearInterval(interval);
                }, []);
                
                // Datos fijos de ejemplo (si no hay memoria)
                let chartData = [
                  { indicator: "RSI", bullish: 70, bearish: 30 },
                  { indicator: "MACD", bullish: 80, bearish: 20 },
                  { indicator: "Mayoría", bullish: 60, bearish: 40 },
                  { indicator: "Valle", bullish: 50, bearish: 50 },
                  { indicator: "Volumen", bullish: 30, bearish: 70 },
                  { indicator: "Ballenas", bullish: 80, bearish: 20 },
                ];
                
                // Obtener datos reales si es posible
                if (typeof window !== "undefined") {
                  try {
                    const rawMemory = localStorage.getItem("autoMixMemory");
                    if (rawMemory) {
                      const memory = JSON.parse(rawMemory);
                      // Obtener la última entrada de la memoria
                      const lastEntry = memory[memory.length - 1] || {};
                      
                      // Actualizar chartData con valores reales
                      chartData = [
                        { 
                          indicator: "RSI", 
                          bullish: lastEntry.rsiSignal === "BULLISH" ? 80 : 20, 
                          bearish: lastEntry.rsiSignal === "BEARISH" ? 80 : 20 
                        },
                        { 
                          indicator: "MACD", 
                          bullish: lastEntry.macdSignal === "BULLISH" ? 80 : 20, 
                          bearish: lastEntry.macdSignal === "BEARISH" ? 80 : 20 
                        },
                        { 
                          indicator: "Mayoría", 
                          bullish: lastEntry.majoritySignal === "BULLISH" ? 80 : 20, 
                          bearish: lastEntry.majoritySignal === "BEARISH" ? 80 : 20 
                        },
                        { 
                          indicator: "Valle", 
                          bullish: lastEntry.valleyVote === "BULLISH" ? 80 : 20, 
                          bearish: lastEntry.valleyVote === "BEARISH" ? 80 : 20 
                        },
                        { 
                          indicator: "Volumen", 
                          // Revisar múltiples posibles propiedades para volumen
                          bullish: lastEntry.volumeVote === "BULLISH" || 
                                  (lastEntry.votesSnapshot?.volumeVote === "BULLISH") ? 80 : 20, 
                          bearish: lastEntry.volumeVote === "BEARISH" || 
                                  (lastEntry.votesSnapshot?.volumeVote === "BEARISH") ? 80 : 20 
                        },
                        { 
                          indicator: "Ballenas", 
                          // Revisar múltiples posibles propiedades para ballenas
                          bullish: lastEntry.whaleVote === "BULLISH" || 
                                  (lastEntry.votesSnapshot?.whaleVote === "BULLISH") ? 80 : 20, 
                          bearish: lastEntry.whaleVote === "BEARISH" || 
                                  (lastEntry.votesSnapshot?.whaleVote === "BEARISH") ? 80 : 20 
                        },
                      ];
                      
                      // Añadir logging para debug
                      console.log("Datos de AutoMix:", {
                        rsi: lastEntry.rsiSignal,
                        macd: lastEntry.macdSignal,
                        mayoría: lastEntry.majoritySignal,
                        valle: lastEntry.valleyVote,
                        volumen: lastEntry.volumeVote || (lastEntry.votesSnapshot?.volumeVote),
                        ballenas: lastEntry.whaleVote || (lastEntry.votesSnapshot?.whaleVote),
                        votesSnapshot: lastEntry.votesSnapshot
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
                        <RadarChart data={chartData}>
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                          />
                          <PolarAngleAxis 
                            dataKey="indicator" 
                            tick={{ fill: '#fff', fontSize: 9 }}
                          />
                          <PolarGrid radialLines={false} stroke="#333" />
                          <Radar
                            dataKey="bullish"
                            fill="var(--color-bullish)"
                            fillOpacity={0}
                            stroke="var(--color-bullish)"
                            strokeWidth={2}
                          />
                          <Radar
                            dataKey="bearish"
                            fill="var(--color-bearish)"
                            fillOpacity={0}
                            stroke="var(--color-bearish)"
                            strokeWidth={1.5}
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
                          lastBetDirection === "BEARISH" ? "bg-red-500 text-white" : 
                          "bg-gray-500 text-white"
                        }`}>
                          {lastBetDirection === "BULLISH" ? "ALCISTA" : 
                          lastBetDirection === "BEARISH" ? "BAJISTA" : 
                          "DESCONOCIDO"}
                        </span>
                        {lastBetResult && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            lastBetResult === "WIN" ? "bg-green-500 text-white" : 
                            lastBetResult === "LOSS" || lastBetResult === "LIQ" ? "bg-red-500 text-white" : 
                            "bg-gray-500 text-white"
                          }`}>
                            {lastBetResult === "WIN" ? "GANADA" : 
                            lastBetResult === "LOSS" ? "PERDIDA" : 
                            lastBetResult === "LIQ" ? "LIQUIDADA" : "..."}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 leading-none text-muted-foreground mt-1 text-xs">
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
              <CardDescription className="text-black">Últimas 6 velas de 1 minuto</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              {(() => {
                // Estado para almacenar y actualizar las velas
                const [candlesData, setCandlesData] = React.useState([
                  { time: "00:00", price: 0, isUp: true, priceChange: 0 },
                  { time: "00:01", price: 0, isUp: false, priceChange: 0 },
                  { time: "00:02", price: 0, isUp: true, priceChange: 0 },
                  { time: "00:03", price: 0, isUp: false, priceChange: 0 },
                  { time: "00:04", price: 0, isUp: true, priceChange: 0 },
                  { time: "00:05", price: 0, isUp: false, priceChange: 0 },
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
                      const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=6');
                      
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
                      if (candles && candles.length >= 6) {
                        // Tomar las últimas 6 velas
                        return candles.slice(-6).map(candle => {
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
                
                // Formatear los datos para el gráfico
                const chartData = candlesData.map(candle => ({
                  time: candle.time,
                  price: candle.price,
                  priceChange: candle.priceChange,
                  isUp: candle.isUp,
                  value: candle.isUp ? candle.price : -candle.price // Usar el precio real directamente
                }));
                
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
                            domain={['auto', 'auto']} 
                            hide 
                          />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#fff', fontSize: 10 }}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                // Calcular el precio real multiplicando por 1000 para revertir el escalado
                                const precioReal = Math.abs(data.price) * 1000;
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
                          >
                            {chartData.map((item, index) => (
                              <Cell
                                key={`cell-${index}`}
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
                      <div className="flex items-center justify-center gap-1 leading-none text-muted-foreground mt-1 text-xs">
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
                      
                      // Limitar a 6 puntos máximo
                      if (initialHistory.length > 6) {
                        initialHistory = initialHistory.slice(-6);
                      }
                    }
                  } else {
                    // Si no hay historial guardado, inicializar con puntos predeterminados
                    // que tengan algunas variaciones para mostrar una línea interesante
                    const baseBalance = userBalance || 1000;
                    
                    for (let i = 0; i < 6; i++) {
                      const time = new Date(now);
                      time.setMinutes(now.getMinutes() - (5 - i));
                      
                      const timeStr = time.toLocaleTimeString([], {
                        hour: '2-digit', 
                        minute: '2-digit'
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
                            if (newHistory.length > 6) {
                              const limitedHistory = newHistory.slice(-6);
                              
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
                              if (newHistory.length > 6) {
                                const limitedHistory = newHistory.slice(-6);
                                
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
                    label: "Balance",
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
                          <CartesianGrid vertical={false} horizontal={true} stroke="#333" />
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
                                    <p className="font-medium text-white">{data.time}</p>
                                    <p className="text-sm text-white">
                                      Balance: <span className="font-bold">{data.balance.toLocaleString('es-ES')}</span>
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
                            <LabelList
                              dataKey="balance"
                              position="top"
                              offset={12}
                              fill="#fff"
                              fontSize={10}
                              formatter={(value: number) => value.toLocaleString('es-ES')}
                            />
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
                      <div className="flex items-center justify-center gap-1 leading-none text-muted-foreground mt-1 text-xs">
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
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl rounded-xl">
            <CardHeader className="items-center pb-4">
              <CardTitle>Historial de Apuestas</CardTitle>
              <CardDescription className="text-black">Evolución de tus apuestas ganadas, perdidas y liquidadas</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={{
                  won: { label: "Ganadas", color: "#22c55e" },
                  lost: { label: "Perdidas", color: "#ef4444" },
                  liquidated: { label: "Liquidadas", color: "#eab308" },
                }}
                className="aspect-auto h-[300px] w-full"
              >
                <AreaChart
                  data={(() => {
                    // Evolución acumulada de apuestas por estado
                    const { bets } = useGame();
                    const data = [];
                    let won = 0;
                    let lost = 0;
                    let liquidated = 0;
                    
                    // Primero contamos los totales
                    const totalWon = bets.filter(b => b.status === "WON").length;
                    const totalLost = bets.filter(b => b.status === "LOST").length;
                    const totalLiquidated = bets.filter(b => b.status === "LIQUIDATED").length;
                    const maxTotal = Math.max(totalWon, totalLost, totalLiquidated, 1);
                    
                    // Normalizamos los datos para que todas las áreas tengan la misma escala
                    return bets
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((bet, i) => {
                        if (bet.status === "WON") won++;
                        if (bet.status === "LOST") lost++;
                        if (bet.status === "LIQUIDATED") liquidated++;
                        
                        // Normalizamos los valores para que vayan de 0 a 100
                        const total = won + lost + liquidated || 1;
                        
                        return {
                          ronda: i + 1,
                          won: (won / maxTotal) * 100,
                          lost: (lost / maxTotal) * 100,
                          liquidated: (liquidated / maxTotal) * 100,
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
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      return value;
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="won"
                    type="monotone"
                    fill="url(#fillWon)"
                    stroke="#22c55e"
                    stackId="1"
                    fillOpacity={0.8}
                  />
                  <Area
                    dataKey="lost"
                    type="monotone"
                    fill="url(#fillLost)"
                    stroke="#ef4444"
                    stackId="2"
                    fillOpacity={0.6}
                  />
                  <Area
                    dataKey="liquidated"
                    type="monotone"
                    fill="url(#fillLiquidated)"
                    stroke="#000000"
                    strokeWidth={1.5}
                    stackId="3"
                    fillOpacity={0.7}
                  />
                  <Legend />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Nuevo gráfico de rachas */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl rounded-xl mt-6">
            <CardHeader className="items-center pb-4">
              <CardTitle>Rachas de Trading</CardTitle>
              <CardDescription className="text-black">Análisis de tus rachas ganadoras y perdedoras</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6">
              <div className="grid grid-cols-3 gap-8 w-full">
                {/* Gráfico Radial */}
                <div className="col-span-1 bg-black rounded-xl p-4 flex flex-col items-center justify-center gap-8">
                  <div className="w-full flex justify-center" style={{ position: 'relative' }}>
                    <RadialBarChart
                      width={200}
                      height={160}
                      innerRadius={30}
                      outerRadius={80}
                      data={[
                        {
                          name: 'Racha Actual',
                          value: streakStats.currentWinStreak || streakStats.currentLoseStreak,
                          fill: streakStats.currentWinStreak > 0 ? '#22c55e' : '#ef4444'
                        },
                        {
                          name: 'Racha Máxima',
                          value: streakStats.maxWinStreak,
                          fill: '#eab308'
                        },
                        {
                          name: 'Racha Perdedora',
                          value: streakStats.maxLoseStreak,
                          fill: '#ef4444'
                        }
                      ]}
                      startAngle={0}
                      endAngle={360}
                    >
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-black p-2 rounded border border-yellow-500">
                                <p className="text-white">{`${payload[0].name}: ${payload[0].value}`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadialBarChart>
                  </div>
                  <div className="w-full text-center mt-4">
                    <div className="flex justify-center gap-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs text-white">Racha Actual</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-xs text-white">Racha Máxima</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-xs text-white">Racha Perdedora</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas de Rachas */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  {/* Racha Actual */}
                  <div className="bg-black rounded-xl p-6 flex flex-col items-center justify-center">
                    <p className="text-yellow-400 text-lg font-medium mb-2">Racha Actual</p>
                    <div className="flex items-center gap-2">
                      <div className={`text-4xl font-bold ${streakStats.currentWinStreak > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {streakStats.currentWinStreak || streakStats.currentLoseStreak}
                      </div>
                      <div className="text-sm text-gray-400">
                        {streakStats.currentWinStreak > 0 ? 'victorias' : 'derrotas'}
                      </div>
                    </div>
                  </div>

                  {/* Mejor Racha */}
                  <div className="bg-black rounded-xl p-6 flex flex-col items-center justify-center">
                    <p className="text-yellow-400 text-lg font-medium mb-2">Mejor Racha</p>
                    <div className="flex items-center gap-2">
                      <div className="text-4xl font-bold text-green-500">
                        {streakStats.maxWinStreak}
                      </div>
                      <div className="text-sm text-gray-400">victorias</div>
                    </div>
                  </div>

                  {/* Peor Racha */}
                  <div className="bg-black rounded-xl p-6 flex flex-col items-center justify-center">
                    <p className="text-yellow-400 text-lg font-medium mb-2">Peor Racha</p>
                    <div className="flex items-center gap-2">
                      <div className="text-4xl font-bold text-red-500">
                        {streakStats.maxLoseStreak}
                      </div>
                      <div className="text-sm text-gray-400">derrotas</div>
                    </div>
                  </div>

                  {/* Promedio */}
                  <div className="bg-black rounded-xl p-6 flex flex-col items-center justify-center">
                    <p className="text-yellow-400 text-lg font-medium mb-2">Promedio</p>
                    <div className="flex items-center gap-2">
                      <div className="text-4xl font-bold text-blue-500">
                        {Math.round((streakStats.maxWinStreak + streakStats.maxLoseStreak) / 2)}
                      </div>
                      <div className="text-sm text-gray-400">apuestas</div>
                    </div>
                  </div>
                </div>
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
      {/* Footer visible y fijo al final */}
      <footer className="w-full bg-zinc-900 text-center py-8 mt-10 border-t border-zinc-800">
        <span className="text-zinc-400 font-medium"> 2025 CandleRush — Todos los derechos reservados</span>
      </footer>
    </main>
  );
}