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
  // --- FASES REALISTAS DE TENDENCIA Y RANGO ---
  // Detectar tendencia real de las últimas 99 velas reales
  const last99 = baseCandles.slice(-99);
  const bullishCount = last99.filter((c: Candle) => c.close > c.open).length;
  const bearishCount = last99.filter((c: Candle) => c.close < c.open).length;
  let realTrend: 'BULLISH' | 'BEARISH' | 'RANGE' = 'RANGE';
  if (bullishCount > bearishCount + 10) realTrend = 'BULLISH';
  else if (bearishCount > bullishCount + 10) realTrend = 'BEARISH';
  // Probabilidad de iniciar en tendencia según tendencia real
  let phaseType: 'trend' | 'range' = 'range';
  if (realTrend === 'BULLISH' && Math.random() < 0.8) phaseType = 'trend';
  else if (realTrend === 'BEARISH' && Math.random() < 0.8) phaseType = 'trend';
  // Dirección de la tendencia simulada
  let trendDir: 'BULLISH' | 'BEARISH' = realTrend === 'RANGE' ? (Math.random() > 0.5 ? 'BULLISH' : 'BEARISH') : realTrend;
  // Duración de la fase actual
  let phaseCounter = 0;
  let phaseLimit = 30 + Math.floor(Math.random() * 91); // 30-120 velas por fase
  // Control de máximo 2 fases consecutivas de rango
  let consecutiveRangePhases = 0;
  let totalRangeStreaks = 0;
  function getNextPhaseType(): 'trend' | 'range' {
    if (consecutiveRangePhases >= 2) {
      consecutiveRangePhases = 0;
      return 'trend';
    }
    // Probabilidad base
    let trendBias = 0.7;
    if (count > 30) trendBias = 0.74;
    if (count > 50) trendBias = 0.78;
    if (count > 90) trendBias = 0.82;
    if (count > 150) trendBias = 0.86;
    if (count > 300) trendBias = 0.91;
    if (count > 600) trendBias = 0.96;
    if (count >= 999) trendBias = 0.99;
    // Si ya hubo muchas rachas de rango, reduce la probabilidad de rango
    let rangePenalty = Math.min(totalRangeStreaks * 0.09, 0.25); // penaliza más si hubo muchas rachas
    let rangeProb = realTrend === 'RANGE'
      ? 0.5 + (trendBias - 0.7) / 2 - rangePenalty
      : 1 - trendBias - rangePenalty;
    if (Math.random() < rangeProb) {
      consecutiveRangePhases++;
      totalRangeStreaks++;
      return 'range';
    } else {
      consecutiveRangePhases = 0;
      return 'trend';
    }
  }
  // Probabilidad de cambiar dirección en tendencia
  function shouldInvertTrend(): boolean {
    // Muy baja probabilidad, pero aumenta tras fases largas
    return Math.random() < 0.08 || phaseCounter > phaseLimit * 0.8 && Math.random() < 0.25;
  }
  // Probabilidad de pullback fuerte en tendencia
  function shouldPullback(): boolean {
    return Math.random() < 0.11;
  }
  // --- FIN BLOQUE DE FASES ---

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
  trendDir = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'; // Dirección de la tendencia
  let pullbackCounter = 0;
  let pullbackLimit = 12 + Math.floor(Math.random() * 22); // 4-7 velas antes de pullback

  // Guardar el precio inicial de la simulación (último close real)
  const simStartPrice = lastCandle.close;

  // --- Volatilidad dinámica por segmento ---
  // Fallback para timeframe inválido
  let _volFactor = typeof volFactor === 'number' && !isNaN(volFactor) && volFactor > 0 ? volFactor : 1;
  let segmentVolatility = _volFactor; // base según timeframe
  let volatilityTrend = Math.random() > 0.5 ? 1 : -1; // 1: sube, -1: baja
  let segmentStart = 0;

  for (let i = 0; i < count; i++) {
    let regimeBodyFactor: number;
    // --- CONTROL DE FASES REALISTAS ---
    phaseCounter++;
    // Detectar inicio de nuevo segmento
    if (phaseCounter === 1 || phaseCounter > phaseLimit) {
      // Al iniciar nueva fase/segmento, definir nueva volatilidad base y tendencia de volatilidad
      segmentVolatility = _volFactor * (0.9 + Math.random() * 0.3);
      volatilityTrend = Math.random() > 0.5 ? 1 : -1;
      segmentStart = i;
    }
    if (phaseCounter > phaseLimit) {
      // Cambiar de fase (tendencia o rango)
      phaseType = getNextPhaseType();
      phaseCounter = 1;
      phaseLimit = 30 + Math.floor(Math.random() * 91);
      // Si la nueva fase es tendencia, decidir dirección
      if (phaseType === 'trend') {
        // 80% de probabilidad de continuar la dirección anterior, 20% de invertir
        if (Math.random() < 0.8) {
          // Mantener dirección
        } else {
          trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
        }
      }
    }
    // --- DIRECCIÓN DE LA VELA SEGÚN FASE ---
    let direction: 'BULLISH' | 'BEARISH';
    if (phaseType === 'trend') {
      // --- CONTROL DE VARIACIÓN MÁXIMA EN TENDENCIA ---
      const currentPrice = lastCandle.close;
      const pctChange = ((currentPrice - simStartPrice) / simStartPrice) * 100;
      if (pctChange >= 5) {
        trendDir = 'BEARISH';
      } else if (pctChange <= -5) {
        trendDir = 'BULLISH';
      } else if (Math.abs(pctChange) >= 4.5) {
        // Si está cerca del 5%, probabilidad muy baja de continuar
        if (trendDir === 'BULLISH' && pctChange > 0 && Math.random() > 0.01) {
          trendDir = 'BEARISH';
        } else if (trendDir === 'BEARISH' && pctChange < 0 && Math.random() > 0.01) {
          trendDir = 'BULLISH';
        }
      }

      // Pullback fuerte ocasional
      if (shouldInvertTrend()) {
        trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
      } else if (shouldPullback()) {
        direction = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
      }
      direction = trendDir;
      regimeBodyFactor = 1.2;
    } else {
      // Rango: más alternancia y cuerpos pequeños
      direction = Math.random() < 0.53 ? 'BULLISH' : 'BEARISH';
      regimeBodyFactor = 0.6;
    }
    pullbackCounter = 0;
    pullbackLimit = 4 + Math.floor(Math.random() * 4);

    // Soportes y resistencias con lookback adaptado
    const { supports, resistances } = getSupportResistance(candles, lookback);
    let directionMix: 'BULLISH' | 'BEARISH' = decideMixDirection(candles, timeframe) as 'BULLISH' | 'BEARISH';

    // --- LÓGICA DE RÉGIMEN ---
    if (regime === 'trend') {
      // Mayor probabilidad de seguir la tendencia
      directionMix = Math.random() < 0.78 ? trendDir : (trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH');
      // Cuerpos más grandes
      regimeBodyFactor = 1.18;
      // Pullback forzado cada X velas
      pullbackCounter++;
      if (pullbackCounter >= pullbackLimit) {
        directionMix = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
        regimeBodyFactor = 0.7;
        pullbackCounter = 0;
        pullbackLimit = 4 + Math.floor(Math.random() * 4);
      }
    } else {
      // Rango: más alternancia y cuerpos pequeños
      directionMix = Math.random() < 0.53 ? 'BULLISH' : 'BEARISH';
      regimeBodyFactor = 0.6;
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

    // --- Volatilidad dinámica por segmento (realista) ---
    // Dentro del segmento, la volatilidad sube o baja suavemente
    // Si el segmento es largo, aumenta la probabilidad de agotamiento (volatilidad decreciente)
    if ((i - segmentStart) > 12 && Math.random() < 0.15) {
      volatilityTrend = -1; // tendencia a bajar volatilidad
    }
    segmentVolatility *= 1 + (Math.random() * 0.018 * volatilityTrend);
    // Limitar volatilidad a rango razonable
    segmentVolatility = Math.max(_volFactor * 0.6, Math.min(segmentVolatility, _volFactor * 2.5));
    if (!segmentVolatility || isNaN(segmentVolatility) || segmentVolatility <= 0) segmentVolatility = _volFactor;

    // --- Cuerpo de vela basado en las últimas 120 velas reales ---
    const last120 = baseCandles.slice(-120);
    const bodies120 = last120.map(c => Math.abs(c.close - c.open));
    const avgBody120 = bodies120.reduce((a, b) => a + b, 0) / (bodies120.length || 1);
    const maxBody120 = Math.max(...bodies120);
    const minBody120 = Math.min(...bodies120);
    // Variación normal (70%-130% del promedio)
    let candleBody = avgBody120 * (0.7 + Math.random() * 0.6);
    // Pico de volatilidad (3% de los casos)
    if (Math.random() < 0.03) {
      candleBody = avgBody120 * (1.5 + Math.random() * 1.5);
      candleBody = Math.min(candleBody, maxBody120 * 1.3);
    }
    // Limitar siempre el cuerpo a un rango razonable
    const minBody = Math.max(minBody120, avgBody120 * 0.4);
    const maxBody = Math.min(maxBody120 * 1.3, avgBody120 * 2.5);
    candleBody = Math.max(minBody, Math.min(candleBody, maxBody));
    // Si por alguna razón es NaN o cero, usar un valor de fallback
    if (!candleBody || isNaN(candleBody) || candleBody <= 0) candleBody = Math.abs(avgBody120) * 0.7;
    let open = lastCandle.close;
    let close = direction === "BULLISH" ? open + candleBody : open - candleBody;

    // Determinar si hay ruptura de soporte o resistencia (breakout)
    let breakoutVolBoost = 1;
    // Buscar soporte/resistencia relevante cerca
    let nearSupportBreak = supports.find(s => Math.abs(open - s) / open < srMargin / 100);
    let nearResistanceBreak = resistances.find(r => Math.abs(open - r) / open < srMargin / 100);
    if ((direction === 'BULLISH' && nearResistanceBreak && close > nearResistanceBreak) || (direction === 'BEARISH' && nearSupportBreak && close < nearSupportBreak)) {
      breakoutVolBoost = 1.15 + Math.random() * 0.12;
      // Recalcular el cuerpo de la vela con el boost aplicado
      candleBody *= breakoutVolBoost;
      close = direction === "BULLISH" ? open + candleBody : open - candleBody;
    }

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
