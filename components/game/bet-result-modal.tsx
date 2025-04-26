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

export default function BetResultModal({ open, onOpenChange, result }: BetResultModalProps) {
  if (!result) return null;
  const { bet, candle } = result;
  const wasLiquidated = bet.status === 'LIQUIDATED' || bet.wasLiquidated;
  const won = bet.status === 'WON';
  return (
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
              </>
            ) : (
              <>
                Ganancia: <span className={`font-mono text-2xl ml-2 ${won ? 'text-green-400' : 'text-red-400'}`}>{bet.winnings > 0 ? `+${bet.winnings.toFixed(2)}` : bet.winnings.toFixed(2)} $</span>
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
              <div className="font-mono text-xl text-white break-words">{(bet.entryPrice ?? candle.open).toFixed(2)}</div>
            </div>
            <div className="rounded-xl p-4 min-w-[90px] border-2 border-yellow-400 bg-black flex flex-col items-center">
              <div className="text-yellow-400 mb-1">Cierre</div>
              <div className="font-mono text-xl text-white break-words">{candle.close.toFixed(2)}</div>
            </div>
            <div className="rounded-xl p-4 min-w-[90px] border-2 border-yellow-400 bg-black flex flex-col items-center">
              <div className="text-yellow-400 mb-1">Diferencia</div>
              <div className={`font-mono text-xl break-words ${candle.close - candle.open > 0 ? "text-green-400" : candle.close - candle.open < 0 ? "text-red-400" : "text-white"}`}>{candle.close - candle.open > 0 ? "+" : ""}${(candle.close - candle.open).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
