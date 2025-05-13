import { useEffect, useCallback, useRef } from 'react';
import type { Candle } from '@/types/game';

/**
 * Hook para detectar y notificar cambios significativos en el precio
 */
export function usePriceAlerts({
  candles,
  currentCandle,
  currentSymbol,
  threshold = 250,
  enabled = true
}: {
  candles: Candle[];
  currentCandle: Candle | null;
  currentSymbol: string;
  threshold?: number;
  enabled?: boolean;
}) {
  // Referencia para evitar notificaciones duplicadas
  const lastAlertTimestampRef = useRef<number | null>(null);

  // Función para solicitar permiso para mostrar notificaciones
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones de escritorio');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);

  // Detectar cambios significativos en el precio y mostrar notificación
  useEffect(() => {
    if (!enabled) return;
    
    // Solo ejecutar si currentCandle está disponible
    if (!currentCandle) return;
    
    // Calcular el cambio de precio dentro de la misma vela (high - low)
    const priceRange = Math.abs(currentCandle.high - currentCandle.low);
    
    // Evitar notificaciones duplicadas para la misma vela
    if (lastAlertTimestampRef.current === currentCandle.timestamp) return;
    
    // Si el rango de precio dentro de la vela es mayor al umbral, mostrar notificación
    if (priceRange >= threshold) {
      // Actualizar la referencia para evitar duplicados
      lastAlertTimestampRef.current = currentCandle.timestamp;
      
      // Solicitar permiso y mostrar notificación
      requestNotificationPermission().then(granted => {
        if (granted && 'Notification' in window) {
          // Determinar si la vela es alcista o bajista
          const isBullish = currentCandle.close > currentCandle.open;
          const icon = isBullish ? '/bull.png' : '/bear.png';
          
          const notification = new Notification(`¡Movimiento significativo en la vela actual!`, {
            body: `Rango de precio de $${priceRange.toFixed(2)} en ${currentSymbol} (vela de 1min)`,
            icon: icon,
          });
          
          notification.onclick = function() {
            window.focus();
            notification.close();
          };
        }
      });
    }
  }, [currentCandle, candles, currentSymbol, threshold, enabled, requestNotificationPermission]);

  return { requestPermission: requestNotificationPermission };
}
