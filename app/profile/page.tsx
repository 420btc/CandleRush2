"use client";
import Image from "next/image";
import { TrendingUp } from "lucide-react"
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
  Sector
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

// Hook para obtener y computar métricas de apuestas del usuario logueado

function useBetChartsData() {
  // Obtener las apuestas reales desde el contexto global
  const { bets } = useGame();
  
  // Definir el tipo para las apuestas
  type BetWithStatus = Bet & { status: string; prediction: string; timestamp: number };

  // Radar: estados de apuesta
  const radarData = useMemo(() => {
    const typedBets = bets as BetWithStatus[];
    return [
      { status: 'Ganadas', value: typedBets.filter(b => b.status === 'WON').length },
      { status: 'Perdidas', value: typedBets.filter(b => b.status === 'LOST').length },
      { status: 'Liquidadas', value: typedBets.filter(b => b.status === 'LIQUIDATED').length },
      { status: 'Pendientes', value: typedBets.filter(b => b.status === 'PENDING').length },
    ];
  }, [bets]);

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
          <CardTitle>Pie Chart - Interactive</CardTitle>
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
  timestamp: number;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  symbol: string;
}

function WhaleTradesCard() {
  const [currentTime, setCurrentTime] = React.useState(Date.now());
  
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
  const whaleTrades = useWhaleTrades({
    minUsd: 10000, // Mostrar trades mayores a $10,000
    symbols: ["btcusdt@trade", "ethusdt@trade"], // Pares a monitorear en minúsculas con @trade
    refreshInterval: 1000, // Actualizar cada segundo
    limit: 10000 // Aumentar el límite a 10000 transacciones
  }) as WhaleTrade[];

  // Contar trades de compra y venta en los últimos 5 minutos
  const fiveMinutesAgo = currentTime - (5 * 60 * 1000);
  
  const recentTrades = React.useMemo(() => {
    console.log('Todos los trades:', whaleTrades); // Debug
    return whaleTrades.filter(trade => trade.timestamp > fiveMinutesAgo);
  }, [whaleTrades, fiveMinutesAgo]);
  
  const { buyTrades, sellTrades } = React.useMemo(() => {
    const buys = recentTrades.filter(trade => trade.side === 'buy').length;
    const sells = recentTrades.filter(trade => trade.side === 'sell').length;
    console.log('Buy trades:', buys, 'Sell trades:', sells); // Debug
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
          Actividad reciente de ballenas (últimos 5 min)
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
                          className="fill-foreground text-2xl font-bold transition-all duration-300"
                        >
                          {Math.round(animatedValue)}
                        </tspan>
                        <tspan
                          x={viewBox?.cx || 0}
                          y={((viewBox?.cy || 0) + 4)}
                          className="fill-muted-foreground text-xs"
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
  const betCharts = useBetChartsData();

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
      {/* Perfil y logo arriba */}
      <div className="container mx-auto w-full flex flex-col pt-8 items-center">
        <div className="flex flex-col items-center gap-4 mb-8">
  <div className="w-56 flex flex-col items-center bg-black/70 rounded-xl border-4 border-yellow-400 overflow-hidden shadow-2xl" style={{boxShadow: '0 0 48px 12px #fde047cc'}}>
    <div className="relative h-36 w-36 mx-auto mt-4">
      <Image src={selectedImage} alt="Foto de perfil" fill className="object-cover rounded-xl" />
    </div>
    <span className="block w-full text-center text-3xl font-black text-yellow-400 py-2 drop-shadow">{currentUser ? currentUser.slice(0, 12) : "Usuario Pro"}</span>
  </div>
  <div className="flex gap-4">
    <Button
      variant="outline"
      onClick={() => setIsGalleryOpen(true)}
      className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
    >
      <span className="text-lg font-medium tracking-widest uppercase text-shadow-sm px-4 py-1">Cambiar foto</span>
    </Button>
    <Button
      variant="outline"
      onClick={() => {
        const randomImage = cryptoImages[Math.floor(Math.random() * cryptoImages.length)];
        setSelectedImage(randomImage.src);
      }}
      className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
    >
      <span className="text-lg font-medium tracking-widest uppercase text-shadow-sm px-4 py-1">Aleatorio</span>
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
              <div className="mx-auto w-full max-w-[250px] aspect-square min-h-[250px] rounded-xl bg-black flex items-center justify-center -mt-1">
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
              <div className="mx-auto w-full max-w-[250px] aspect-square min-h-[250px] rounded-xl bg-black flex items-center justify-center">
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
                className="mx-auto w-full max-w-[250px] aspect-square rounded-xl bg-black flex items-center justify-center -mt-14"
              >
                <BarChart
                  width={210}
                  height={210}
                  data={(() => {
                    // Agrupa apuestas por fecha (día) y suma volumen de longs y shorts
                    const { bets } = useGame();
                    // Leer y guardar datos en localStorage
                    const LS_KEY = 'bet_volume_chart_days';
                    let grouped = bets.reduce((acc: Record<string, { longs: number; shorts: number }>, bet) => {
                      if (!bet.timestamp) return acc;
                      const date = new Date(bet.timestamp).toISOString().slice(0, 10);
                      if (!acc[date]) acc[date] = { longs: 0, shorts: 0 };
                      if (bet.prediction === "BULLISH") acc[date].longs += bet.amount;
                      if (bet.prediction === "BEARISH") acc[date].shorts += bet.amount;
                      return acc;
                    }, {});
                    // Generar los próximos 4 días a partir de hoy
                    const today = new Date();
                    const days = [] as string[];
                    for (let i = 0; i < 5; i++) {
                      const d = new Date(today.getTime());
                      d.setDate(today.getDate() + i);
                      const dateStr = d.toISOString().slice(0, 10);
                      days.push(dateStr);
                    }
                    // Completa con ceros si no hay apuestas para esos días
                    const chartData = days.map(date => ({
                      date,
                      longs: grouped[date]?.longs || 0,
                      shorts: grouped[date]?.shorts || 0,
                    }));
                    // Persistir en localStorage
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem(LS_KEY, JSON.stringify(chartData));
                    }
                    // Leer de localStorage si no hay apuestas
                    if (bets.length === 0 && typeof window !== 'undefined') {
                      const stored = window.localStorage.getItem(LS_KEY);
                      if (stored) return JSON.parse(stored);
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
                        weekday: "short",
                        day: "2-digit",
                        month: "short"
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
              <div className="w-full max-w-[260px] h-[250px] bg-black rounded-lg flex items-center justify-center">
                <LineChart
                  width={250}
                  height={225}
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
              <div className="mx-auto w-full max-w-[250px] aspect-square min-h-[250px] rounded-xl bg-black flex items-center justify-center -mt-4">
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
                          bullish: lastEntry.volumeVote === "BULLISH" ? 80 : 20, 
                          bearish: lastEntry.volumeVote === "BEARISH" ? 80 : 20 
                        },
                        { 
                          indicator: "Ballenas", 
                          bullish: lastEntry.whaleVote === "BULLISH" ? 80 : 20, 
                          bearish: lastEntry.whaleVote === "BEARISH" ? 80 : 20 
                        },
                      ];
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
                    <ChartContainer
                      config={chartConfig}
                      className="mx-auto aspect-square max-h-[250px]"
                    >
                      <RadarChart data={chartData}>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        <PolarAngleAxis 
                          dataKey="indicator" 
                          tick={{ fill: '#fff', fontSize: 10 }}
                        />
                        <PolarGrid radialLines={false} stroke="#444" />
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
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ChartContainer>
                    
                    <div className="mt-2">
                      <div className="flex items-center gap-2 font-medium leading-none">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span> Señales alcistas vs 
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span> Señales bajistas
                      </div>
                      <div className="flex items-center gap-2 leading-none text-black font-medium mt-2">
                        Última decisión: 
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
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
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
                      <div className="flex items-center gap-2 leading-none text-muted-foreground mt-1">
                        Última actualización: {lastBetTime} (actualiza cada 1 min)
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
              <CardTitle>Gráfico Personalizado 2</CardTitle>
              <CardDescription className="text-black">Espacio para gráfico personalizado</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[250px] h-[250px] bg-black rounded-lg flex items-center justify-center">
                {/* Contenido del gráfico será agregado aquí */}
              </div>
            </CardContent>
          </Card>
          
          {/* Nueva tarjeta 3 */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>Gráfico Personalizado 3</CardTitle>
              <CardDescription className="text-black">Espacio para gráfico personalizado</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[250px] h-[250px] bg-black rounded-lg flex items-center justify-center">
                {/* Contenido del gráfico será agregado aquí */}
              </div>
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
