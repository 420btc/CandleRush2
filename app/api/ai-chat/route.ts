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

FORMATO DE RESPUESTA OBLIGATORIO:
- MÁXIMO 2 párrafos cortos
- MÁXIMO 400 caracteres total (para lectura en 7-8 segundos)
- Resalta precios con formato: **$PRECIO** para destacar visualmente
- Sé conciso pero informativo
- Enfócate en lo más importante para el trader`
        };
      }
      return msg;
    });

    const requestBody = {
      model: model || 'gpt-4o-mini',
      messages: modifiedMessages,
      max_tokens: 200, // Reducido para respuestas más cortas
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