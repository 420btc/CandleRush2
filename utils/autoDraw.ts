import type { Candle } from "@/types/game";
import { decideMixDirection } from "./macd-decision";

// Detecta soportes y resistencias locales en las últimas N velas
function getSupportResistance(candles: Candle[], lookback: number = 199) {
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
  if (timeframe.endsWith('m')) return { factor: 1, lookback: 199, srMargin: 1.2 };
  if (timeframe.endsWith('h')) return { factor: 1.6, lookback: 25, srMargin: 2.7 };
  if (timeframe.endsWith('d')) return { factor: 2.2, lookback: 40, srMargin: 3.5 };
  if (timeframe.endsWith('w')) return { factor: 3.5, lookback: 60, srMargin: 4.5 };
  return { factor: 1, lookback: 199, srMargin: 1.2 };
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

  // --- NUEVO: Alternancia de régimen y volatilidad dinámica ---
  let regime = 'trend'; // 'trend' o 'range'
  let regimeCounter = 0;
  let regimeLimit = 30 + Math.floor(Math.random() * 99); // 10-25 velas por régimen
  let trendDir: 'BULLISH' | 'BEARISH' = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'; // Dirección de la tendencia
  let pullbackCounter = 0;
  let pullbackLimit = 12 + Math.floor(Math.random() * 22); // 4-7 velas antes de pullback

  for (let i = 0; i < count; i++) {
    // --- Alternancia automática de régimen ---
    regimeCounter++;
    if (regimeCounter > regimeLimit) {
      regime = regime === 'trend' ? 'range' : 'trend';
      regimeCounter = 1;
      regimeLimit = 30 + Math.floor(Math.random() * 99);
      if (regime === 'trend') trendDir = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH';
      pullbackCounter = 0;
      pullbackLimit = 12 + Math.floor(Math.random() * 22);
    }

    // Soportes y resistencias con lookback adaptado
    const { supports, resistances } = getSupportResistance(candles, lookback);
    let direction: 'BULLISH' | 'BEARISH' = decideMixDirection(candles, timeframe) as 'BULLISH' | 'BEARISH';

    // --- Lógica de régimen ---
    if (regime === 'trend') {
      // Mayor probabilidad de seguir la tendencia
      direction = Math.random() < 0.78 ? trendDir : (trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH');
      // Cuerpos más grandes
      var regimeBodyFactor = 1.18;
      // Pullback forzado cada X velas
      pullbackCounter++;
      if (pullbackCounter >= pullbackLimit) {
        direction = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
        regimeBodyFactor = 0.7;
        pullbackCounter = 0;
        pullbackLimit = 4 + Math.floor(Math.random() * 4);
      }
    } else {
      // Rango: más alternancia y cuerpos pequeños
      direction = Math.random() < 0.53 ? 'BULLISH' : 'BEARISH';
      var regimeBodyFactor = 0.6;
    }

    // === NUEVA LÓGICA: analizar últimas 100 velas ===
    // --- ADAPTACIÓN A LAS ÚLTIMAS 66 VELAS REALES PARA LAS PRIMERAS 6 SIMULADAS ---
    let meanBody: number, stdBody: number, meanWick: number, stdWick: number;
    let historyLen: number;
    let upCount: number, downCount: number;
    if (generated.length < 9 && baseCandles.length >= 99) {
      const last99 = baseCandles.slice(-99);
      historyLen = 99;
      upCount = last99.filter((c: Candle) => c.close > c.open).length;
      downCount = last99.filter((c: Candle) => c.close < c.open).length;
      const bodies99 = last99.map((c: Candle) => Math.abs(c.close - c.open));
      const mechas99 = last99.map((c: Candle) => Math.abs(c.high - c.low) - Math.abs(c.close - c.open));
      meanBody = bodies99.length > 0 ? bodies99.reduce((a, b) => a + b, 0) / bodies99.length : (lastCandle.close * 0.0025);
      stdBody = Math.sqrt(bodies99.reduce((a, b) => a + Math.pow(b - meanBody,2), 0) / (bodies99.length || 1));
      const maxStdBody = lastCandle.close * 0.025;
      if (stdBody > maxStdBody) stdBody = maxStdBody;
      meanWick = mechas99.length > 0 ? mechas99.reduce((a, b) => a + b, 0) / mechas99.length : meanBody * 0.6;
      stdWick = Math.sqrt(mechas99.reduce((a, b) => a + Math.pow(b - meanWick,2), 0) / (mechas99.length || 1));
      const maxStdWick = lastCandle.close * 0.025;
      if (stdWick > maxStdWick) stdWick = maxStdWick;
    } else {
      historyLen = 100;
      const longHistory: Candle[] = candles.slice(-historyLen);
      upCount = longHistory.filter((c: Candle) => c.close > c.open).length;
      downCount = longHistory.filter((c: Candle) => c.close < c.open).length;
      const longBodies = longHistory.map((c: Candle) => Math.abs(c.close - c.open));
      const longMechas = longHistory.map((c: Candle) => Math.abs(c.high - c.low) - Math.abs(c.close - c.open));
      meanBody = longBodies.length > 0 ? longBodies.reduce((a, b) => a + b, 0) / longBodies.length : (lastCandle.close * 0.0025);
      // Limitar la desviación estándar máxima del cuerpo a un 2.5% del precio actual
      stdBody = Math.sqrt(longBodies.reduce((a, b) => a + Math.pow(b - meanBody,2), 0) / (longBodies.length || 1));
      const maxStdBody = lastCandle.close * 0.025;
      if (stdBody > maxStdBody) stdBody = maxStdBody;
      meanWick = longMechas.length > 0 ? longMechas.reduce((a, b) => a + b, 0) / longMechas.length : meanBody * 0.6;
      // Limitar la desviación estándar máxima de la mecha a un 2.5% del precio actual
      stdWick = Math.sqrt(longMechas.reduce((a, b) => a + Math.pow(b - meanWick,2), 0) / (longMechas.length || 1));
      const maxStdWick = lastCandle.close * 0.025;
      if (stdWick > maxStdWick) stdWick = maxStdWick;
    }
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

    // --- Volatilidad dinámica (probabilística: 20% de las velas) ---
    let volCycle = 1;
    if (Math.random() < 0.2) {
      volCycle = 0.8 + 0.45 * (1 + Math.sin((candles.length + i) / 11));
    }
    // Cuerpo realista según estadística larga
    const randomBody = meanBody + stdBody * (Math.random() - 0.5);
    const randomFactor = 0.85 + Math.random() * 0.3;
    let candleBody = Math.max(0.0001, randomBody * randomFactor * volFactor * regimeBodyFactor * volCycle);
    let open = lastCandle.close;
    let close = direction === "BULLISH" ? open + candleBody : open - candleBody;

    // --- Patrones de vela especiales ---
    // 1 de cada 10 velas: doji, martillo, envolvente
    if (Math.random() < 0.10) {
      const pattern = Math.random();
      if (pattern < 0.33) {
        // Doji: cuerpo pequeño, mechas largas
        const dojiBody = Math.max(0.0001, meanBody * 0.12);
        close = direction === 'BULLISH' ? open + dojiBody : open - dojiBody;
      } else if (pattern < 0.66) {
        // Martillo: cuerpo pequeño, mecha inferior larga
        const martilloBody = Math.max(0.0001, meanBody * 0.16);
        close = direction === 'BULLISH' ? open + martilloBody : open - martilloBody;
      } else {
        // Envolvente: cuerpo más grande de lo normal
        candleBody = candleBody * 1.7;
        close = direction === 'BULLISH' ? open + candleBody : open - candleBody;
      }
    }



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
