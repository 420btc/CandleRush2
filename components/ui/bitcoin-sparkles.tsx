"use client";
import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export function BitcoinSparkles() {
  return (
    <div className="w-full h-full relative">
      <SparklesCore
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={100}
        className="w-full h-full"
        particleColor="#FFD600"
        speed={0.1} // Ajustado para una animación más suave
        particleSize={1}
        opacity={0.8} // Ajustado para que las partículas sean más visibles
        particleDensity={150} // Aumentado para más partículas
      />
    </div>
  );
}
