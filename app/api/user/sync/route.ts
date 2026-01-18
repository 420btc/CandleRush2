import { NextResponse } from 'next/server';
import { updateUser, getUser } from '@/lib/server-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, balance, autoMixEnabled, autoMixTimeframe, autoMixSymbol } = body;

    if (!username) {
      return NextResponse.json({ success: false, message: 'Username required' }, { status: 400 });
    }

    // Actualizar usuario en DB
    updateUser(username, {
      balance,
      autoMixEnabled,
      autoMixTimeframe,
      autoMixSymbol
    });

    const updatedUser = getUser(username);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
