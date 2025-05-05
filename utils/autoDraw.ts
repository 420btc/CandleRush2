import type { Candle } from "@/types/game";
import { decideMixDirection } from "./macd-decision";

// Detecta soportes y resistencias locales en las últimas N velas
function getSupportResistance(candles: Candle[], lookback: number = 99) {
  const slice = candles.slice(-lookback);
  const supports: number[] = [];
  const resistances: number[] = [];
  // Un soporte es un mínimo local, una resistencia un máximo local
  for (let i = 2; i < slice.length - 2; i++) {
    const prev1 = slice[i - 1], prev2 = slice[i - 2];
    const next1 = slice[i + 1], next2 = slice[i + 2];
    const curr = slice[i];
    // Soporte: mínimo local
    if (curr.low < prev1.low && curr.low < prev2.low && curr.low < next1.low && curr.low < next2.low) {
      supports.push(curr.low);
    }
    // Resistencia: máximo local
    if (curr.high > prev1.high && curr.high > prev2.high && curr.high > next1.high && curr.high > next2.high) {
      resistances.push(curr.high);
    }
  }
  // Quitar duplicados y ordenar
  return {
    supports: Array.from(new Set(supports)).sort((a, b) => a - b),
    resistances: Array.from(new Set(resistances)).sort((a, b) => a - b),
  };
}

// Utilidad para obtener ms por vela según timeframe
function getMsPerCandle(timeframe: string): number {
  // Siempre 58 segundos por vela, sin importar el timeframe
  return 58000;
  /*switch (timeframe) {
    case "1m": return 60000;
    case "3m": return 180000;
    case "5m": return 300000;
    case "15m": return 900000;
    case "30m": return 1800000;
    case "1h": return 3600000;
    case "2h": return 7200000;
    case "4h": return 14400000;
    case "6h": return 21600000;
    case "12h": return 43200000;
    case "1d": return 86400000;
    case "3d": return 259200000;
    case "1w": return 604800000;
    default: return 60000;
  */
}


// Factor de volatilidad y lookback según timeframe
function getVolatilityFactor(timeframe: string) {
  if (timeframe.endsWith('m')) return { factor: 1, lookback: 14, srMargin: 1.5 };
  if (timeframe.endsWith('h')) return { factor: 1.6, lookback: 25, srMargin: 2.7 };
  if (timeframe.endsWith('d')) return { factor: 2.2, lookback: 40, srMargin: 3.5 };
  if (timeframe.endsWith('w')) return { factor: 3.5, lookback: 60, srMargin: 4.5 };
  return { factor: 1, lookback: 14, srMargin: 1.5 };
}

