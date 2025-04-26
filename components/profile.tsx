import { useEffect, useState } from "react";
import type { Bet } from "@/types/game";
import { useGame } from "../context/game-context";
import Login from "./login";

// BOTÓN DE PRUEBA SIMULADO (debe aparecer arriba del perfil)
// Elimina este bloque tras la prueba
const TestButton = () => (
  <div style={{position:'fixed', top: 20, right: 20, zIndex: 9999}}>
    <button style={{background:'red', color:'white', fontWeight:'bold', fontSize:'2rem', padding:'1rem 2rem', borderRadius:'1rem', boxShadow:'0 0 20px #000'}}>BOTÓN TEST</button>
  </div>
);

export default function Profile() {
  const { betsByPair } = useGame();
  // Unir todas las apuestas de todos los pares/timeframes
  const allBets: Bet[] = Object.values(betsByPair)
    .flatMap(pair => Object.values(pair).flat())
    .sort((a, b) => b.timestamp - a.timestamp);
  const bets = allBets;
  const [topStreak, setTopStreak] = useState(0);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    setUser(localStorage.getItem("currentUser"));
  }, []);

  // Calcular la mejor racha histórica (solo usando bets del contexto global)
  useEffect(() => {
    let maxStreak = 0;
    let currentStreak = 0;
    bets.forEach((bet: Bet) => {
      if (bet.status === "WON") {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else if (bet.status === "LOST" || bet.status === "LIQUIDATED") {
        currentStreak = 0;
      }
    });
    setTopStreak(maxStreak);
    localStorage.setItem("topStreak", String(maxStreak));
  }, [bets]);

  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto p-6 text-white pb-32">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Perfil {user ? `de ${user}` : ""}</h2>
        </div>
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
        <div className="mb-6 p-4 rounded bg-zinc-800 flex items-center justify-between">
          <span className="font-semibold">Mejor racha histórica:</span>
          <span className="text-orange-400 text-xl font-bold">{topStreak}</span>
        </div>
        <h3 className="text-xl font-semibold mb-2 mt-6">Historial de apuestas</h3>
        <div className="overflow-x-auto bg-zinc-900 rounded-lg p-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-zinc-700">
                <th className="p-4">#</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Predicción</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Símbolo</th>
                <th className="p-4">Timeframe</th>
                <th className="p-4">Resuelta</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet: Bet, i: number) => (
                <tr key={bet.id} className={
                  bet.status === "WON"
                    ? "bg-green-900"
                    : bet.status === "LOST"
                    ? "bg-red-900"
                    : "bg-yellow-900 animate-pulse"
                } style={{height: '72px', minHeight: '72px'}}>
                  <td className="p-4 font-mono align-middle text-lg">{i + 1}</td>
                  <td className="p-4 font-bold align-middle text-lg text-center">
                    {bet.status === "PENDING" ? (
                      <span className="text-yellow-300">Pendiente</span>
                    ) : bet.status === "WON" ? (
                      <span className="text-green-300">Ganada</span>
                    ) : (
                      <span className="text-red-300">Perdida</span>
                    )}
                  </td>
                  <td className="p-4 flex flex-col items-center justify-center gap-1 align-middle">
                    <img src={bet.prediction === "BULLISH" ? "/bull.png" : "/bear.png"} alt={bet.prediction === "BULLISH" ? "Bull" : "Bear"} className="w-7 h-7 mx-auto mb-1" />
                    <span className="block text-base text-center">{bet.prediction === "BULLISH" ? "Alcista" : "Bajista"}</span>
                  </td>
                  <td className="p-4 align-middle text-lg">${bet.amount}</td>
                  <td className="p-4 align-middle text-base">{bet.symbol}</td>
                  <td className="p-4 align-middle text-base">{bet.timeframe}</td>
                  <td className="p-4 align-middle text-base">
                    {bet.status === "PENDING"
                      ? "-"
                      : bet.resolvedAt
                      ? new Date(bet.resolvedAt).toLocaleTimeString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Botón de login/logout dentro del box principal, siempre visible al final */}
      <div className="flex justify-center mt-10">
        {user ? (
          <button
            className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg py-4 text-lg shadow-lg border-2 border-yellow-600"
            onClick={() => {
              localStorage.removeItem("currentUser");
              setUser(null);
            }}
          >Cerrar sesión</button>
        ) : (
          <button
            className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg py-4 text-lg shadow-lg border-2 border-yellow-600"
            onClick={() => setShowLogin(true)}
          >Iniciar sesión / Registrarse</button>
        )}
      </div>
    </div>
  );
}
