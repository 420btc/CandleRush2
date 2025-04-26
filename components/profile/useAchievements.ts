import { useCallback, useEffect, useState } from "react";

export type AchievementId =
  | "first_trade"
  | "ten_trades"
  | "bull_master"
  | "bear_master"
  | "lucky_strike"
  | "high_roller"
  | "early_bird"
  | "night_owl"
  | "comeback_king"
  | "socializer";

export interface Achievement {
  id: AchievementId;
  unlocked: boolean;
  unlockedAt?: string;
}

const ALL_ACHIEVEMENTS: AchievementId[] = [
  "first_trade",
  "ten_trades",
  "bull_master",
  "bear_master",
  "lucky_strike",
  "high_roller",
  "early_bird",
  "night_owl",
  "comeback_king",
  "socializer",
];

const STORAGE_KEY = "user_achievements";

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
    return ALL_ACHIEVEMENTS.map((id) => ({ id, unlocked: false }));
  });

  // Save to localStorage when achievements change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
    }
  }, [achievements]);

  // Unlock function (safe, idempotente)
  const unlock = useCallback((id: AchievementId) => {
    setAchievements((prev) => {
      if (prev.find((a) => a.id === id && a.unlocked)) return prev;
      return prev.map((a) =>
        a.id === id ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a
      );
    });
  }, []);

  // Reset (for debug)
  const resetAchievements = useCallback(() => {
    setAchievements(ALL_ACHIEVEMENTS.map((id) => ({ id, unlocked: false })));
  }, []);

  return { achievements, unlock, resetAchievements };
};
