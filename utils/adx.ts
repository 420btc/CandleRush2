// utils/adx.ts
// Cálculo del ADX (Average Directional Index) para un array de velas
// Devuelve un array de valores ADX del mismo tamaño que el input (los primeros period-1 serán null)
import type { Candle } from "@/types/game";

export function calculateADX(candles: Candle[], period = 14): (number|null)[] {
  if (candles.length < period + 1) return Array(candles.length).fill(null);
  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const highDiff = curr.high - prev.high;
    const lowDiff = prev.low - curr.low;
    const upMove = highDiff > 0 && highDiff > lowDiff ? highDiff : 0;
    const downMove = lowDiff > 0 && lowDiff > highDiff ? lowDiff : 0;
    plusDM.push(upMove);
    minusDM.push(downMove);
    const trVal = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    tr.push(trVal);
  }

  // Suavizado EMA-like para TR, +DM, -DM
  const smooth = (arr: number[], period: number) => {
    const res = [arr.slice(0, period).reduce((a, b) => a + b, 0)];
    for (let i = period; i < arr.length; i++) {
      res.push(res[res.length-1] - res[res.length-1]/period + arr[i]);
    }
    return res;
  };
  const smTr = smooth(tr, period);
  const smPlusDM = smooth(plusDM, period);
  const smMinusDM = smooth(minusDM, period);

  const plusDI = smPlusDM.map((val, i) => 100 * val / (smTr[i] || 1));
  const minusDI = smMinusDM.map((val, i) => 100 * val / (smTr[i] || 1));
  const dx = plusDI.map((p, i) => 100 * Math.abs(p - minusDI[i]) / ((p + minusDI[i]) || 1));
  // ADX: media móvil simple de dx
  const adx: (number|null)[] = Array(period).fill(null);
  for (let i = period; i < dx.length; i++) {
    const avg = dx.slice(i-period+1, i+1).reduce((a,b) => a+b, 0) / period;
    adx.push(avg);
  }
  // El output tiene la misma longitud que candles
  adx.unshift(null); // por el desfase de 1
  return adx.slice(0, candles.length);
}
