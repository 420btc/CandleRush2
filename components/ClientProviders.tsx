"use client";

import { DeviceModeProvider } from '../context/device-mode-context';
import { AuthProvider } from '../context/auth-context';
import { AchievementProvider } from '../context/achievement-context';
import { GameProvider } from '../context/game-context';
import { SessionProvider } from "next-auth/react";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DeviceModeProvider>
        <AuthProvider>
          <AchievementProvider>
            <GameProvider>
              {children}
            </GameProvider>
          </AchievementProvider>
        </AuthProvider>
      </DeviceModeProvider>
    </SessionProvider>
  );
}
