"use client";
export default function ProfilePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">Perfil de Usuario</h1>
      <div className="max-w-xl bg-zinc-800/80 rounded-xl p-8 shadow-xl border border-yellow-500">
        <p className="mb-4">Aquí podrás ver y editar tu información de perfil.</p>
        <ul className="list-disc list-inside space-y-2 text-zinc-300">
          <li>Nombre de usuario</li>
          <li>Avatar</li>
          <li>Estadísticas</li>
        </ul>
        <p className="mt-6 text-zinc-400 text-xs">Personalización y perfil social próximamente.</p>
      </div>
    </main>
  );
}
