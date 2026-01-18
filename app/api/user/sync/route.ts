import { NextResponse } from 'next/server';
import { updateUser, getUser } from '@/lib/server-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, balance, autoMixEnabled, autoMixTimeframe, autoMixSymbol } = body;

    console.log('[API Sync] Recibido:', { username, autoMixEnabled, autoMixTimeframe });

    if (!username) {
      return NextResponse.json({ success: false, message: 'Username required' }, { status: 400 });
    }

    // Actualizar usuario en DB
    const result = await updateUser(username, {
      balance,
      autoMixEnabled,
      autoMixTimeframe,
      autoMixSymbol
    });

    console.log(`[API Sync] Update User Result:`, result);

    // Si viene memoria en el payload, guardarla en la memoria global
    if (body.autoMixMemory && Array.isArray(body.autoMixMemory) && body.autoMixMemory.length > 0) {
      console.log(`[API Sync] Guardando ${body.autoMixMemory.length} entradas de memoria`);
      // Guardar las últimas entradas nuevas (asumimos que las últimas son las más recientes)
      // En un sistema real, deberíamos hacer un merge inteligente o usar un Set
      const latestEntries = body.autoMixMemory.slice(-10); // Guardar solo las últimas 10 para no saturar en cada sync
      
      const { saveAutoMixMemoryEntry } = require('@/lib/server-db');
      for (const entry of latestEntries) {
        await saveAutoMixMemoryEntry(entry);
      }
    }

    const updatedUser = await getUser(username);

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      debug: {
        storage: result.storage,
        error: result.error
      }
    });
  } catch (error: any) {
    console.error('[API Sync] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
