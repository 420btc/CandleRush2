// AutoMix Service Worker
console.log('[AutoMix Worker] Service Worker iniciando...');

try {
  console.log('[AutoMix Worker] Importando macd-decision.js...');
  importScripts('/utils/macd-decision.js');
  console.log('[AutoMix Worker] macd-decision.js importado correctamente');
  
  console.log('[AutoMix Worker] Importando autoMixMemory.js...');
  importScripts('/utils/autoMixMemory.js');
  console.log('[AutoMix Worker] autoMixMemory.js importado correctamente');
} catch (error) {
  console.error('[AutoMix Worker] Error importando scripts:', error);
}

const CACHE_NAME = 'automix-cache-v1';
const AUTO_MIX_INTERVAL = 60000; // 1 minuto

// Websocket connection
let ws = null;
let lastCandles = [];
let isAutoMixActive = false;
let lastProcessedCandleTimestamp = 0;

// Initialize WebSocket connection
function initWebSocket() {
  console.log('[AutoMix Worker] initWebSocket llamado');
  if (ws) {
    console.log('[AutoMix Worker] WebSocket ya existe, no creando nuevo');
    return;
  }
  
  console.log('[AutoMix Worker] Creando nueva conexión WebSocket...');
  ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');
  
  ws.onopen = () => {
    console.log('[AutoMix Worker] WebSocket conectado exitosamente');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.k) {
        const candle = {
          timestamp: data.k.t,
          open: parseFloat(data.k.o),
          high: parseFloat(data.k.h),
          low: parseFloat(data.k.l),
          close: parseFloat(data.k.c),
          volume: parseFloat(data.k.v),
          isFinal: data.k.x
        };
        
        console.log('[AutoMix Worker] Vela recibida:', { timestamp: candle.timestamp, close: candle.close, isFinal: candle.isFinal });
        
        lastCandles.push(candle);
        // Keep only last 100 candles
        if (lastCandles.length > 100) {
          lastCandles.shift();
        }
        
        console.log('[AutoMix Worker] Total velas almacenadas:', lastCandles.length);
        
        // If candle is final and AutoMix is active, make decision
        if (candle.isFinal && isAutoMixActive) {
          console.log('[AutoMix Worker] Vela final detectada, AutoMix activo:', { timestamp: candle.timestamp, lastProcessed: lastProcessedCandleTimestamp });
          // Add this check to ensure only one decision per final candle
          if (candle.timestamp !== lastProcessedCandleTimestamp) {
            console.log('[AutoMix Worker] Nueva vela final, procesando decisión...');
            lastProcessedCandleTimestamp = candle.timestamp;
            makeAutoMixDecision();
          } else {
            console.log('[AutoMix Worker] Vela ya procesada, saltando...');
          }
        } else {
          if (!candle.isFinal) {
            console.log('[AutoMix Worker] Vela no es final, saltando decisión');
          }
          if (!isAutoMixActive) {
            console.log('[AutoMix Worker] AutoMix no activo, saltando decisión');
          }
        }
      }
    } catch (error) {
      console.error('[AutoMix Worker] Error processing WebSocket message:', error);
    }
  };
  
  ws.onclose = () => {
    console.log('[AutoMix Worker] WebSocket disconnected, attempting to reconnect...');
    ws = null;
    setTimeout(initWebSocket, 5000);
  };
  
  ws.onerror = (error) => {
    console.error('[AutoMix Worker] WebSocket error:', error);
  };
}

// Make AutoMix decision
async function makeAutoMixDecision() {
  console.log('[AutoMix Worker] Iniciando decisión AutoMix...');
  
  if (lastCandles.length < 66) {
    console.log('[AutoMix Worker] No hay suficientes velas, usando decisión aleatoria');
    const direction = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
    
    // Send decision to main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'AUTO_MIX_DECISION',
          decision: {
            direction,
            timestamp: Date.now(),
            reason: 'random'
          }
        });
      });
    });
    return;
  }

  try {
    // Get configuration and memory
    const config = await getAutoMixConfig();
    const memory = await getAutoMixMemory();
    
    console.log('[AutoMix Worker] Config:', config);
    console.log('[AutoMix Worker] Memory entries:', memory.length);

    // Make decision using MACD
    const direction = decideMixDirection(lastCandles);
    console.log('[AutoMix Worker] Decisión MACD:', direction);

    // Store decision in memory
    const newEntry = {
      timestamp: Date.now(),
      direction,
      result: null // Will be updated when bet resolves
    };
    
    const updatedMemory = [...memory, newEntry];
    await saveAutoMixMemory(updatedMemory);

    // Send decision to main thread
    self.clients.matchAll().then(clients => {
      console.log('[AutoMix Worker] Enviando decisión a', clients.length, 'clientes');
      clients.forEach(client => {
        client.postMessage({
          type: 'AUTO_MIX_DECISION',
          decision: {
            direction,
            timestamp: Date.now(),
            reason: 'macd'
          }
        });
      });
    });
    
  } catch (error) {
    console.error('[AutoMix Worker] Error en makeAutoMixDecision:', error);
  }
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[AutoMix Worker] Evento install ejecutado');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[AutoMix Worker] Cache abierto, agregando archivos...');
      return cache.addAll([
        '/automix-worker.js',
        '/utils/macd-decision.js',
        '/utils/autoMixMemory.js'
      ]);
    }).then(() => {
      console.log('[AutoMix Worker] Archivos agregados al cache correctamente');
    }).catch((error) => {
      console.error('[AutoMix Worker] Error en install:', error);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[AutoMix Worker] Evento activate ejecutado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[AutoMix Worker] Cache limpiado, tomando control de clientes');
      return self.clients.claim();
    })
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[AutoMix Worker] Recibido SKIP_WAITING, activando...');
    self.skipWaiting();
    return;
  }
  
  console.log('[AutoMix Worker] Mensaje recibido:', event.data);
  
  if (event.data.type === 'ACTIVATE_AUTO_MIX') {
    console.log('[AutoMix Worker] Activando AutoMix...');
    isAutoMixActive = true;
    initWebSocket();
  } else if (event.data.type === 'DEACTIVATE_AUTO_MIX') {
    console.log('[AutoMix Worker] Desactivando AutoMix...');
    isAutoMixActive = false;
    if (ws) {
      ws.close();
      ws = null;
    }
  }
});

// Helper functions for IndexedDB
const dbName = 'AutoMixDB';
const storeName = 'automix_store';

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
}

// Get AutoMix configuration
async function getAutoMixConfig() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get('config');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Get AutoMix memory
async function getAutoMixMemory() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get('memory');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

// Save AutoMix memory
async function saveAutoMixMemory(memory) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(memory, 'memory');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}