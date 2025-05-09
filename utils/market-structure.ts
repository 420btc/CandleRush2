import { Candle } from '../types';
import { saveMarketStructureMemory, getMarketStructureMemory } from './autoMixMemory';

interface SupportResistance {
  supports: number[];
  resistances: number[];
}

interface MarketStructureResult {
  supportLevels: number[];
  resistanceLevels: number[];
  currentTrend: 'UP' | 'DOWN' | 'SIDEWAYS';
  vote: 'BULLISH' | 'BEARISH' | null;
  voteWeight: number;
}

// Actualizar el tipo de la memoria para incluir voteWeight
export type MarketStructureMemoryEntry = {
  timestamp: number;
  timeframe: string;
  vote: 'BULLISH' | 'BEARISH' | null;
  supportLevels: number[];
  resistanceLevels: number[];
  currentTrend: 'UP' | 'DOWN' | 'SIDEWAYS';
  voteWeight: number;
};

export function getSupportResistance(candles: Candle[]): SupportResistance {
  // Tomar solo las últimas 66 velas
  const recentCandles = candles.slice(-66);
  const prices = recentCandles.map(c => c.close);
  
  // Encontrar máximos y mínimos locales usando una ventana de 5 velas
  const lookback = 3;
  const supportLevels = findLocalExtremes(prices, false, lookback);
  const resistanceLevels = findLocalExtremes(prices, true, lookback);
  
  // Eliminar duplicados y ordenar
  const uniqueSupports = Array.from(new Set(supportLevels)).sort((a, b) => a - b);
  const uniqueResistances = Array.from(new Set(resistanceLevels)).sort((a, b) => a - b);
  
  return {
    supports: uniqueSupports,
    resistances: uniqueResistances
  };
}

// Actualizar el tipo de la memoria para incluir voteWeight
interface MarketStructureResult {
  supportLevels: number[];
  resistanceLevels: number[];
  currentTrend: 'UP' | 'DOWN' | 'SIDEWAYS';
  vote: 'BULLISH' | 'BEARISH' | null;
  voteWeight: number;
}

function findLocalExtremes(prices: number[], isMax: boolean, lookback: number): number[] {
  const extremes: number[] = [];
  
  for (let i = lookback; i < prices.length - lookback; i++) {
    const current = prices[i];
    const prev = prices.slice(i - lookback, i);
    const next = prices.slice(i + 1, i + lookback + 1);
    
    if (isMax) {
      if (current > Math.max(...prev) && current > Math.max(...next)) {
        extremes.push(current);
      }
    } else {
      if (current < Math.min(...prev) && current < Math.min(...next)) {
        extremes.push(current);
      }
    }
  }
  
  return extremes;
}

function getLevels(extremes: number[], count: number): number[] {
  const sorted = [...extremes].sort((a, b) => a - b);
  const levels = [];
  
  for (let i = 0; i < Math.min(count, sorted.length); i++) {
    levels.push(sorted[i]);
  }
  
  return levels;
}

function determineTrend(candles: Candle[], supportLevels: number[], resistanceLevels: number[], threshold: number): 'UP' | 'DOWN' | 'SIDEWAYS' {
  // Guard: need at least 2 candles to determine trend
  if (!candles || candles.length < 2) return 'SIDEWAYS';
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  if (!last || !prev) return 'SIDEWAYS';
  const lastPrice = last.close;
  const lastLow = last.low;
  const lastHigh = last.high;
  
  // Verificar si el precio está cerca de algún nivel con umbral ajustado
  const nearSupport = supportLevels.some((level: number) => 
    Math.abs((lastPrice - level) / level) < threshold
  );
  
  const nearResistance = resistanceLevels.some((level: number) => 
    Math.abs((lastPrice - level) / level) < threshold
  );
  
  // Verificar la dirección del movimiento
  const priceChange = (candles[candles.length - 1].close - candles[candles.length - 2].close) / candles[candles.length - 2].close;
  
  if (nearSupport && priceChange > 0) {
    return 'UP';
  } else if (nearResistance && priceChange < 0) {
    return 'DOWN';
  } else {
    return 'SIDEWAYS';
  }
}

