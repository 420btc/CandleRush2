"use client"

import React, { useState, useEffect } from "react";
import { canAttemptMathChallenge, incrementMathChallengeCount, getMathChallengeTimeLeft, MATH_CHALLENGE_LIMIT } from "@/utils/math-challenge-limit";
import { useGame } from "@/context/game-context";
import { TrendingUp, TrendingDown, Percent, DollarSign } from "lucide-react";

function generateMathChallenge() {
  // Nivel avanzado: operaciones encadenadas y números grandes
  const ops = ['+', '-', '×', '÷'];
  // Decide si es operación simple o encadenada
  const isChained = Math.random() > 0.5;
  let question = '';
  let answer = 0;

  if (isChained) {
    // Ejemplo: (a op1 b) op2 c
    let a = Math.floor(Math.random() * 800) + 200; // 200-999
    let b = Math.floor(Math.random() * 300) + 100; // 100-399
    let c = Math.floor(Math.random() * 100) + 10;  // 10-109
    let op1 = ops[Math.floor(Math.random() * ops.length)];
    let op2 = ops[Math.floor(Math.random() * ops.length)];
    // Para divisiones, aseguramos resultado entero
    if (op1 === '÷') { b = Math.max(1, Math.floor(a / (Math.floor(Math.random() * 5) + 2))); a = b * (Math.floor(Math.random() * 5) + 2); }
    if (op2 === '÷') { c = Math.max(1, Math.floor((op1 === '÷' ? a / b : eval(`${a}${op1 === '×' ? '*' : op1}${b}`)) / (Math.floor(Math.random() * 5) + 2))); let prev = (op1 === '÷' ? a / b : op1 === '×' ? a * b : op1 === '+' ? a + b : a - b); c = Math.max(1, Math.floor(prev / (Math.floor(Math.random() * 5) + 2))); if (c === 0) c = 1; }
    // Calcula resultado
    let part1 = op1 === '+' ? a + b : op1 === '-' ? a - b : op1 === '×' ? a * b : Math.floor(a / b);
    answer = op2 === '+' ? part1 + c : op2 === '-' ? part1 - c : op2 === '×' ? part1 * c : Math.floor(part1 / c);
    question = `${a} ${op1} ${b} ${op2} ${c} = ?`;
  } else {
    // Operación simple
    let a = Math.floor(Math.random() * 900) + 100; // 100-999
    let b = Math.floor(Math.random() * 900) + 100; // 100-999
    let op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '-') { if (a < b) [a, b] = [b, a]; }
    if (op === '÷') { b = Math.max(1, Math.floor(a / (Math.floor(Math.random() * 10) + 2))); a = b * (Math.floor(Math.random() * 10) + 2); }
    answer = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : Math.floor(a / b);
    question = `${a} ${op} ${b} = ?`;
  }
  return { question, answer: answer.toString() };
}

