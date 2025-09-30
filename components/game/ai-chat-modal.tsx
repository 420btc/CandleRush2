"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGame } from '@/context/game-context';
import type { Candle } from '@/types/game';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const gameContext = useGame();

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Crear el contexto del juego para la IA
  const createGameContext = () => {
    const { 
      candles, 
      currentCandle, 
      currentSymbol, 
      timeframe, 
      bets, 
      userBalance, 
      gamePhase,
      autoMixMemory,
      betsByPair,
      nextPhaseTime,
      nextCandleTime
    } = gameContext;

    // Obtener las últimas 30 velas para análisis más profundo
    const recentCandles = candles.slice(-30);
    const currentPrice = currentCandle?.close || 0;
    
    // Estadísticas de apuestas actuales
    const currentPairBets = betsByPair[currentSymbol]?.[timeframe] || [];
    const totalBets = currentPairBets.length;
    const wonBets = currentPairBets.filter(bet => bet.status === 'WON').length;
    const lostBets = currentPairBets.filter(bet => bet.status === 'LOST').length;
    const pendingBets = currentPairBets.filter(bet => bet.status === 'PENDING').length;
    const liquidatedBets = currentPairBets.filter(bet => bet.status === 'LIQUIDATED').length;
    const winRate = totalBets > 0 ? (wonBets / totalBets * 100).toFixed(1) : '0';

    // Posiciones abiertas con detalles de liquidación
    const openPositions = currentPairBets.filter(bet => bet.status === 'PENDING').map(bet => ({
      id: bet.id,
      prediction: bet.prediction,
      amount: bet.amount,
      leverage: bet.leverage || 1,
      entryPrice: bet.entryPrice,
      liquidationPrice: bet.liquidationPrice,
      currentPnL: bet.entryPrice ? 
        (bet.prediction === 'BULLISH' ? 
          ((currentPrice - bet.entryPrice) / bet.entryPrice * 100 * (bet.leverage || 1)).toFixed(2) :
          ((bet.entryPrice - currentPrice) / bet.entryPrice * 100 * (bet.leverage || 1)).toFixed(2)
        ) : '0',
      timeRemaining: nextPhaseTime ? Math.max(0, Math.floor((nextPhaseTime - Date.now()) / 1000)) : 0,
      timestamp: new Date(bet.timestamp).toLocaleTimeString()
    }));

    // Análisis de rendimiento por timeframe
    const allBets = Object.values(betsByPair).flatMap(symbolBets => 
      Object.values(symbolBets).flat()
    );
    const totalProfit = allBets
      .filter(bet => bet.status === 'WON')
      .reduce((sum, bet) => sum + (bet.winnings || 0), 0);
    const totalLoss = allBets
      .filter(bet => bet.status === 'LOST' || bet.status === 'LIQUIDATED')
      .reduce((sum, bet) => sum + bet.amount, 0);
    const netProfit = totalProfit - totalLoss;

    // Últimas 10 entradas de memoria AutoMix
    const recentAutoMixMemory = autoMixMemory.slice(-10);

    // Análisis de volatilidad reciente
    const recentPrices = recentCandles.slice(-10).map(c => c.close);
    const avgPrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    const volatility = recentPrices.length > 1 ? 
      Math.sqrt(recentPrices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / recentPrices.length) : 0;

    return {
      currentSymbol,
      timeframe,
      currentPrice,
      gamePhase,
      userBalance,
      nextPhaseTime,
      nextCandleTime,
      timeUntilNextCandle: nextCandleTime ? Math.max(0, Math.floor((nextCandleTime - Date.now()) / 1000)) : 0,
      recentCandles: recentCandles.map(c => ({
        timestamp: new Date(c.timestamp).toLocaleTimeString(),
        open: c.open.toFixed(4),
        high: c.high.toFixed(4),
        low: c.low.toFixed(4),
        close: c.close.toFixed(4),
        volume: c.volume?.toFixed(0) || '0',
        change: c.open !== 0 ? (((c.close - c.open) / c.open) * 100).toFixed(2) : '0'
      })),
      betsStats: {
        total: totalBets,
        won: wonBets,
        lost: lostBets,
        pending: pendingBets,
        liquidated: liquidatedBets,
        winRate: `${winRate}%`,
        totalProfit: totalProfit.toFixed(2),
        totalLoss: totalLoss.toFixed(2),
        netProfit: netProfit.toFixed(2),
        profitability: totalLoss > 0 ? ((netProfit / totalLoss) * 100).toFixed(1) : '0'
      },
      openPositions,
      marketAnalysis: {
        volatility: volatility.toFixed(4),
        avgPrice: avgPrice.toFixed(4),
        priceChange24h: recentCandles.length >= 2 ? 
          (((currentPrice - recentCandles[0].close) / recentCandles[0].close) * 100).toFixed(2) : '0',
        highestPrice: Math.max(...recentPrices).toFixed(4),
        lowestPrice: Math.min(...recentPrices).toFixed(4)
      },
      recentBets: currentPairBets.slice(-10).map(bet => ({
        prediction: bet.prediction,
        amount: bet.amount,
        status: bet.status,
        timeframe: bet.timeframe,
        leverage: bet.leverage || 1,
        entryPrice: bet.entryPrice?.toFixed(4) || 'N/A',
        liquidationPrice: bet.liquidationPrice?.toFixed(4) || 'N/A',
        winnings: bet.winnings?.toFixed(2) || '0',
        timestamp: new Date(bet.timestamp).toLocaleTimeString(),
        wasLiquidated: bet.wasLiquidated || false
      })),
      autoMixMemory: recentAutoMixMemory.map(entry => ({
        direction: entry.direction,
        result: entry.result,
        majoritySignal: entry.majoritySignal,
        rsiSignal: entry.rsiSignal,
        macdSignal: entry.macdSignal,
        valleyVote: entry.valleyVote,
        volumeVote: entry.volumeVote,
        timestamp: new Date(entry.timestamp).toLocaleTimeString()
      }))
    };
  };

  // Prompt del sistema para la IA
  const getSystemPrompt = async () => {
    const gameData = createGameContext();
    
    // Obtener contexto detallado de la API
    try {
      const response = await fetch('/api/ai-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      
      if (response.ok) {
        const detailedContext = await response.json();
        
        return `Eres AutoMix, la IA de trading del juego CandleRush 2. Sé directo, técnico y conciso.

=== ESTADO ACTUAL ===
${detailedContext.gameInfo.currentSymbol} | ${detailedContext.gameInfo.timeframe} | $${detailedContext.gameInfo.currentPrice} | ${detailedContext.gameInfo.gamePhase}
Balance: $${detailedContext.gameInfo.userBalance} | Próxima vela: ${gameData.timeUntilNextCandle}s

=== POSICIONES ACTIVAS ===
${gameData.openPositions.length > 0 ? 
  gameData.openPositions.map(pos => 
    `${pos.prediction} $${pos.amount} ${pos.leverage}x | PnL: ${pos.currentPnL}% | Liq: $${pos.liquidationPrice || 'N/A'} | ${pos.timeRemaining}s`
  ).join('\n') : 
  'Sin posiciones abiertas'
}

=== ANÁLISIS TÉCNICO ACTUAL ===
RSI (33p): ${(() => {
  const recentCandles = gameData.recentCandles.slice(-34);
  if (recentCandles.length < 34) return 'N/A';
  let gains = 0, losses = 0;
  for (let i = 1; i < recentCandles.length; i++) {
    const diff = parseFloat(recentCandles[i].close) - parseFloat(recentCandles[i-1].close);
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / 33;
  const avgLoss = losses / 33;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return rsi.toFixed(1);
})()}

MACD: ${(() => {
  const closes = gameData.recentCandles.slice(-26).map(c => parseFloat(c.close));
  if (closes.length < 26) return 'N/A';
  
  // EMA 12 y 26
  const calcEMA = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  };
  
  const ema12 = calcEMA(closes.slice(-12), 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12 - ema26;
  
  return `${macdLine > 0 ? 'BULLISH' : 'BEARISH'} (${macdLine.toFixed(4)})`;
})()}

Volatilidad: ${gameData.marketAnalysis.volatility} | Cambio 24h: ${gameData.marketAnalysis.priceChange24h}%
Rango: $${gameData.marketAnalysis.lowestPrice} - $${gameData.marketAnalysis.highestPrice}

=== RENDIMIENTO ===
W/L: ${gameData.betsStats.won}/${gameData.betsStats.lost}/${gameData.betsStats.liquidated} | WR: ${gameData.betsStats.winRate}
P&L: $${gameData.betsStats.netProfit} | ROI: ${gameData.betsStats.profitability}%

=== ÚLTIMAS 5 VELAS ===
${gameData.recentCandles.slice(-5).map(c => `${c.timestamp}: ${c.open}→${c.close} (${c.change}%)`).join('\n')}

=== MEMORIA AUTOMIX (Últimas 3) ===
${gameData.autoMixMemory.slice(-3).map(entry => 
  `${entry.timestamp}: ${entry.direction} → ${entry.result || 'PENDING'} | RSI:${entry.rsiSignal} MACD:${entry.macdSignal} Valle:${entry.valleyVote}`
).join('\n')}

=== INSTRUCCIONES ===
- Respuestas máximo 3-4 líneas
- Enfócate en datos técnicos específicos
- Menciona niveles de liquidación si hay riesgo
- Usa terminología de trading profesional
- Analiza patrones MACD, RSI, y estructura de velas
- Comenta sobre gestión de riesgo cuando sea relevante
- Si preguntan por estrategia, explica la lógica de los indicadores


- Responde como AutoMix, la IA experta en trading del juego
- Usa los datos actuales para análisis precisos y contextualizados
- Analiza las posiciones abiertas y su riesgo de liquidación
- Comenta sobre la volatilidad y tendencias del mercado
- Explica las decisiones de trading de forma educativa
- Puedes hacer recomendaciones, pero siempre con disclaimers sobre riesgos
- Mantén un tono profesional pero amigable
- Si preguntan sobre estrategias específicas, explica la lógica completa
- Haz referencias a tu "experiencia" analizando patrones de mercado
- Puedes mencionar cómo funciona tu algoritmo interno de decisiones
- Siempre enfatiza la gestión de riesgo y el apalancamiento responsable
- Comenta sobre el rendimiento histórico y las estadísticas actuales
- Alerta sobre posiciones cercanas a liquidación si las hay

IMPORTANTE: Eres parte integral del juego CandleRush 2. Tu objetivo es educar y ayudar al usuario a entender mejor el trading automatizado y las decisiones basadas en análisis técnico.`;
      }
    } catch (error) {
      console.error('Error fetching detailed context:', error);
    }
    
    // Fallback al prompt básico si falla la API
    return `Eres AutoMix, la IA de trading avanzada del juego CandleRush 2. Tu personalidad es la de un trader experimentado, analítico pero accesible, con un toque de humor ocasional.

CONTEXTO ACTUAL DEL JUEGO:
- Símbolo: ${gameData.currentSymbol}
- Timeframe: ${gameData.timeframe}
- Precio actual: $${gameData.currentPrice}
- Fase del juego: ${gameData.gamePhase}
- Balance del usuario: $${gameData.userBalance}

ESTADÍSTICAS DE APUESTAS:
- Total: ${gameData.betsStats.total}
- Ganadas: ${gameData.betsStats.won}
- Perdidas: ${gameData.betsStats.lost}
- Pendientes: ${gameData.betsStats.pending}
- Tasa de éxito: ${gameData.betsStats.winRate}

TU CONOCIMIENTO INCLUYE:
1. Análisis MACD (EMA 12/26, línea de señal)
2. RSI (33 períodos)
3. Detección de valles alcistas/bajistas
4. Análisis de tendencia de volumen
5. Señales de mayoría (65 velas)
6. Golden Cross/Death Cross
7. Niveles de Fibonacci
8. Análisis ADX para fuerza de tendencia
9. Whale trades y order blocks
10. Memoria de patrones ganadores/perdedores

Recuerda: Eres parte del juego CandleRush 2 y tu objetivo es ayudar al usuario a entender mejor el trading y las decisiones automatizadas.`;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Obtener el prompt del sistema de forma asíncrona
      const systemPrompt = await getSystemPrompt();
      
      // Usar nuestra API route en lugar de llamar directamente a OpenAI
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'No se pudo conectar con la IA'}. Verifica la configuración del servidor.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      <div 
        className="absolute bg-black/90 border border-yellow-400/50 rounded-lg shadow-2xl pointer-events-auto resize overflow-hidden"
        style={{
          top: '20px',
          right: '20px',
          width: '500px', // Aumentado de 400px a 500px
          height: '600px',
          minWidth: '400px', // Aumentado de 300px a 400px
          minHeight: '400px',
          maxWidth: '90vw', // Aumentado de 80vw a 90vw
          maxHeight: '80vh',
          resize: 'both'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-yellow-400/30 bg-black/50">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🤖</span>
            <span className="text-white font-semibold">AutoMix IA</span>
            <span className="text-xs text-gray-400">({selectedModel})</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0"
            >
              ⚙️
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="h-6 w-6 p-0"
            >
              🗑️
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-red-400"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
          {showSettings && (
            <div className="border-b border-yellow-400/30 p-3 space-y-3 bg-black/30 flex-shrink-0">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Modelo:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2 border rounded-md text-xs bg-black text-white"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Recomendado)</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full p-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-300 mt-4">
                  <span className="text-2xl mb-2 block">🤖</span>
                  <p className="text-sm font-semibold">¡Hola! Soy AutoMix</p>
                  <p className="text-xs mt-2">
                    Pregúntame sobre estrategias de trading, análisis técnico, o cualquier decisión de apuestas.
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-[95%] p-2 rounded-lg text-xs break-words ${
                      message.role === 'user'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="text-left mb-3">
                  <div className="inline-block bg-gray-700 text-gray-100 p-2 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                      AutoMix está analizando...
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </ScrollArea>
          </div>

          <div className="p-3 border-t border-yellow-400/30 space-y-2 flex-shrink-0 bg-black/50">
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregúntale a AutoMix..."
                className="flex-1 min-h-[40px] max-h-[80px] text-xs resize-none bg-gray-800 border-gray-600 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={false}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="self-end h-[40px] w-[40px] p-0 bg-yellow-600 hover:bg-yellow-500"
                size="sm"
              >
                {isLoading ? '⏳' : '📤'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}