import fs from 'fs';
import path from 'path';
import os from 'os';
import { AutoMixMemoryEntry, OrderBlockMemoryEntry, MarketStructureMemoryEntry } from '@/utils/autoMixMemory';

// En producción (Vercel), solo /tmp es escribible.
// NOTA: /tmp es efímero. Para persistencia real se necesita una base de datos externa (Redis, Mongo, Postgres).
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? path.join(os.tmpdir(), 'candlerush_db.json')
  : path.join(process.cwd(), 'server', 'db.json');

// Cache en memoria para intentar mitigar la pérdida de datos en /tmp si la instancia se reutiliza
let memoryCache: ServerDB | null = null;

export interface UserData {
  username: string;
  balance: number;
  autoMixEnabled: boolean;
  autoMixTimeframe: string; // "1m", "3m", "5m"
  autoMixSymbol: string;
  lastActive: number;
}

export interface ServerDB {
  users: Record<string, UserData>;
  autoMixMemory: AutoMixMemoryEntry[];
  orderBlocks: OrderBlockMemoryEntry[];
  marketStructure: MarketStructureMemoryEntry[];
}

// --- Vercel KV (Upstash Redis) Helper ---
async function kvGet<T>(key: string): Promise<T | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const res = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
    });
    const data = await res.json();
    // Redis devuelve el string JSON en result, hay que parsearlo
    return data.result ? JSON.parse(data.result) : null;
  } catch (e) {
    console.error("KV Get Error:", e);
    return null;
  }
}

async function kvSet(key: string, value: any) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
  try {
    await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
      body: JSON.stringify(value)
    });
  } catch (e) {
    console.error("KV Set Error:", e);
  }
}

// Inicializar DB
function initDB() {
  // Asegurar directorio local si no es producción
  if (process.env.NODE_ENV !== 'production') {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialDB: ServerDB = {
      users: {},
      autoMixMemory: [],
      orderBlocks: [],
      marketStructure: []
    };
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
      memoryCache = initialDB;
    } catch (e) {
      console.error("Error writing init DB:", e);
      // Fallback a memoria si falla escritura
      memoryCache = initialDB;
    }
  }
}

// Convertir a ASYNC para soportar KV
export async function getDB(): Promise<ServerDB> {
  // 1. Intentar KV primero (Persistencia Real)
  const kvData = await kvGet<ServerDB>('server_db');
  if (kvData) {
    memoryCache = kvData;
    return kvData;
  }

  // 2. Fallback a Sistema de Archivos / Memoria
  if (memoryCache) return memoryCache; 
  
  initDB();
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      memoryCache = JSON.parse(data);
      return memoryCache!;
    }
  } catch (error) {
    console.error("Error reading DB:", error);
  }
  
  // Fallback seguro
  return { users: {}, autoMixMemory: [], orderBlocks: [], marketStructure: [] };
}

export async function saveDB(data: ServerDB) {
  memoryCache = data; // Actualizar caché
  
  // 1. Guardar en KV (Persistencia Real)
  await kvSet('server_db', data);

  // 2. Guardar en Archivo (Local / Tmp)
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving DB:", error);
  }
}

// Helpers específicos (Ahora ASYNC)
export async function getUser(username: string): Promise<UserData | null> {
  const db = await getDB();
  return db.users[username] || null;
}

export async function updateUser(username: string, updates: Partial<UserData>) {
  const db = await getDB();
  if (!db.users[username]) {
    db.users[username] = {
      username,
      balance: 100,
      autoMixEnabled: false,
      autoMixTimeframe: '1m',
      autoMixSymbol: 'BTCUSDT',
      lastActive: Date.now()
    };
  }
  db.users[username] = { ...db.users[username], ...updates, lastActive: Date.now() };
  await saveDB(db);
}

export async function saveAutoMixMemoryEntry(entry: AutoMixMemoryEntry) {
  const db = await getDB();
  db.autoMixMemory.push(entry);
  // Limitar a 666 entradas
  if (db.autoMixMemory.length > 666) {
    db.autoMixMemory = db.autoMixMemory.slice(-666);
  }
  await saveDB(db);
}

export async function getAutoMixMemoryFn(): Promise<AutoMixMemoryEntry[]> {
  const db = await getDB();
  return db.autoMixMemory;
}
