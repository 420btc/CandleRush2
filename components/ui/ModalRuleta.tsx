import React, { useRef, useState, useEffect } from 'react';

const PRIZES = [
  100, 200, 50, 500, 20, 300, 150, 75, 400, 250, 30, 1000
];
const SEGMENTS = PRIZES.length;
const SEGMENT_ANGLE = 360 / SEGMENTS;

interface ModalRuletaProps {
  open: boolean;
  onClose: () => void;
  onWin: (prize: number) => void;
}

import { useGame } from "@/context/game-context";
import { useToast } from "@/hooks/use-toast";

export const ModalRuleta: React.FC<ModalRuletaProps> = ({ open, onClose }) => {
  const { addCoins } = useGame();
  const { toast } = useToast();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(2);
  const [nextReset, setNextReset] = useState<number|null>(null);
  const wheelRef = useRef<SVGSVGElement>(null);

  // --- Spin limit logic ---
  useEffect(() => {
    // On open, check localStorage for spins and reset time
    if (open) {
      const data = localStorage.getItem('roulette_spins');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const now = Date.now();
          if (parsed.resetAt && now > parsed.resetAt) {
            // Reset spins
            setSpinsLeft(2);
            setNextReset(now + 12 * 60 * 60 * 1000);
            localStorage.setItem('roulette_spins', JSON.stringify({ spins: 2, resetAt: now + 12 * 60 * 60 * 1000 }));
          } else {
            setSpinsLeft(parsed.spins ?? 2);
            setNextReset(parsed.resetAt ?? (now + 12 * 60 * 60 * 1000));
          }
        } catch {
          setSpinsLeft(2);
          const resetAt = Date.now() + 12 * 60 * 60 * 1000;
          setNextReset(resetAt);
          localStorage.setItem('roulette_spins', JSON.stringify({ spins: 2, resetAt }));
        }
      } else {
        setSpinsLeft(2);
        const resetAt = Date.now() + 12 * 60 * 60 * 1000;
        setNextReset(resetAt);
        localStorage.setItem('roulette_spins', JSON.stringify({ spins: 2, resetAt }));
      }
    }
  }, [open]);

  // Timer to auto-reset spins if modal stays open
  useEffect(() => {
    if (!nextReset) return;
    const interval = setInterval(() => {
      if (Date.now() > nextReset) {
        setSpinsLeft(2);
        const newReset = Date.now() + 12 * 60 * 60 * 1000;
        setNextReset(newReset);
        localStorage.setItem('roulette_spins', JSON.stringify({ spins: 2, resetAt: newReset }));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [nextReset]);


  const PRIZE_WEIGHTS = [
    7, 7, 8, 2, 10, 4, 6, 7, 3, 4, 7, 1
  ];

  function weightedRandom(weights: number[]) {
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) return i;
      r -= weights[i];
    }
    return weights.length - 1;
  }

  const spin = () => {
    if (spinning || spinsLeft <= 0) return;
    setSpinning(true);
    setResult(null);
    // Decrement spins and update localStorage
    const newSpins = spinsLeft - 1;
    setSpinsLeft(newSpins);
    localStorage.setItem('roulette_spins', JSON.stringify({ spins: newSpins, resetAt: nextReset ?? (Date.now() + 12 * 60 * 60 * 1000) }));
    const winner = weightedRandom(PRIZE_WEIGHTS);
    // const winner = 4; // Descomentar para forzar el ganador (índice 4, "20")

    // Desplazamiento inicial para alinear con la imagen
    const initialOffset = 150;
    const winnerAngle = (winner * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 + initialOffset) % 360;

    // La flecha está a 270 grados (abajo)
    const targetAngle = 270;

    // Calcular cuánto necesitamos rotar para que winnerAngle quede en targetAngle
    // Diferencia entre el ángulo deseado y el ángulo del segmento ganador
    let additionalRotation = (targetAngle - winnerAngle + 360) % 360;

    // Asegurar que siempre gire en sentido horario y evitar el "camino más corto"
    const totalSpins = 40;
    const currentRotation = rotation;
    const newTargetRotation = currentRotation + totalSpins * 360 + additionalRotation;

    if (wheelRef.current) {
      wheelRef.current.style.transition = 'none';
      void (wheelRef.current as any).offsetWidth;
      wheelRef.current.style.transition = 'transform 9.9s cubic-bezier(0.12, 0.92, 0.38, 1.01)';
    }

    setRotation(newTargetRotation);

    setTimeout(() => {
      setSpinning(false);

      // Calcular qué segmento está bajo la flecha
      const normalizedRotation = ((newTargetRotation % 360) + 360) % 360;
      const effectiveAngle = (270 - normalizedRotation + 360) % 360;
      let realWinner = Math.floor(((effectiveAngle - initialOffset + 360) % 360) / SEGMENT_ANGLE);
      if (realWinner < 0) realWinner += SEGMENTS;
      if (effectiveAngle >= 360 - SEGMENT_ANGLE / 2) realWinner = 0;

      setResult(realWinner);
      const prize = PRIZES[realWinner];
      if (typeof addCoins === 'function') {
        addCoins(prize);
      }
      toast({
        title: `¡Ganaste ${prize} monedas en la ruleta!`,
        variant: "default",
      });
    }, 9900);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur">
      <div className="bg-black rounded-2xl p-8 shadow-xl relative flex flex-row items-center min-h-[370px] min-w-[720px] gap-10">
        {/* Spin counter UI OUTSIDE wheel, left side */}
        <div className="flex flex-col items-center w-[180px]">
          <span className="text-base font-semibold text-yellow-300 tracking-wide mb-1">Tiradas restantes</span>
          <span className={spinsLeft === 0 ? 'text-3xl text-red-400 font-bold' : 'text-3xl text-yellow-200 font-bold'}>{spinsLeft} <span className="text-base text-white/60">/ 2</span></span>
        </div>
        <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={onClose}>
          ✕
        </button>
        <div className="relative" style={{ width: 260, height: 260 }}>
          {/* Static red marker at 12:00 (top center, outside wheel) */}
          <div style={{ position: 'absolute', left: '50%', top: -18, transform: 'translateX(-50%)', zIndex: 2 }}>
            <div style={{ width: 18, height: 24, background: '#e11d48', border: '2px solid #b91c1c', borderRadius: 6 }}></div>
          </div>
          <svg
            ref={wheelRef}
            width={260}
            height={260}
            viewBox="0 0 260 260"
            style={{
              transition: spinning ? 'transform 6.6s cubic-bezier(0.12, 0.92, 0.38, 1.01)' : undefined,
              transform: `rotate(${rotation}deg)`
            }}
          >
            <g>
              {PRIZES.map((prize, i) => {
                const initialOffset = 150;
                const startAngle = (i * SEGMENT_ANGLE + initialOffset) % 360;
                const endAngle = ((i + 1) * SEGMENT_ANGLE + initialOffset) % 360;
                const radius = 120;
                const arcCenter = 130;
                const prizeColors: Record<number, string> = {
                  1000: '#a21caf',
                  500: '#22c55e',
                  400: '#2563eb',
                  300: '#fb923c',
                  250: '#14b8a6',
                  200: '#fde047',
                  150: '#ec4899',
                  100: '#ef4444',
                  75: '#6b7280',
                  50: '#84cc16',
                  30: '#92400e',
                  20: '#fef9c3',
                };
                const fillColor = prizeColors[prize] || '#fbbf24';
                const x1 = arcCenter + radius * Math.cos((Math.PI / 180) * startAngle);
                const y1 = arcCenter + radius * Math.sin((Math.PI / 180) * startAngle);
                const x2 = arcCenter + radius * Math.cos((Math.PI / 180) * endAngle);
                const y2 = arcCenter + radius * Math.sin((Math.PI / 180) * endAngle);
                const textRadius = 92;
                const textAngle = startAngle + SEGMENT_ANGLE / 2;
                const textX = arcCenter + textRadius * Math.cos((Math.PI / 180) * textAngle);
                const textY = arcCenter + textRadius * Math.sin((Math.PI / 180) * textAngle);
                return (
                  <g key={i}>
                    <path
                      d={`M${arcCenter},${arcCenter} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`}
                      fill={fillColor}
                      stroke="#b45309"
                      strokeWidth={2}
                    />
                    <g>
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="13"
                        fill="#fff"
                        fontWeight="bold"
                        style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 0 4px #000, 0 0 1px #000' }}
                        transform={`rotate(${-textAngle + 90},${textX},${textY})`}
                      >
                        {prize}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
            <circle cx={130} cy={130} r={40} fill="#f59e42" stroke="#b45309" strokeWidth={4} />
            <text x={130} y={135} textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">Ruleta</text>
          </svg>

          <button
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-brown-900 rounded-full shadow-lg text-lg font-bold"
            onClick={spin}
            disabled={spinning || spinsLeft <= 0}
          >
            {spinning ? 'Girando...' : (spinsLeft <= 0 ? 'Sin tiradas' : 'Girar')}
          </button>
        </div>

        {result !== null && (
          <div className="mt-4 text-xl font-bold text-green-600">¡Ganaste {PRIZES[result]} monedas!</div>
        )}
      </div>
    </div>
  );
};