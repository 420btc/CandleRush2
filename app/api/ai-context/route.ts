import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const gameData = await request.json();
    
    // Crear un contexto más detallado del juego
    const detailedContext = {
      // Información básica del juego
      gameInfo: {
        name: "CandleRush 2",
        description: "Juego de trading de criptomonedas con apuestas en tiempo real",
        currentSymbol: gameData.currentSymbol,
        timeframe: gameData.timeframe,
        currentPrice: gameData.currentPrice,
        gamePhase: gameData.gamePhase,
        userBalance: gameData.userBalance
      },
      
      // Análisis técnico disponible
      technicalAnalysis: {
        indicators: [
          "MACD (Moving Average Convergence Divergence)",
          "RSI (Relative Strength Index) - 33 períodos",
          "EMA (Exponential Moving Average) - 12, 26, 55, 200",
          "Golden Cross / Death Cross",
          "Niveles de Fibonacci",
          "ADX (Average Directional Index)",
          "Detección de valles alcistas/bajistas",
          "Análisis de tendencia de volumen",
          "Estructura de mercado SMC+"
        ],
        signalTypes: [
          "Señal de mayoría (últimas 65 velas)",
          "Señal RSI (sobrecompra/sobreventa)",
          "Señal MACD (cruce de líneas)",
          "Voto de valle (patrones de reversión)",
          "Voto de volumen (divergencias)",
          "Voto de whale trades (grandes operaciones)",
          "Voto ADX + memoria",
          "Voto de estructura de mercado"
        ]
      },
      
      // Sistema AutoMix
      autoMixSystem: {
        description: "Sistema de apuestas automatizado que utiliza múltiples indicadores técnicos",
        decisionProcess: [
          "1. Análisis de señales técnicas múltiples",
          "2. Votación ponderada entre indicadores",
          "3. Consulta de memoria histórica de patrones",
          "4. Aplicación de lógica de inversión si es necesario",
          "5. Ejecución de apuesta con apalancamiento"
        ],
        memorySystem: "Almacena resultados de combinaciones de señales para mejorar decisiones futuras",
        inversionLogic: "Invierte decisiones si detecta patrones perdedores recurrentes"
      },
      
      // Datos actuales del juego
      currentData: gameData,
      
      // Contexto de personalidad para la IA
      aiPersonality: {
        role: "AutoMix - IA de trading experta",
        traits: [
          "Analítico y basado en datos",
          "Educativo pero accesible",
          "Humor ocasional apropiado",
          "Transparente sobre limitaciones",
          "Enfocado en gestión de riesgo"
        ],
        expertise: [
          "Análisis técnico avanzado",
          "Gestión de riesgo en trading",
          "Psicología del trading",
          "Sistemas automatizados",
          "Interpretación de datos de mercado"
        ]
      }
    };
    
    return NextResponse.json(detailedContext);
  } catch (error) {
    console.error('Error processing AI context:', error);
    return NextResponse.json(
      { error: 'Failed to process context' },
      { status: 500 }
    );
  }
} 