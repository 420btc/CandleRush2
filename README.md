<p align="center">
  <img src="./public/portada.png" alt="CandleRush2 Portada" width="320" />
</p>

# 🕯️ **CandleRush2: Crypto Betting Game** — _Documentación Científica y Técnica_


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

## Fundamentos y Lógica de Apuestas

El sistema permite apostar sobre la dirección de la siguiente vela (alcista/bajista) usando diferentes estrategias:
- **Manual:** El usuario elige dirección y cantidad.
- **AutoMix:** Algoritmo multi-voto que pondera varios indicadores técnicos y patrones.

## AutoMix: Algoritmo Multi-Voto

### Indicadores y Señales
AutoMix pondera hasta 7 señales para decidir cada apuesta:
- **Mayoría de Velas:** ¿Más velas alcistas o bajistas en la ventana reciente?
- **RSI:** Señal "BULLISH" si RSI > 60, "BEARISH" si RSI < 40.
- **MACD:** Señal según cruce de líneas (alcista o bajista).
- **Fibonacci:** Voto alcista/bajista si el precio rebota en niveles clave.
- **Valle:** Detección de patrones de valle (apertura/cierre).
- **Tendencia General:** Cálculo sobre las últimas 70 velas.
- **Tendencia de Volumen:** Análisis de la evolución del volumen y su relación con la tendencia.

### Lógica de Decisión y Persistencia

1. **Votación proporcional:** Cada señal suma un voto a "BULLISH" o "BEARISH". Fibonacci suma medio voto.
2. **Zonas neutras:** Si no hay mayoría ni señal clara de RSI, la dirección se elige aleatoriamente.
3. **Desempate:** Si hay empate de votos, decide el MACD. Si tampoco hay MACD, elige aleatorio.
4. **Anti-persistencia:** Si las últimas 5 apuestas han sido iguales y todas pérdidas/liquidadas, la siguiente apuesta fuerza la dirección contraria.

#### Ejemplo práctico de secuencia de apuestas

Supón la siguiente serie de resultados:

| Nº | Mayoría | RSI   | MACD   | Valle | Fib | Tend. | Vol. | Decisión | Resultado |
|----|---------|-------|--------|-------|-----|-------|------|----------|-----------|
| 1  | BULLISH| BULLISH| BULLISH|  -    |  -  |  -    |  -   | BULLISH  | WIN       |
| 2  | BULLISH| null  | BEARISH|  -    |  -  |  -    |  -   | BULLISH  | LOSS      |
| 3  | BULLISH| null  | BEARISH|  -    |  -  |  -    |  -   | BULLISH  | LOSS      |
| 4  | BEARISH| BEARISH| BEARISH|  -    |  -  |  -    |  -   | BEARISH  | WIN       |
| 5  | null   | null  | BULLISH|  -    |  -  |  -    |  -   | (aleatorio)| LOSS     |
| 6  | null   | null  | BEARISH|  -    |  -  |  -    |  -   | (aleatorio)| WIN      |
| ...| ...    | ...   | ...    | ...   | ... | ...   | ...  | ...      | ...       |

- Cuando no hay mayoría ni RSI, la decisión es aleatoria.
- Si hay empate de votos, decide MACD.
- Si se pierde 5 veces seguidas en una dirección, la siguiente apuesta se invierte automáticamente.

### Persistencia y Transparencia

Todas las decisiones y señales quedan registradas en la memoria local, permitiendo auditar y analizar el comportamiento del algoritmo en cualquier momento.

## Componentes Clave

- **game-screen.tsx:** Pantalla principal y lógica de interacción.
- **bet-result-modal.tsx:** Muestra el resultado de cada apuesta, con desglose de señales.
- **bet-result-modal-automix-info.tsx:** Explica la decisión de AutoMix en detalle.
- **autoMixMemory.ts:** Gestión y almacenamiento de señales y resultados.
- **macd-decision.ts:** Núcleo del algoritmo de decisión multi-voto.

## Integración con Binance API

El sistema puede conectarse a la API de Binance para obtener datos de mercado en tiempo real, permitiendo simular apuestas sobre datos reales.

## Memorias y Transparencia

Cada decisión, señal y resultado se guarda en localStorage, permitiendo:
- Revisar el histórico de apuestas y señales.
- Auditar el comportamiento del algoritmo.
- Analizar patrones de éxito y error.

## Personalización y Extensión

Puedes modificar los umbrales de los indicadores, añadir nuevas señales o cambiar la lógica de votación fácilmente editando los módulos correspondientes.

## Créditos y Licencia

Desarrollado por el equipo de CandleRush2. Código abierto bajo licencia MIT.

---

¿Preguntas, sugerencias o mejoras? ¡Abre un issue o contribuye!
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
