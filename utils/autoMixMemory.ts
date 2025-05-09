// Utils para memoria AutoMix robusta
// Guarda y consulta el historial de resultados de apuestas automáticas

export type OrderBlockType = 'BULLISH' | 'BEARISH';

export interface OrderBlockMemoryEntry {
  timestamp: number; // ms
  price: number;
  index: number; // índice de la vela
  type: OrderBlockType;
}

const ORDER_BLOCK_MEMORY_KEY = 'orderBlockMemory';
const ORDER_BLOCK_MEMORY_MAX_ENTRIES = 6; // 3 bullish + 3 bearish máx

export function saveOrderBlockMemory(entry: OrderBlockMemoryEntry) {
  try {
    const raw = localStorage.getItem(ORDER_BLOCK_MEMORY_KEY);
    let arr: OrderBlockMemoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    // Mantener solo los 3 más recientes de cada tipo
    const bullish = arr.filter(e => e.type === 'BULLISH').slice(-3);
    const bearish = arr.filter(e => e.type === 'BEARISH').slice(-3);
    arr = [...bullish, ...bearish];
    localStorage.setItem(ORDER_BLOCK_MEMORY_KEY, JSON.stringify(arr));
  } catch {}
}

export function getOrderBlockMemory(): OrderBlockMemoryEntry[] {
  try {
    const raw = localStorage.getItem(ORDER_BLOCK_MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export type AutoMixMemoryEntry = {
  betId: string;
  timestamp: number;
  direction: "BULLISH" | "BEARISH";
  result: "WIN" | "LOSS" | "LIQ" | null;
  majoritySignal: "BULLISH" | "BEARISH" | null;
  rsiSignal: "BULLISH" | "BEARISH" | null;
  macdSignal: "BULLISH" | "BEARISH" | null;
  valleyVote: "BULLISH" | "BEARISH" | null;
  rsi: number;
  macd: number;
  macdSignalLine: number;
  volumeVote: "BULLISH" | "BEARISH" | null;
  whaleVote?: "BULLISH" | "BEARISH" | null;
  adxMemoryVote?: "BULLISH" | "BEARISH" | null;
  crossSignal?: "GOLDEN_CROSS" | "DEATH_CROSS" | null;
  emaPositionVote?: "BULLISH" | "BEARISH" | null;
  wasRandom?: boolean; // true si la apuesta fue aleatoria
  consecutiveBets: number; // Número de apuestas consecutivas con esta estrategia
  // --- Extensiones para desglose de votos y contexto ---
  bullishVotes?: number;
  bearishVotes?: number;
  totalVotes?: number;
  directionAntesDeInvertir?: "BULLISH" | "BEARISH";
  timeframe?: string;
  votesSnapshot?: {
    majoritySignal?: "BULLISH" | "BEARISH" | null;
    rsiSignal?: "BULLISH" | "BEARISH" | null;
    macdSignal?: "BULLISH" | "BEARISH" | null;
    valleyVote?: "BULLISH" | "BEARISH" | null;
    volumeVote?: "BULLISH" | "BEARISH" | null;
    whaleVote?: "BULLISH" | "BEARISH" | null;
    adxMemoryVote?: "BULLISH" | "BEARISH" | null;
    crossSignal?: "GOLDEN_CROSS" | "DEATH_CROSS" | null;
    emaPositionVote?: "BULLISH" | "BEARISH" | null;
    orderBlockVotes?: { bullish: boolean; bearish: boolean };
    trendVote?: "BULLISH" | "BEARISH" | null;
    fibonacciVote?: {
      vote: "BULLISH" | "BEARISH" | null;
      level: string | null;
      price: number;
      levels: Record<string, number>;
    } | null;
    avgVol1?: number | null;
    avgVol2?: number | null;
    rsiValue?: number;
    macdValue?: number;
    macdSignalLineValue?: number;
    timeframe?: string;
  };

};

// --- Memoria para tendencia y conteo de velas (máx 666) ---
export type TrendMemoryEntry = {
  timestamp: number;
  bullishCount: number;
  bearishCount: number;
  trend: "BULLISH" | "BEARISH" | null;
};

const TREND_STORAGE_KEY = "trendMemory";
const TREND_MAX_ENTRIES = 666;

export function saveTrendMemory(entry: TrendMemoryEntry) {
  try {
    const raw = localStorage.getItem(TREND_STORAGE_KEY);
    let arr: TrendMemoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > TREND_MAX_ENTRIES) arr = arr.slice(-TREND_MAX_ENTRIES);
    localStorage.setItem(TREND_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // Falla silenciosa
  }
}

export function getTrendMemory(): TrendMemoryEntry[] {
  try {
    const raw = localStorage.getItem(TREND_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// --- Memoria para Fibonacci (máx 666) ---
export type FibonacciMemoryEntry = {
  timestamp: number;
  fibVote: "BULLISH" | "BEARISH" | null;
  level: string | null;
  price: number;
  levels: Record<string, number>;
};

const FIBONACCI_MEMORY_STORAGE_KEY = "fibonacciMemory";
const FIBONACCI_MEMORY_MAX_ENTRIES = 666;

export function saveFibonacciMemory(entry: FibonacciMemoryEntry) {
  try {
    const raw = localStorage.getItem(FIBONACCI_MEMORY_STORAGE_KEY);
    let arr: FibonacciMemoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > FIBONACCI_MEMORY_MAX_ENTRIES) arr = arr.slice(-FIBONACCI_MEMORY_MAX_ENTRIES);
    localStorage.setItem(FIBONACCI_MEMORY_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // Falla silenciosa
  }
}

export function getFibonacciMemory(): FibonacciMemoryEntry[] {
  try {
    const raw = localStorage.getItem(FIBONACCI_MEMORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// --- Memoria para RSI (máx 666) ---
export type RsiMemoryEntry = {
  timestamp: number;
  rsi: number;
  rsiSignal: "BULLISH" | "BEARISH" | null;
};

// --- Memoria para Estructura de Mercado (máx 666) ---
export type MarketStructureMemoryEntry = {
  timestamp: number;
  timeframe: string;
  vote: 'BULLISH' | 'BEARISH' | null;
  supportLevels: number[];
  resistanceLevels: number[];
  currentTrend: 'UP' | 'DOWN' | 'SIDEWAYS';
  voteWeight: number;
};

const MARKET_STRUCTURE_MEMORY_STORAGE_KEY = "marketStructureMemory";
const MARKET_STRUCTURE_MEMORY_MAX_ENTRIES = 666;

export function saveMarketStructureMemory(entry: MarketStructureMemoryEntry) {
  try {
    const raw = localStorage.getItem(MARKET_STRUCTURE_MEMORY_STORAGE_KEY);
    let arr: MarketStructureMemoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > MARKET_STRUCTURE_MEMORY_MAX_ENTRIES) arr = arr.slice(-MARKET_STRUCTURE_MEMORY_MAX_ENTRIES);
    localStorage.setItem(MARKET_STRUCTURE_MEMORY_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // Falla silenciosa
  }
}

export function getMarketStructureMemory(): MarketStructureMemoryEntry[] {
  try {
    const raw = localStorage.getItem(MARKET_STRUCTURE_MEMORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const RSI_MEMORY_STORAGE_KEY = "rsiMemory";
const RSI_MEMORY_MAX_ENTRIES = 666;

export function saveRsiMemory(entry: RsiMemoryEntry) {
  try {
    const raw = localStorage.getItem(RSI_MEMORY_STORAGE_KEY);
    let arr: RsiMemoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > RSI_MEMORY_MAX_ENTRIES) arr = arr.slice(-RSI_MEMORY_MAX_ENTRIES);
    localStorage.setItem(RSI_MEMORY_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // Falla silenciosa
  }
}

export function getRsiMemory(): RsiMemoryEntry[] {
  try {
    const raw = localStorage.getItem(RSI_MEMORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// --- Memoria para tendencia de volumen (máx 666) ---
export type VolumeTrendMemoryEntry = {
  timestamp: number;
  avgVol1: number;
  avgVol2: number;
  volumeTrend: "UP" | "DOWN";
  majority: "BULLISH" | "BEARISH";
  vote: "BULLISH" | "BEARISH";
};

const VOLUME_TREND_STORAGE_KEY = "volumeTrendMemory";
const VOLUME_TREND_MAX_ENTRIES = 666;

// --- Memoria para voto de valle (máx 666) ---
export type ValleyMemoryEntry = {
  timestamp: number;
  valleyVote: "BULLISH" | "BEARISH" | null;
};

const VALLEY_MEMORY_STORAGE_KEY = "valleyMemory";
const VALLEY_MEMORY_MAX_ENTRIES = 666;

export function saveValleyMemory(entry: ValleyMemoryEntry) {
  try {
    const raw = localStorage.getItem(VALLEY_MEMORY_STORAGE_KEY);
    let arr: ValleyMemoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > VALLEY_MEMORY_MAX_ENTRIES) arr = arr.slice(-VALLEY_MEMORY_MAX_ENTRIES);
    localStorage.setItem(VALLEY_MEMORY_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // Falla silenciosa
  }
}

export function getValleyMemory(): ValleyMemoryEntry[] {
  try {
    const raw = localStorage.getItem(VALLEY_MEMORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVolumeTrendMemory(entry: VolumeTrendMemoryEntry) {
  try {
    const raw = localStorage.getItem(VOLUME_TREND_STORAGE_KEY);
    let arr: VolumeTrendMemoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > VOLUME_TREND_MAX_ENTRIES) arr = arr.slice(-VOLUME_TREND_MAX_ENTRIES);
    localStorage.setItem(VOLUME_TREND_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // Falla silenciosa
  }
}

export function getVolumeTrendMemory(): VolumeTrendMemoryEntry[] {
  try {
    const raw = localStorage.getItem(VOLUME_TREND_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}


const STORAGE_KEY = "autoMixMemory";
const MAX_ENTRIES = 666;

export function saveAutoMixMemory(entry: AutoMixMemoryEntry) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let arr: AutoMixMemoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > MAX_ENTRIES) arr = arr.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // Falla silenciosa
  }
}



export function clearAutoMixMemory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getAutoMixMemory(): AutoMixMemoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Ejemplo de función para analizar patrones perdedores (puedes expandirla)
export function shouldInvertDecision(majority: string|null, rsi: string|null, macd: string|null): boolean {
  const mem = getAutoMixMemory();
  // Busca los últimos 20 casos con la misma combinación de señales
  const recent = mem.filter(e => e.majoritySignal === majority && e.rsiSignal === rsi && e.macdSignal === macd).slice(-20);
  if (recent.length < 10) return false;
  // Si la tasa de derrota es >70%, sugerir invertir
  const losses = recent.filter(e => e.result === "LOSS" || e.result === "LIQ").length;
  return losses / recent.length > 0.7;
}
