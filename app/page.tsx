import { Suspense } from "react"
import GameScreen from "@/components/game/game-screen"
import { GameProvider } from "@/context/game-context"
import { AuthProvider } from "@/context/auth-context"
import { AchievementProvider } from "@/context/achievement-context"
import { DeviceModeProvider } from "@/context/device-mode-context"
import Loading from "@/components/ui/loading"

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/menu");
  }, [router]);
  return null;
}
