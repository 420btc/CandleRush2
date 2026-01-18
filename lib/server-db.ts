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

export function getDB(): ServerDB {
  if (memoryCache) return memoryCache; // Retornar caché si existe
  
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

export function saveDB(data: ServerDB) {
  memoryCache = data; // Actualizar caché
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving DB:", error);
  }
}

// Helpers específicos
export function getUser(username: string): UserData | null {
  const db = getDB();
  return db.users[username] || null;
}

export function updateUser(username: string, updates: Partial<UserData>) {
  const db = getDB();
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
  saveDB(db);
}

export function saveAutoMixMemoryEntry(entry: AutoMixMemoryEntry) {
  const db = getDB();
  db.autoMixMemory.push(entry);
  // Limitar a 666 entradas
  if (db.autoMixMemory.length > 666) {
    db.autoMixMemory = db.autoMixMemory.slice(-666);
  }
  saveDB(db);
}

export function getAutoMixMemory(): AutoMixMemoryEntry[] {
  return getDB().autoMixMemory;
}
