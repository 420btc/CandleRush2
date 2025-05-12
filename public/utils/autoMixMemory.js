// Funciones para manejar la memoria de AutoMix en el Service Worker

// Obtener memoria de AutoMix
function getAutoMixMemory() {
  try {
    const stored = localStorage.getItem('autoMixMemory');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

// Guardar memoria de AutoMix
function saveAutoMixMemory(entry) {
  try {
    const memory = getAutoMixMemory();
    memory.push(entry);
    // Mantener solo las últimas 1000 entradas
    if (memory.length > 1000) {
      memory.shift();
    }
    localStorage.setItem('autoMixMemory', JSON.stringify(memory));
  } catch (error) {
    console.error('[AutoMix Memory] Error saving memory:', error);
  }
}

// Analizar patrones perdedores
function shouldInvertDecision(majority, rsi, macd) {
  try {
    const memory = getAutoMixMemory();
    // Buscar los últimos 20 casos con la misma combinación de señales
    const recent = memory
      .filter(e => e.majoritySignal === majority && e.rsiSignal === rsi && e.macdSignal === macd)
      .slice(-20);
    
    if (recent.length < 10) return false;
    
    // Si la tasa de derrota es >70%, sugerir invertir
    const losses = recent.filter(e => e.result === "LOSS" || e.result === "LIQ").length;
    return losses / recent.length > 0.7;
  } catch {
    return false;
  }
}

// Exportar funciones
self.getAutoMixMemory = getAutoMixMemory;
self.saveAutoMixMemory = saveAutoMixMemory;
self.shouldInvertDecision = shouldInvertDecision; 