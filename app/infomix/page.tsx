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
          <h1 className="text-5xl md:text-7xl text-yellow-400 font-bold tracking-wider" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
            Conoce a AutoMix
          </h1>
          <div className="w-full h-[90vh] relative">
            <RadialOrbitalTimeline timelineData={timelineData} />
          </div>
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-black/70 text-white p-4 border-t border-yellow-400 backdrop-blur-md h-40 overflow-y-auto">
        <div className="space-y-2">
          <div className="text-white/80">Desglose de votos:</div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Majority Signal (1 voto)</span>
              <span className="text-white">Tendencia alcista</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">RSI (0.5 votos)</span>
              <span className="text-white">Sobrecompra</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Valley (1 voto)</span>
              <span className="text-white">Soporte detectado</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">MACD (1 voto)</span>
              <span className="text-white">Cruce alcista</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Fibonacci (1 voto)</span>
              <span className="text-white">Nivel 0.618</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Market Structure (variable)</span>
              <span className="text-white">Tendencia alcista</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Trend (1 voto)</span>
              <span className="text-white">Tendencia alcista</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Volume Trend (1 voto)</span>
              <span className="text-white">Volumen alcista</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Golden Cross (1 voto)</span>
              <span className="text-white">Cruce alcista</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">EMA 55/200 (0.5 votos)</span>
              <span className="text-white">Posición alcista</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Whale Trades (2 votos)</span>
              <span className="text-white">Movimiento alcista</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">ADX + Memory (1 voto)</span>
              <span className="text-white">Tendencia fuerte</span>
            </div>
          </div>
          <div className="mt-4 text-center text-white/80">
            <span className="text-yellow-400">Total Votos:</span> 4.5/12.5
          </div>
        </div>
      </footer>
    </div>
  );
}
