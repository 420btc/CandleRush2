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

// --- FUNCIONES GLOBALES RSI Y ADX ---
function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i-1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}
function calcADX(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (closes.length < period + 2) return 20;
  let trSum = 0, plusDM = 0, minusDM = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const high = highs[i], low = lows[i];
    const prevHigh = highs[i-1], prevLow = lows[i-1];
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    plusDM += upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM += downMove > upMove && downMove > 0 ? downMove : 0;
    trSum += Math.max(
      high - low,
      Math.abs(high - closes[i-1]),
      Math.abs(low - closes[i-1])
    );
  }
  const plusDI = 100 * (plusDM / trSum);
  const minusDI = 100 * (minusDM / trSum);
  const dx = 100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI);
  return dx;
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

import { getWhaleVote } from "./whale-vote";

export function calcEMA(period: number, arr: number[]): number[] {
  const k = 2 / (period + 1);
  let emaArr: number[] = [];
  let emaPrev: number | null = null;
  for (let i = 0; i < arr.length; i++) {
    const price = arr[i];
    if (i < period - 1) {
      emaArr.push(NaN);
    } else if (i === period - 1) {
      const sma = arr.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
      emaArr.push(sma);
      emaPrev = sma;
    } else if (emaPrev !== null) {
      const ema: number = price * k + (emaPrev as number) * (1 - k);
      emaArr.push(ema);
      emaPrev = ema;
    }
  }
  return emaArr;
}

