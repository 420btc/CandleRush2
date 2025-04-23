"use client";
import Link from "next/link";

const menuItems = [
  {
    label: "Jugar",
    description: "Ir al juego principal",
    href: "/",
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    label: "Cómo Jugar",
    description: "Aprende las reglas y mecánicas",
    href: "/how-to-play",
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
    ),
  },
  {
    label: "Niveles",
    description: "Consulta tu progreso y logros",
    href: "/levels",
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-yellow-500"><path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
    ),
  },
  {
    label: "Perfil",
    description: "Ver y editar tu perfil",
    href: "/profile",
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-purple-500"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a8.38 8.38 0 0 1 13 0" /></svg>
    ),
  },
];

export default function MenuPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-yellow-400 drop-shadow-lg select-none">CandleRush</h1>
      <div className="flex flex-col gap-6 w-full max-w-md">
        {menuItems.map((item) => (
          <Link
            href={item.href}
            key={item.label}
            className="group flex items-center gap-4 p-6 rounded-2xl bg-zinc-900/80 hover:bg-yellow-500/90 transition-colors shadow-2xl border-2 border-zinc-800 hover:border-yellow-300 cursor-pointer"
          >
            <span className="transition-transform group-hover:scale-110">{item.icon}</span>
            <span className="flex flex-col">
              <span className="text-xl font-bold group-hover:text-zinc-900 text-yellow-200">{item.label}</span>
              <span className="text-zinc-400 text-sm group-hover:text-zinc-900">{item.description}</span>
            </span>
          </Link>
        ))}
      </div>
      <footer className="mt-16 text-zinc-500 text-xs opacity-60">v1.0.0 &copy; CandleRush 2025</footer>
    </main>
  );
}
