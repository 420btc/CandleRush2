"use client";

import React from "react";
import { InteractiveRobotSpline } from "@/components/interactive-3d-robot";

export default function MinijuegoPage() {
  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Botón de volver al menú */}
      <a
        href="/menu"
        className="fixed top-4 left-4 z-20 bg-black/70 rounded-full p-2 shadow-lg hover:bg-yellow-400/90 transition-colors group"
        style={{ pointerEvents: 'auto' }}
        aria-label="Volver al menú"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8 text-yellow-400 group-hover:text-black"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </a>
      <InteractiveRobotSpline
        scene={ROBOT_SCENE_URL}
        className="absolute inset-0 z-0"
      />
      <div
        className="
          absolute inset-0 z-10
          pt-6 md:pt-12 lg:pt-16
          px-4 md:px-8
          pointer-events-none
        "
      >
        <div
          className="
            text-center
            text-white
            drop-shadow-lg
            w-full max-w-2xl
            mx-auto
          "
        >
          <h1
            className="
              text-2xl md:text-3xl lg:text-4xl xl:text-5xl
              font-bold
            "
          >
            Minijuego Candle <span className="text-yellow-400">FOMO</span>
          </h1>
        </div>
      </div>
    </div>
  );
}
