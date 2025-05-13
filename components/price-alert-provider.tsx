"use client";

import { useGame } from "@/context/game-context";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { ReactNode } from "react";

/**
 * Componente que proporciona alertas de precio significativas en toda la aplicación
 * Funciona tanto en la página principal como en la página de perfil
 */
export function PriceAlertProvider({ children }: { children: ReactNode }) {
  // Obtener datos del contexto del juego
  const { candles, currentCandle, currentSymbol } = useGame();
  
  // Usar el hook de alertas de precio
  usePriceAlerts({
    candles,
    currentCandle,
    currentSymbol,
    threshold: 250, // Umbral de 250 dólares para notificaciones
    enabled: true // Siempre activo
  });
  
  // Simplemente renderizar los hijos sin afectar la estructura del DOM
  return <>{children}</>;
}
