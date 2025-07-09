import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const COUNTER_FILE = path.join(process.cwd(), 'data', 'visit-counter.json');

interface VisitData {
  totalVisits: number;
  lastVisits: { [key: string]: number }; // IP -> timestamp
}

// Asegurar que el directorio data existe
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Leer datos del contador
async function readCounterData(): Promise<VisitData> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si no existe el archivo, crear datos iniciales
    return {
      totalVisits: 0,
      lastVisits: {}
    };
  }
}

// Escribir datos del contador
async function writeCounterData(data: VisitData) {
  await ensureDataDir();
  await fs.writeFile(COUNTER_FILE, JSON.stringify(data, null, 2));
}

// Obtener IP del cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// GET - Obtener contador actual
export async function GET() {
  try {
    const data = await readCounterData();
    return NextResponse.json({ 
      totalVisits: data.totalVisits,
      success: true 
    });
  } catch (error) {
    console.error('Error reading visit counter:', error);
    return NextResponse.json({ 
      totalVisits: 0,
      success: false,
      error: 'Failed to read counter' 
    }, { status: 500 });
  }
}

// POST - Incrementar contador
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const data = await readCounterData();
    
    const now = Date.now();
    const fourYears = 4 * 365 * 24 * 60 * 60 * 1000; // 4 años en milisegundos
    
    // Verificar si esta IP ya visitó en los últimos 4 años
    const lastVisit = data.lastVisits[clientIP];
    
    if (!lastVisit || (now - lastVisit) > fourYears) {
      // Nueva visita válida
      data.totalVisits += 1;
      data.lastVisits[clientIP] = now;
      
      // Limpiar visitas antiguas (más de 8 años)
      const eightYears = 8 * 365 * 24 * 60 * 60 * 1000;
      Object.keys(data.lastVisits).forEach(ip => {
        if (now - data.lastVisits[ip] > eightYears) {
          delete data.lastVisits[ip];
        }
      });
      
      await writeCounterData(data);
      
      return NextResponse.json({ 
        totalVisits: data.totalVisits,
        success: true,
        newVisit: true
      });
    } else {
      // Visita reciente, no incrementar
      return NextResponse.json({ 
        totalVisits: data.totalVisits,
        success: true,
        newVisit: false
      });
    }
  } catch (error) {
    console.error('Error updating visit counter:', error);
    return NextResponse.json({ 
      totalVisits: 0,
      success: false,
      error: 'Failed to update counter' 
    }, { status: 500 });
  }
} 