import fs from 'fs';
import path from 'path';
import { AutoMixMemoryEntry, OrderBlockMemoryEntry, MarketStructureMemoryEntry } from '@/utils/autoMixMemory';

const DB_PATH = path.join(process.cwd(), 'server', 'db.json');

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

// Inicializar DB si no existe
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDB: ServerDB = {
      users: {},
      autoMixMemory: [],
      orderBlocks: [],
      marketStructure: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
  }
}

export function getDB(): ServerDB {
  initDB();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading DB:", error);
    return { users: {}, autoMixMemory: [], orderBlocks: [], marketStructure: [] };
  }
}

export function saveDB(data: ServerDB) {
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
