"use client"

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/game-context";
import { TrendingUp, TrendingDown, Percent, DollarSign } from "lucide-react";
import { canAttemptMathChallenge, incrementMathChallengeCount, getMathChallengeTimeLeft, MATH_CHALLENGE_LIMIT } from "@/utils/math-challenge-limit";

function generateMathChallenge() {
  const ops = ['+', '-', '×', '÷'];
  const isChained = Math.random() > 0.5;
  let question = '';
  let answer = 0;

  if (isChained) {
    let a = Math.floor(Math.random() * 800) + 200;
    let b = Math.floor(Math.random() * 300) + 100;
    let c = Math.floor(Math.random() * 100) + 10;
    let op1 = ops[Math.floor(Math.random() * ops.length)];
    let op2 = ops[Math.floor(Math.random() * ops.length)];
    if (op1 === '÷') { b = Math.max(1, Math.floor(a / (Math.floor(Math.random() * 5) + 2))); a = b * (Math.floor(Math.random() * 5) + 2); }
    if (op2 === '÷') { c = Math.max(1, Math.floor((op1 === '÷' ? a / b : eval(`${a}${op1 === '×' ? '*' : op1}${b}`)) / (Math.floor(Math.random() * 5) + 2))); let prev = (op1 === '÷' ? a / b : op1 === '×' ? a * b : op1 === '+' ? a + b : a - b); c = Math.max(1, Math.floor(prev / (Math.floor(Math.random() * 5) + 2))); if (c === 0) c = 1; }
    let part1 = op1 === '+' ? a + b : op1 === '-' ? a - b : op1 === '×' ? a * b : Math.floor(a / b);
    answer = op2 === '+' ? part1 + c : op2 === '-' ? part1 - c : op2 === '×' ? part1 * c : Math.floor(part1 / c);
    question = `${a} ${op1} ${b} ${op2} ${c} = ?`;
  } else {
    let a = Math.floor(Math.random() * 900) + 100;
    let b = Math.floor(Math.random() * 900) + 100;
    let op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '-') { if (a < b) [a, b] = [b, a]; }
    if (op === '÷') { b = Math.max(1, Math.floor(a / (Math.floor(Math.random() * 10) + 2))); a = b * (Math.floor(Math.random() * 10) + 2); }
    answer = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : Math.floor(a / b);
    question = `${a} ${op} ${b} = ?`;
  }
  return { question, answer: answer.toString() };
}

