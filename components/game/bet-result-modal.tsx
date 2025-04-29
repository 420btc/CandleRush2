"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface BetResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    bet: Bet;
    candle: {
      open: number;
      close: number;
      high: number;
      low: number;
    };
  } | null;
}

import type { Bet } from "@/types/game";

import React, { useRef, useEffect } from "react";

export default function BetResultModal({ open, onOpenChange, result }: BetResultModalProps) {
  const liquidatedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [played, setPlayed] = React.useState(false);
  useEffect(() => {
    // Reset played when modal closes or result cambia
    if (!open || !result || !(result.bet.status === 'LIQUIDATED' || result.bet.wasLiquidated)) {
      setPlayed(false);
      if (liquidatedAudioRef.current) {
        liquidatedAudioRef.current.pause();
        liquidatedAudioRef.current.currentTime = 0;
      }
      return;
    }
    if (!played) {
      setPlayed(true);
      if (liquidatedAudioRef.current) {
        liquidatedAudioRef.current.currentTime = 0;
        liquidatedAudioRef.current.play();
      }
    }
  }, [open, result, played]);

  if (!result) return null;
  const { bet, candle } = result;
  const openPrice = bet.entryPrice ?? candle.open;
  const closePrice = candle.close;
  const diff = closePrice - openPrice;
  const wasLiquidated = bet.status === 'LIQUIDATED' || bet.wasLiquidated;
  const won = bet.status === 'WON';
  return (
    <>
      <audio ref={liquidatedAudioRef} src="/liquidated.mp3" preload="auto" style={{ display: 'none' }} />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center max-w-lg p-8 rounded-2xl border-4 shadow-2xl border-yellow-400 bg-black">
        <DialogHeader>
          <DialogTitle className="text-3xl font-extrabold mb-1 flex items-center justify-center gap-2"
            style={{letterSpacing:'-1px'}}>
            {wasLiquidated ? (
              <>
                <ArrowDownCircle className="inline h-8 w-8 text-yellow-400 mr-1" />
                LIQUIDADO
              </>
            ) : won ? (
              <>
                <ArrowUpCircle className="inline h-8 w-8 text-green-400 mr-1" />
                ¡Ganaste!
              </>
            ) : (
              <>
                <ArrowDownCircle className="inline h-8 w-8 text-red-400 mr-1" />
                Perdiste
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="rounded-xl p-4 border text-lg font-bold border-yellow-400 bg-black"
            style={{color: '#FFD600'}}>{wasLiquidated ? (
              <>
                Ganancia: <span className="font-mono text-2xl ml-2 text-yellow-400">0 $</span>
                {bet.liquidationFee && bet.liquidationFee > 0 && (
                  <div className="mt-2 text-lg font-bold text-red-500 bg-yellow-900/70 rounded-lg px-3 py-2 border border-yellow-400 animate-pulse">
                    Penalización por liquidación: <span className="text-yellow-300">-{bet.liquidationFee.toFixed(2)} $</span>
                  </div>
                )}
              </>
            ) : (
              <>
                Ganancia: <span className={`font-mono text-2xl ml-2 ${won ? 'text-green-400' : 'text-red-400'}`}>{(bet.winnings ?? 0) > 0 ? `+${(bet.winnings ?? 0).toFixed(2)}` : (bet.winnings ?? 0).toFixed(2)} $</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 justify-center text-xl font-bold mt-2">
            {bet.prediction === "BULLISH" ? <ArrowUpCircle className="h-7 w-7 text-green-400" /> : <ArrowDownCircle className="h-7 w-7 text-red-400" />}
            <span className={bet.prediction === "BULLISH" ? "text-green-300" : "text-red-300"}>{bet.prediction === "BULLISH" ? "Alcista" : "Bajista"}</span>
            <span className="text-yellow-400 ml-2">{bet.symbol} <span className="text-white">({bet.timeframe})</span></span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-6 text-base">
            <div className="rounded-xl p-4 min-w-[90px] border-2 border-yellow-400 bg-black flex flex-col items-center">
              <div className="text-yellow-400 mb-1">Apertura</div>
              <div className="font-mono text-xl text-white break-words">{openPrice.toFixed(2)}</div>
            </div>
            <div className="rounded-xl p-4 min-w-[90px] border-2 border-yellow-400 bg-black flex flex-col items-center">
              <div className="text-yellow-400 mb-1">Cierre</div>
              <div className="font-mono text-xl text-white break-words">{closePrice.toFixed(2)}</div>
            </div>
            <div className="rounded-xl p-4 min-w-[90px] border-2 border-yellow-400 bg-black flex flex-col items-center">
              <div className="text-yellow-400 mb-1">Diferencia</div>
              <div className={`font-mono text-xl break-words ${diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-white"}`}>{diff > 0 ? "+" : ""}${diff.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
