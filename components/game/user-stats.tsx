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
  const { bets, userBalance, addCoins } = useGame();

  // Calcular la racha real de victorias consecutivas
  let realStreak = 0;
  for (let i = bets.length - 1; i >= 0; i--) {
    if (bets[i].status === "WON") {
      realStreak++;
    } else if (bets[i].status === "LOST" || bets[i].status === "LIQUIDATED") {
      break;
    }
  }

  // Calculate stats
  const totalBets = bets.length
  const wonBets = bets.filter((bet) => bet.status === "WON").length
  const lostBets = bets.filter((bet) => bet.status === "LOST").length
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0

  const balance = userBalance;
  const profitLoss = balance - 100;
  const isProfitable = profitLoss >= 0;

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
    <div className="space-y-4 text-white">
      {/* Rachas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {realStreak >= 3 ? (
            <span className="text-orange-400 animate-pulse text-2xl">🔥</span>
          ) : (
            <span className="text-zinc-400 text-xl">🏁</span>
          )}
          <span className="text-sm">Racha actual</span>
        </div>
        <span className={`font-bold text-lg ${realStreak >= 3 ? "text-orange-400" : ""} ${realStreak >= 1 ? "animate-shake" : ""}`}>{realStreak}</span>
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
          <span className="text-sm text-white">Balance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-white">${balance.toFixed(2)}</span>
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
            </div>
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
          <span className="text-sm text-white">Ganancias/Pérdidas</span>
        </div>
        <span className={`font-bold text-lg ${isProfitable ? "text-green-400" : "text-red-400"}`}>{isProfitable ? "+" : ""}{profitLoss.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-white">
          <Percent className="h-5 w-5 text-blue-400" />
          <span className="text-sm text-white">Tasa de victorias</span>
        </div>
        <span className="font-bold text-lg text-white">{winRate.toFixed(1)}%</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-white">
        <div className="bg-zinc-900/60 p-2 rounded-lg text-center text-white">
          <p className="text-xs text-zinc-400 text-white">Total</p>
          <p className="font-bold text-white">{totalBets}</p>
        </div>
        <div className="bg-green-900/30 p-2 rounded-lg text-center text-white">
          <p className="text-xs text-green-400 text-white">Ganadas</p>
          <p className="font-bold text-green-400 text-white">{wonBets}</p>
        </div>
        <div className="bg-red-900/30 p-2 rounded-lg text-center text-white">
          <p className="text-xs text-red-400 text-white">Perdidas</p>
          <p className="font-bold text-red-400 text-white">{lostBets}</p>
        </div>
      </div>
    </div>
  )
}
