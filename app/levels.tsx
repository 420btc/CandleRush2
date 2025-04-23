"use client";
export default function LevelsPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">Niveles y Progreso</h1>
      <div className="max-w-xl bg-zinc-800/80 rounded-xl p-8 shadow-xl border border-yellow-500">
        <p className="mb-4">Aquí podrás ver tu nivel, experiencia y logros en CandleRush.</p>
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>Sube de nivel apostando y ganando.</li>
          <li>Desbloquea logros especiales.</li>
          <li>¡Compite en el ranking global!</li>
        </ul>
        <p className="mt-6 text-zinc-400 text-xs">Sistema de niveles próximamente.</p>
      </div>
    </main>
  );
}
