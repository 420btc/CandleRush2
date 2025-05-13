"use client";

import { DeviceModeProvider } from '../context/device-mode-context';
import { AuthProvider } from '../context/auth-context';
import { AchievementProvider } from '../context/achievement-context';
import { GameProvider } from '../context/game-context';
import { SessionProvider } from "next-auth/react";
import { PriceAlertProvider } from './price-alert-provider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DeviceModeProvider>
        <AuthProvider>
          <AchievementProvider>
            <GameProvider>
              <PriceAlertProvider>
                {children}
              </PriceAlertProvider>
            </GameProvider>
          </AchievementProvider>
        </AuthProvider>
      </DeviceModeProvider>
    </SessionProvider>
  );
}
