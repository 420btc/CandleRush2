'use client';

import Link from 'next/link';
import { RadialOrbitalTimeline } from '@/components/ui/radial-orbital-timeline';
import { ArrowRight, Link as LinkIcon, Zap, ArrowLeft } from 'lucide-react';

export default function InfoMixPage() {
  const timelineData = [
    {
      id: 1,
      title: "Decisiones",
      date: "Ahora",
      content: "Sistema de toma de decisiones inteligente con múltiples indicadores técnicos: MACD, RSI, Fibonacci, Estructura de Mercado. Aprendizaje automático y corrección de patrones.",
      category: "Feature",
      icon: Zap,
      relatedIds: [2, 4],
      status: "completed" as const,
      energy: 90
    },
    {
      id: 2,
      title: "Modos",
      date: "Cada Vela",
      content: "Modos de juego automáticos y manuales. Incluye: MIX (apuesta única por vela), AUTO (gestión automática basada en votación), MANUAL (control total del usuario)",
      category: "Strategy",
      icon: ArrowRight,
      relatedIds: [1, 3],
      status: "completed" as const,
      energy: 85
    },
    {
      id: 3,
      title: "Temporalidades",
      date: "100%",
      content: "Gestión de tiempos y duraciones. Soporta múltiples temporalidades con ajuste automático de parámetros: 1m, 5m, 15m, 1h, 4h, 1d. Análisis de tendencias a diferentes plazos.",
      category: "Coverage",
      icon: LinkIcon,
      relatedIds: [2, 5],
      status: "completed" as const,
      energy: 100
    },
    {
      id: 4,
      title: "AutoMix",
      date: "Ahora",
      content: "Modo automático de juego con cobertura total. Una apuesta por vela basada en votación ponderada. Sistema de memoria para evitar patrones y optimizar resultados.",
      category: "Feature",
      icon: Zap,
      relatedIds: [1],
      status: "completed" as const,
      energy: 90
    },
    {
      id: 5,
      title: "Votos",
      date: "Cada Vela",
      content: "Sistema de votación múltiple con ponderación: RSI (25%), MACD (25%), Fibonacci (25%), Estructura de Mercado (25%). Memoria histórica para optimizar decisiones.",
      category: "Strategy",
      icon: ArrowRight,
      relatedIds: [3],
      status: "completed" as const,
      energy: 85
    }
  ];

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0">
        <img
          src="/fondomix.png"
          alt="Fondo"
          className="w-full h-full object-cover filter blur-[1px]"
        />
      </div>
      <div className="min-h-screen bg-black/50 text-white relative">
        <Link
          href="/menu"
          className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-yellow-400" />
        </Link>
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-5xl md:text-7xl text-yellow-400 font-bold tracking-wider">
            Conoce a AutoMix
          </h1>
          <div className="w-full h-[90vh] relative">
            <RadialOrbitalTimeline timelineData={timelineData} />
          </div>
        </div>
      </div>
    </div>
  );
}
