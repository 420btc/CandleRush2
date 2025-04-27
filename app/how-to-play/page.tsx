"use client";
import Link from "next/link";

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-yellow-400 px-4 py-8">
      <div className="max-w-2xl w-full bg-yellow-400 rounded-2xl shadow-2xl p-8 border-4 border-black flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-6 text-center drop-shadow-lg uppercase">¿Cómo jugar?</h1>

        {/* Explicación de apalancamiento y liquidación arriba, fuera del recuadro negro */}
        <div className="w-full mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-xl text-black text-md text-center shadow-lg">
          <span className="font-bold text-lg">¿Cómo funciona el apalancamiento y la liquidación?</span><br/>
          El apalancamiento multiplica tu apuesta y tus posibles ganancias, pero también el riesgo. Si eliges un apalancamiento de <span className="text-yellow-600 font-bold">2000x</span>, tu apuesta será liquidada si el precio se mueve solo un <span className="text-yellow-600 font-bold">0.05%</span> en contra de tu predicción.<br/>
          <span className="text-xs text-yellow-700">Ejemplo: Apostando 10 monedas con 2000x, si el precio se mueve ese pequeño porcentaje en contra, pierdes la apuesta (liquidación). ¡Úsalo con precaución!</span>
        </div>
        <ol className="list-decimal text-lg text-black font-semibold mb-8 space-y-4 pl-6 w-full">
          <li>
            Elige el <span className="text-yellow-600 font-bold">Par</span> (ej: BTC/USDT) y el <span className="text-yellow-600 font-bold">Intervalo</span> de tiempo para operar.
          </li>
          <li>
            Selecciona la cantidad a apostar y el apalancamiento deseado.
          </li>
          <li>
            Haz tu predicción:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><span className="font-black">BULL</span>: Apostarás a que la vela cerrará más arriba (alcista).</li>
              <li><span className="font-black">BEAR</span>: Apostarás a que la vela cerrará más abajo (bajista).</li>
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
          <strong>Consejo:</strong> ¡Elige bien tu apalancamiento! Un mayor apalancamiento puede aumentar tus ganancias, pero también el riesgo de liquidación.
        </div>
        <Link href="/menu" className="mt-4 inline-block px-6 py-3 rounded-full bg-black text-yellow-400 border-2 border-yellow-400 font-bold text-lg shadow hover:bg-yellow-400 hover:text-black transition uppercase">Volver al menú</Link>
      </div>
    </main>
  );
}
