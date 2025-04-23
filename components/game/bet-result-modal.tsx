"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface BetResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    won: boolean;
    amount: number;
    bet: {
      prediction: "BULLISH" | "BEARISH";
      amount: number;
      timestamp: number;
      symbol: string;
      timeframe: string;
    };
    candle: {
      open: number;
      close: number;
      high: number;
      low: number;
    };
    diff: number;
  } | null;
}

export default function BetResultModal({ open, onOpenChange, result }: BetResultModalProps) {
  if (!result) return null;
  const { won, amount, bet, candle, diff } = result;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center max-w-2xl p-10 rounded-2xl border-4 border-yellow-400 shadow-2xl bg-black">
        <DialogHeader>
          <DialogTitle className={`text-5xl font-extrabold mb-2 ${won ? "text-green-500" : "text-red-500"} drop-shadow-lg flex items-center justify-center gap-4`}>
            {won ? (
              <>
                <span className="text-green-400">🎉</span> ¡PREMIO! <span className="text-green-400">🎉</span>
              </>
            ) : (
              <>
                <span className="text-red-400">💔</span> DERROTA <span className="text-red-400">💔</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 mt-6">
          <div className="flex items-center gap-4 justify-center text-3xl font-bold">
            {bet.prediction === "BULLISH" ? <ArrowUpCircle className="h-12 w-12 text-green-400" /> : <ArrowDownCircle className="h-12 w-12 text-red-400" />}
            <span className={bet.prediction === "BULLISH" ? "text-green-300" : "text-red-300"}>{bet.prediction === "BULLISH" ? "Alcista" : "Bajista"}</span>
            <span className="text-yellow-400 text-2xl ml-3">{bet.symbol} <span className="text-white">({bet.timeframe})</span></span>
          </div>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center w-full">
            <div className="text-2xl md:text-3xl font-bold text-yellow-400 bg-zinc-900 rounded-xl px-6 py-4 border-2 border-yellow-600 shadow">
              Apostaste
              <div className="text-4xl mt-2">${bet.amount.toFixed(2)}</div>
            </div>
            <div className={`text-2xl md:text-3xl font-bold rounded-xl px-6 py-4 border-2 shadow ${won ? "bg-green-900 border-green-600 text-green-300" : "bg-red-900 border-red-600 text-red-300"}`}>
              {won ? "Ganancia" : "Pérdida"}
              <div className="text-4xl mt-2">{won ? "+" : "-"}${amount.toFixed(2)}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4 text-lg">
            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <div className="text-zinc-400">Precio apertura</div>
              <div className="font-mono text-2xl text-white">{candle.open.toFixed(2)}</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <div className="text-zinc-400">Precio cierre</div>
              <div className="font-mono text-2xl text-white">{candle.close.toFixed(2)}</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <div className="text-zinc-400">Diferencia</div>
              <div className={`font-mono text-2xl ${diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-white"}`}>{diff > 0 ? "+" : ""}{diff.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
