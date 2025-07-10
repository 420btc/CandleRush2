"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const gameContext = useGame();

  // Cargar API key del localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

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
      autoMixMemory 
    } = gameContext;

    // Obtener las últimas 20 velas para análisis
    const recentCandles = candles.slice(-20);
    const currentPrice = currentCandle?.close || 0;
    
    // Estadísticas de apuestas
    const totalBets = bets.length;
    const wonBets = bets.filter(bet => bet.status === 'WON').length;
    const lostBets = bets.filter(bet => bet.status === 'LOST').length;
    const pendingBets = bets.filter(bet => bet.status === 'PENDING').length;
    const winRate = totalBets > 0 ? (wonBets / totalBets * 100).toFixed(1) : '0';

    // Últimas 5 entradas de memoria AutoMix
    const recentAutoMixMemory = autoMixMemory.slice(-5);

    return {
      currentSymbol,
      timeframe,
      currentPrice,
      gamePhase,
      userBalance,
      recentCandles: recentCandles.map(c => ({
        timestamp: new Date(c.timestamp).toLocaleTimeString(),
        open: c.open.toFixed(2),
        high: c.high.toFixed(2),
        low: c.low.toFixed(2),
        close: c.close.toFixed(2),
        volume: c.volume?.toFixed(0) || '0'
      })),
      betsStats: {
        total: totalBets,
        won: wonBets,
        lost: lostBets,
        pending: pendingBets,
        winRate: `${winRate}%`
      },
      recentBets: bets.slice(-5).map(bet => ({
        prediction: bet.prediction,
        amount: bet.amount,
        status: bet.status,
        timeframe: bet.timeframe,
        leverage: bet.leverage || 1,
        timestamp: new Date(bet.timestamp).toLocaleTimeString()
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
        
        return `Eres AutoMix, la IA de trading avanzada del juego CandleRush 2. Tu personalidad es la de un trader experimentado, analítico pero accesible, con un toque de humor ocasional.

=== INFORMACIÓN DEL JUEGO ===
Juego: ${detailedContext.gameInfo.name}
Descripción: ${detailedContext.gameInfo.description}
Símbolo actual: ${detailedContext.gameInfo.currentSymbol}
Timeframe: ${detailedContext.gameInfo.timeframe}
Precio actual: $${detailedContext.gameInfo.currentPrice}
Fase del juego: ${detailedContext.gameInfo.gamePhase}
Balance del usuario: $${detailedContext.gameInfo.userBalance}

=== TUS CAPACIDADES TÉCNICAS ===
Indicadores disponibles:
${detailedContext.technicalAnalysis.indicators.map((indicator: string) => `• ${indicator}`).join('\n')}

Tipos de señales que analizas:
${detailedContext.technicalAnalysis.signalTypes.map((signal: string) => `• ${signal}`).join('\n')}

=== SISTEMA AUTOMIX ===
${detailedContext.autoMixSystem.description}

Proceso de decisión:
${detailedContext.autoMixSystem.decisionProcess.map((step: string) => `${step}`).join('\n')}

Sistema de memoria: ${detailedContext.autoMixSystem.memorySystem}
Lógica de inversión: ${detailedContext.autoMixSystem.inversionLogic}

=== DATOS ACTUALES ===
Estadísticas de apuestas:
- Total: ${gameData.betsStats.total}
- Ganadas: ${gameData.betsStats.won}
- Perdidas: ${gameData.betsStats.lost}
- Pendientes: ${gameData.betsStats.pending}
- Tasa de éxito: ${gameData.betsStats.winRate}

Últimas velas (${gameData.timeframe}):
${gameData.recentCandles.map(c => `${c.timestamp}: O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${c.volume}`).join('\n')}

Últimas apuestas:
${gameData.recentBets.map(bet => `${bet.timestamp}: ${bet.prediction} $${bet.amount} (${bet.status}) Leverage: ${bet.leverage}x`).join('\n')}

Memoria AutoMix reciente:
${gameData.autoMixMemory.map(entry => `${entry.timestamp}: ${entry.direction} -> ${entry.result || 'PENDING'} | Señales: Mayoría:${entry.majoritySignal} RSI:${entry.rsiSignal} MACD:${entry.macdSignal} Valle:${entry.valleyVote} Volumen:${entry.volumeVote}`).join('\n')}

=== TU PERSONALIDAD ===
Rasgos: ${detailedContext.aiPersonality.traits.join(', ')}
Experiencia: ${detailedContext.aiPersonality.expertise.join(', ')}

=== INSTRUCCIONES ===
- Responde como AutoMix, la IA experta en trading del juego
- Usa los datos actuales para análisis precisos y contextualizados
- Explica las decisiones de trading de forma educativa
- Puedes hacer recomendaciones, pero siempre con disclaimers sobre riesgos
- Mantén un tono profesional pero amigable
- Si preguntan sobre estrategias específicas, explica la lógica completa
- Haz referencias a tu "experiencia" analizando patrones de mercado
- Puedes mencionar cómo funciona tu algoritmo interno de decisiones
- Siempre enfatiza la gestión de riesgo y el apalancamiento responsable

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
    if (!inputMessage.trim() || !apiKey) return;

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
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
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
        content: `Error: ${error instanceof Error ? error.message : 'No se pudo conectar con la IA'}. Verifica tu API key y conexión.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('openai-api-key', apiKey);
    setShowSettings(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">🤖</span>
              Chat con AutoMix IA
              <span className="text-xs text-gray-400">({selectedModel})</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                ⚙️
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
              >
                🗑️
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {showSettings && (
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                OpenAI API Key:
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1"
                />
                <Button onClick={saveApiKey}>Guardar</Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Modelo:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Recomendado)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-4 border rounded-lg">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <span className="text-4xl mb-4 block">🤖</span>
              <p className="text-lg font-semibold">¡Hola! Soy AutoMix</p>
              <p className="text-sm mt-2">
                Pregúntame sobre estrategias de trading, análisis técnico, o cualquier decisión de apuestas.
                Tengo acceso completo a los datos del juego y puedo explicarte mis algoritmos.
              </p>
              {!apiKey && (
                <p className="text-yellow-600 mt-4 text-sm">
                  ⚠️ Configura tu API Key de OpenAI en ajustes para comenzar
                </p>
              )}
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-left mb-4">
              <div className="inline-block bg-gray-100 text-gray-900 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                  AutoMix está analizando...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Pregúntale a AutoMix sobre trading, análisis técnico, o estrategias..."
            className="flex-1 min-h-[60px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={!apiKey}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !apiKey}
            className="self-end"
          >
            {isLoading ? '⏳' : '📤'}
          </Button>
        </div>

        {!apiKey && (
          <p className="text-xs text-yellow-600 text-center">
            Necesitas configurar tu API Key de OpenAI para usar el chat
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
} 