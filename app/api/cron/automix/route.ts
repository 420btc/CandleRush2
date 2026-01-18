import { NextResponse } from 'next/server';
import { getDB, saveDB, saveAutoMixMemoryEntry, UserData } from '@/lib/server-db';
import { fetchHistoricalCandles } from '@/lib/binance-api';
import { decideMixDirection } from '@/utils/macd-decision';
import { AutoMixMemoryEntry } from '@/utils/autoMixMemory';

export const dynamic = 'force-dynamic'; // Evitar caché estático

export async function GET(request: Request) {
  try {
    // 1. Cargar Base de Datos
    const db = getDB();
    const users = Object.values(db.users).filter(u => u.autoMixEnabled);

    if (users.length === 0) {
      return NextResponse.json({ message: 'No active AutoMix users', timestamp: Date.now() });
    }

    // Agrupar usuarios por símbolo y timeframe para minimizar llamadas a API
    const groups: Record<string, UserData[]> = {};
    users.forEach(u => {
      const key = `${u.autoMixSymbol}-${u.autoMixTimeframe}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    });

    const results = [];

    // 2. Procesar por grupo
    for (const key in groups) {
      const groupUsers = groups[key];
      const [symbol, timeframe] = key.split('-');
      
      // Obtener velas (necesitamos suficientes para los indicadores, ~100 o más)
      const candles = await fetchHistoricalCandles(symbol, timeframe, 200);
      
      if (!candles || candles.length < 100) {
        console.error(`Insufficient candles for ${symbol} ${timeframe}`);
        continue;
      }

      // Preparar memoria inyectada desde DB
      // Nota: db.autoMixMemory es global, idealmente debería filtrarse por usuario o contexto, 
      // pero por ahora usaremos la global como contexto compartido de aprendizaje
      const injectedMemory = {
        autoMix: db.autoMixMemory,
        orderBlocks: db.orderBlocks,
        marketStructure: db.marketStructure,
        // Otros pueden estar vacíos si no se persisten en server aún
      };

      // 3. Tomar decisión
      // Nota: decideMixDirection guarda internamente en memoria (via save*), 
      // pero como estamos en server, esas llamadas fallarán silenciosamente o no persistirán.
      // Necesitamos capturar el resultado y guardarlo manualmente en db.json.
      
      const direction = decideMixDirection(candles, timeframe, undefined, injectedMemory);

      // Simular la creación de la entrada de memoria (ya que decideMixDirection lo hace internamente pero con localStorage)
      // Aquí creamos una entrada simplificada para el registro
      const memoryEntry: AutoMixMemoryEntry = {
        betId: `cron-${Date.now()}`,
        timestamp: Date.now(),
        direction,
        result: null, // Se resolverá en el futuro
        majoritySignal: null, // Simplificado, decideMixDirection no retorna todo el detalle fácilmente sin refactorizar más
        rsiSignal: null,
        macdSignal: null,
        valleyVote: null,
        rsi: 0,
        macd: 0,
        macdSignalLine: 0,
        volumeVote: null,
        consecutiveBets: 1
      };
      
      // Guardar en historial global del servidor
      db.autoMixMemory.push(memoryEntry);
      if (db.autoMixMemory.length > 666) db.autoMixMemory = db.autoMixMemory.slice(-666);

      // 4. Ejecutar apuestas para cada usuario
      for (const user of groupUsers) {
        // Lógica de apuesta simplificada:
        // Si hay dirección, crear una "apuesta pendiente"
        // En un sistema real, aquí crearíamos el registro de la apuesta en db.bets
        
        // Actualizar última actividad
        user.lastActive = Date.now();
        
        // TODO: Implementar lógica real de apuestas y actualización de balance
        // Por ahora solo logueamos que se "haría"
        results.push({
          user: user.username,
          symbol,
          timeframe,
          action: `Would bet ${direction}`,
          balance: user.balance
        });
      }
    }

    // Guardar cambios en DB
    saveDB(db);

    return NextResponse.json({ 
      success: true, 
      processedUsers: users.length, 
      results 
    });

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