export function generateAutoDrawCandles(
  baseCandles: Candle[],
  count: number,
  timeframe: string = "1m",
  whaleTrades?: any[] // WhaleTrade[] si tienes el tipo
): { candles: Candle[], finalPrice: number } {
  // --- CONTROL DE TENDENCIAS ULTRA LARGAS Y REVERSALS ---
  // Configuración: máximos y reversals
  const MAX_TREND_LEN = 48; // Máximo permitido de velas en una misma tendencia (mucho más prolongado)
  const MAX_TREND_LEN_HARD = 60; // Máximo absoluto (nunca más de esto, pero sigue siendo realista)
  const REVERSAL_INTERVAL_MIN = 10; // Cada cuántas velas mínimo puede haber reversal fuerte
  const REVERSAL_INTERVAL_MAX = 20; // Máximo para reversal aleatorio
  let trendStreak = 0; // Cuenta velas en la misma dirección
  let lastTrendDir: 'BULLISH' | 'BEARISH' = 'BULLISH';
  let nextForcedReversal = REVERSAL_INTERVAL_MIN + Math.floor(Math.random() * (REVERSAL_INTERVAL_MAX - REVERSAL_INTERVAL_MIN));

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

  // --- CRUCES DE EMAS SIMULADAS (10, 55, 200, 365) ---
  // Calcula EMAs sobre las velas reales + simuladas hasta ahora
  function calcEMA(period: number, arr: number[]) {
    const k = 2 / (period + 1);
    let emaArr: number[] = [];
    let emaPrev: number | null = null;
    for (let i = 0; i < arr.length; i++) {
      const price = arr[i];
      if (i < period - 1) {
        emaArr.push(NaN);
      } else if (i === period - 1) {
        const sma = arr.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
        emaArr.push(sma);
        emaPrev = sma;
      } else if (emaPrev !== null) {
        const ema: number = price * k + (emaPrev as number) * (1 - k);
        emaArr.push(ema);
        emaPrev = ema;
      }
    }
    return emaArr;
  }

  let trendDirection: 'BULLISH' | 'BEARISH' = 'BULLISH';

  // --- NUEVO: Breakouts realistas por distancia al precio inicial ---
  const breakouts: { idx: number, type: 'weak'|'mild'|'medium'|'strong'|'extreme', direction: 'BULLISH'|'BEARISH', distance: number, price: number }[] = [];

  // --- Control de máximos/mínimos crecientes/decrecientes por tendencia ---
  let lastMax = Math.max(...baseCandles.slice(-30).map(c => c.high));
  let lastMin = Math.min(...baseCandles.slice(-30).map(c => c.low));
  let maxStreak = 0;
  let minStreak = 0;
  let lastReversalIdx = -10;

  // --- Parámetros para volatilidad extrema y eventos aleatorios ---
  let calmPhase = false;
  let calmPhaseLen = 0;
  let calmPhaseLimit = 7 + Math.floor(Math.random()*7); // 7-14 velas de calma
  let expansionPhase = false;
  let expansionLen = 0;
  let expansionLimit = 3 + Math.floor(Math.random()*3); // 3-5 velas de expansión
  let lastBreakoutOrFakeout = -20;
  let lastSuperPullback = -30;
  let lastFlashEvent = -50;
  let lastLiquidityGrab = -60;
  let breakoutOrFakeoutPending = false;
  let nextMaxMinInterval = 6 + Math.floor(Math.random()*6); // 6-11, luego se recalcula
  let superPullbackProb = 0.08;
  let flashCrashProb = 0.008;
  let liquidityGrabProb = 0.012;
  let whaleSpikeProb = 0.01;

  // --- Estado de manipulación prolongada ---
  let manipulationActive: false | 'mild' | 'medium' | 'strong' = false;
  let manipulationCounter = 0;
  let manipulationLimit = 0;
  let manipulationTriggered = { mild: false, medium: false, strong: false };

  let lastPrice = generated.length > 0 ? generated[generated.length-1].close : baseCandles[baseCandles.length-1].close;
  for (let i = 0; i < count; i++) {
    // Inicializa regimeBodyFactor al principio de cada iteración
    let regimeBodyFactor: number = 1;
    // EMAs actualizadas para cada iteración
    const closesSim = [...baseCandles, ...generated].map(c => c.close);
    const ema10 = calcEMA(10, closesSim);
    const ema55 = calcEMA(55, closesSim);
    const ema200 = calcEMA(200, closesSim);
    const ema365 = calcEMA(365, closesSim);


    // === LÓGICA 2: Si el precio está muy por encima/debajo de la EMA 55, 200 o 365, forzar reversal ===
    const lastEma55 = ema55[ema55.length-1];
    const lastEma200 = ema200[ema200.length-1];
    const lastEma365 = ema365[ema365.length-1];
    // --- Usar estas variables para toda la lógica de la iteración ---
    if (lastPrice > Math.max(lastEma55, lastEma200, lastEma365) * 1.025) {
      // Muy por encima de las EMAs: forzar reversal bajista
      trendDir = 'BEARISH';
      phaseType = 'trend';
      phaseCounter = 0;
      phaseLimit = 10 + Math.floor(Math.random() * 10);
    } else if (lastPrice < Math.min(lastEma55, lastEma200, lastEma365) * 0.975) {
      // Muy por debajo de las EMAs: forzar reversal alcista
      trendDir = 'BULLISH';
      phaseType = 'trend';
      phaseCounter = 0;
      phaseLimit = 10 + Math.floor(Math.random() * 10);
    }

    // === PROBABILIDAD DE ROMPER NUEVOS MÍNIMOS EN TENDENCIA BAJISTA ===
    // Si la tendencia es bajista y el precio está cerca del mínimo histórico reciente, aumenta la probabilidad de romperlo
    if (trendDir === 'BEARISH') {
      const allCandles = [...baseCandles, ...generated];
      const minHistory = Math.min(...allCandles.slice(-200).map(c => c.low));
      const distToMin = (lastPrice - minHistory) / minHistory;
      // Si está a menos de 1% del mínimo, 70% de probabilidad de romper un nuevo mínimo
      if (distToMin < 0.01 && Math.random() < 0.7) {
        // Fuerza que la siguiente vela sea bajista y rompa el mínimo
        trendDir = 'BEARISH';
        phaseType = 'trend';
        phaseCounter = 0;
        phaseLimit = 5 + Math.floor(Math.random() * 5);
        // Opcional: puedes ajustar aquí el cuerpo de la vela para que sea más grande
      }
    }

    // === DETECCIÓN Y AUTOCORRECCIÓN DE FASES ABSURDAS ===
    // 1. Detectar movimientos verticales extremos en pocas velas
    const checkCandles = [...baseCandles, ...generated];
    if (checkCandles.length > 12) {
      const last10 = checkCandles.slice(-10);
      const price10Ago = last10[0].close;
      const pctMove10 = Math.abs((lastPrice - price10Ago) / price10Ago);
      if (pctMove10 > 0.08) {
        // Si subió o bajó más de 8% en 10 velas, forzar rango/corrección
        trendDir = lastPrice > price10Ago ? 'BEARISH' : 'BULLISH';
        phaseType = 'trend';
        phaseCounter = 0;
        phaseLimit = 7 + Math.floor(Math.random() * 6);
      }
    }

    // 2. Detectar tendencias largas sin corrección
    if (trendStreak > 30) {
      // Si lleva más de 30 velas en la misma dirección, fuerza rango/corrección
      trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
      phaseType = 'trend';
      phaseCounter = 0;
      phaseLimit = 10 + Math.floor(Math.random() * 10);
    }

    // 3. Detectar si el precio se mantiene fuera de las EMAs demasiado tiempo
    // Las EMAs ya están declaradas arriba en la iteración
    const aboveAllEMAs = lastPrice > lastEma55 && lastPrice > lastEma200 && lastPrice > lastEma365;
    const belowAllEMAs = lastPrice < lastEma55 && lastPrice < lastEma200 && lastPrice < lastEma365;
    if ((aboveAllEMAs || belowAllEMAs) && trendStreak > 18) {
      // Si lleva más de 18 velas por fuera de todas las EMAs, fuerza pullback/rango
      trendDir = aboveAllEMAs ? 'BEARISH' : 'BULLISH';
      phaseType = 'trend';
      phaseCounter = 0;
      phaseLimit = 8 + Math.floor(Math.random() * 8);
    }



    // --- DETECCIÓN DE RUPTURAS (BREAKOUTS) ---
    const distance = Math.abs(lastPrice - simStartPrice);
    let breakoutType: 'weak'|'mild'|'medium'|'strong'|'extreme'|null = null;
    // --- Activar manipulación prolongada según umbral ---
    if (distance >= 4000) {
      // Tendencia bajista extrema
      manipulationActive = 'strong';
      manipulationCounter = 0;
      manipulationLimit = 600 + Math.floor(Math.random() * 101); // 600-700 velas
      manipulationTriggered.strong = true;
      trendDir = 'BEARISH';
      // Buscar mínimos: fuerza el precio a caer progresivamente
    } else if (!manipulationTriggered.strong && distance >= 3000) {
      manipulationActive = 'strong';
      manipulationCounter = 0;
      manipulationLimit = 500 + Math.floor(Math.random() * 101); // 500-600
      manipulationTriggered.strong = true;
      trendDir = 'BEARISH'; // También fuerza bajista en 3000
    } else if (!manipulationTriggered.medium && distance >= 2000) {
      manipulationActive = 'medium';
      manipulationCounter = 0;
      manipulationLimit = 300 + Math.floor(Math.random() * 101); // 300-400
      manipulationTriggered.medium = true;
    } else if (!manipulationTriggered.mild && distance >= 1000) {
      manipulationActive = 'mild';
      manipulationCounter = 0;
      manipulationLimit = 100 + Math.floor(Math.random() * 101); // 100-200
      manipulationTriggered.mild = true;
    }
    // --- Determinar breakoutType solo para la lógica de ruptura puntual (no prolongada) ---
    if (distance >= 3000) breakoutType = 'extreme';
    else if (distance >= 2000) breakoutType = 'strong';
    else if (distance >= 1000) breakoutType = 'medium';
    else if (distance >= 500) breakoutType = 'mild';
    else if (distance >= 250) breakoutType = 'weak';
    if (breakoutType) {
      // Registrar ruptura y forzar cambio de fase/tendencia
      const direction = lastPrice > simStartPrice ? 'BULLISH' : 'BEARISH';
      breakouts.push({ idx: i, type: breakoutType, direction, distance, price: lastPrice });
      // Forzar fase tendencia fuerte y dirección
      phaseType = 'trend';
      phaseCounter = 1;
      phaseLimit = 10 + Math.floor(Math.random() * 10);
      trendDir = direction;
      trendDirection = direction;
      // HACER EL BREAKOUT MUCHO MÁS FUERTE
      let open = lastPrice;
      let close;
      let high, low;
      let breakoutMove = 0;
      if (breakoutType === 'extreme') {
        breakoutMove = 1600 + Math.random() * 1000; // 1600-2600 USD
        segmentVolatility *= 4.5;
      } else if (breakoutType === 'strong') {
        breakoutMove = 1000 + Math.random() * 700; // 1000-1700 USD
        segmentVolatility *= 3.2;
      } else if (breakoutType === 'medium') {
        breakoutMove = 400 + Math.random() * 300; // 400-700 USD
        segmentVolatility *= 1.7;
      } else if (breakoutType === 'mild') {
        breakoutMove = 250 + Math.random() * 150; // 250-400 USD
        segmentVolatility *= 1.35;
      } else if (breakoutType === 'weak') {
        breakoutMove = 180 + Math.random() * 120; // 180-300 USD
        segmentVolatility *= 1.25;
      }
      if (direction === 'BULLISH') {
        close = open + breakoutMove;
        low = open - Math.random() * 30;
        high = close + Math.random() * 30;
      } else {
        close = open - breakoutMove;
        high = open + Math.random() * 30;
        low = close - Math.random() * 30;
      }
      // Marca la vela como ruptura
      // --- AJUSTE ROBUSTO DE BREAKOUT Y REVERSAL: posicionar el precio respecto a TODAS las EMAs ---
      // Recalcular EMAs con el nuevo close
      let closesSimCandles = [...baseCandles, ...generated];
      let closesSim = closesSimCandles.map(c => c.close).concat(close);
      let ema10 = calcEMA(10, closesSim);
      let ema55 = calcEMA(55, closesSim);
      let ema200 = calcEMA(200, closesSim);
      let ema365 = calcEMA(365, closesSim);
      // Si el breakout es fuerte, forzar el posicionamiento respecto a TODAS las EMAs
      if (breakoutType === 'extreme' || breakoutType === 'strong') {
        if (direction === 'BEARISH') {
          // Forzar close por debajo de todas las EMAs
          const minEMA = Math.min(ema10[ema10.length-1], ema55[ema55.length-1], ema200[ema200.length-1], ema365[ema365.length-1]);
          if (close > minEMA) {
            close = minEMA - Math.abs(breakoutMove * 0.15 + Math.random() * breakoutMove * 0.1);
            low = Math.min(low, close - Math.abs(breakoutMove * 0.05));
          }
          // Simular velas bajistas hasta que el precio quede por debajo de todas las EMAs
          let forceSteps = 0;
          while ((close > ema10[ema10.length-1] || close > ema55[ema55.length-1] || close > ema200[ema200.length-1] || close > ema365[ema365.length-1]) && forceSteps < 12) {
            close -= Math.abs(breakoutMove * 0.08);
            closesSim.push(close);
            ema10 = calcEMA(10, closesSim);
            ema55 = calcEMA(55, closesSim);
            ema200 = calcEMA(200, closesSim);
            ema365 = calcEMA(365, closesSim);
            forceSteps++;
          }
        } else {
          // breakout alcista fuerte: forzar por encima de todas las EMAs
          const maxEMA = Math.max(ema10[ema10.length-1], ema55[ema55.length-1], ema200[ema200.length-1], ema365[ema365.length-1]);
          if (close < maxEMA) {
            close = maxEMA + Math.abs(breakoutMove * 0.15 + Math.random() * breakoutMove * 0.1);
            high = Math.max(high, close + Math.abs(breakoutMove * 0.05));
          }
          // Simular velas alcistas hasta que el precio quede por encima de todas las EMAs
          let forceSteps = 0;
          while ((close < ema10[ema10.length-1] || close < ema55[ema55.length-1] || close < ema200[ema200.length-1] || close < ema365[ema365.length-1]) && forceSteps < 12) {
            close += Math.abs(breakoutMove * 0.08);
            closesSim.push(close);
            ema10 = calcEMA(10, closesSim);
            ema55 = calcEMA(55, closesSim);
            ema200 = calcEMA(200, closesSim);
            ema365 = calcEMA(365, closesSim);
            forceSteps++;
          }
        }
      }
      // --- DURANTE LA TENDENCIA: si el precio se aleja >2% de la EMA365, forzar pullback o reversal ---
      const distFromEMA365 = Math.abs(close - ema365[ema365.length-1]) / ema365[ema365.length-1];
      if (distFromEMA365 > 0.02) {
        // Si está muy alejado, fuerza reversal o pullback fuerte hacia la EMA365
        if (direction === 'BULLISH' && close > ema365[ema365.length-1]) {
          close = ema365[ema365.length-1] + Math.abs(breakoutMove * 0.05) * (Math.random() + 0.3);
        } else if (direction === 'BEARISH' && close < ema365[ema365.length-1]) {
          close = ema365[ema365.length-1] - Math.abs(breakoutMove * 0.05) * (Math.random() + 0.3);
        }
      }
      // --- USAR TODAS LAS EMAs COMO SOPORTE/RESISTENCIA EN GENERACIÓN DE VELAS ---
      // (esto se debe aplicar también en la lógica general de soportes/resistencias y pullbacks, fuera de este bloque)
      // --- FASE DE CALMA Y EXPANSIÓN DE VOLATILIDAD ---
      if (calmPhase) {
        regimeBodyFactor *= 0.7;
        calmPhaseLen++;
        if (calmPhaseLen > calmPhaseLimit) {
          calmPhase = false;
          expansionPhase = true;
          expansionLen = 0;
          expansionLimit = 3 + Math.floor(Math.random()*3);
        }
      } else if (expansionPhase) {
        regimeBodyFactor *= 1.9;
        expansionLen++;
        if (expansionLen > expansionLimit) {
          expansionPhase = false;
          calmPhase = true;
          calmPhaseLen = 0;
          calmPhaseLimit = 7 + Math.floor(Math.random()*7);
        }
      } else if (Math.random() < 0.10) {
        calmPhase = true;
        calmPhaseLen = 0;
        calmPhaseLimit = 7 + Math.floor(Math.random()*7);
      }

      // --- FLASH CRASH/PUMP EVENTO EXTREMO ---
      if (i - lastFlashEvent > 30 && Math.random() < flashCrashProb) {
        if (direction === 'BULLISH') {
          high = high + Math.abs(high*0.04 + Math.random()*high*0.04);
          close = high - Math.abs(high*0.01 + Math.random()*high*0.01);
        } else {
          low = low - Math.abs(low*0.04 + Math.random()*low*0.04);
          close = low + Math.abs(low*0.01 + Math.random()*low*0.01);
        }
        lastFlashEvent = i;
      }

      // --- SUPER PULLBACK BRUSCO ---
      if (i - lastSuperPullback > 10 && Math.random() < superPullbackProb) {
        if (direction === 'BULLISH') {
          low = lastMin - Math.abs(lastMin * (0.03 + Math.random()*0.05));
          close = Math.max(close, low + Math.abs(low*0.002));
        } else {
          high = lastMax + Math.abs(lastMax * (0.03 + Math.random()*0.05));
          close = Math.min(close, high - Math.abs(high*0.002));
        }
        lastSuperPullback = i;
      }

      // --- FAKEOUT/LIQUIDITY GRAB SOBRE EMAS ---
      if (i - lastLiquidityGrab > 20 && Math.random() < liquidityGrabProb) {
        // Elige una EMA aleatoria relevante
        const emas = [ema10, ema55, ema200, ema365];
        const sel = emas[Math.floor(Math.random()*emas.length)];
        const ref = sel[sel.length-1];
        if (direction === 'BULLISH') {
          low = ref - Math.abs(ref*0.012 + Math.random()*ref*0.03);
          close = ref + Math.abs(ref*0.01 + Math.random()*ref*0.02);
        } else {
          high = ref + Math.abs(ref*0.012 + Math.random()*ref*0.03);
          close = ref - Math.abs(ref*0.01 + Math.random()*ref*0.02);
        }
        lastLiquidityGrab = i;
      }

      // --- WHALE SPIKE ---
      if (whaleTrades && whaleTrades.length > 0 && Math.random() < whaleSpikeProb) {
        // Simula un spike de volatilidad por ballena
        if (direction === 'BULLISH') {
          high = high + Math.abs(high*0.018 + Math.random()*high*0.032);
        } else {
          low = low - Math.abs(low*0.018 + Math.random()*low*0.032);
        }
      }

      // --- LÓGICA DE MÁXIMOS/MÍNIMOS CRECIENTES/DECRECIENTES SEGÚN TENDENCIA ---
      // Solo se aplica si no es rango ni reversal inmediato
      if (regime === 'trend') {
        // Intervalo aleatorio para máximos/mínimos crecientes
        if (maxStreak >= nextMaxMinInterval && direction === 'BULLISH') {
          if (high <= lastMax) {
            let delta = Math.abs(lastMax * (0.0025 + Math.random() * 0.01));
            high = lastMax + delta;
            if (close > high) close = high - Math.abs(high*0.001);
          }
          lastMax = high;
          nextMaxMinInterval = 6 + Math.floor(Math.random()*7); // 6-12
          maxStreak = 0;
        }
        if (minStreak >= nextMaxMinInterval && direction === 'BEARISH') {
          if (low >= lastMin) {
            let delta = Math.abs(lastMin * (0.0025 + Math.random() * 0.01));
            low = lastMin - delta;
            if (close < low) close = low + Math.abs(low*0.001);
          }
          lastMin = low;
          nextMaxMinInterval = 6 + Math.floor(Math.random()*7);
          minStreak = 0;
        }
        if (direction === 'BULLISH') {
          maxStreak++;
          // Pullback fuerte y natural en alcista si la racha es larga
          if (maxStreak > 6 && Math.random() < 0.28) {
            low = lastMin - Math.abs(lastMin * (0.008 + Math.random() * 0.018));
            close = Math.max(close, low + Math.abs(low*0.002));
          }
          if (i - lastReversalIdx < 8 && low < lastMin) {
            low = lastMin + Math.abs(lastMin*0.003);
          }
        } else if (direction === 'BEARISH') {
          minStreak++;
          // Pullback fuerte y natural en bajista si la racha es larga
          if (minStreak > 6 && Math.random() < 0.28) {
            high = lastMax + Math.abs(lastMax * (0.008 + Math.random() * 0.018));
            close = Math.min(close, high - Math.abs(high*0.002));
          }
          if (i - lastReversalIdx < 8 && high > lastMax) {
            high = lastMax - Math.abs(lastMax*0.003);
          }
        }
      }
      // Si hay reversal fuerte, reinicia los contadores y marca el reversal
      if (breakoutType === 'strong') {
        maxStreak = 0;
        minStreak = 0;
        lastReversalIdx = i;
        // Tras reversal bajista, fuerza nuevo mínimo decreciente
        if (direction === 'BEARISH') {
          let delta = Math.abs(lastMin * (0.002 + Math.random() * 0.003));
          low = lastMin - delta;
          lastMin = low;
        }
        // Tras reversal alcista, fuerza nuevo máximo creciente
        if (direction === 'BULLISH') {
          let delta = Math.abs(lastMax * (0.002 + Math.random() * 0.003));
          high = lastMax + delta;
          lastMax = high;
        }
      }
      // --- FIN LÓGICA DE MÁXIMOS/MÍNIMOS ---
      generated.push({
        open,
        close,
        high,
        low,
        volume: 1 + Math.random() * 3,
        timestamp: Date.now() + i * 60000,
        isClosed: true,
        breakoutType: breakoutType as 'weak' | 'medium' | 'strong',
        volatileRandom: false,
      });
      // Saltar el resto del bucle para que la ruptura sea inmediata
      continue;
    }

    // --- MANIPULACIÓN PROLONGADA: aplicar si está activa ---
    if (manipulationActive) {
      // Eleva la volatilidad y fuerza tendencia según nivel
      if (manipulationActive === 'mild') {
        segmentVolatility *= 1.25;
        // Mantén la tendencia actual
      } else if (manipulationActive === 'medium') {
        segmentVolatility *= 1.7;
        // Mantén la tendencia actual
      } else if (manipulationActive === 'strong') {
        segmentVolatility *= 3.2;
        // Fuerza tendencia bajista si está en manipulación fuerte
        trendDir = 'BEARISH';
        // Tendencia bajista fuerte: favorece caídas progresivas hacia nuevos mínimos
        const allLows = [...baseCandles, ...generated].map(c => c.low);
        const minSoFar = Math.min(...allLows);
        // Probabilidad alta de seguir bajando, pero permite rebotes
        const probNewLow = 0.7; // 70% de probabilidad de hacer un low más bajo
        let low: number, close: number, high: number, open: number;
        let newLow: number, newClose: number, newHigh: number, newOpen: number;
        if (Math.random() < probNewLow) {
          // Hacer un nuevo mínimo histórico, pero con caída moderada
          newLow = minSoFar - Math.abs(minSoFar * (0.001 + Math.random() * 0.002));
          newClose = newLow + Math.abs(newLow * (0.001 + Math.random() * 0.002));
        } else {
          // Rebote: low cerca del mínimo pero no menor
          newLow = minSoFar + Math.abs(minSoFar * (0.0005 + Math.random() * 0.002));
          newClose = newLow + Math.abs(newLow * (0.003 + Math.random() * 0.005));
        }
        // El high puede ser apenas por encima del open para simular mecha superior
        // Calcula el high solo con lastPrice y newClose
        newHigh = Math.max(lastPrice, newClose) + Math.abs(newLow * (0.0005 + Math.random() * 0.001));
        // El open puede ser entre el close previo y el nuevo close
        newOpen = lastPrice > newClose ? lastPrice : newClose + Math.abs(newClose * 0.001);
        // Asigna los valores generados a las variables de la vela después de calcular todo
        low = newLow;
        close = newClose;
        high = newHigh;
        open = newOpen;
        // Así, la serie baja progresivamente hacia nuevos mínimos, pero no en cada vela.
      }
      manipulationCounter++;
      if (manipulationCounter >= manipulationLimit) {
        manipulationActive = false;
        manipulationCounter = 0;
        manipulationLimit = 0;
      }
    }

    // --- CONTROL DE FASES REALISTAS ---
    phaseCounter++;

    // --- CONTROL DE TENDENCIA ULTRA LARGA Y REVERSAL ALEATORIO ---
    if (phaseType === 'trend') {
      if (trendDir === lastTrendDir) {
        trendStreak++;
      } else {
        trendStreak = 1;
        lastTrendDir = trendDir;
      }
      // 1. Forzar reversal si se supera el máximo absoluto de tendencia
      if (trendStreak > MAX_TREND_LEN_HARD) {
        trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
        trendStreak = 1;
        // Opcional: marcar reversal fuerte
      }
      // 2. Probabilidad creciente de reversal al acercarse al máximo
      else if (trendStreak > MAX_TREND_LEN) {
        const probReversal = 0.25 + 0.1 * (trendStreak - MAX_TREND_LEN); // 25% base +10% por vela extra
        if (Math.random() < probReversal) {
          trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
          trendStreak = 1;
        }
      }
      // 3. Reversal aleatorio fuerte cada X velas
      if (trendStreak >= nextForcedReversal) {
        if (Math.random() < 0.7) { // 70% de probabilidad de reversal fuerte
          trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
          trendStreak = 1;
        }
        nextForcedReversal = REVERSAL_INTERVAL_MIN + Math.floor(Math.random() * (REVERSAL_INTERVAL_MAX - REVERSAL_INTERVAL_MIN));
      }
    }

    // Detectar inicio de nuevo segmento
    if (phaseCounter === 1 || phaseCounter > phaseLimit) {
      // Al iniciar nueva fase/segmento, definir nueva volatilidad base y tendencia de volatilidad
      segmentVolatility = _volFactor * (0.9 + Math.random() * 0.3);
      volatilityTrend = Math.random() > 0.5 ? 1 : -1;
      segmentStart = i;
    }
    // --- Probabilidad decreciente de tendencia larga ---
    if (phaseType === 'trend') {
      let maxTrendNormal = 30, maxTrendHard = 60;
      if (timeframe === '3m') { maxTrendNormal = 12; maxTrendHard = 24; }
      if (phaseCounter > maxTrendNormal) {
        const over = phaseCounter - maxTrendNormal;
        const probContinue = Math.max(0.01, 0.85 ** over); // baja exponencialmente cada vela
        if (Math.random() > probContinue || phaseCounter > maxTrendHard) {
          // Forzar cambio de fase
          phaseType = 'range';
          phaseCounter = 1;
          phaseLimit = 10 + Math.floor(Math.random() * 10);
        }
      }
    }
    // --- Probabilidad decreciente de rango largo ---
    if (phaseType === 'range') {
      let maxRangeNormal = 15, maxRangeHard = 30;
      if (_volFactor > 1.3 || timeframe !== '1m') { maxRangeNormal = 22; maxRangeHard = 30; }
      if (phaseCounter > 10) {
        const over = phaseCounter - 10;
        const probContinue = Math.max(0.01, 0.7 ** over);
        if (Math.random() > probContinue || phaseCounter > maxRangeHard) {
          // Forzar cambio de fase a tendencia
          phaseType = 'trend';
          phaseCounter = 1;
          phaseLimit = 10 + Math.floor(Math.random() * 10);
          // Decidir dirección según EMAs
          const lastClose = generated.length > 0 ? generated[generated.length-1].close : baseCandles[baseCandles.length-1].close;
          let above = 0, below = 0;
          const emas = [ema10, ema55, ema200, ema365];
          for (const emaArr of emas) {
            const v = emaArr[emaArr.length-1];
            if (!isNaN(v)) {
              if (lastClose > v) above++;
              else if (lastClose < v) below++;
            }
          }
          if (above > below && Math.random() < 0.7) trendDirection = 'BULLISH';
          else if (below > above && Math.random() < 0.7) trendDirection = 'BEARISH';
          else trendDirection = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH';
        }
      }
    }
    if (phaseCounter > phaseLimit) {
      const closesSim = [...baseCandles, ...generated].map(c => c.close);
      const highsSim = [...baseCandles, ...generated].map(c => c.high);
      const lowsSim = [...baseCandles, ...generated].map(c => c.low);
      const adx = calcADX(highsSim, lowsSim, closesSim);

      if (phaseType === 'trend') {
        // 80% de probabilidad de continuar la dirección anterior, 20% de invertir
        if (Math.random() < 0.8) {
          // Mantener dirección
        } else {
          trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
        }
      }
    }

    // Detectar cruces recientes
    let emaCross: 'BULLISH' | 'BEARISH' | null = null;
    function crossUp(a: number[], b: number[]) {
      const n = a.length;
      if (n < 2) return false;
      return a[n-2] < b[n-2] && a[n-1] > b[n-1];
    }
    function crossDown(a: number[], b: number[]) {
      const n = a.length;
      if (n < 2) return false;
      return a[n-2] > b[n-2] && a[n-1] < b[n-1];
    }
    // Prioridad: 10/55 > 55/200 > 200/365
    if (crossUp(ema10, ema55) || crossUp(ema55, ema200) || crossUp(ema200, ema365)) emaCross = 'BULLISH';
    if (crossDown(ema10, ema55) || crossDown(ema55, ema200) || crossDown(ema200, ema365)) emaCross = 'BEARISH';

    // --- LÓGICA DOMINANTE DE WHALE TRADES ---
    let direction: 'BULLISH' | 'BEARISH';
    let whaleVote: "BULLISH" | "BEARISH" | null = null;
    if (whaleTrades && whaleTrades.length > 0) {
      whaleVote = getWhaleVote(whaleTrades, Date.now());
    }
    if (whaleVote) {
      direction = whaleVote;
      trendDir = whaleVote;
    } else if (phaseType === 'trend') {
      // --- SISTEMA DE VOTOS REALISTA (EMA, RSI, ADX, MACD, memoria de mercado) ---
      // Arrays de precios para indicadores
      const closesSim = [...baseCandles, ...generated].map(c => c.close);
      const highsSim = [...baseCandles, ...generated].map(c => c.high);
      const lowsSim = [...baseCandles, ...generated].map(c => c.low);
      const rsi = calcRSI(closesSim);
      const adx = calcADX(highsSim, lowsSim, closesSim);
      // MACD
      function calcMACD(closes: number[]): { macd: number, signal: number } {
        function ema(period: number, arr: number[]): number[] {
          const k = 2 / (period + 1);
          let emaArr: number[] = [];
          let emaPrev: number | null = null;
          for (let i = 0; i < arr.length; i++) {
            const price = arr[i];
            if (i < period - 1) {
              emaArr.push(NaN);
            } else if (i === period - 1) {
              const sma = arr.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
              emaArr.push(sma);
              emaPrev = sma;
            } else if (emaPrev !== null) {
              const emaVal: number = price * k + (emaPrev as number) * (1 - k);
              emaArr.push(emaVal);
              emaPrev = emaVal;
            }
          }
          return emaArr;
        }
        const ema12 = ema(12, closes);
        const ema26 = ema(26, closes);
        const macdArr = ema12.map((v, i) => v - ema26[i]);
        const signalArr = ema(9, macdArr.slice(macdArr.length - ema12.length));
        return {
          macd: macdArr[macdArr.length - 1],
          signal: signalArr[signalArr.length - 1]
        };
      }
      const macdVals = calcMACD(closesSim);
      let bullishVotes = 0, bearishVotes = 0;
      if (emaCross === 'BULLISH') bullishVotes++;
      if (emaCross === 'BEARISH') bearishVotes++;
      if (rsi > 60) bullishVotes++; else if (rsi < 40) bearishVotes++;
      if (adx > 25) (trendDir === 'BULLISH' ? bullishVotes++ : bearishVotes++);
      if (macdVals.macd > macdVals.signal) bullishVotes++; else if (macdVals.macd < macdVals.signal) bearishVotes++;
      // Memoria de mercado: ¿cuántas velas lleva el precio cerca del inicial?
      const distFromStart = Math.abs(lastCandle.close - simStartPrice) / simStartPrice;
      if (distFromStart < 0.003 && i > 30) { // <0.3% tras 30 velas
        if (Math.random() < 0.7) bullishVotes++; else bearishVotes++;
      }
      if (distFromStart > 0.08 && i > 30) { // >8% tras 30 velas
        if (trendDir === 'BULLISH') bearishVotes += 2;
        else bullishVotes += 2;
      }
      // Decisión final de dirección
      if (bullishVotes > bearishVotes) direction = 'BULLISH';
      else if (bearishVotes > bullishVotes) direction = 'BEARISH';
      else direction = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH';

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

    // === CONTROL DE TENDENCIA INTERMINABLE ===
    // Lleva la cuenta de la racha actual de tendencia
    if (typeof trendStreak !== 'number') trendStreak = 1;
    if (generated.length > 0) {
      const prevCandle = generated[generated.length - 1];
      const prevDir = prevCandle.close > prevCandle.open ? 'BULLISH' : 'BEARISH';
      const currDir = direction;
      if (currDir === prevDir) {
        trendStreak++;
      } else {
        trendStreak = 1;
      }
    }
    // Si la racha supera el máximo permitido, forzar reversal
    if (trendStreak > MAX_TREND_LEN) {
      trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
      direction = trendDir;
      trendStreak = 1;
    }
    // Si por cualquier motivo supera el hard limit, reversal obligatorio
    if (trendStreak > MAX_TREND_LEN_HARD) {
      trendDir = trendDir === 'BULLISH' ? 'BEARISH' : 'BULLISH';
      direction = trendDir;
      trendStreak = 1;
    }
    // === FIN CONTROL DE TENDENCIA INTERMINABLE ===

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

    // === APLICAR EFECTO DE WHALE ALERT ===
    if (whaleTrades && Array.isArray(whaleTrades)) {
      whaleTrades.forEach((trade: any) => {
        // Si el trade ocurre en el rango de tiempo de la vela simulada
        if (trade.timestamp >= open && trade.timestamp < open + msPerCandle) {
          const whaleEffect = Math.abs(open) * 0.005; // 0.5%
          if (trade.side === 'buy') close += whaleEffect;
          if (trade.side === 'sell') close -= whaleEffect;
        }
      });
    }

    // === NIVELES DE FIBONACCI ===
    // Calcula niveles sobre el rango de las últimas 50 velas (reales+simuladas)
    const fibCandles = [...baseCandles, ...generated].slice(-50);
    if (fibCandles.length >= 2) {
      const fibHigh = Math.max(...fibCandles.map(c => c.high));
      const fibLow = Math.min(...fibCandles.map(c => c.low));
      const fibRange = fibHigh - fibLow;
      const fibLevels = [
        fibHigh - fibRange * 0.382,
        fibHigh - fibRange * 0.5,
        fibHigh - fibRange * 0.618
      ];
      // Si el cierre está cerca de un nivel de fibo, aumenta probabilidad de reversal o pullback
      fibLevels.forEach(fib => {
        if (Math.abs(close - fib) / fib < 0.006) {
          // 0.6% de margen
          if (direction === 'BULLISH') close -= Math.abs(candleBody) * 0.5 * Math.random();
          if (direction === 'BEARISH') close += Math.abs(candleBody) * 0.5 * Math.random();
        }
      });
    }

    // === INFLUENCIA DEL RSI ===
    // Calcula RSI de las últimas 14 velas (reales+simuladas)
    const rsiCandles = [...baseCandles, ...generated].slice(-15);
    const rsiCloses = rsiCandles.map(c => c.close);
    const rsi = calcRSI(rsiCloses, 14);
    if (rsi > 70 && direction === 'BULLISH') {
      // Sobrecompra: aumenta probabilidad de reversal bajista
      if (Math.random() < 0.45) close -= Math.abs(candleBody) * (0.4 + Math.random()*0.5);
    } else if (rsi < 30 && direction === 'BEARISH') {
      // Sobreventa: aumenta probabilidad de reversal alcista
      if (Math.random() < 0.45) close += Math.abs(candleBody) * (0.4 + Math.random()*0.5);
    }

    // Determinar si hay ruptura de soporte o resistencia (breakout)
    let breakoutVolBoost = 1;
    // Buscar soporte/resistencia relevante cerca
    const nearSupport = supports.filter(s => Math.abs(open - s) < meanBody * srMargin).pop();
    const nearResistance = resistances.filter(r => Math.abs(open - r) < meanBody * srMargin)[0];
    if ((direction === 'BULLISH' && nearResistance && close > nearResistance) || (direction === 'BEARISH' && nearSupport && close < nearSupport)) {
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

    // === SPIKES ALEATORIOS CADA 66 VELAS ===
    // Con probabilidad baja, cada vez que el contador de velas simuladas sea múltiplo de 66
    if ((generated.length > 0 && generated.length % 66 === 0) && Math.random() < 0.7) {
      // Elegir aleatoriamente si es spike alcista o bajista
      const spikeType = Math.random() < 0.5 ? 'UP' : 'DOWN';
      const spikePercent = 0.002; // 0.2%
      if (spikeType === 'UP') {
        const spikeValue = close * (1 + spikePercent);
        // El close sube un 0.2%
        close = spikeValue;
        // El high también debe reflejar el spike si es mayor
        if (close > high) high = close;
      } else {
        const spikeValue = close * (1 - spikePercent);
        // El close baja un 0.2%
        close = spikeValue;
        // El low también debe reflejar el spike si es menor
        if (close < low) low = close;
      }
      // Opcional: marcar la vela como spike para debug
      (newCandle as any).isSpike = true;
    }



    // Lógica de soportes y resistencias (margen adaptado)
    // Las variables nearSupport y nearResistance ya están declaradas arriba en la iteración
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