export default function MobileStats() {
  const { bets, userBalance, addCoins } = useGame();

  // Estados para el reto matemático
  const [showMathModal, setShowMathModal] = useState(false);
  const [mathChallenge, setMathChallenge] = useState(generateMathChallenge());
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathError, setMathError] = useState('');
  const [mathSuccess, setMathSuccess] = useState(false);
  const [mathTimeLeft, setMathTimeLeft] = useState(0);
  const [canAttempt, setCanAttempt] = useState(true);
  const [mathProgress, setMathProgress] = useState<{count: number, limit: number}>({count: 0, limit: MATH_CHALLENGE_LIMIT});

  // Estados para contraseña
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [customCoins, setCustomCoins] = useState(1500);

  // Top Racha persistente
  const [topStreak, setTopStreak] = useState(0);

  // Cargar datos guardados
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = parseInt(localStorage.getItem('top_win_streak') || '0', 10);
      setTopStreak(saved);
      const savedCoins = parseInt(localStorage.getItem('custom_coins') || '1500', 10);
      setCustomCoins(savedCoins);
    }
  }, []);

  // Actualizar estado del reto matemático
  useEffect(() => {
    function updateMathState() {
      const canTry = canAttemptMathChallenge();
      setCanAttempt(canTry);
      setMathTimeLeft(getMathChallengeTimeLeft());
      if (typeof window !== 'undefined') {
        try {
          const data = localStorage.getItem('math_challenge_attempts');
          if (data) {
            const parsed = JSON.parse(data);
            const count = parsed && typeof parsed.count === 'number' ? parsed.count : 0;
            setMathProgress({count, limit: MATH_CHALLENGE_LIMIT});
          } else {
            setMathProgress({count: 0, limit: MATH_CHALLENGE_LIMIT});
          }
        } catch {
          setMathProgress({count: 0, limit: MATH_CHALLENGE_LIMIT});
        }
      }
    }
    updateMathState();
    const interval = setInterval(updateMathState, 60000);
    return () => clearInterval(interval);
  }, [showMathModal]);

  // Guardar monedas personalizadas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('custom_coins', customCoins.toString());
    }
  }, [customCoins]);

  // Calculate stats
  const totalBets = bets.length;
  const wonBets = bets.filter((bet) => bet.status === "WON").length;
  const lostBets = bets.filter((bet) => bet.status === "LOST").length;
  const liquidatedBets = bets.filter((bet) => bet.status === "LIQUIDATED").length;
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

  // Ganancias/Pérdidas
  const netBetProfit = bets.reduce((acc, bet) => {
    if (bet.status === "WON" && typeof bet.winnings === "number" && typeof bet.amount === "number") {
      return acc + (bet.winnings - bet.amount);
    } else if ((bet.status === "LOST" || bet.status === "LIQUIDATED") && typeof bet.amount === "number") {
      return acc - bet.amount;
    }
    return acc;
  }, 0);
  const isProfitable = netBetProfit >= 0;

  // Toro/Oso stats
  const bullBets = bets.filter(b => b.prediction === 'BULLISH').length;
  const bearBets = bets.filter(b => b.prediction === 'BEARISH').length;
  const bullPct = totalBets > 0 ? Math.round((bullBets / totalBets) * 100) : 0;
  const bearPct = totalBets > 0 ? 100 - bullPct : 0;
  let bullVsBearText = '';
  let bullVsBearIcon = '';
  if (bullPct > bearPct) {
    bullVsBearText = 'Más Toro';
    bullVsBearIcon = '🐂';
  } else if (bearPct > bullPct) {
    bullVsBearText = 'Más Oso';
    bullVsBearIcon = '🐻';
  } else {
    bullVsBearText = 'Equilibrado';
    bullVsBearIcon = '⚖️';
  }

  // Racha actual y top racha
  let currentStreak = 0;
  let tempStreak = 0;
  let streakCount = 0;
  for (let i = 0; i < bets.length; i++) {
    if (bets[i].status === "WON") {
      streakCount++;
      if (streakCount > tempStreak) tempStreak = streakCount;
    } else if (bets[i].status === "LOST" || bets[i].status === "LIQUIDATED") {
      streakCount = 0;
    }
  }

  // Actualizar top racha si es necesario
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
      currentStreak++;
    } else if (bets[i].status === "LOST" || bets[i].status === "LIQUIDATED") {
      break;
    }
  }

  const formatNum = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  // Handlers
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

  function handlePasswordSubmit() {
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

  return (
    <>
      <div className="bg-black/90 border border-[#FFD600]/60 rounded-lg px-2 py-1 mt-2 space-y-1">
        {/* Toro/Oso y Top racha */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-sm">{bullVsBearIcon}</span>
            <span className="font-bold text-yellow-300 text-xs">{bullVsBearText}</span>
            <span className="text-zinc-300 text-xs">({bullPct}%/{bearPct}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-pink-300 font-bold text-xs">Top:</span>
            <span className="font-bold text-pink-300 text-xs">{topStreak}</span>
          </div>
        </div>

        {/* Racha actual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {currentStreak >= 3 ? (
              <span className="text-orange-400 animate-pulse text-sm">🔥</span>
            ) : (
              <span className="text-zinc-400 text-sm">🏁</span>
            )}
            <span className="text-xs font-bold text-white">Racha actual</span>
          </div>
          <span className={`font-bold text-sm ${currentStreak >= 3 ? "text-orange-400" : "text-white"}`}>
            {currentStreak}
          </span>
        </div>

        {/* Balance con botón de recarga */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-xs font-bold text-white">Balance</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm text-yellow-300">${formatNum(userBalance)}</span>
            <button
              className="px-1 py-0.5 rounded bg-yellow-400 text-black text-xs font-bold shadow hover:bg-yellow-300 disabled:bg-zinc-500 disabled:text-zinc-300"
              onClick={() => setShowMathModal(true)}
              title={canAttempt ? "Recargar monedas" : "Máximo de retos alcanzado"}
              disabled={!canAttempt}
            >
              +💰
            </button>
          </div>
        </div>

        {/* Profit/Loss */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span className="text-xs font-bold text-white">P&L</span>
          </div>
          <span className={`font-bold text-sm ${isProfitable ? "text-green-400" : "text-red-400"}`}>
            {isProfitable ? "+" : ""}{netBetProfit.toFixed(2)}
          </span>
        </div>

        {/* Win Rate y Liquidaciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Percent className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-white">Tasa</span>
          </div>
          <span className="font-bold text-sm text-white">{winRate.toFixed(1)}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-sm">💀</span>
            <span className="text-xs font-bold text-red-400">Liquidaciones</span>
          </div>
          <span className="font-bold text-sm text-red-400">{liquidatedBets}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-1">
          <div className="bg-zinc-900/60 border border-yellow-300/30 px-1 py-0.5 rounded text-center h-7 flex flex-col justify-center">
            <p className="text-[10px] text-yellow-200 font-bold leading-none">Total</p>
            <p className="text-xs text-white font-black leading-none">{totalBets}</p>
          </div>
          <div className="bg-green-900/40 border border-green-400/30 px-1 py-0.5 rounded text-center h-7 flex flex-col justify-center">
            <p className="text-[10px] text-green-300 font-bold leading-none">Ganadas</p>
            <p className="text-xs text-green-200 font-black leading-none">{wonBets}</p>
          </div>
          <div className="bg-red-900/40 border border-red-400/30 px-1 py-0.5 rounded text-center h-7 flex flex-col justify-center">
            <p className="text-[10px] text-red-300 font-bold leading-none">Perdidas</p>
            <p className="text-xs text-red-200 font-black leading-none">{lostBets}</p>
          </div>
        </div>
      </div>

      {/* Modal de reto matemático */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 rounded-xl p-4 shadow-lg border-2 border-yellow-400 w-full max-w-sm text-center">
            <h2 className="text-lg font-bold mb-2 text-yellow-400 flex items-center justify-center gap-2">
              ¡Reto matemático!
              <span className="text-xs font-normal text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded-full">{mathProgress.count}/{mathProgress.limit}</span>
            </h2>
            <p className="mb-3 text-white text-sm">Resuelve para ganar <span className="font-bold text-yellow-300">100 monedas</span>:</p>
            {!canAttempt && (
              <div className="mb-2 text-red-400 font-bold text-sm">
                Máximo de retos alcanzado por 24h.<br />
                Intenta en {Math.floor(mathTimeLeft / 3600000)}h {Math.floor((mathTimeLeft % 3600000) / 60000)}min.
              </div>
            )}
            <div className="mb-3 text-lg font-mono text-yellow-200">{mathChallenge.question}</div>
            <input
              type="text"
              className="w-20 px-2 py-1 rounded border border-yellow-400 text-center text-black font-bold mb-3"
              value={mathAnswer}
              onChange={e => setMathAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCheckMath(); }}
              autoFocus
              disabled={!canAttempt}
            />
            <div className="flex justify-center gap-2 mb-2">
              <button
                className="px-3 py-1 bg-green-500 hover:bg-green-400 rounded text-white font-bold text-sm disabled:bg-zinc-500"
                onClick={handleCheckMath}
                disabled={!canAttempt}
              >OK</button>
              <button
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white font-bold text-sm"
                onClick={() => { setShowMathModal(false); setMathAnswer(''); setMathChallenge(generateMathChallenge()); }}
              >Cancelar</button>
              <button
                className="px-2 py-1 bg-yellow-400 hover:bg-yellow-300 rounded text-black font-bold text-sm"
                onClick={() => setShowPasswordSection(true)}
              >🔑</button>
            </div>
            {showPasswordSection && (
              <div className="mt-2 p-2 border border-yellow-400 rounded bg-black/80">
                <div className="mb-2 text-yellow-300 font-bold text-sm">Contraseña:</div>
                <input
                  type="password"
                  className="w-24 px-2 py-1 rounded border border-yellow-400 text-center text-black font-bold text-sm mb-2"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                  autoFocus
                />
                <button
                  className="ml-2 px-2 py-1 bg-yellow-500 hover:bg-yellow-400 rounded text-black font-bold text-sm"
                  onClick={handlePasswordSubmit}
                >OK</button>
                {passwordMsg && <div className={`mt-2 text-sm ${passwordMsg.includes('correcta') || passwordMsg.includes('Fumaste') ? 'text-green-400' : 'text-red-400'}`}>{passwordMsg}</div>}
              </div>
            )}
            {mathError && <div className="text-red-400 mt-2 text-sm">{mathError}</div>}
            {mathSuccess && <div className="text-green-400 mt-2 text-sm">¡Correcto! +100 monedas</div>}
          </div>
        </div>
      )}
    </>
  );
}