"use client";
import React from "react";
import FlipDigits from "@/components/game/FlipDigits";
import { formatTime } from "@/utils/formatTime";

interface CountdownFlipTimerProps {
  ms: number; // tiempo en milisegundos
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const CountdownFlipTimer: React.FC<CountdownFlipTimerProps> = ({ ms, color = '#FFD600', className = '', style = {} }) => {
  return (
    <FlipDigits
      value={formatTime(ms)}
      className={`text-[4rem] leading-none font-black p-0 m-0 ${className}`}
      style={{ color, ...style }}
    />
  );
};

export default CountdownFlipTimer;
