"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface GameControlsProps {
  onSymbolChange: (symbol: string) => void
  onTimeframeChange: (timeframe: string) => void
  currentSymbol: string
  currentTimeframe: string
  gamePhase: string
  isConnected: boolean
}

const AVAILABLE_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "IOTAUSDT", "ADAUSDT", "RENDERUSDT", // RENDERUSDT a la quinta posición
  "XRPUSDT", "SOLUSDT", "BNBUSDT", "DOGEUSDT", // DOGEUSDT movido tras los antiguos
  "TRONUSDT", "XLMUSDT", "PEPEUSDT", "TRUMPUSDT",
  "WLDUSDT", "LINKUSDT", "VETUSDT", "SUIUSDT"
]

const AVAILABLE_TIMEFRAMES = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d"]

export default function GameControls({
  onSymbolChange,
  onTimeframeChange,
  currentSymbol,
  currentTimeframe,
  gamePhase,
  isConnected
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap gap-4 md:gap-4 gap-2 w-full">

      <div className="space-y-1">
        <Label htmlFor="symbol" className="text-[#FFD600] block w-full text-center text-lg sm:text-2xl font-extrabold uppercase" style={{textShadow:'0 0 8px #FFD60099, 0 0 2px #000'}}>Par</Label>
        <Select value={currentSymbol} onValueChange={onSymbolChange} disabled={gamePhase === 'LOADING' || !isConnected}>
          <SelectTrigger id="symbol" className="w-full md:w-[200px] h-10 md:h-14 bg-black border-2 border-[#FFD600] text-[#FFD600] focus:ring-[#FFD600] text-lg md:text-2xl font-black uppercase tracking-widest px-3 md:px-6 py-2 md:py-4 shadow-lg" style={{letterSpacing:'0.04em', textShadow:'0 0 8px #FFD60099, 0 0 2px #000'}} >
            <SelectValue placeholder="Seleccionar par" />
          </SelectTrigger>
          <SelectContent className="bg-black border-[#FFD600] text-[#FFD600] max-h-60 overflow-y-auto">
            {AVAILABLE_SYMBOLS.map((symbol) => (
              <SelectItem key={symbol} value={symbol} className="text-[#FFD600] font-black text-lg md:text-2xl uppercase tracking-wider py-3 px-4 no-check" style={{textShadow:'0 0 8px #FFD60099, 0 0 2px #000', letterSpacing:'0.05em'}} >
                {symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="timeframe" className="text-[#FFD600] block w-full text-center text-lg sm:text-2xl font-extrabold uppercase" style={{textShadow:'0 0 8px #FFD60099, 0 0 2px #000'}}>Intervalo</Label>
        <Select value={currentTimeframe} onValueChange={onTimeframeChange} disabled={gamePhase === 'LOADING' || !isConnected} >
          <SelectTrigger id="timeframe" className="w-full md:w-[200px] h-10 md:h-14 bg-black border-2 border-[#FFD600] text-[#FFD600] focus:ring-[#FFD600] text-lg md:text-2xl font-black tracking-widest px-3 md:px-6 py-2 md:py-4 shadow-lg" style={{letterSpacing:'0.04em', textShadow:'0 0 8px #FFD60099, 0 0 2px #000'}}>
            <SelectValue placeholder="Seleccionar intervalo" />
          </SelectTrigger>
          <SelectContent className="bg-black border-[#FFD600] text-[#FFD600]">
            {AVAILABLE_TIMEFRAMES.map((timeframe) => (
              <SelectItem key={timeframe} value={timeframe} className="text-[#FFD600] font-black text-lg md:text-2xl tracking-wider py-3 px-4 no-check" style={{textShadow:'0 0 8px #FFD60099, 0 0 2px #000', letterSpacing:'0.05em'}} >
                {timeframe}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
