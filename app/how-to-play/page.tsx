"use client";

import Link from "next/link";
import { TiltedScroll } from "@/components/ui/tilted-scroll";

export default function HowToPlayPage() {
  const gameTips = [
    { id: "1", text: "Apostar en velas alcistas (BULL) o bajistas (BEAR)" },
    { id: "2", text: "Elige tu apalancamiento sabiamente (100x a 10000x)" },
    { id: "3", text: "Gana hasta 1000x tu apuesta con apalancamiento" },
    { id: "4", text: "Evita la liquidación rezando!" },
    { id: "5", text: "Análisis técnico en tiempo real" },
    { id: "6", text: "Revisa tus apuestas pasadas y tu tasa de victoria" },
    { id: "7", text: "AutoDraw te dibujará el futuro, pruebalo!" },
    { id: "8", text: "Revisa los apoyos en la EMA 55 o 200" },
    { id: "9", text: "Revisa el MACD siempre y los cierres de los valles" },
    { id: "10", text: "El RSI + Volumen + Tiempo y las EMAS te ayudarán a predecir el movimiento" },
    { id: "11", text: "Las apuestas en Modo Automatico son infinitas" },
    { id: "12", text: "Bonus por apuestas consecutivas x3,x6,x9" },
    { id: "13", text: "Sistema de logros y recompensas en camino" },
    { id: "14", text: "Guarda tu progreso y estadísticas con Google" },
    { id: "15", text: "Compite por el primer lugar (online en camino)" },
    { id: "16", text: "Analiza patrones de velas" },
    { id: "17", text: "Aprende con el modo manual o AutoMix" },
    { id: "18", text: "Gestiona tu balance con cuidado" },
    { id: "19", text: "Sigue las tendencias del mercado con SMC+ y los soportes y resistencias" },
    { id: "20", text: "Practica aquí antes de apostar real en otra plataforma" },
    { id: "21", text: "Usa el indicador SMC+ para detectar tendencias fuertes" },
    { id: "22", text: "El volumen te muestra el interés real del mercado" },
    { id: "23", text: "Los patrones de velas pueden predecir reversiones" },
    { id: "24", text: "El stop-loss te protege de pérdidas grandes" },
    { id: "25", text: "El take-profit te asegura ganancias" },
    { id: "26", text: "El RSI te muestra sobrecompra o sobreventa" },
    { id: "27", text: "El MACD te indica cambios de tendencia" },
    { id: "28", text: "Las EMAs te muestran la dirección del mercado" },
    { id: "29", text: "Los soportes y resistencias son niveles clave" },
    { id: "30", text: "El AutoMix aprende de tus patrones de trading" },
    { id: "31", text: "El AutoBull busca oportunidades alcistas" },
    { id: "32", text: "El AutoBear busca oportunidades bajistas" },
    { id: "33", text: "Los logros te recompensan por tu progreso" },
    { id: "34", text: "El sistema de bonus te premia por consistencia" },
    { id: "35", text: "El modo demo te permite practicar sin riesgo" },
    { id: "36", text: "El historial muestra tu evolución" },
    { id: "37", text: "El análisis técnico te da ventaja" },
    { id: "38", text: "El AutoDraw te ayuda a entender las EMAS y su funcionamiento" },
    { id: "39", text: "El SMC+ te muestra la fuerza del mercado inteligente" },
    { id: "40", text: "El volumen te muestra el interés real" },
  ];

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 h-[840px]">
        <div className="md:w-1/2 flex flex-col justify-between h-full">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4 text-center md:text-left">
            Cómo Jugar Candle<span className="text-red-600">Rush</span> <span className="text-green-600">2</span>
          </h1>
          <ol className="flex-1 space-y-2 text-yellow-400">
            <li>
              Elige el tamaño de tu apuesta y el apalancamiento deseado.
            </li>
            <li>
              Selecciona la dirección de la vela:
              <ul className="list-disc pl-5 text-yellow-400">
                <li><span className="font-black text-green-600">BULL</span>: Apostarás a que la vela cerrará más arriba (alcista).</li>
                <li><span className="font-black text-red-600">BEAR</span>: Apostarás a que la vela cerrará más abajo (bajista).</li>
              </ul>
            </li>
            <li>
              Espera a que termine el intervalo, puede ser 1min o incluso 12h o 1d!.  Si acertaste la dirección, ¡ganas el premio al instante en la resolucion automatica!
            </li>
            <li>
              Consulta tu historial y sigue mejorando tu estrategia. Tambien puedes usar AutoMix y ver como el algoritmo apuesta el solo durante minutos o incluso horas si no pierdes todas las monedas!
            </li>
          </ol>
          <div className="bg-black text-yellow-400 rounded-xl p-4 w-full text-center text-md shadow-lg border-2 border-yellow-400 mb-4">
            <strong className="text-yellow-400">Consejo:</strong> ¡Elige bien tu apalancamiento!  Un mayor apalancamiento puede aumentar tus ganancias, pero también el riesgo de liquidación.
          </div>
          <Link href="/menu" className="mt-4 inline-block px-8 py-4 rounded-full bg-black text-yellow-400 border-2 border-yellow-400 font-bold text-lg shadow-lg hover:bg-yellow-400 hover:text-black transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 uppercase tracking-wider">Volver al menú</Link>
          <Link href="/game" className="mt-4 inline-block px-8 py-4 rounded-full bg-yellow-400 text-black border-2 border-yellow-400 font-bold text-lg shadow-lg hover:bg-black hover:text-yellow-400 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 uppercase tracking-wider text-center">Volver a Jugar</Link>
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