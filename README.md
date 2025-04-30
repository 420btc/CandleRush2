<p align="center">
  <img src="./public/portada.png" alt="CandleRush2 Portada" width="320" />
</p>

# 🕯️ **CandleRush2: Crypto Betting Game** — _Documentación Científica y Técnica_

---



# Tabla de Contenidos
1. [Introducción General](#introducción-general)
2. [Arquitectura y Estructura del Proyecto](#arquitectura-y-estructura-del-proyecto)
3. [Fundamentos Matemáticos y Científicos](#fundamentos-matemáticos-y-científicos)
4. [Sistema de Apuestas y Resolución](#sistema-de-apuestas-y-resolución)
5. [AutoMix: Algoritmo de Decisión Multi-Voto](#automix-algoritmo-de-decisión-multi-voto)
    - [Desglose de las 6 Señales](#desglose-de-las-6-señales)
    - [Lógica de Votación Proporcional](#lógica-de-votación-proporcional)
    - [Ejemplo Matemático y Persistencia](#ejemplo-matemático-y-persistencia)
6. [Componentes Clave y Canvas](#componentes-clave-y-canvas)
    - [game-screen.tsx](#game-screentsx)
    - [candlestick-chart.tsx](#candlestick-charttsx)
    - [bet-result-modal.tsx](#bet-result-modaltsx)
    - [autoMixMemory.ts](#automixmemoryts)
    - [macd-decision.ts](#macd-decisionts)
7. [Integración con Binance API](#integración-con-binance-api)
8. [Memorias, Transparencia y Análisis](#memorias-transparencia-y-análisis)
9. [Extensión, Personalización y FAQ](#extensión-personalización-y-faq)
10. [Créditos y Licencia](#créditos-y-licencia)

---



# Introducción General
CandleRush2 es una plataforma gamificada de predicción de mercados, donde los usuarios apuestan sobre el comportamiento de velas japonesas (candlesticks) en criptomonedas. El objetivo es ofrecer una experiencia educativa, transparente y científicamente fundamentada, combinando análisis técnico, probabilidad y gamificación.

---



# Arquitectura y Estructura del Proyecto

```
crypto-betting/
├── app/                       # Rutas y layout principal
├── components/                # Componentes UI y de juego
│   ├── game/                  # Lógica y UI del juego principal
│   └── ui/                    # Componentes de interfaz reutilizables
├── context/                   # Contextos globales (juego, auth, logros)
├── hooks/                     # Custom hooks
├── lib/                       # Lógica de integración externa (API Binance)
├── public/                    # Archivos estáticos
├── styles/                    # Estilos globales
├── types/                     # Tipos TypeScript compartidos
├── utils/                     # Utilidades matemáticas, memoria y lógica de señales
├── package.json               # Dependencias y scripts
└── README.md                  # Este archivo
```

---



# Fundamentos Matemáticos y Científicos

#

# ¿Qué es un Candlestick?
Un candlestick es una representación gráfica de la evolución del precio de un activo en un intervalo de tiempo. Cada vela contiene:
- **open**: precio de apertura
- **close**: precio de cierre
- **high**: precio máximo
- **low**: precio mínimo
- **volume**: volumen negociado

La interpretación estadística de patrones de velas es la base de múltiples estrategias de trading cuantitativo.

#

# Probabilidad y Decisión
El juego utiliza principios de probabilidad y estadística para tomar decisiones automáticas (AutoMix), simulando el razonamiento de un operador cuantitativo, pero de forma transparente y reproducible.

---



# Sistema de Apuestas y Resolución

- **Apuestas manuales**: El usuario decide dirección y cantidad.
- **Apuestas automáticas**: Basadas en señales programadas.
- **Apuestas AutoMix**: Decisión tomada por el algoritmo multi-voto, con desglose visible de cada señal.

**Resolución:**  
Las apuestas se resuelven al cierre de la vela objetivo. El resultado puede ser:
- **WON**: Predicción acertada.
- **LOST**: Predicción fallida.
- **LIQUIDATED**: Liquidación anticipada por margen insuficiente (si se activa el apalancamiento).

El modal de resultado muestra el desglose de la apuesta, y para AutoMix, un análisis detallado de los votos y señales que llevaron a la decisión.

---



# AutoMix: Algoritmo de Decisión Multi-Voto

AutoMix es el corazón científico del sistema. Su objetivo es tomar decisiones de apuesta basadas en la síntesis de múltiples señales técnicas, cada una con fundamento matemático y estadístico. El sistema es transparente y auditable: cada decisión y señal queda registrada para análisis posterior.

#

# Desglose de las 6 Señales (Votos)

##

# 1. **Mayoría de Velas**
- **Cálculo:** Se cuentan las últimas 65 velas (excluyendo la más reciente). Si hay más bullish (cierre > apertura), se suma un voto bullish; si hay más bearish, un voto bearish.
- **Fundamento:** La tendencia reciente suele persistir por inercia de mercado.

##

# 2. **RSI (Relative Strength Index)**
- **Cálculo:**
  \[
  RSI = 100 - \frac{100}{1 + RS}
  \]
  donde \( RS = \frac{\text{ganancias medias}}{\text{pérdidas medias}} \) en las últimas 33 velas.
- **Interpretación:**
  - RSI > 70: sobrecompra → voto bearish.
  - RSI < 30: sobreventa → voto bullish.

##

# 3. **MACD**
- **Cálculo:**
  - EMA12 y EMA26 sobre los cierres.
  - MACD = EMA12 - EMA26.
  - Señal = EMA9 del MACD.
  - Si MACD cruza sobre señal → bullish, bajo señal → bearish.
- **Fundamento:** El MACD es un indicador de momentum y tendencia ampliamente validado en literatura financiera.

##

# 4. **Valle (Apertura/Cierre)**
- **Cálculo:** Detección de patrones de reversión (valle alcista o bajista) en la serie temporal de velas. Se analizan secuencias específicas de máximos/mínimos relativos y aperturas/cierres.
- **Fundamento:** Los valles marcan posibles puntos de giro, basados en la teoría de ondas y patrones de reversión.

##

# 5. **Tendencia de Velas**
- **Cálculo:** Últimas 70 velas, mayoría bullish o bearish.
- **Fundamento:** Confirma tendencia de fondo y reduce el ruido de fluctuaciones cortas.

##

# 6. **Tendencia de Volumen**
- **Cálculo:**
  - Divide las últimas 30 velas en dos mitades de 15.
  - Calcula el promedio de volumen de cada mitad.
  - Si el volumen cae en tendencia alcista (mayoría bullish), sugiere agotamiento → voto bearish.
  - Si el volumen sube en tendencia alcista, refuerza la tendencia → voto bullish.
  - Lo mismo pero invertido para mayoría bearish.
- **Fundamento:** El volumen es un validador de la fortaleza de la tendencia. Divergencias entre precio y volumen suelen anticipar giros.

---

#

# Lógica de Votación Proporcional

Cada señal suma un voto a bullish o bearish. La decisión final es probabilística:

\[
P(\text{bullish}) = \frac{\text{votos bullish}}{\text{total votos}}
\]

La dirección de la apuesta se decide con un random ponderado por esa proporción. Esto introduce variabilidad, simulando la incertidumbre real de los mercados.

**Ejemplo:**  
Si hay 4 votos bullish y 2 bearish, la probabilidad de apostar bullish es 66.6%.

---

#

# Ejemplo Matemático y Persistencia

Supón que para una apuesta AutoMix se obtienen los siguientes votos:

- Mayoría de velas: BULLISH
- RSI: BEARISH
- MACD: BULLISH
- Valle: BULLISH
- Tendencia de velas: BEARISH
- Tendencia de volumen: BULLISH

Esto da 4 votos bullish y 2 bearish. Se almacena en memoria:

```json
{
  "timestamp": 1681234567890,
  "direction": "BULLISH",
  "result": "WIN",
  "majoritySignal": "BULLISH",
  "rsiSignal": "BEARISH",
  "macdSignal": "BULLISH",
  "rsi": 28.5,
  "macd": 0.0042,
  "macdSignalLine": 0.0039
}
```

Además, se guarda la tendencia de velas y volumen en memorias especializadas para análisis avanzado y backtesting.

---

#

# Justificación Estadística y Científica

Cada señal está fundamentada en décadas de investigación en análisis técnico y cuantitativo:
- **Mayoría y tendencia:** Capturan la inercia y persistencia estadística de tendencias.
- **RSI y MACD:** Indicadores validados empíricamente en mercados líquidos.
- **Volumen:** La teoría de Dow y estudios modernos muestran que el volumen precede al precio.
- **Valles:** Basados en patrones de reversión, ampliamente usados en algoritmos de trading algorítmico.

El sistema es auditable: toda decisión queda registrada y puede analizarse para ajustar parámetros o detectar sesgos.

---

crypto-betting/
├── app/                       # Rutas y layout principal
├── components/                # Componentes UI y de juego
│   ├── game/                  # Lógica y UI del juego principal
│   └── ui/                    # Componentes de interfaz reutilizables
├── context/                   # Contextos globales (juego, auth, logros)
├── hooks/                     # Custom hooks
├── lib/                       # Lógica de integración externa (API Binance)
├── public/                    # Archivos estáticos
├── styles/                    # Estilos globales
├── types/                     # Tipos TypeScript compartidos
├── package.json               # Dependencias y scripts
└── README.md                  # Este archivo
```

---



# 6. Componentes Clave y Canvas

#

# 6.1 `game-screen.tsx`: Orquestador Principal
Gestiona el ciclo de vida del juego, estado global (apuestas, historial, saldo, logros) y renderiza subcomponentes clave. Orquesta la llegada de velas nuevas, resolución de apuestas y actualización de la UI. Utiliza React Context para compartir estado entre componentes y asegurar la sincronización de datos en tiempo real.

#

# 6.2 `candlestick-chart.tsx`: Renderizado Científico en Canvas
Dibuja las velas, overlays de señales y volumen en un `<canvas>` optimizado. Permite zoom, drag y overlays interactivos. Visualiza señales AutoMix (iconos de votos, flechas de tendencia). Utiliza referencias y memoización para máximo rendimiento y experiencia fluida.

#

# 6.3 `bet-result-modal.tsx`: Modal de Transparencia
Muestra el resultado de la apuesta (ganada, perdida, liquidada) con todos los detalles numéricos. Si la apuesta es AutoMix, muestra el desglose de votos y señales. El modal solo aparece una vez al resolverse la apuesta, nunca al recargar (lógica de estado persistente).

#

# 6.4 `autoMixMemory.ts`: Persistencia y Auditoría
Gestiona la escritura y lectura de memorias de AutoMix y tendencias de volumen usando `localStorage`. Permite hasta 666 entradas de tendencias, 333 de volumen. Facilita análisis, backtesting y visualizaciones históricas.

#

# 6.5 `macd-decision.ts`: Núcleo Algorítmico
Implementa la lógica de cálculo de señales técnicas (RSI, MACD, mayoría, etc) y la función de decisión de AutoMix. Modular y extensible para añadir nuevas señales. Incluye cálculos matemáticos de EMAs, cruces y generación de señales.

---



# 7. Integración con Binance API

- **Datos históricos:** Obtenidos por REST para poblar el gráfico inicial.
- **Datos en tiempo real:** WebSocket para nuevas velas y actualizaciones de precios/volúmenes.
- **Gestión de reconexión:** Reintentos automáticos y sincronización del estado.
- **Sincronización:** Garantiza cierre de vela y resolución de apuestas atómicos y sin lag perceptible.

**Ejemplo de flujo:**
1. El usuario selecciona par y timeframe.
2. Se descargan velas históricas.
3. Se abre WebSocket para la próxima vela.
4. Al cerrar la vela, se resuelve la apuesta y se actualiza el gráfico.

---



# 8. Memorias, Transparencia y Análisis

- **Persistencia:** Todas las decisiones de AutoMix y tendencias se almacenan en `localStorage` estructurado.
- **Auditoría:** El usuario puede revisar el desglose de cada apuesta AutoMix, accediendo a valores numéricos y señales.
- **Backtesting:** Las memorias permiten analizar performance histórico, calcular winrate, drawdown, ajustar parámetros.
- **Visualización:** Graficar tendencias de acierto, distribución de señales, correlaciones entre indicadores.
- **Ejemplo de análisis:**
  - ¿Qué señal predice mejor el resultado?
  - ¿Hay sesgo en algún tipo de mercado?

---



# 9. Extensión, Personalización y FAQ

#

# Extensión
- **Nuevos pares/timeframes:** Edita los arrays `AVAILABLE_SYMBOLS` y `AVAILABLE_TIMEFRAMES` en `game-controls.tsx`.
- **Nuevas señales AutoMix:** Implementa lógica en `macd-decision.ts` y actualiza tipos en `autoMixMemory.ts`.
- **Cambiar reglas de votación:** Modifica la función de decisión proporcional en `macd-decision.ts`.
- **Internacionalización:** Adapta textos en la UI y añade soporte para nuevos idiomas.

#

# Personalización
- **Ajustar lógica de premios:** Modifica el cálculo de payout en el contexto del juego.
- **Integrar autenticación:** Implementa el contexto de auth y enlaza con tu backend.

#

# FAQ
- **¿Por qué el modal de resultado aparece solo una vez?**
  - Por UX: evita mostrar información redundante y molesta.
- **¿Qué pasa si pierdo la conexión?**
  - El sistema reintenta la conexión y sincroniza el estado al reconectar.
- **¿Puedo analizar mis apuestas pasadas?**
  - Sí, accede al historial y a las memorias de AutoMix para análisis avanzado.

---



# 10. Créditos y Licencia

- **Inspiración:** Mercados financieros y gamificación educativa.
- **Tecnologías:** React, Next.js, TailwindCSS, Radix UI, Lucide Icons, Binance API.
- **Autor principal:** Carlos Freire
- **Licencia:** MIT. Consulta el archivo LICENSE para más detalles.
- **Contacto:** Vía GitHub Issues o correo asociado al repo.

---



# Instalación y Puesta en Marcha

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/420btc/CandleRush2.git
   cd CandleRush2
   ```
2. **Instala dependencias:**
   ```bash
   npm install
   # o
   pnpm install
   ```
3. **Configura variables de entorno:**
   - Si necesitas claves para la API de Binance u otros servicios, crea un archivo `.env.local` siguiendo el ejemplo de `.env.example` (si existe).
4. **Ejecuta el servidor de desarrollo:**
   ```bash
   npm run dev
   # o
   pnpm dev
   ```
5. **Abre el navegador:**
   - Accede a `http://localhost:3000`

---



# Uso de la Aplicación

- **Apostar:** Selecciona el par de criptomoneda y timeframe. Haz tu predicción (alcista/bajista) y apuesta una cantidad.
- **Ver resultados:** Cuando una apuesta se resuelve, aparecerá un modal con el resultado. Puedes revisar resultados pasados en el historial.
- **Logros y estadísticas:** Consulta el panel de usuario para ver tu progreso y estadísticas.

---



# Personalización y Extensión

- **Agregar nuevos pares/timeframes:** Modifica los arrays `AVAILABLE_SYMBOLS` y `AVAILABLE_TIMEFRAMES` en `game-controls.tsx`.
- **Cambiar lógica de premios:** Ajusta el cálculo de ganancias/pérdidas en el contexto del juego.
- **Integrar autenticación:** Implementa el contexto de auth y enlaza con tu backend si lo deseas.
- **Internacionalización:** La UI está preparada para textos en español, pero puedes adaptar fácilmente a otros idiomas.

---



# Contribución

¡Pull requests y sugerencias son bienvenidas! Si encuentras un bug o tienes una idea para mejorar el juego, abre un issue o envía tu PR siguiendo las buenas prácticas del repositorio.

---



# Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

---



# Créditos y Reconocimientos

- Inspirado por la emoción de los mercados financieros y la gamificación educativa.
- Gracias a las librerías open source que hacen posible este proyecto: React, Next.js, TailwindCSS, Radix UI, Lucide Icons y Binance API.
- **Autor:** Carlos Freire

---



# Contacto

¿Dudas o sugerencias? Puedes contactarnos vía GitHub Issues o en el correo asociado al repo.

**Autor principal:** Carlos Pastor Freire
