// Utils para memoria AutoMix robusta
// Guarda y consulta el historial de resultados de apuestas automáticas

export type AutoMixMemoryEntry = {
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
  wasRandom?: boolean; // true si la apuesta fue aleatoria
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
