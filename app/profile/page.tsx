"use client";
import Image from "next/image";
import { TrendingUp } from "lucide-react"
import { PolarRadiusAxis } from "recharts";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBarChart, RadialBar, Tooltip, Legend, LineChart, Line, XAxis, YAxis, BarChart, Bar, AreaChart, Area, CartesianGrid } from "recharts";
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
import { useGame } from "@/context/game-context";
import { useMemo } from "react";
import { useState, useEffect } from "react";
import Login from "@/components/login";
import DisplayCards from "@/components/ui/display-cards";
import { Modal } from "../components/modal";
import { Button } from "../components/button";

// Hook para obtener y computar métricas de apuestas del usuario logueado

function useBetChartsData() {
  // Obtener las apuestas reales desde el contexto global
  const { bets } = useGame();

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
    <span className="block w-full text-center text-3xl font-black text-yellow-400 py-2 drop-shadow">{currentUser || "Usuario Pro"}</span>
  </div>
  <div className="flex gap-2">
    <Button
      variant="outline"
      onClick={() => setIsGalleryOpen(true)}
      className="bg-yellow-400 hover:bg-yellow-500 text-black"
    >
      Cambiar foto
    </Button>
    <Button
      variant="outline"
      onClick={() => {
        const randomImage = cryptoImages[Math.floor(Math.random() * cryptoImages.length)];
        setSelectedImage(randomImage.src);
      }}
      className="bg-yellow-400 hover:bg-yellow-500 text-black"
    >
      Aleatorio
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
                        formatter={(value, name, item, index) => (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[1px] bg-[--color-bg]"
                              style={{
                                "--color-bg": name === "longs" ? "#22c55e" : "#ef4444",
                              } as React.CSSProperties}
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
                                  {item.payload.longs + item.payload.shorts}
                                  <span className="font-normal text-muted-foreground">contratos</span>
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
        {/* Tarjetas adicionales para nuevas métricas personalizadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
          <Card className="bg-yellow-400 border-yellow-500 shadow-2xl min-h-[250px] rounded-xl flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>Whales Toro vs Oso</CardTitle>
              <CardDescription className="text-black">Actividad de grandes jugadores detectada</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-0">
              {/* RadialBarChart de whales toros/osos */}
              {/* Puedes reemplazar los datos por los reales cuando los tengas */}
              <ChartContainer
                config={{
                  toro: { label: "Toro", color: "#22c55e" },
                  oso: { label: "Oso", color: "#ef4444" },
                }}
                className="mx-auto aspect-square w-full max-w-[220px] mt-10"
              >
                <RadialBarChart
                  data={[{ whalesToro: 5, whalesOso: 2 }]}
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
                          const totalWhales = 6 + 1;
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
                    return bets
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
                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                                      {bullPct}%
                                    </tspan>
                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
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
                    let won = 0;
                    let lost = 0;
                    let liquidated = 0;
                    return bets
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((bet, i) => {
                        if (bet.status === "WON") won++;
                        if (bet.status === "LOST") lost++;
                        if (bet.status === "LIQUIDATED") liquidated++;
                        return {
                          ronda: i + 1,
                          won,
                          lost,
                          liquidated,
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
                  <CartesianGrid vertical={false} />
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
                    stackId="a"
                  />
                  <Area
                    dataKey="lost"
                    type="monotone"
                    fill="url(#fillLost)"
                    stroke="#ef4444"
                    stackId="a"
                  />
                  <Area
                    dataKey="liquidated"
                    type="monotone"
                    fill="url(#fillLiquidated)"
                    stroke="#eab308"
                    stackId="a"
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
                  className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
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
