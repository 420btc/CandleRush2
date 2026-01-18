import fs from 'fs';
import path from 'path';
import os from 'os';
import { Pool } from '@neondatabase/serverless';
import { AutoMixMemoryEntry, OrderBlockMemoryEntry, MarketStructureMemoryEntry } from '@/utils/autoMixMemory';

// Configuración DB Neon (Postgres)
const connectionString = process.env.DATABASE_URL;

// En producción (Vercel), solo /tmp es escribible para fallbacks locales
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? path.join(os.tmpdir(), 'candlerush_db.json')
  : path.join(process.cwd(), 'server', 'db.json');

// Cache en memoria para rendimiento y fallback
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

// --- Neon DB Helpers ---

// Crear tablas si no existen
async function initNeonDB() {
  if (!connectionString) return;
  const pool = new Pool({ connectionString });
  try {
    // Tabla Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        data JSONB
      );
    `);
    // Tabla Global Memory (AutoMix)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS global_memory (
        key TEXT PRIMARY KEY,
        data JSONB
      );
    `);
  } catch (e) {
    console.error("Neon DB Init Error:", e);
  } finally {
    await pool.end();
  }
}

// Obtener datos completos de Neon
async function neonGetDB(): Promise<ServerDB | null> {
  if (!connectionString) return null;
  const pool = new Pool({ connectionString });
  try {
    const usersRes = await pool.query('SELECT * FROM users');
    const memoryRes = await pool.query("SELECT data FROM global_memory WHERE key = 'autoMixMemory'");
    
    const users: Record<string, UserData> = {};
    usersRes.rows.forEach(row => {
      users[row.username] = row.data;
    });

    const autoMixMemory = memoryRes.rows[0]?.data || [];

    return {
      users,
      autoMixMemory,
      orderBlocks: [], // No persistido en SQL por ahora para simplificar
      marketStructure: []
    };
  } catch (e) {
    console.error("Neon DB Get Error:", e);
    return null;
  } finally {
    await pool.end();
  }
}

// Guardar datos completos en Neon
async function neonSaveDB(data: ServerDB) {
  if (!connectionString) return;
  const pool = new Pool({ connectionString });
  try {
    // Guardar usuarios (upsert)
    for (const [username, userData] of Object.entries(data.users)) {
      await pool.query(`
        INSERT INTO users (username, data)
        VALUES ($1, $2)
        ON CONFLICT (username)
        DO UPDATE SET data = $2
      `, [username, JSON.stringify(userData)]);
    }

    // Guardar memoria global
    // Asegurarse de que autoMixMemory sea un array válido
    const memoryToSave = Array.isArray(data.autoMixMemory) ? data.autoMixMemory : [];
    
    await pool.query(`
      INSERT INTO global_memory (key, data)
      VALUES ('autoMixMemory', $1)
      ON CONFLICT (key)
      DO UPDATE SET data = $1
    `, [JSON.stringify(memoryToSave)]);

  } catch (e) {
    console.error("Neon DB Save Error:", e);
  } finally {
    await pool.end();
  }
}

// Inicializar DB Local (Fallback)
function initLocalDB() {
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
      console.error("Error writing init local DB:", e);
      memoryCache = initialDB;
    }
  }
}

// --- Función Principal GetDB ---
export async function getDB(): Promise<ServerDB> {
  // 1. Intentar Neon DB (Persistencia Real)
  if (connectionString) {
    // Inicializar tablas la primera vez (lazy init)
    await initNeonDB(); 
    
    const neonData = await neonGetDB();
    if (neonData) {
      memoryCache = neonData;
      return neonData;
    }
  }

  // 2. Fallback a Sistema de Archivos / Memoria
  if (memoryCache) return memoryCache; 
  
  // Si no hay caché y falló Neon, intentar local
  initLocalDB();
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      memoryCache = JSON.parse(data);
      return memoryCache!;
    }
  } catch (error) {
    console.error("Error reading local DB:", error);
  }
  
  return { users: {}, autoMixMemory: [], orderBlocks: [], marketStructure: [] };
}

// --- Función Principal SaveDB ---
export async function saveDB(data: ServerDB): Promise<{ success: boolean; storage: 'neon' | 'local' | 'both' | 'none'; error?: string }> {
  memoryCache = data; // Actualizar caché
  let storage: 'neon' | 'local' | 'both' | 'none' = 'none';
  let errorMsg: string | undefined;

  // 1. Guardar en Neon DB
  if (connectionString) {
    try {
      await neonSaveDB(data);
      storage = 'neon';
    } catch (e: any) {
      console.error("Neon DB Save Error:", e);
      errorMsg = e.message;
    }
  }

  // 2. Guardar en Archivo Local (Backup / Dev)
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    storage = storage === 'neon' ? 'both' : 'local';
  } catch (error) {
    // Ignorar error en Vercel si no es /tmp
    if (process.env.NODE_ENV !== 'production') console.error("Error saving local DB:", error);
  }

  return { success: true, storage, error: errorMsg };
}

// Helpers específicos
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
  return await saveDB(db);
}

export async function saveAutoMixMemoryEntry(entry: AutoMixMemoryEntry) {
  const db = await getDB();
  
  // Evitar duplicados por betId
  const exists = db.autoMixMemory.some(e => e.betId === entry.betId);
  if (exists) return { success: true, skipped: true };

  db.autoMixMemory.push(entry);
  if (db.autoMixMemory.length > 666) {
    db.autoMixMemory = db.autoMixMemory.slice(-666);
  }
  return await saveDB(db);
}

export async function getAutoMixMemoryFn(): Promise<AutoMixMemoryEntry[]> {
  const db = await getDB();
  return db.autoMixMemory;
}
