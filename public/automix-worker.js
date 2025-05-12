// AutoMix Service Worker
importScripts('/utils/macd-decision.js');
importScripts('/utils/autoMixMemory.js');

const CACHE_NAME = 'automix-cache-v1';
const AUTO_MIX_INTERVAL = 60000; // 1 minuto

// Websocket connection
let ws = null;
let lastCandles = [];
let isAutoMixActive = false;

// Initialize WebSocket connection
function initWebSocket() {
  if (ws) return;
  
  ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');
  
  ws.onopen = () => {
    console.log('[AutoMix Worker] WebSocket connected');
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
        
        lastCandles.push(candle);
        // Keep only last 100 candles
        if (lastCandles.length > 100) {
          lastCandles.shift();
        }
        
        // If candle is final and AutoMix is active, make decision
        if (candle.isFinal && isAutoMixActive) {
          makeAutoMixDecision();
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
  try {
    // Get stored configuration
    const config = await getAutoMixConfig();
    if (!config || !config.isActive) return;
    
    // Get stored memory
    const memory = await getAutoMixMemory();
    
    // Make decision based on candles
    const direction = decideMixDirection(lastCandles);
    
    // Store decision in memory
    const decision = {
      timestamp: Date.now(),
      direction,
      candles: lastCandles.slice(-10), // Store last 10 candles for reference
    };
    
    memory.push(decision);
    
    // Keep only last 1000 decisions
    if (memory.length > 1000) {
      memory.shift();
    }
    
    // Store updated memory
    await saveAutoMixMemory(memory);
    
    // Notify main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'AUTO_MIX_DECISION',
          decision
        });
      });
    });
    
  } catch (error) {
    console.error('[AutoMix Worker] Error making decision:', error);
  }
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/automix-worker.js',
        '/utils/macd-decision.js',
        '/utils/autoMixMemory.js'
      ]);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Message event
self.addEventListener('message', (event) => {
  if (event.data.type === 'ACTIVATE_AUTO_MIX') {
    isAutoMixActive = true;
    initWebSocket();
  } else if (event.data.type === 'DEACTIVATE_AUTO_MIX') {
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