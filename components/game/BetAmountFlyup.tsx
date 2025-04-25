"use client";
import { useEffect, useState } from "react";

interface BetAmountFlyupProps {
  amount: number;
  trigger: boolean;
  onComplete?: () => void;
}

export default function BetAmountFlyup({ amount, trigger, onComplete }: BetAmountFlyupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timeout = setTimeout(() => {
        setShow(false);
        if (onComplete) onComplete();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [trigger, onComplete]);

  if (!show) return null;

  return (
    <div
      className="fixed left-1/2 top-[35%] z-50 pointer-events-none select-none"
      style={{ transform: "translateX(-50%)" }}
    >
      <span
        className="text-yellow-400 text-5xl font-extrabold drop-shadow-lg animate-bet-flyup"
        style={{
          transition: "opacity 0.5s, transform 1.2s",
        }}
      >
        +{amount}
      </span>
      <style jsx>{`
        .animate-bet-flyup {
          animation: bet-flyup 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes bet-flyup {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(1.1);
          }
          10% {
            opacity: 1;
            transform: translateY(0px) scale(1.05);
          }
          80% {
            opacity: 1;
            transform: translateY(-40px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.92);
          }
        }
      `}</style>
    </div>
  );
}
