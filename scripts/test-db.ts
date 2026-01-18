// Script de prueba para conexión con Neon DB
// Ejecutar con: npx tsx scripts/test-db.ts

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDB, saveDB, updateUser, getUser, saveAutoMixMemoryEntry } from '../lib/server-db';
import { AutoMixMemoryEntry } from '../utils/autoMixMemory';

async function testNeonConnection() {
  console.log('🧪 Iniciando prueba de conexión con Neon DB...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno.');
    console.log('ℹ️ Asegúrate de tener un archivo .env.local con la variable DATABASE_URL.');
    return;
  }

  try {
    // 1. Probar lectura inicial
    console.log('📥 Intentando leer la base de datos...');
    const db = await getDB();
    console.log('✅ Lectura exitosa. Usuarios encontrados:', Object.keys(db.users).length);
    console.log('✅ Memoria global encontrada:', db.autoMixMemory.length, 'entradas');

    // 2. Probar escritura de usuario
    const testUser = 'test-user-' + Date.now();
    console.log(`📤 Intentando crear/actualizar usuario de prueba: ${testUser}...`);
    await updateUser(testUser, {
      balance: 999,
      autoMixEnabled: true,
      autoMixSymbol: 'BTCUSDT',
      autoMixTimeframe: '1m'
    });
    console.log('✅ Usuario guardado/actualizado.');

    // 3. Verificar persistencia de usuario
    console.log('🔍 Verificando usuario guardado...');
    const user = await getUser(testUser);
    if (user && user.balance === 999) {
      console.log('✅ Usuario verificado correctamente:', user);
    } else {
      console.error('❌ Error: El usuario no se guardó correctamente o los datos no coinciden.', user);
    }

    // 4. Probar escritura de memoria global
    console.log('🧠 Intentando guardar entrada de memoria AutoMix...');
    const memoryEntry: AutoMixMemoryEntry = {
      betId: `test-bet-${Date.now()}`,
      timestamp: Date.now(),
      direction: 'BULLISH',
      result: 'WIN',
      majoritySignal: 'BULLISH',
      rsiSignal: 'BULLISH',
      macdSignal: 'BULLISH',
      rsi: 60,
      macd: 100,
      macdSignalLine: 90,
      volumeVote: 'BULLISH',
      valleyVote: 'BULLISH',
      consecutiveBets: 1
    };
    await saveAutoMixMemoryEntry(memoryEntry);
    console.log('✅ Entrada de memoria guardada.');

    // 5. Verificar persistencia de memoria
    console.log('🔍 Verificando memoria global...');
    const updatedDB = await getDB();
    const foundEntry = updatedDB.autoMixMemory.find(e => e.betId === memoryEntry.betId);
    
    if (foundEntry) {
      console.log('✅ Entrada de memoria verificada correctamente.');
    } else {
      console.error('❌ Error: No se encontró la entrada de memoria recién guardada.');
    }

    console.log('🎉 Prueba completa finalizada.');

  } catch (error) {
    console.error('❌ Error fatal durante la prueba:', error);
  }
}

testNeonConnection();
