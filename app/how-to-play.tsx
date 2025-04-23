"use client";
export default function HowToPlayPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">¿Cómo Jugar?</h1>
      <div className="max-w-xl text-lg bg-zinc-800/80 rounded-xl p-8 shadow-xl border border-yellow-500">
        <ol className="list-decimal list-inside space-y-2">
          <li>Selecciona un par y un timeframe.</li>
          <li>Coloca tu apuesta: elige si la vela será alcista o bajista.</li>
          <li>Espera a que cierre la vela para ver si ganas.</li>
          <li>¡Gana recompensas según el movimiento del mercado!</li>
        </ol>
        <p className="mt-6 text-zinc-300 text-sm">Más detalles y tutorial próximamente.</p>
      </div>
    </main>
  );
}
