// Utilidad para convertir timeframe a milisegundos
export function getTimeframeInMs(tf: string): number {
  const value = Number.parseInt(tf.slice(0, -1));
  const unit = tf.slice(-1);
  switch (unit) {
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return 60 * 1000;
  }
}
