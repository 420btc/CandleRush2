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
  const [autoMonitoring, setAutoMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number>(0);
  const [previousGameState, setPreviousGameState] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const gameContext = useGame();
  const { currentUser } = gameContext;

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicializar análisis automático cuando se abre el chat vacío
  useEffect(() => {
    if (isOpen && messages.length === 0 && !autoMonitoring) {
      console.log('🚀 Iniciando monitoreo automático...');
      startAutoMonitoring();
    }
  }, [isOpen]); // Solo depende de isOpen para evitar re-ejecuciones

  // Limpiar interval al cerrar
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        console.log('🛑 Limpiando interval de monitoreo');
        clearInterval(monitoringInterval);
        setMonitoringInterval(null);
        setAutoMonitoring(false);
      }
    };
  }, []);

  // Limpiar interval cuando se cierra el modal
  useEffect(() => {
    if (!isOpen && monitoringInterval) {
      console.log('🔴 Modal cerrado - deteniendo monitoreo');
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
      setAutoMonitoring(false);
    }
  }, [isOpen]);

  // Función para enviar análisis automático usando OpenAI
  const sendAutoAnalysis = async (isInitial: boolean = false) => {
    console.log('📤 Enviando análisis automático a OpenAI - Inicial:', isInitial);
    
    // Forzar actualización del contexto del juego obteniendo datos frescos
    const gameData = createGameContext();
    
    try {
      const systemPrompt = await getSystemPrompt();
      
      // Log para verificar que los datos se están actualizando
      console.log('🔄 Datos actualizados - Precio:', gameData.currentPrice, 'Posiciones:', gameData.openPositions.length);
      
      // Crear mensaje personalizado para el análisis automático
      const autoPrompt = isInitial 
        ? `Hola ${currentUser || 'trader'}! Acabo de conectarme al AutoMix. Dame un análisis completo del mercado actual de ${gameData.currentSymbol} en ${gameData.timeframe}. Incluye precio actual, tendencias, patrones de velas, indicadores técnicos y cualquier insight importante. Hazlo personal y directo, como si fueras mi asistente personal de trading.`
        : `${currentUser || 'Trader'}, dame una actualización completa del mercado ${gameData.currentSymbol} ${gameData.timeframe}. Analiza los últimos movimientos, patrones, indicadores y dame tu perspectiva sobre las próximas velas. Sé específico y personal en tu análisis.`;

      console.log('🤖 Enviando prompt a OpenAI...');
      
      // Usar nuestra API route para enviar a OpenAI
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: autoPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar el análisis automático.';
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
      setLastAnalysisTime(Date.now());
      setPreviousGameState(gameData);
      
      console.log('✅ Análisis automático de OpenAI recibido y enviado');
    } catch (error) {
      console.error('❌ Error en análisis automático:', error);
      // No agregar mensaje de fallback, solo loggear el error
    }
  };

  // Iniciar monitoreo automático
  const startAutoMonitoring = () => {
    console.log('🔄 Iniciando startAutoMonitoring...');
    
    if (monitoringInterval) {
      console.log('⚠️ Limpiando interval existente');
      clearInterval(monitoringInterval);
    }

    // Enviar análisis inicial inmediatamente
    console.log('📊 Enviando análisis inicial');
    sendAutoAnalysis(true);
    
    setAutoMonitoring(true);
    
    // Configurar interval para envío cada 15 segundos
    console.log('⏰ Configurando interval de 15 segundos');
    const interval = setInterval(() => {
      console.log('🔄 Ejecutando análisis automático programado');
      sendAutoAnalysis(false);
    }, 15000);
    
    setMonitoringInterval(interval);
    console.log('✅ Monitoreo automático configurado correctamente');
  };

  // Pausar/reanudar monitoreo
  const toggleAutoMonitoring = () => {
    console.log('🔄 Toggle monitoreo - Estado actual:', autoMonitoring);
    
    if (autoMonitoring && monitoringInterval) {
      console.log('⏸️ Pausando monitoreo automático');
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
      setAutoMonitoring(false);
    } else {
      console.log('▶️ Reanudando monitoreo automático');
      startAutoMonitoring();
    }
  };

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
    const avgPrice = recentPrices.length > 0 ? recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length : 0;
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
        volatility: (volatility || 0).toFixed(4),
        avgPrice: (avgPrice || 0).toFixed(4),
        priceChange24h: recentCandles.length >= 2 ? 
          (((currentPrice - recentCandles[0].close) / recentCandles[0].close) * 100).toFixed(2) : '0',
        highestPrice: recentPrices.length > 0 ? Math.max(...recentPrices).toFixed(4) : '0',
        lowestPrice: recentPrices.length > 0 ? Math.min(...recentPrices).toFixed(4) : '0'
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
    // Obtener datos frescos del contexto del juego en cada llamada
    const gameData = createGameContext();
    
    // Log para verificar actualización de datos
    console.log('📊 Generando prompt con datos actualizados - Balance:', gameData.userBalance, 'Precio:', gameData.currentPrice);
    
    // Obtener contexto detallado de la API
    try {
      const response = await fetch('/api/ai-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      
      if (response.ok) {
        const detailedContext = await response.json();
        
        return `Eres AutoMix, la IA personal de trading de ${currentUser || 'este trader'}. Habla directamente con él/ella de forma personal y cercana, como su asistente experto en trading.

=== INFORMACIÓN PERSONAL ===
Usuario: ${currentUser || 'Trader'}
Balance actual: $${detailedContext.gameInfo.userBalance}
Rendimiento total: ${parseFloat(gameData.betsStats.netProfit) > 0 ? '+' : ''}$${gameData.betsStats.netProfit}
Tasa de éxito: ${gameData.betsStats.winRate} (${gameData.betsStats.won}W/${gameData.betsStats.lost}L)
Posiciones activas: ${gameData.openPositions.length}

=== MERCADO ACTUAL ===
${detailedContext.gameInfo.currentSymbol} | ${detailedContext.gameInfo.timeframe} | $${detailedContext.gameInfo.currentPrice}
Próxima vela en: ${gameData.timeUntilNextCandle}s
Volatilidad: ${gameData.marketAnalysis.volatility}% | Cambio 24h: ${gameData.marketAnalysis.priceChange24h}%

=== ANÁLISIS DE VELAS (Últimas 10) ===
${gameData.recentCandles.slice(-10).map((c, i) => {
  const candleType = parseFloat(c.close) > parseFloat(c.open) ? '🟢' : '🔴';
  const bodySize = Math.abs(parseFloat(c.close) - parseFloat(c.open));
  const wickSize = parseFloat(c.high) - Math.max(parseFloat(c.close), parseFloat(c.open)) + 
                   Math.min(parseFloat(c.close), parseFloat(c.open)) - parseFloat(c.low);
  const pattern = bodySize > wickSize * 2 ? 'Fuerte' : bodySize < wickSize ? 'Doji/Indecisión' : 'Normal';
  return `Vela ${i+1}: ${candleType} ${c.open}→${c.close} (${c.change}%) [${pattern}]`;
}).join('\n')}

=== POSICIONES DE ${currentUser || 'USUARIO'} ===
${gameData.openPositions.length > 0 ? 
  gameData.openPositions.map(pos => {
    const currentPrice = parseFloat(detailedContext.gameInfo.currentPrice);
    const liquidationPrice = parseFloat(String(pos.liquidationPrice || '0'));
    const riskLevel = liquidationPrice > 0 ? 
      Math.abs((currentPrice - liquidationPrice) / currentPrice * 100) : 100;
    const riskEmoji = riskLevel < 5 ? '🔴' : riskLevel < 15 ? '🟠' : riskLevel < 30 ? '🟡' : '🟢';
    const timeRemaining = typeof pos.timeRemaining === 'number' ? pos.timeRemaining : parseInt(pos.timeRemaining || '0');
    return `${pos.prediction} $${pos.amount} ${pos.leverage}x | PnL: ${pos.currentPnL}% | Liq: $${pos.liquidationPrice || 'N/A'} ${riskEmoji} | ${Math.floor(timeRemaining/60)}min remaining`;
  }).join('\n') : 
  `Sin posiciones - ${currentUser || 'Tienes'} $${gameData.userBalance} disponibles para operar`
}

=== INDICADORES TÉCNICOS ===
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
  return `${rsi.toFixed(1)} ${rsi > 70 ? '(Sobrecompra)' : rsi < 30 ? '(Sobreventa)' : '(Neutral)'}`;
})()}

MACD: ${(() => {
  const closes = gameData.recentCandles.slice(-26).map(c => parseFloat(c.close));
  if (closes.length < 26) return 'N/A';
  
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

=== HISTORIAL RECIENTE DE ${currentUser || 'USUARIO'} ===
${gameData.recentBets.slice(-5).map(bet => 
  `${bet.prediction} $${bet.amount} ${bet.leverage}x → ${bet.status} ${bet.status === 'WON' ? '+$' + bet.winnings : bet.status === 'LOST' ? '-$' + bet.amount : 'PENDING'}`
).join('\n')}

=== MEMORIA AUTOMIX ===
${gameData.autoMixMemory.slice(-3).map(entry => 
  `${entry.timestamp}: ${entry.direction} → ${entry.result || 'PENDING'} | Señales: RSI:${entry.rsiSignal} MACD:${entry.macdSignal}`
).join('\n')}

=== INSTRUCCIONES PARA AUTOMIX ===
- Habla directamente con ${currentUser || 'el usuario'} de forma personal y cercana
- Usa su nombre cuando sea apropiado
- Analiza específicamente SUS posiciones y SU rendimiento
- Comenta sobre SUS patrones de trading y decisiones
- Da consejos personalizados basados en SU historial
- Menciona riesgos específicos de SUS posiciones actuales
- Sé conciso pero completo (máximo 4-5 líneas por respuesta)
- Usa terminología técnica pero explicada de forma accesible
- Siempre enfatiza la gestión de riesgo personalizada
- Haz referencia a las velas específicas y patrones que está viendo

PERSONALIDAD: Eres su asistente personal de trading, conoces su estilo, sus éxitos y errores. Eres directo, técnico pero amigable, y siempre enfocado en ayudarle a mejorar sus resultados.`;
      }
    } catch (error) {
      console.error('Error fetching detailed context:', error);
    }
    
    // Fallback mejorado y personalizado
    return `Eres AutoMix, la IA personal de trading de ${currentUser || 'este trader'}. Habla directamente con él/ella de forma personal y cercana.

=== INFORMACIÓN PERSONAL ===
Usuario: ${currentUser || 'Trader'}
Balance: $${gameData.userBalance}
Símbolo actual: ${gameData.currentSymbol} ${gameData.timeframe}
Precio: $${gameData.currentPrice}
Rendimiento: ${parseFloat(gameData.betsStats.netProfit) > 0 ? '+' : ''}$${gameData.betsStats.netProfit} | WR: ${gameData.betsStats.winRate}

=== POSICIONES ACTUALES ===
${gameData.openPositions.length > 0 ? 
  gameData.openPositions.map(pos => {
    const timeRemaining = typeof pos.timeRemaining === 'number' ? pos.timeRemaining : parseInt(pos.timeRemaining || '0');
    return `${pos.prediction} $${pos.amount} ${pos.leverage}x | PnL: ${pos.currentPnL}% | ${Math.floor(timeRemaining/60)}min`;
  }).join('\n') : 
  'Sin posiciones activas'
}

=== ÚLTIMAS VELAS ===
${gameData.recentCandles.slice(-5).map((c, i) => 
  `${i+1}: ${parseFloat(c.close) > parseFloat(c.open) ? '🟢' : '🔴'} ${c.open}→${c.close} (${c.change}%)`
).join('\n')}

INSTRUCCIONES:
- Habla directamente con ${currentUser || 'el usuario'} de forma personal
- Analiza SUS posiciones específicas y SU rendimiento
- Da consejos personalizados basados en SU situación actual
- Sé conciso pero técnico (máximo 4 líneas)
- Enfócate en gestión de riesgo personalizada
- Usa las velas y datos específicos que está viendo ahora

Eres su asistente personal de trading, conoces su estilo y siempre buscas ayudarle a mejorar.`;
  };

  // Función para procesar y resaltar precios en el contenido
  const processMessageContent = (content: string) => {
    // Regex para detectar precios en formato $X.XX, $X,XXX.XX, etc.
    const priceRegex = /\*\*\$([0-9,]+\.?[0-9]*)\*\*|\$([0-9,]+\.?[0-9]*)/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = priceRegex.exec(content)) !== null) {
      // Agregar texto antes del precio
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      // Agregar el precio resaltado
      const price = match[1] || match[2]; // Capturar el precio sin los asteriscos
      parts.push({
        type: 'price',
        content: `$${price}`
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Agregar texto restante
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content }];
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
      // Obtener datos frescos del juego para cada mensaje manual
      console.log('💬 Enviando mensaje manual - obteniendo datos actualizados...');
      
      // Obtener el prompt del sistema de forma asíncrona con datos frescos
      const systemPrompt = await getSystemPrompt();
      console.log('🔍 System prompt generado:', systemPrompt.substring(0, 200) + '...');
      
      const requestBody = {
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: inputMessage }
        ]
      };
      
      console.log('🔍 Enviando a API:', {
        model: requestBody.model,
        messagesCount: requestBody.messages.length,
        lastUserMessage: inputMessage
      });
      
      // Usar nuestra API route en lugar de llamar directamente a OpenAI
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar el análisis automático.';
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
      setLastAnalysisTime(Date.now());
      
      console.log('✅ Análisis automático de OpenAI recibido y enviado');
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
              
              {messages.map((message, index) => {
                return (
                <div key={message.id} className={`mb-3 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block p-2 rounded-lg text-xs max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.role === 'assistant' ? (
                        // Procesar contenido de IA para resaltar precios
                        processMessageContent(message.content || '[Contenido vacío]').map((part, partIndex) => (
                          <span key={partIndex}>
                            {part.type === 'price' ? (
                              <span className="bg-yellow-400/20 text-yellow-300 px-1 py-0.5 rounded font-bold shadow-lg border border-yellow-400/30">
                                {part.content}
                              </span>
                            ) : (
                              part.content
                            )}
                          </span>
                        ))
                      ) : (
                        // Contenido normal para mensajes del usuario
                        message.content || '[Contenido vacío]'
                      )}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )})}
              
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
            <div className="flex gap-2 items-center mb-2">
              <Button
                onClick={toggleAutoMonitoring}
                className={`text-xs px-3 py-1 h-7 ${
                  autoMonitoring 
                    ? 'bg-red-600 hover:bg-red-500 text-white' 
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
                size="sm"
              >
                {autoMonitoring ? '⏸️ Pausar' : '▶️ Reanudar'} AutoMix
              </Button>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                {autoMonitoring && (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Monitoreando cada 10s
                  </>
                )}
              </div>
            </div>
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