export default function UserStats() {
  // --- Password section state ---
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [customCoins, setCustomCoins] = useState(1500); // Estado para las monedas personalizadas

  // --- Password handler ---
  function handlePasswordSubmit() {
    // Verificar si es la contraseña para agregar monedas personalizadas
    if (passwordInput.startsWith("custom:")) {
      const [_, amountStr] = passwordInput.split(":");
      const amount = parseInt(amountStr, 10);
      if (!isNaN(amount)) {
        setCustomCoins(prev => prev + amount);
        setPasswordMsg(`¡Contraseña correcta! +${amount} monedas`);
        if (typeof addCoins === 'function') addCoins(amount);
      } else {
        setPasswordMsg("Formato de cantidad inválido");
      }
    } else if (passwordInput === "420420420") {
      if (typeof addCoins === 'function') addCoins(1500);
      setPasswordMsg("¡Contraseña correcta! +1500 monedas");
    } else {
      setPasswordMsg("Contraseña incorrecta");
    }
    setPasswordInput("");
    setTimeout(() => {
      setShowPasswordSection(false);
      setPasswordMsg("");
    }, 1800);
  }

  // Guardar las monedas personalizadas en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('custom_coins', customCoins.toString());
    }
  }, [customCoins]);

  // Cargar las monedas personalizadas al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCoins = parseInt(localStorage.getItem('custom_coins') || '1500', 10);
      setCustomCoins(savedCoins);
    }
  }, []);

  const { bets, userBalance, addCoins } = useGame();

  // Calcular la racha real de victorias consecutivas
  let realStreak = 0;
  // --- Top Racha persistente ---
  const [topStreak, setTopStreak] = useState(0);
  let tempStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < bets.length; i++) {
    if (bets[i].status === "WON") {
      currentStreak++;
      if (currentStreak > tempStreak) tempStreak = currentStreak;
    } else if (bets[i].status === "LOST" || bets[i].status === "LIQUIDATED") {
      currentStreak = 0;
    }
  }
  // Al montar, lee el récord guardado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = parseInt(localStorage.getItem('top_win_streak') || '0', 10);
      setTopStreak(saved);
    }
  }, []);
  // Si la racha calculada es mayor que el récord, actualiza localStorage y el estado
  useEffect(() => {
    if (tempStreak > topStreak) {
      setTopStreak(tempStreak);
      if (typeof window !== 'undefined') {
        localStorage.setItem('top_win_streak', tempStreak.toString());
      }
    }
  }, [tempStreak, topStreak]);
  // Racha actual (desde el final)
  for (let i = bets.length - 1; i >= 0; i--) {
    if (bets[i].status === "WON") {
      realStreak++;
    } else if (bets[i].status === "LOST" || bets[i].status === "LIQUIDATED") {
      break;
    }
  }

  // Calculate stats
  const totalBets = bets.length;
  const wonBets = bets.filter((bet) => bet.status === "WON").length;
  const lostBets = bets.filter((bet) => bet.status === "LOST").length;
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

  // Toro/Oso
  const bullBets = bets.filter(b => b.prediction === 'BULLISH').length;
  const bearBets = bets.filter(b => b.prediction === 'BEARISH').length;
  const bullPct = totalBets > 0 ? Math.round((bullBets / totalBets) * 100) : 0;
  const bearPct = totalBets > 0 ? 100 - bullPct : 0;
  let bullVsBearText = '';
  let bullVsBearIcon = '';
  if (bullPct > bearPct) {
    bullVsBearText = 'Eres más Toro';
    bullVsBearIcon = '🐂';
  } else if (bearPct > bullPct) {
    bullVsBearText = 'Eres más Oso';
    bullVsBearIcon = '🐻';
  } else {
    bullVsBearText = 'Equilibrado';
    bullVsBearIcon = '⚖️';
  }

  // Ganancias/Pérdidas solo de apuestas (ignora retos, ruleta, etc)
  const netBetProfit = bets.reduce((acc, bet) => {
    if (bet.status === "WON" && typeof bet.winnings === "number" && typeof bet.amount === "number") {
      return acc + (bet.winnings - bet.amount);
    } else if ((bet.status === "LOST" || bet.status === "LIQUIDATED") && typeof bet.amount === "number") {
      return acc - bet.amount;
    }
    return acc;
  }, 0);
  const isProfitable = netBetProfit >= 0;

  // --- NUEVO: Ganancias y pérdidas totales acumuladas ---
  const totalWon = bets.filter(b => b.status === "WON" && typeof b.winnings === 'number').reduce((sum, b) => sum + (b.winnings || 0), 0);
  const totalLost = bets.filter(b => (b.status === "LOST" || b.status === "LIQUIDATED") && typeof b.amount === 'number').reduce((sum, b) => sum + (b.amount || 0), 0);
  // Formato separador de miles
  const formatNum = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  // Estado para el reto matemático
  const [showMathModal, setShowMathModal] = useState(false);
  const [mathChallenge, setMathChallenge] = useState(generateMathChallenge());
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathError, setMathError] = useState('');
  const [mathSuccess, setMathSuccess] = useState(false);
  const [mathAttempts, setMathAttempts] = useState(0);
  const [mathTimeLeft, setMathTimeLeft] = useState(0);
  const [canAttempt, setCanAttempt] = useState(true);

  // Obtener el progreso actual (ej: 1/3)
  const [mathProgress, setMathProgress] = useState<{count: number, limit: number}>({count: 0, limit: MATH_CHALLENGE_LIMIT});

  // Actualizar intentos y tiempo restante cada vez que se muestra el modal o cada 60s
  useEffect(() => {
    function updateMathState() {
      const canTry = canAttemptMathChallenge();
      setCanAttempt(canTry);
      setMathTimeLeft(getMathChallengeTimeLeft());
      // Leer progreso real desde localStorage
      if (typeof window !== 'undefined') {
        try {
          const data = localStorage.getItem('math_challenge_attempts');
          if (data) {
            const parsed = JSON.parse(data);
            const count = parsed && typeof parsed.count === 'number' ? parsed.count : 0;
            setMathProgress({count, limit: MATH_CHALLENGE_LIMIT});
            setMathAttempts(count);
          } else {
            setMathProgress({count: 0, limit: MATH_CHALLENGE_LIMIT});
            setMathAttempts(0);
          }
        } catch {
          setMathProgress({count: 0, limit: MATH_CHALLENGE_LIMIT});
          setMathAttempts(0);
        }
      }
    }
    updateMathState();
    const interval = setInterval(updateMathState, 60000);
    return () => clearInterval(interval);
  }, [showMathModal]);

  const handleCheckMath = () => {
    if (!canAttemptMathChallenge()) {
      setMathError('Has alcanzado el máximo de retos matemáticos por hoy.');
      setMathSuccess(false);
      return;
    }
    if (mathAnswer.trim() === mathChallenge.answer) {
      setMathSuccess(true);
      setMathError('');
      incrementMathChallengeCount();
      setTimeout(() => {
        setShowMathModal(false);
        setMathAnswer('');
        setMathChallenge(generateMathChallenge());
        setMathSuccess(false);
      }, 1200);
      if (typeof addCoins === 'function') addCoins(100);
    } else {
      setMathError('Respuesta incorrecta, inténtalo de nuevo.');
      setMathSuccess(false);
    }
  };

  return (
    <div className="space-y-3.6 text-white">
      <style jsx>{`
        @media (max-width: 768px) {
          .stats-container {
            height: 60px;
            overflow-y: auto;
            padding: 1px;
            display: flex;
            flex-direction: column;
            gap: 1px;
          }
          .stats-item {
            padding: 0.1rem 0;
            font-size: 0.6rem;
            line-height: 1.1;
            height: 12px;
            margin: 0;
          }
          .stats-icon {
            width: 0.8rem;
            height: 0.8rem;
          }
          .stats-number {
            font-size: 0.65rem;
            line-height: 1;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.1rem;
            height: 30px;
            flex: 1;
            overflow-y: auto;
          }
          .stats-card {
            padding: 0.1rem;
            font-size: 0.5rem;
            height: 14px;
          }
          .stats-container .grid p {
            margin: 0;
            padding: 0.05rem 0;
            font-size: 0.5rem;
          }
          .stats-container .grid > div {
            height: 14px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
        }
      `}</style>
      {/* Toro/Oso y Top racha - Compacto */}
      <div className="flex items-center justify-between text-xs mb-0.9 stats-item">
        <div className="flex items-center gap-0.5">
          <span className="text-lg">{bullVsBearIcon}</span>
          <span className="font-bold text-yellow-300 text-sm">{bullVsBearText}</span>
          <span className="ml-1 text-zinc-300 text-sm">({bullPct}% Toro / {bearPct}% Oso)</span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-pink-300 font-bold text-sm">Top racha:</span>
          <span className="font-extrabold text-pink-300 text-sm">{topStreak}</span>
        </div>
      </div>
      {/* Racha actual */}
      <div className="flex items-center justify-between text-xs stats-item">
        <div className="flex items-center gap-1">
          {realStreak >= 3 ? (
            <span className="text-orange-400 animate-pulse text-lg">🔥</span>
          ) : (
            <span className="text-zinc-400 text-lg">🏁</span>
          )}
          <span className="text-sm font-bold">Racha actual</span>
        </div>
        <span className={`font-extrabold text-base ${realStreak >= 3 ? "text-orange-400" : ""} ${realStreak >= 1 ? "animate-shake" : ""}`}>{realStreak}</span>
      </div>
      <style jsx>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.5s infinite;
          display: inline-block;
        }
      `}</style>
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5 text-green-400" />
          <span className="text-sm font-bold text-white">Balance</span>
        </div>
        <div className="flex items-center gap-2 stats-item">
          <span className="font-extrabold text-lg text-yellow-300">${formatNum(userBalance)}</span>
          <button
            className="ml-2 px-2 py-1 rounded bg-yellow-400 text-black text-xs font-bold shadow hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-zinc-500 disabled:text-zinc-300 disabled:cursor-not-allowed"
            style={{ minWidth: 24, minHeight: 24 }}
            onClick={() => setShowMathModal(true)}
            title={canAttempt ? "Recargar monedas" : "Máximo de retos matemáticos alcanzado (3 cada 24h)"}
            disabled={!canAttempt}
          >
            +💰
          </button>
        </div>
      </div>

      {/* Modal de reto matemático para recargar monedas */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-900 rounded-xl p-6 shadow-lg border-2 border-yellow-400 min-w-[260px] text-center">
            <h2 className="text-lg font-bold mb-2 text-yellow-400 flex items-center justify-center gap-2">
              ¡Reto matemático!
              <span className="text-xs font-normal text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded-full ml-2">{mathProgress.count}/{mathProgress.limit}</span>
            </h2>
            <p className="mb-3 text-white">Resuelve para ganar <span className="font-bold text-yellow-300">100 monedas</span>:</p>
            {!canAttempt && (
              <div className="mb-2 text-red-400 font-bold">
                Has alcanzado el máximo de retos matemáticos por 24h.<br />
                Intenta de nuevo en {Math.floor(mathTimeLeft / 3600000)}h {Math.floor((mathTimeLeft % 3600000) / 60000)}min.
              </div>
            )}
            <div className="mb-3 text-xl font-mono text-yellow-200">{mathChallenge.question}</div>
            <input
              type="text"
              className="w-24 px-2 py-1 rounded border border-yellow-400 text-center text-black font-bold"
              value={mathAnswer}
              onChange={e => setMathAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCheckMath(); }}
              autoFocus
              disabled={!canAttempt}
            />
            <div className="flex justify-center gap-2 mt-4">
  <button
    className="px-3 py-1 bg-green-500 hover:bg-green-400 rounded text-white font-bold disabled:bg-zinc-500 disabled:text-zinc-300"
    onClick={handleCheckMath}
    disabled={!canAttempt}
  >Aceptar</button>
  <button
    className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white font-bold"
    onClick={() => { setShowMathModal(false); setMathAnswer(''); setMathChallenge(generateMathChallenge()); }}
  >Cancelar</button>
  <button
    className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 rounded text-black font-bold border border-yellow-600 shadow"
    onClick={() => setShowPasswordSection(true)}
    type="button"
  >Contraseña</button>
</div>
{showPasswordSection && (
  <div className="mt-3 p-3 border-2 border-yellow-400 rounded-lg bg-black/80">
    <div className="mb-2 text-yellow-300 font-bold">Introduce la contraseña secreta:</div>
    <input
      type="password"
      className="w-32 px-2 py-1 rounded border border-yellow-400 text-center text-black font-bold"
      value={passwordInput}
      onChange={e => setPasswordInput(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
      autoFocus
    />
    <button
      className="ml-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 rounded text-black font-bold border border-yellow-600"
      onClick={handlePasswordSubmit}
      type="button"
    >OK</button>
    {passwordMsg && <div className={`mt-2 ${passwordMsg === '¡Contraseña correcta! +1500 monedas' ? 'text-green-400' : 'text-red-400'}`}>{passwordMsg}</div>}
  </div>
) }
            {mathError && <div className="text-red-400 mt-2">{mathError}</div>}
            {mathSuccess && <div className="text-green-400 mt-2">¡Correcto! +100 monedas</div>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-white">
          {isProfitable ? (
            <TrendingUp className="h-5 w-5 text-green-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-400" />
          )}
          <span className="text-sm font-bold text-white">Ganancias/Pérdidas</span>
        </div>
        <span className={`font-extrabold text-lg ${isProfitable ? "text-green-400" : "text-red-400"}`}>{isProfitable ? "+" : ""}{netBetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      {/* Liquidaciones */}
      <div className="flex items-center justify-between text-white" style={{ marginTop: '0.125rem' }}>
        <div className="flex items-center gap-2 text-white">
          <span className="text-lg">💀</span>
          <span className="text-sm font-bold text-red-400">Liquidaciones</span>
        </div>
        <span className="font-black text-lg text-red-400">{bets.filter(b => b.status === "LIQUIDATED").length}</span>
      </div>
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-white">
          <Percent className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-bold text-white">Tasa de victorias</span>
        </div>
        <span className="font-black text-lg text-white">{winRate.toFixed(1)}%</span>
      </div>
      <div className="grid grid-cols-3 gap-1.8 mt-3.6 text-white font-[Montserrat,Inter,Rubik,Poppins,sans-serif] stats-grid">
        <div className="bg-zinc-900/80 border border-yellow-300/40 p-2 rounded-lg text-center text-white">
          <p className="text-xs font-bold text-yellow-200 drop-shadow-sm stats-item">Total</p>
          <p className="font-black text-white text-shadow-lg stats-number" style={{textShadow:'0 1px 6px #FFD60055'}}>{totalBets}</p>
        </div>
        <div className="bg-green-900/50 border border-green-400/30 p-2 rounded-lg text-center text-white">
          <p className="text-xs font-bold text-green-300 drop-shadow-sm stats-item">Ganadas</p>
          <p className="font-black text-green-200 text-shadow-lg stats-number" style={{textShadow:'0 1px 6px #00FF8555'}}>{wonBets}</p>
        </div>
        <div className="bg-red-900/50 border border-red-400/30 p-2 rounded-lg text-center text-white">
          <p className="text-xs font-bold text-red-300 drop-shadow-sm stats-item">Perdidas</p>
          <p className="font-black text-red-200 text-shadow-lg stats-number" style={{textShadow:'0 1px 6px #FF222255'}}>{lostBets}</p>
        </div>
      </div>
    </div>
  );
}
