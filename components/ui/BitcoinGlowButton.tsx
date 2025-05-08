import React from "react";
import { SiBitcoinsv } from "react-icons/si";

export const BitcoinGlowButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", ...props }) => (
  <button
    {...props}
    className={
      `relative flex items-center justify-center w-16 h-16 rounded-full bg-black text-yellow-400 shadow-lg overflow-hidden ` +
      className
    }
    style={{ boxShadow: "0 0 24px 6px #fde047, 0 0 0 4px #fde04755" }}
  >
    {/* Animated yellow glow border */}
    <span className="absolute inset-0 rounded-full pointer-events-none animate-bitcoin-glow" />
    <SiBitcoinsv className="relative z-10 text-4xl" />
    <style jsx>{`
      @keyframes bitcoin-glow {
        0% { box-shadow: 0 0 24px 6px #fde047, 0 0 0 4px #fde04755; }
        50% { box-shadow: 0 0 48px 12px #fde047, 0 0 0 8px #fde04799; }
        100% { box-shadow: 0 0 24px 6px #fde047, 0 0 0 4px #fde04755; }
      }
      .animate-bitcoin-glow {
        box-shadow: 0 0 24px 6px #fde047, 0 0 0 4px #fde04755;
        animation: bitcoin-glow 2s infinite linear;
        z-index: 1;
      }
    `}</style>
  </button>
);
