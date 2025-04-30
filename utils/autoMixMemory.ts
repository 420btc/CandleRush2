// Utils para memoria AutoMix robusta
// Guarda y consulta el historial de resultados de apuestas automáticas

export type AutoMixMemoryEntry = {
  timestamp: number;
  direction: "BULLISH" | "BEARISH";
  result: "WIN" | "LOSS" | "LIQ" | null;
  majoritySignal: "BULLISH" | "BEARISH" | null;
  rsiSignal: "BULLISH" | "BEARISH" | null;
  macdSignal: "BULLISH" | "BEARISH" | null;
  rsi: number;
  macd: number;
  macdSignalLine: number;
};

const STORAGE_KEY = "autoMixMemory";
const MAX_ENTRIES = 500;

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
