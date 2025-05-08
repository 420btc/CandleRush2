import React, { useEffect, useRef } from "react";

interface BetFlyToRobotAnimationProps {
  price: number | string;
  onFinish?: () => void;
}

export const BetFlyToRobotAnimation: React.FC<BetFlyToRobotAnimationProps> = ({ price, onFinish }) => {
  const animRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cuando la animación termina, dispara onFinish
    const node = animRef.current;
    if (!node) return;
    const handleEnd = () => onFinish && onFinish();
    node.addEventListener("animationend", handleEnd);
    return () => node.removeEventListener("animationend", handleEnd);
  }, [onFinish]);

  return (
    <div
      ref={animRef}
      className="fixed left-1/2 top-2/3 z-[100] pointer-events-none animate-bet-fly-to-robot"
      style={{ transform: "translate(-50%, -50%)" }}
    >
      <span className="text-yellow-400 drop-shadow-2xl text-5xl md:text-7xl font-extrabold bg-black/80 px-8 py-4 rounded-2xl border-4 border-yellow-400 shadow-xl">
        ${typeof price === "number" ? price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : price}
      </span>
      <style jsx global>{`
        @keyframes bet-fly-to-robot {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            filter: blur(0px);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -200%) scale(1.15);
            filter: blur(0px);
          }
          90% {
            opacity: 0.9;
            transform: translate(-50%, -330%) scale(0.9);
            filter: blur(1px);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -420%) scale(0.4);
            filter: blur(4px);
          }
        }
        .animate-bet-fly-to-robot {
          animation: bet-fly-to-robot 1.25s cubic-bezier(0.6,0,0.4,1) forwards;
        }
      `}</style>
    </div>
  );
};
