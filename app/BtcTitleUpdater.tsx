"use client";
import { useEffect, useState } from "react";

export default function BtcTitleUpdater() {
  const [btcPrice, setBtcPrice] = useState<string | null>(null);

  useEffect(() => {
    let shouldRun = true;
    async function fetchPrice() {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
        const data = await res.json();
        if (shouldRun && data.price) {
          setBtcPrice(Number(data.price).toLocaleString("en-US", { maximumFractionDigits: 2 }));
        }
      } catch {
        // fallback: no update
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 1000); // actualiza cada segundo
    return () => { shouldRun = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (btcPrice) {
      document.title = `BTC ${btcPrice} | Candle Rush 2`;
    } else {
      document.title = "Candle Rush 2";
    }
    return () => {};
  }, [btcPrice]);

  return null;
}
