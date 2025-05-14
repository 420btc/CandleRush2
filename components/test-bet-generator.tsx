'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";

// Interface for bet data
interface StoredBet {
  id: string;
  status: string;
  timestamp: number;
  amount: number;
  prediction?: 'BULLISH' | 'BEARISH';
  leverage?: number;
  entryPrice?: number;
  symbol?: string;
  timeframe?: string;
}

// Function to generate a random bet
function generateRandomBet(): StoredBet {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT', 'ADA/USDT'];
  const statuses = ['WON', 'LOST', 'LIQUIDATION'];
  const timeframes = ['1m', '5m', '15m', '1h', '4h'];
  const predictions = ['BULLISH', 'BEARISH'];
  
  return {
    id: `bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    timestamp: Date.now(),
    amount: Math.floor(Math.random() * 1000) + 10,
    prediction: predictions[Math.floor(Math.random() * predictions.length)] as 'BULLISH' | 'BEARISH',
    leverage: Math.floor(Math.random() * 20) + 1,
    entryPrice: Math.floor(Math.random() * 50000) + 1000,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    timeframe: timeframes[Math.floor(Math.random() * timeframes.length)]
  };
}

// Component to generate test bets
export default function TestBetGenerator() {
  const [lastBetId, setLastBetId] = useState<string | null>(null);
  
  // Function to create and dispatch a new bet
  const createNewBet = () => {
    const newBet = generateRandomBet();
    setLastBetId(newBet.id);
    
    // Dispatch the event with the new bet
    window.dispatchEvent(new CustomEvent('newBet', { detail: newBet }));
  };
  
  // Function to create multiple bets in sequence
  const createMultipleBets = () => {
    // Create 5 bets with a 1 second delay between each
    let count = 0;
    const interval = setInterval(() => {
      createNewBet();
      count++;
      if (count >= 5) clearInterval(interval);
    }, 1000);
  };
  
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 bg-black/70 p-3 rounded-lg border border-yellow-500/30 z-50">
      <h3 className="text-yellow-400 text-sm font-medium">Test Bet Generator</h3>
      {lastBetId && (
        <p className="text-xs text-yellow-300/70 mb-2">
          Last bet: {lastBetId.substring(0, 15)}...
        </p>
      )}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={createNewBet}
          className="bg-black/30 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 h-8 px-3"
        >
          Generate Bet
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={createMultipleBets}
          className="bg-black/30 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 h-8 px-3"
        >
          Generate 5 Bets
        </Button>
      </div>
    </div>
  );
}
