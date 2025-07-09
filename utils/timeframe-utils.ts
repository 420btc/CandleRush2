// Utilidad para normalizar timestamps según timeframes
export function getTimeframeInMs(tf: string): number {
  const value = Number.parseInt(tf.slice(0, -1));
  const unit = tf.slice(-1);
  
  switch (unit) {
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 60 * 1000; // Default to 1m
  }
}

/**
 * Normaliza un timestamp al inicio del intervalo del timeframe
 * Por ejemplo, para 5m: 14:23:45 se convierte en 14:20:00
 * Para 1h: 14:23:45 se convierte en 14:00:00
 */
export function normalizeTimestampToTimeframe(timestamp: number, timeframe: string): number {
  const date = new Date(timestamp);
  const value = Number.parseInt(timeframe.slice(0, -1));
  const unit = timeframe.slice(-1);
  
  switch (unit) {
    case "m": {
      // Para minutos: normalizar a múltiplos del valor
      const minutes = date.getMinutes();
      const normalizedMinutes = Math.floor(minutes / value) * value;
      date.setMinutes(normalizedMinutes, 0, 0); // Resetear segundos y ms
      return date.getTime();
    }
    case "h": {
      // Para horas: normalizar a múltiplos del valor
      const hours = date.getHours();
      const normalizedHours = Math.floor(hours / value) * value;
      date.setHours(normalizedHours, 0, 0, 0); // Resetear minutos, segundos y ms
      return date.getTime();
    }
    case "d": {
      // Para días: normalizar al inicio del día
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }
    default:
      // Para 1m o casos no reconocidos, normalizar al inicio del minuto
      date.setSeconds(0, 0);
      return date.getTime();
  }
}

/**
 * Calcula el timestamp de cierre de una vela dado su timestamp de apertura
 */
export function getCandleCloseTimestamp(openTimestamp: number, timeframe: string): number {
  return openTimestamp + getTimeframeInMs(timeframe);
}

/**
 * Verifica si una apuesta debe resolverse basándose en el timeframe
 */
export function shouldResolveBet(
  betCandleTimestamp: number,
  currentTimestamp: number,
  timeframe: string
): boolean {
  const normalizedBetTimestamp = normalizeTimestampToTimeframe(betCandleTimestamp, timeframe);
  const candleCloseTimestamp = getCandleCloseTimestamp(normalizedBetTimestamp, timeframe);
  
  // La apuesta se resuelve cuando el timestamp actual es mayor o igual al cierre de la vela
  return currentTimestamp >= candleCloseTimestamp;
} 