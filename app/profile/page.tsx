"use client";
import Image from "next/image";
import UserStats from "@/components/game/user-stats";
import BetHistory from "@/components/game/bet-history";

import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";

import Login from "@/components/login";

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
          className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg py-4 text-lg shadow-lg border-2 border-yellow-600 mt-4"
          onClick={handleLogout}
        >Cerrar sesión</button>
      ) : (
        <button
          className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg py-4 text-lg shadow-lg border-2 border-yellow-600 mt-4"
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
            <Login onLogin={(username) => { setUser(username); setShowLogin(false); }} />
          </div>
        </div>
      )}
    </>
  );
}


export default function ProfilePage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-black flex flex-col items-center py-10 px-4">
      {/* Botón para volver al menú principal */}
      <button
        className="absolute left-4 top-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded shadow-lg transition-colors"
        onClick={() => router.push('/menu')}
      >
        ← Volver al Menú
      </button>
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        {/* BOTÓN LOGIN/DESLOGIN REAL */}
        <LoginLogoutButton />
        {/* Avatar y nombre */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden shadow-lg">
            <Image src="/perfil1.png" alt="Foto de perfil" fill className="object-cover" />
          </div>
          <span className="text-2xl font-bold text-yellow-400 mt-2">{typeof window !== "undefined" && localStorage.getItem("currentUser") ? localStorage.getItem("currentUser") : "Usuario Pro"}</span>
        </div>

        {/* Estadísticas */}
        <div className="w-full bg-zinc-900 border-2 border-yellow-400 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Estadísticas</h2>
          <UserStats />
        </div>

        {/* Historial de apuestas */}
        <div className="w-full bg-zinc-900 border-2 border-yellow-400 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Historial de Apuestas</h2>
          <BetHistory />
        </div>
      </div>
    </main>
  );
}