function generateVote(trend: 'UP' | 'DOWN' | 'SIDEWAYS', candles: Candle[], supportLevels: number[], resistanceLevels: number[], threshold: number): { vote: 'BULLISH' | 'BEARISH' | null; weight: number } {
  // Guard: need at least 2 candles to generate a vote
  if (!candles || candles.length < 2) return { vote: null, weight: 0 };
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  if (!lastCandle || !prevCandle) return { vote: null, weight: 0 };
  const lastPrice = lastCandle.close;
  
  // Base weight of 2 votes
  let weight = 2;
  
  // Generate vote based on structure
  if (trend === 'UP' && supportLevels.some((level: number) => 
    Math.abs((lastPrice - level) / level) < threshold
  )) {
    return { vote: 'BULLISH', weight };
  }
  
  if (trend === 'DOWN' && resistanceLevels.some((level: number) => 
    Math.abs((lastPrice - level) / level) < threshold
  )) {
    return { vote: 'BEARISH', weight };
  }
  
  // If we're in sideways trend and breaking levels
  if (trend === 'SIDEWAYS') {
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    
    // If breaking resistance
    if (lastCandle.high > prevCandle.high && resistanceLevels.some((level: number) => 
      Math.abs((lastCandle.high - level) / level) < threshold
    )) {
      return { vote: 'BULLISH', weight };
    }
    
    // If breaking support
    if (lastCandle.low < prevCandle.low && supportLevels.some((level: number) => 
      Math.abs((lastCandle.low - level) / level) < threshold
    )) {
      return { vote: 'BEARISH', weight };
    }
  }
  
  return { vote: null, weight: 0 };
}

export function detectMarketStructure(candles: Candle[], timeframe: string = '1m'): MarketStructureResult {
  // Verificar si hay memoria reciente
  const memory = getMarketStructureMemory();
  const latestEntry = memory[memory.length - 1];
  
  // Si hay memoria reciente y el timeframe es el mismo, usarla
  if (latestEntry && latestEntry.timeframe === timeframe && 
      Date.now() - latestEntry.timestamp < 60000) { // 1 minuto
    return {
      supportLevels: latestEntry.supportLevels,
      resistanceLevels: latestEntry.resistanceLevels,
      currentTrend: latestEntry.currentTrend,
      vote: latestEntry.vote,
      voteWeight: latestEntry.voteWeight
    };
  }

  // Ajustar parámetros según el timeframe
  const timeframes: Record<string, { lookback: number; levels: number; threshold: number }> = {
    '1m': { lookback: 10, levels: 3, threshold: 0.005 },
    '5m': { lookback: 15, levels: 3, threshold: 0.007 },
    '15m': { lookback: 20, levels: 2, threshold: 0.01 },
    '30m': { lookback: 25, levels: 2, threshold: 0.015 },
    '1h': { lookback: 30, levels: 2, threshold: 0.02 },
    '4h': { lookback: 40, levels: 2, threshold: 0.03 },
    '1d': { lookback: 50, levels: 1, threshold: 0.05 }
  };

  const params = timeframes[timeframe] || timeframes['1m'];
  const { lookback, levels, threshold } = params;

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // Encontrar máximos y mínimos locales con parámetros ajustados
  const localMaxima = findLocalExtremes(highs, true, lookback);
  const localMinima = findLocalExtremes(lows, false, lookback);
  
  // Calcular niveles de soporte y resistencia con número ajustado de niveles
  const supportLevels = getLevels(localMinima, levels);
  const resistanceLevels = getLevels(localMaxima, levels);
  
  // Determinar la tendencia actual con umbral ajustado
  const currentTrend = determineTrend(candles, supportLevels, resistanceLevels, threshold);
  
  // Generar voto basado en la estructura
  const { vote, weight } = generateVote(currentTrend, candles, supportLevels, resistanceLevels, threshold);
  
  // Guardar en memoria
  saveMarketStructureMemory({
    timestamp: Date.now(),
    timeframe,
    vote,
    voteWeight: weight,
    supportLevels,
    resistanceLevels,
    currentTrend
  });

  return {
    supportLevels,
    resistanceLevels,
    currentTrend,
    vote,
    voteWeight: weight
  };
}
