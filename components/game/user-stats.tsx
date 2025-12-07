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
    if (passwordInput.startsWith("fumar:")) {
      const [_, amountStr] = passwordInput.split(":");
      const amount = parseInt(amountStr, 10);
      if (!isNaN(amount)) {
        setCustomCoins(prev => prev + amount);
        setPasswordMsg(`¡Fumaste ${amount} monedas!`);
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
  const [mathProgress, setMathProgress] = useState<{ count: number, limit: number }>({ count: 0, limit: MATH_CHALLENGE_LIMIT });

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
            setMathProgress({ count, limit: MATH_CHALLENGE_LIMIT });
            setMathAttempts(count);
          } else {
            setMathProgress({ count: 0, limit: MATH_CHALLENGE_LIMIT });
            setMathAttempts(0);
          }
        } catch {
          setMathProgress({ count: 0, limit: MATH_CHALLENGE_LIMIT });
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
    <div className="space-y-3 text-white p-2 pb-6 m-0 h-full flex flex-col">
      <style jsx>{`
        @media (max-width: 768px) {
          .stats-grid {
             gap: 0.25rem;
          }
        }
      `}</style>

      {/* Toro/Oso y Top racha - Mejor espaciado */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-800 pb-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{bullVsBearIcon}</span>
            <div className="flex flex-col">
              <span className="font-bold text-yellow-300 text-sm leading-tight">{bullVsBearText}</span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-tight leading-tight">({bullPct}% Toro / {bearPct}% Oso)</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-pink-300 font-bold text-[10px] uppercase tracking-wider">Top racha</span>
            <div className="flex items-center gap-1">
              <span className="font-black text-pink-300 text-base leading-none">{topStreak}</span>
              <span className="text-xs">🔥</span>
            </div>
          </div>
        </div>

        {/* Racha actual */}
        <div className="flex items-center justify-between text-xs bg-zinc-900/40 rounded px-2 py-1">
          <div className="flex items-center gap-2">
            {realStreak >= 3 ? (
              <span className="text-orange-400 animate-pulse text-sm">🔥</span>
            ) : (
              <span className="text-zinc-500 text-sm">🏁</span>
            )}
            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">Racha Actual</span>
          </div>
          <span className={`font-black text-sm ${realStreak >= 3 ? "text-orange-400" : "text-white"} ${realStreak >= 1 ? "animate-shake" : ""}`}>{realStreak}</span>
        </div>
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

      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        {/* Balance */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 text-white">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-xs font-bold text-zinc-300">Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-yellow-300">${formatNum(userBalance)}</span>
            <button
              className="px-1.5 py-0.5 rounded bg-yellow-400 text-black text-[10px] font-bold shadow hover:bg-yellow-300 disabled:opacity-50"
              onClick={() => setShowMathModal(true)}
              title={canAttempt ? "Recargar monedas" : "Máximo alcanzado"}
              disabled={!canAttempt}
            >
              +💰
            </button>
          </div>
        </div>

        {/* Net PnL */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 text-white">
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span className="text-xs font-bold text-zinc-300">PnL Neto</span>
          </div>
          <span className={`font-bold text-sm ${isProfitable ? "text-green-400" : "text-red-400"}`}>{isProfitable ? "+" : ""}{netBetProfit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Win Rate */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 text-white">
            <Percent className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-zinc-300">Win Rate</span>
          </div>
          <span className="font-bold text-sm text-white">{winRate.toFixed(1)}%</span>
        </div>

        {/* Liquidaciones small */}
        <div className="flex items-center justify-between text-white opacity-80">
          <div className="flex items-center gap-1.5 text-white">
            <span className="text-sm">💀</span>
            <span className="text-[10px] font-bold text-red-300">Liqs</span>
          </div>
          <span className="font-bold text-xs text-red-400">{bets.filter(b => b.status === "LIQUIDATED").length}</span>
        </div>
      </div>


      {/* Stats Grid Compacto */}
      <div className="grid grid-cols-3 gap-2 text-white font-mono pt-2 mt-auto">
        <div className="bg-zinc-900 border border-zinc-700/50 p-1.5 rounded-md text-center flex flex-col justify-center h-14">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Total</p>
          <p className="font-bold text-sm text-white leading-none">{totalBets}</p>
        </div>
        <div className="bg-green-950/30 border border-green-500/20 p-1.5 rounded-md text-center flex flex-col justify-center h-14">
          <p className="text-[9px] font-bold text-green-400/80 uppercase tracking-wider mb-0.5">Ganadas</p>
          <p className="font-bold text-sm text-green-400 leading-none">{wonBets}</p>
        </div>
        <div className="bg-red-950/30 border border-red-500/20 p-1.5 rounded-md text-center flex flex-col justify-center h-14">
          <p className="text-[9px] font-bold text-red-400/80 uppercase tracking-wider mb-0.5">Perdidas</p>
          <p className="font-bold text-sm text-red-400 leading-none">{lostBets}</p>
        </div>
      </div>
    </div>
  );
}
