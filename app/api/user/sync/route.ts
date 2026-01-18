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
    await updateUser(username, {
      balance,
      autoMixEnabled,
      autoMixTimeframe,
      autoMixSymbol
    });

    const updatedUser = await getUser(username);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('[API Sync] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
