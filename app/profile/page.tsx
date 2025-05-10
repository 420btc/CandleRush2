"use client";
import Image from "next/image";
import { TrendingUp } from "lucide-react"
import { PolarRadiusAxis } from "recharts";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBarChart, RadialBar, Tooltip, Legend, LineChart, Line, XAxis, YAxis, BarChart, Bar } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import UserStats from "@/components/game/user-stats";
import BetHistory from "@/components/game/bet-history";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Login from "@/components/login";
import DisplayCards from "@/components/ui/display-cards";

import { useGame } from "@/context/game-context";
import { useMemo } from "react";

// Hook para obtener y computar métricas de apuestas del usuario logueado
function useBetChartsData() {
  // DATOS MOCK: 3 ganadas, 5 liquidadas, 2 perdidas, 1 pendiente
  // 33 toros (BULLISH), 20 osos (BEARISH), más los status para los otros gráficos
  const bets = [
    // 33 toros
    ...Array(33).fill({ prediction: 'BULLISH', status: 'WON' }),
    // 20 osos
    ...Array(20).fill({ prediction: 'BEARISH', status: 'LOST' }),
    // 3 ganadas (extra para otros gráficos)
    { status: 'WON' }, { status: 'WON' }, { status: 'WON' },
    // 5 liquidadas
    { status: 'LIQUIDATED' }, { status: 'LIQUIDATED' }, { status: 'LIQUIDATED' }, { status: 'LIQUIDATED' }, { status: 'LIQUIDATED' },
    // 2 perdidas
    { status: 'LOST' }, { status: 'LOST' },
    // 1 pendiente
    { status: 'PENDING' },
  ];

  // Radar: estados de apuesta
  const radarData = useMemo(() => (
    [
      { status: 'Ganadas', value: bets.filter(b => b.status === 'WON').length },
      { status: 'Perdidas', value: bets.filter(b => b.status === 'LOST').length },
      { status: 'Liquidadas', value: bets.filter(b => b.status === 'LIQUIDATED').length },
      { status: 'Pendientes', value: bets.filter(b => b.status === 'PENDING').length },
    ]
  ), [bets]);

  // RadialBar: bullish vs bearish
  const bullish = bets.filter((b: any) => b.prediction === 'BULLISH').length;
  const bearish = bets.filter((b: any) => b.prediction === 'BEARISH').length;
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
const radarConfig = {
  Ganadas: { label: 'Ganadas', color: '#22c55e' },
  Perdidas: { label: 'Perdidas', color: '#ef4444' },
  Liquidadas: { label: 'Liquidadas', color: '#eab308' },
  Pendientes: { label: 'Pendientes', color: '#fbbf24' },
} satisfies ChartConfig;

const radialConfig = {
  Bullish: { label: 'Bullish', color: '#22c55e' },
  Bearish: { label: 'Bearish', color: '#ef4444' },
} satisfies ChartConfig;

const pieConfig = {
  Ganadas: { label: 'Ganadas', color: '#22c55e' },
  Perdidas: { label: 'Perdidas', color: '#ef4444' },
  Liquidadas: { label: 'Liquidadas', color: '#eab308' },
} satisfies ChartConfig;

// Datos y configuración para la gráfica radial
const radialChartData = [
  { browser: "chrome", visitors: 275, fill: "#ef4444" }, // rojo
  { browser: "safari", visitors: 200, fill: "#22c55e" }, // verde
  { browser: "firefox", visitors: 187, fill: "#888888" }, // gris
  { browser: "edge", visitors: 173, fill: "#bbbbbb" }, // gris claro
  { browser: "other", visitors: 90, fill: "#e5e7eb" }, // gris muy claro
];

const radialChartConfig = {
  visitors: {
    label: "Visitantes",
  },
  chrome: {
    label: "Chrome",
    color: "#ef4444",
  },
  safari: {
    label: "Safari",
    color: "#22c55e",
  },
  firefox: {
    label: "Firefox",
    color: "#888888",
  },
  edge: {
    label: "Edge",
    color: "#bbbbbb",
  },
  other: {
    label: "Other",
    color: "#e5e7eb",
  },
} satisfies ChartConfig;


// PieChartCard: Pie chart interactivo para la tercera tarjeta
import * as React from "react";
import { PieChart, Pie, Sector, Label } from "recharts";
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

const pieChartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
  },
  january: {
    label: "January",
    color: "#ef4444",
  },
  february: {
    label: "February",
    color: "#22c55e",
  },
  march: {
    label: "March",
    color: "#888888",
  },
  april: {
    label: "April",
    color: "#bbbbbb",
  },
  may: {
    label: "May",
    color: "#e5e7eb",
  },
} satisfies ChartConfig;

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
          <CardDescription>January - June 2024</CardDescription>
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
          className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg py-4 text-lg shadow-lg border-2 border-yellow-600 mt-4"
          onClick={handleLogout}
        >Cerrar sesión</button>
      ) : (
        <button
          className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg py-4 text-lg shadow-lg border-2 border-yellow-600 mt-4"
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
            <Login onLogin={(username) => { setUser(username); setShowLogin(false); }} />
          </div>
        </div>
      )}
    </>
  );
}


