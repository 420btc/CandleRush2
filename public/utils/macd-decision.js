// Función para calcular EMA
function calcEMA(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  let emaArr = [];
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emaArr[period - 1] = ema;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    emaArr[i] = ema;
  }
  return emaArr;
}

// Función para calcular RSI
function calcRSI(candles, period = 33) {
  if (candles.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (gains + losses === 0) return 50;
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Función principal para decidir la dirección
function decideMixDirection(candles, timeframe = "1m") {
  if (candles.length < 66) return Math.random() < 0.5 ? "BULLISH" : "BEARISH";

  // 1. Señal de mayoría
  const last65 = candles.slice(-66, -1);
  const bullishCount = last65.filter(c => c.close > c.open).length;
  const bearishCount = last65.length - bullishCount;
  let majoritySignal = null;
  if (bullishCount > bearishCount) majoritySignal = "BULLISH";
  else if (bearishCount > bullishCount) majoritySignal = "BEARISH";

  // 2. Señal RSI
  const rsi = calcRSI(candles);
  let rsiSignal = null;
  if (rsi > 50) rsiSignal = "BULLISH";
  else if (rsi < 40) rsiSignal = "BEARISH";

  // 3. Señal MACD
  const closes66 = candles.slice(-66).map(c => c.close);
  const ema12 = calcEMA(closes66, 12);
  const ema26 = calcEMA(closes66, 26);
  let macdLineArr = [];
  for (let i = 0; i < closes66.length; i++) {
    if (ema12[i] !== undefined && ema26[i] !== undefined) {
      macdLineArr[i] = ema12[i] - ema26[i];
    } else {
      macdLineArr[i] = 0;
    }
  }
  const signalLineArr = calcEMA(macdLineArr.filter(x => x !== undefined), 9);
  const macdLine = macdLineArr[macdLineArr.length - 1];
  const macdSignalLine = signalLineArr[signalLineArr.length - 1];
  let macdSignal = null;
  if (macdLine > macdSignalLine) macdSignal = "BULLISH";
  else if (macdLine < macdSignalLine) macdSignal = "BEARISH";

  // Votación proporcional
  let bullishVotes = 0;
  let bearishVotes = 0;

  if (rsiSignal === "BULLISH") bullishVotes += 0.5;
  if (rsiSignal === "BEARISH") bearishVotes += 0.5;
  if (majoritySignal === "BULLISH") bullishVotes++;
  if (majoritySignal === "BEARISH") bearishVotes++;
  if (macdSignal === "BULLISH") bullishVotes++;
  if (macdSignal === "BEARISH") bearishVotes++;

  // Decisión final
  const totalVotes = bullishVotes + bearishVotes;
  let direction = "BULLISH";
  
  if (totalVotes === 0) {
    direction = Math.random() < 0.5 ? "BULLISH" : "BEARISH";
  } else if (bullishVotes === bearishVotes) {
    direction = macdSignal || (Math.random() < 0.5 ? "BULLISH" : "BEARISH");
  } else {
    const bullishProb = bullishVotes / totalVotes;
    direction = Math.random() < bullishProb ? "BULLISH" : "BEARISH";
  }

  return direction;
}

// Exportar funciones
self.decideMixDirection = decideMixDirection;
self.calcRSI = calcRSI;
self.calcEMA = calcEMA; 