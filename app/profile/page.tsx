"use client";
import Image from "next/image";
import UserStats from "@/components/game/user-stats";
import BetHistory from "@/components/game/bet-history";
import Achievements from "../../components/profile/Achievements";

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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Fondo de perfil centrado */}
      <div className="fixed inset-0 flex items-center justify-center z-0">
        <img src="/fondoperfil.png" alt="Fondo perfil" className="max-w-full max-h-screen w-auto h-auto object-contain opacity-95 drop-shadow-xl" />
      </div>
      {/* Perfil y logo arriba */}
      <div className="relative z-10 w-full flex flex-col items-center pt-8">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative w-56 h-56 rounded-full border-4 border-yellow-400 overflow-hidden shadow-2xl bg-black/70">
            <Image src="/perfil1.png" alt="Foto de perfil" fill className="object-cover" />
          </div>
          <span className="text-3xl font-black text-yellow-400 mt-2 drop-shadow">{typeof window !== "undefined" && localStorage.getItem("currentUser") ? localStorage.getItem("currentUser") : "Usuario Pro"}</span>
        </div>
        {/* Botón volver y login arriba */}
        <div className="flex flex-row gap-4 items-center mb-8">
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded shadow-lg transition-colors"
            onClick={() => router.push('/menu')}
          >
            ← Volver al Menú
          </button>
          <LoginLogoutButton />
        </div>
        {/* Sección de logros */}
        <Achievements />
      </div>
    </main>
  );
}
