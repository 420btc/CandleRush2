import React, { useRef, useEffect, useState } from "react";
import type { Candle, Bet } from "@/types/game";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ModalMinimapChartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candles: Candle[];
  bets: Bet[];
}

// Simple minimap: line chart of close prices, overlay bets as markers
export const ModalMinimapChart: React.FC<ModalMinimapChartProps> = ({ open, onOpenChange, candles, bets }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw price line
    const prices = candles.map(c => c.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = 10;
    const w = canvas.width;
    const h = canvas.height;
    ctx.strokeStyle = "#FFD600";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (prices.length === 1) {
      // Solo un punto, dibuja un punto visible
      const x = w / 2;
      const y = h / 2;
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFD600";
      ctx.fill();
    } else if (prices.length > 1) {
      prices.forEach((p, i) => {
        const x = pad + (i * (w - 2 * pad)) / (prices.length - 1);
        const y = h - pad - ((p - min) * (h - 2 * pad)) / (max - min === 0 ? 1 : max - min);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Overlay bets as circles
    bets.forEach(bet => {
      // Busca el índice del candle más cercano por timestamp
      let idx = 0;
      let minDiff = Infinity;
      candles.forEach((c, i) => {
        const diff = Math.abs(c.timestamp - bet.timestamp);
        if (diff < minDiff) {
          minDiff = diff;
          idx = i;
        }
      });
      const x = pad + (idx * (w - 2 * pad)) / (prices.length - 1);
      const y = h - pad - ((candles[idx].close - min) * (h - 2 * pad)) / (max - min || 1);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      let color = '#a259ff'; // Default morado
      if (bet.prediction === 'BULLISH') color = '#22c55e'; // verde
      else if (bet.prediction === 'BEARISH') color = '#ef4444'; // rojo
      ctx.fillStyle = color;
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [open, candles, bets, refresh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#18181b]">
        <DialogTitle>Minimapa de Gráfico</DialogTitle>
        <div className="w-full flex flex-col items-center overflow-x-auto justify-center">
          <button
            className="mb-3 px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-bold flex items-center gap-2"
            onClick={() => setRefresh(r => r + 1)}
            style={{ alignSelf: 'flex-end' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356-2.582A9 9 0 106.582 19.418" /></svg>
            Recargar gráfico
          </button>
          <div className="flex justify-center w-full" style={{ minWidth: 0 }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={320}
              style={{ border: "2px solid #FFD600", background: "#18181b", borderRadius: 12, display: 'block', maxWidth: '100%' }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">Tus posiciones aparecen como círculos sobre el gráfico.</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalMinimapChart;