export function generateAutoDrawCandles(
  baseCandles: Candle[],
  count: number,
  timeframe: string = "1m"
): { candles: Candle[], finalPrice: number } {
  // Copia profunda de las velas base para no modificar el original
  const candles: Candle[] = JSON.parse(JSON.stringify(baseCandles));
  const generated: Candle[] = [];
  let lastCandle = candles[candles.length - 1];

  // Detectar parámetros según timeframe
  const msPerCandle = getMsPerCandle(timeframe);
  const { factor: volFactor, lookback, srMargin } = getVolatilityFactor(timeframe);

  for (let i = 0; i < count; i++) {
    // Soportes y resistencias con lookback adaptado
    const { supports, resistances } = getSupportResistance(candles, lookback);
    let direction = decideMixDirection(candles, timeframe);

    // === NUEVA LÓGICA: analizar últimas 100 velas ===
    const historyLen = 100;
    const longHistory = candles.slice(-historyLen);
    const longBodies = longHistory.map(c => Math.abs(c.close - c.open));
    const longMechas = longHistory.map(c => Math.abs(c.high - c.low) - Math.abs(c.close - c.open));
    const meanBody = longBodies.length > 0 ? longBodies.reduce((a, b) => a + b, 0) / longBodies.length : (lastCandle.close * 0.0025);
    const stdBody = Math.sqrt(longBodies.reduce((a, b) => a + Math.pow(b - meanBody,2), 0) / (longBodies.length || 1));
    const meanWick = longMechas.length > 0 ? longMechas.reduce((a, b) => a + b, 0) / longMechas.length : meanBody * 0.6;
    const stdWick = Math.sqrt(longMechas.reduce((a, b) => a + Math.pow(b - meanWick,2), 0) / (longMechas.length || 1));
    // Tendencia larga
    const upCount = longHistory.filter(c => c.close > c.open).length;
    const downCount = longHistory.filter(c => c.close < c.open).length;
    // Ratio de reversión
    const last5 = candles.slice(-5);
    const last5Dir = last5.map(c => c.close > c.open ? 1 : -1).reduce((a,b)=>a+b,0);
    // === FIN NUEVA LÓGICA ===

    // Probabilidad de reversión si hay racha larga
    if (Math.abs(last5Dir) >= 4 && Math.random() < 0.65) {
      direction = last5Dir > 0 ? "BEARISH" : "BULLISH";
    } else if (upCount > downCount * 1.2 && Math.random() < 0.6) {
      direction = "BEARISH";
    } else if (downCount > upCount * 1.2 && Math.random() < 0.6) {
      direction = "BULLISH";
    }

    // Probabilidad de racha: 70% sigue la anterior, 30% cambia
    if (generated.length > 0 && Math.random() > 0.7) {
      direction = direction === "BULLISH" ? "BEARISH" : "BULLISH";
    }

    // Cuerpo realista según estadística larga
    const randomBody = meanBody + stdBody * (Math.random() - 0.5);
    const randomFactor = 0.85 + Math.random() * 0.3;
    let candleBody = Math.max(0.0001, randomBody * randomFactor * volFactor);
    let open = lastCandle.close;
    let close = direction === "BULLISH" ? open + candleBody : open - candleBody;

    // Lógica de soportes y resistencias (margen adaptado)
    const nearSupport = supports.filter(s => Math.abs(open - s) < meanBody * srMargin).pop();
    const nearResistance = resistances.filter(r => Math.abs(open - r) < meanBody * srMargin)[0];
    if (direction === "BULLISH" && nearResistance) {
      // Breakout o rechazo según historial
      if (Math.random() < 0.7 - (upCount/(historyLen+1))) {
        close = open - Math.abs(candleBody * (0.8 + Math.random() * 0.4)); // Rechazo
      } else {
        close = nearResistance + Math.abs(candleBody * (1 + Math.random())); // Breakout
      }
    } else if (direction === "BEARISH" && nearSupport) {
      if (Math.random() < 0.7 - (downCount/(historyLen+1))) {
        close = open + Math.abs(candleBody * (0.8 + Math.random() * 0.4));
      } else {
        close = nearSupport - Math.abs(candleBody * (1 + Math.random()));
      }
    }

    candleBody = Math.abs(close - open);
    // Mechas realistas según estadística larga
    const wick = Math.max(0.0001, (meanWick + stdWick * (Math.random() - 0.5)) * (0.8 + Math.random() * 0.4) * volFactor);
    let high = Math.max(open, close) + wick * Math.random();
    let low = Math.min(open, close) - wick * Math.random();

    // Ajusta mechas para no romper extremos recientes
    const lastN = candles.slice(-Math.max(lookback/2, 10));
    const minRecent = Math.min(...lastN.map(c => c.low));
    const maxRecent = Math.max(...lastN.map(c => c.high));
    if (direction === "BULLISH" && low < minRecent) low = minRecent;
    if (direction === "BEARISH" && high > maxRecent) high = maxRecent;

    // Volumen simulado
    let volume = lastCandle.volume || 1;
    volume = volume * (0.9 + Math.random() * 0.2);
    // Timestamp simulado correcto
    const timestamp = lastCandle.timestamp + msPerCandle;
    const newCandle: Candle = {
      ...lastCandle,
      open,
      close,
      high,
      low,
      volume,
      timestamp,
      isFinal: i === count - 1  // Marcar la última vela
    };
    (newCandle as any).isSimulated = true;
    generated.push(newCandle);
    candles.push(newCandle);
    lastCandle = newCandle;
  }
  return { candles: generated, finalPrice: lastCandle.close };
}
