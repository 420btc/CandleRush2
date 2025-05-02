import { Candle } from '../types';
import { saveMarketStructureMemory, getMarketStructureMemory } from './autoMixMemory';

interface MarketStructureResult {
  supportLevels: number[];
  resistanceLevels: number[];
  currentTrend: 'UP' | 'DOWN' | 'SIDEWAYS';
  vote: 'BULLISH' | 'BEARISH' | null;
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
      vote: latestEntry.vote
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
  const vote = generateVote(currentTrend, candles, supportLevels, resistanceLevels, threshold);
  
  // Guardar en memoria
  saveMarketStructureMemory({
    timestamp: Date.now(),
    timeframe,
    vote,
    supportLevels,
    resistanceLevels,
    currentTrend
  });

  return {
    supportLevels,
    resistanceLevels,
    currentTrend,
    vote
  };
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
  const lastPrice = candles[candles.length - 1].close;
  const lastLow = candles[candles.length - 1].low;
  const lastHigh = candles[candles.length - 1].high;
  
  // Verificar si el precio está cerca de algún nivel con umbral ajustado
  const nearSupport = supportLevels.some(level => 
    Math.abs((lastPrice - level) / level) < threshold
  );
  
  const nearResistance = resistanceLevels.some(level => 
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

function generateVote(trend: 'UP' | 'DOWN' | 'SIDEWAYS', candles: Candle[], supportLevels: number[], resistanceLevels: number[], threshold: number): 'BULLISH' | 'BEARISH' | null {
  const lastPrice = candles[candles.length - 1].close;
  
  // Si estamos en tendencia alcista y cerca de soporte
  if (trend === 'UP' && supportLevels.some(level => 
    Math.abs((lastPrice - level) / level) < threshold
  )) {
    return 'BULLISH';
  }
  
  // Si estamos en tendencia bajista y cerca de resistencia
  if (trend === 'DOWN' && resistanceLevels.some(level => 
    Math.abs((lastPrice - level) / level) < threshold
  )) {
    return 'BEARISH';
  }
  
  // Si estamos en tendencia lateral y rompiendo niveles
  if (trend === 'SIDEWAYS') {
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    
    // Si rompe resistencia
    if (lastCandle.high > prevCandle.high && resistanceLevels.some(level => 
      Math.abs((lastCandle.high - level) / level) < threshold
    )) {
      return 'BULLISH';
    }
    
    // Si rompe soporte
    if (lastCandle.low < prevCandle.low && supportLevels.some(level => 
      Math.abs((lastCandle.low - level) / level) < threshold
    )) {
      return 'BEARISH';
    }
  }
  
  return null;
}
