import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();
    
    console.log('🔍 API recibió:', {
      model,
      messagesCount: messages?.length,
      hasMessages: !!messages
    });
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ OpenAI API key no configurada');
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      console.error('❌ Messages array requerido');
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Modificar el último mensaje del sistema para incluir restricciones de formato
    const modifiedMessages = messages.map((msg, index) => {
      if (msg.role === 'system' && index === 0) {
        return {
          ...msg,
          content: msg.content + `

FORMATO DE RESPUESTA OBLIGATORIO - MODO VISUAL:
📊 Responde SIEMPRE en formato de lista con emojis
🎯 MÁXIMO 300 caracteres total
📝 Estructura JSON visual:

🔥 MERCADO: [emoji] $PRECIO [tendencia]
📈 POSICIÓN: [emoji correcto] [estado] [PnL]
⚡ SEÑALES: [emoji] [indicador] [emoji] [indicador]
🎲 PRÓXIMO: [emoji] [predicción corta]
💡 CONSEJO: [emoji] [acción recomendada]

IMPORTANTE - LÓGICA DEL JUEGO:
- BULLISH gana si vela cierra ARRIBA del precio de apertura (close > open)
- BEARISH gana si vela cierra ABAJO del precio de apertura (close < open)
- Si apostaste BEARISH y el precio actual está bajando = BUENAS NOTICIAS (vas ganando)
- Si apostaste BULLISH y el precio actual está subiendo = BUENAS NOTICIAS (vas ganando)
- PnL se calcula: (precio_actual - precio_entrada) * leverage * dirección_apuesta
- NO recomiendes reducir riesgo si la posición va ganando

INDICADORES DE POSICIÓN CORRECTOS - MUY IMPORTANTE:
- BULLISH/BULL = SIEMPRE 🟢 (bola verde) - SIN EXCEPCIÓN
- BEARISH/BEAR = SIEMPRE 🔴 (bola roja) - SIN EXCEPCIÓN
- El color del emoji NO depende de si está ganando o perdiendo
- El color del emoji SOLO indica el tipo de posición (BULL=verde, BEAR=rojo)
- Si está perdiendo, usa texto como "¡Perdiendo!" pero mantén el color correcto

EJEMPLOS CORRECTOS:
- Posición BULL ganando: 🟢 BULL $10 +5.2% ¡Ganando!
- Posición BULL perdiendo: 🟢 BULL $10 -3.1% ¡Perdiendo!
- Posición BEAR ganando: 🔴 BEAR $20 +2.8% ¡Ganando!
- Posición BEAR perdiendo: 🔴 BEAR $20 -1.5% ¡Perdiendo!

Ejemplo:
🔥 MERCADO: 📈 $43,250 +0.8%
📈 POSICIÓN: 🟢 BULL $50 -2.1% ¡Perdiendo!
⚡ SEÑALES: 🔴 RSI:72 🟡 MACD:neutro
🎲 PRÓXIMO: ⬇️ Sigue bajando
💡 CONSEJO: 🚀 Mantén posición

SIN texto adicional, SOLO la estructura con emojis.`
        };
      }
      return msg;
    });

    const requestBody = {
      model: model || 'gpt-4o-mini',
      messages: modifiedMessages,
      max_tokens: 150, // Reducido para respuestas más cortas
      temperature: 0.7
    };
    
    console.log('🔍 Enviando a OpenAI:', {
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      maxTokens: requestBody.max_tokens
    });

    // Llamar a OpenAI API desde el servidor
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenAI API Error:', response.status, errorData);
      
      return NextResponse.json(
        { 
          error: `OpenAI API Error: ${response.status}`,
          details: errorData.error?.message || response.statusText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Respuesta de OpenAI recibida:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      firstChoice: data.choices?.[0],
      content: data.choices?.[0]?.message?.content?.substring(0, 100) + '...'
    });
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}