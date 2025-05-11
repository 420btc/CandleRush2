"use client";

import Link from "next/link";
import { TiltedScroll } from "@/components/ui/tilted-scroll";

export default function HowToPlayPage() {
  const gameTips = [
    { id: "1", text: "Apostar en velas alcistas (BULL) o bajistas (BEAR)" },
    { id: "2", text: "Elige tu apalancamiento sabiamente (1x a 10x)" },
    { id: "3", text: "Gana hasta 10x tu apuesta con apalancamiento" },
    { id: "4", text: "Evita la liquidación con stop-loss" },
    { id: "5", text: "Análisis técnico en tiempo real" },
    { id: "6", text: "Historial de apuestas detallado" },
    { id: "7", text: "Mini-juego para practicar" },
    { id: "8", text: "Premios diarios y semanales" },
    { id: "9", text: "AutoMix: Sistema automático de apuestas" },
    { id: "10", text: "AutoBull: Apuestas automáticas alcistas" },
    { id: "11", text: "AutoBear: Apuestas automáticas bajistas" },
    { id: "12", text: "Bonus por apuestas consecutivas" },
    { id: "13", text: "Sistema de logros y recompensas" },
    { id: "14", text: "Guarda tu progreso y estadísticas" },
    { id: "15", text: "Compite por el primer lugar" },
    { id: "16", text: "Analiza patrones de velas" },
    { id: "17", text: "Aprende con el modo demo" },
    { id: "18", text: "Gestiona tu balance con cuidado" },
    { id: "19", text: "Sigue las tendencias del mercado" },
    { id: "20", text: "Practica antes de apostar real" },
  ];

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center md:text-left">Cómo Jugar CandleRush 2</h1>
          <ol className="space-y-4 text-yellow-400">
            <li>
              Elige el tamaño de tu apuesta y el apalancamiento deseado.
            </li>
            <li>
              Selecciona la dirección de la vela:
              <ul className="list-disc pl-5 text-yellow-400">
                <li><span className="font-black text-yellow-400">BULL</span>: Apostarás a que la vela cerrará más arriba (alcista).</li>
                <li><span className="font-black text-yellow-400">BEAR</span>: Apostarás a que la vela cerrará más abajo (bajista).</li>
              </ul>
            </li>
            <li>
              Espera a que termine el intervalo. Si acertaste la dirección, ¡ganas el premio!
            </li>
            <li>
              Consulta tu historial y sigue mejorando tu estrategia.
            </li>
          </ol>
          <div className="bg-black text-yellow-400 rounded-xl p-4 w-full text-center text-md shadow-lg border-2 border-yellow-400 mb-4">
            <strong className="text-yellow-400">Consejo:</strong> ¡Elige bien tu apalancamiento! Un mayor apalancamiento puede aumentar tus ganancias, pero también el riesgo de liquidación.
          </div>
          <Link href="/menu" className="mt-4 inline-block px-6 py-3 rounded-full bg-black text-yellow-400 border-2 border-yellow-400 font-bold text-lg shadow hover:bg-yellow-400 hover:text-black transition uppercase">Volver al menú</Link>
        </div>
        <div className="flex justify-center items-center w-full">
          <TiltedScroll 
            items={gameTips}
            className="mt-8"
          />
        </div>
      </div>
    </main>
  );
}