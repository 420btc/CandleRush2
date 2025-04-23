"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface GameControlsProps {
  onSymbolChange: (symbol: string) => void
  onTimeframeChange: (timeframe: string) => void
  currentSymbol: string
  currentTimeframe: string
}

const AVAILABLE_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "DOGEUSDT", "XRPUSDT", "SOLUSDT"]

const AVAILABLE_TIMEFRAMES = ["1m", "3m", "5m", "15m", "30m", "1h"]

export default function GameControls({
  onSymbolChange,
  onTimeframeChange,
  currentSymbol,
  currentTimeframe,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-1">
        <Label htmlFor="symbol">Par</Label>
        <Select value={currentSymbol} onValueChange={onSymbolChange}>
          <SelectTrigger id="symbol" className="w-[140px] bg-black border-[#FFD600] text-[#FFD600] focus:ring-[#FFD600]">
            <SelectValue placeholder="Seleccionar par" />
          </SelectTrigger>
          <SelectContent className="bg-black border-[#FFD600] text-[#FFD600]">
            {AVAILABLE_SYMBOLS.map((symbol) => (
              <SelectItem key={symbol} value={symbol}>
                {symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="timeframe">Intervalo</Label>
        <Select value={currentTimeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger id="timeframe" className="w-[140px] bg-black border-[#FFD600] text-[#FFD600] focus:ring-[#FFD600]">
            <SelectValue placeholder="Seleccionar intervalo" />
          </SelectTrigger>
          <SelectContent className="bg-black border-[#FFD600] text-[#FFD600]">
            {AVAILABLE_TIMEFRAMES.map((timeframe) => (
              <SelectItem key={timeframe} value={timeframe}>
                {timeframe}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