export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(typeof window !== "undefined" ? localStorage.getItem("currentUser") : null);
  }, []);

  return (
    <main className="w-full bg-black min-h-screen">
      {/* Perfil y logo arriba */}
      <div className="container mx-auto w-full flex flex-col pt-8 items-center">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative w-56 h-56 rounded-full border-4 border-yellow-400 overflow-hidden shadow-2xl bg-black/70">
            <Image src="/perfil1.png" alt="Foto de perfil" fill className="object-cover" />
          </div>
          <span className="text-3xl font-black text-yellow-400 mt-2 drop-shadow">{currentUser || "Usuario Pro"}</span>
        </div>
        {/* Gráficos de rendimiento/apuestas en 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-4">

          {/* Tarjeta 1: Resumen de apuestas (Radar) */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl">
            <CardHeader className="items-center pb-1">
              <CardTitle>Resumen de tus apuestas</CardTitle>
              <CardDescription>
                Distribución por estado: ganadas, perdidas, liquidadas y pendientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="mx-auto w-full max-w-[250px] aspect-square min-h-[250px] rounded-xl bg-black flex items-center justify-center">
                {/* Obtener datos de apuestas */}
                {(() => {
                  const { radarData } = useBetChartsData();
                  return (
                    <ChartContainer
                      config={radarConfig}
                      className="w-full h-full"
                    >
                      <RadarChart data={radarData} outerRadius={80} width={210} height={210}>
                        <PolarGrid stroke="#444" />
                        <PolarAngleAxis dataKey="status" stroke="#fff" />
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
                Total apuestas: {useBetChartsData().total}
              </div>
            </CardFooter>
          </Card>
          {/* Tarjeta 2: Porcentaje de victorias y derrotas (RadialBar) */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl">
            <CardHeader className="items-center pb-0">
              <CardTitle>Porcentaje de victorias y derrotas</CardTitle>
              <CardDescription>Winrate vs Lossrate en tus apuestas.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="mx-auto w-full max-w-[250px] aspect-square min-h-[250px] rounded-xl bg-black flex items-center justify-center">
                {(() => {
                  const { won, lost, total } = useBetChartsData();
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
                Winrate: {useBetChartsData().total ? Math.round((useBetChartsData().won / useBetChartsData().total) * 100) : 0}%
              </div>
            </CardFooter>
          </Card>
          {/* Tarjeta 3: Tipo de apuesta (Toro vs Oso) (Pie) */}
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl">
            <CardHeader className="items-center pb-0">
              <CardTitle>Tipo de apuesta: Toro vs Oso</CardTitle>
              <CardDescription>Proporción de apuestas bullish o bearish.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <div className="mx-auto w-full max-w-[250px] aspect-square min-h-[250px] rounded-xl bg-black flex items-center justify-center">
                {(() => {
                  const { bullish, bearish, total } = useBetChartsData();
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
                                      {bullPct}%
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 24}
                                      className="fill-muted-foreground"
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
                Toro: {useBetChartsData().bullish} &nbsp;|&nbsp; Oso: {useBetChartsData().bearish}
              </div>
            </CardFooter>
          </Card>
        </div>
        {/* Tarjetas adicionales para nuevas métricas personalizadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>Whales Toro vs Oso</CardTitle>
              <CardDescription>Actividad de grandes jugadores detectada</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-0">
              {/* RadialBarChart de whales toros/osos */}
              {/* Puedes reemplazar los datos por los reales cuando los tengas */}
              <ChartContainer
                config={{
                  toro: { label: "Toro", color: "#22c55e" },
                  oso: { label: "Oso", color: "#ef4444" },
                }}
                className="mx-auto aspect-square w-full max-w-[210px] mt-10"
              >
                <RadialBarChart
                  data={[{ whalesToro: 1260, whalesOso: 570 }]}
                  endAngle={180}
                  innerRadius={80}
                  outerRadius={130}
                >
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          const totalWhales = 1260 + 570;
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 16}
                                className="fill-foreground text-2xl font-bold"
                              >
                                {totalWhales.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 4}
                                className="fill-muted-foreground"
                              >
                                Whales totales
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                  <RadialBar
                    dataKey="whalesToro"
                    stackId="a"
                    cornerRadius={5}
                    fill="#22c55e"
                    className="stroke-transparent stroke-2"
                  />
                  <RadialBar
                    dataKey="whalesOso"
                    fill="#ef4444"
                    stackId="a"
                    cornerRadius={5}
                    className="stroke-transparent stroke-2"
                  />
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                Tendencia mensual: +5.2% <TrendingUp className="h-4 w-4" />
              </div>
              <div className="leading-none text-muted-foreground">
                
              </div>
            </CardFooter>
          </Card>
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>Evolución de apuestas</CardTitle>
              <CardDescription>Bullish vs Bearish por ronda</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {/* LineChart de evolución de apuestas bullish/bearish */}
              <div className="w-full max-w-[260px] h-[225px] bg-black rounded-lg flex items-center justify-center p-0">
                <LineChart width={250} height={225} data={[
                  { ronda: 1, bullish: 2, bearish: 2 },
                  { ronda: 2, bullish: 3, bearish: 5 },
                  { ronda: 3, bullish: 6, bearish: 1 },
                  { ronda: 4, bullish: 2, bearish: 4 },
                  { ronda: 5, bullish: 8, bearish: 1 },
                ]}>
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
            <CardHeader className="items-center pb-2">
              <CardTitle>Volumen Long vs Short</CardTitle>
              <CardDescription>Comparativa diaria de posiciones</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-0">
              <ChartContainer
                config={{
                  longs: { label: "Longs", color: "#22c55e" },
                  shorts: { label: "Shorts", color: "#ef4444" },
                }}
                className="mx-auto w-full max-w-[230px] aspect-square rounded-xl bg-black flex items-center justify-center -mt-5"
              >
                <BarChart width={220} height={220} data={[
                  { date: "2024-07-15", longs: 450, shorts: 300 },
                  { date: "2024-07-16", longs: 380, shorts: 420 },
                  { date: "2024-07-17", longs: 520, shorts: 120 },
                  { date: "2024-07-18", longs: 140, shorts: 550 },
                  { date: "2024-07-19", longs: 600, shorts: 350 },
                  { date: "2024-07-20", longs: 480, shorts: 400 },
                ]}>
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
                      })
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
                        className="w-[190px]"
                        formatter={(value, name, item, index) => (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[1px] bg-[--color-bg]"
                              style={{
                                "--color-bg": name === "longs" ? "#22c55e" : "#ef4444"
                              } as React.CSSProperties}
                            />
                            {name === "longs" ? "Longs" : "Shorts"}
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              {value}
                              <span className="font-normal text-muted-foreground">
                                contratos
                              </span>
                            </div>
                            {/* Add this after the last item */}
                            {index === 1 && (
                              <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                Total
                                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                  {item.payload.longs + item.payload.shorts}
                                  <span className="font-normal text-muted-foreground">
                                    contratos
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      />
                    }
                    cursor={false}
                  />
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
                  className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  title: "Halving Countdown",
                  description: "Faltan 1069 días para el halving de BTC",
                  className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
                },
              ]}
            />
          </div>
        </div>
        {/* Botón volver y login abajo del todo */}
        <div className="flex justify-center mt-16">
          <div className="flex flex-row gap-4 items-center">
            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 relative top-2"
              onClick={() => router.push('/menu')}
            >
              ← Volver al Menú
            </button>
            <LoginLogoutButton />
          </div>
        </div>
      </div>
      {/* Footer visible y fijo al final */}
      <footer className="w-full bg-zinc-900 text-center py-8 mt-10 border-t border-zinc-800">
        <span className="text-zinc-400 font-medium">© 2025 CandleRush — Todos los derechos reservados</span>
      </footer>
    </main>
  );
}
