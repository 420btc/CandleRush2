# CandleRush2: Crypto Betting Game

Bienvenido a la documentación científica y técnica de CandleRush2, el juego de apuestas algorítmicas sobre velas y tendencias del mercado cripto.

CandleRush2 es un simulador donde puedes apostar sobre la dirección futura de las velas en mercados de criptomonedas. El sistema permite experimentar tanto con apuestas manuales como con estrategias automáticas, mostrando siempre la lógica detrás de cada decisión para máxima transparencia.

---

## Índice

- [Fundamentos Matemáticos y Científicos](#fundamentos-matemáticos-y-científicos)
- [Sistema de Apuestas y Resolución](#sistema-de-apuestas-y-resolución)
- [AutoMix: Algoritmo de Decisión Multi-Voto](#automix-algoritmo-de-decisión-multi-voto)
  - [Desglose de las 6 Señales](#desglose-de-las-6-señales)
  - [Lógica de Votación Proporcional](#lógica-de-votación-proporcional)
  - [Ejemplo Matemático y Persistencia](#ejemplo-matemático-y-persistencia)
- [Componentes Clave y Canvas](#componentes-clave-y-canvas)
  - [game-screen.tsx](#game-screentsx)
  - [candlestick-chart.tsx](#candlestick-charttsx)
  - [bet-result-modal.tsx](#bet-result-modaltsx)
  - [autoMixMemory.ts](#automixmemoryts)
  - [macd-decision.ts](#macd-decisionts)
- [Integración con Binance API](#integración-con-binance-api)
- [Memorias, Transparencia y Análisis](#memorias-transparencia-y-análisis)
- [Extensión, Personalización y FAQ](#extensión-personalización-y-faq)
- [Créditos y Licencia](#créditos-y-licencia)

---

## Fundamentos Matemáticos y Científicos

Explicación de los indicadores técnicos, fórmulas y lógica matemática utilizada en el sistema (RSI, MACD, Fibonacci, etc.).

---

## Sistema de Apuestas y Resolución

Descripción del flujo de una apuesta: desde la entrada, la toma de decisión, hasta la resolución (ganada, perdida, liquidada). Ejemplos prácticos y explicación de cómo se determina el resultado.

---

## AutoMix: Algoritmo de Decisión Multi-Voto

Explicación general del algoritmo AutoMix, su objetivo y cómo integra múltiples señales para decidir.

### Desglose de las 6 Señales

Detalle de cada señal: cómo se calcula, qué representa y cómo influye en la decisión.

### Lógica de Votación Proporcional

Cómo se ponderan los votos de cada señal y cómo se llega a una decisión final.

### Ejemplo Matemático y Persistencia

Ejemplo concreto de una secuencia de apuestas, mostrando cómo AutoMix toma decisiones y cómo actúa la lógica anti-persistencia.

---

## Componentes Clave y Canvas

Breve descripción de los principales archivos y componentes visuales.

### game-screen.tsx
Pantalla principal del juego y lógica de interacción.

### candlestick-chart.tsx
Componente que dibuja el gráfico de velas y visualiza las señales.

### bet-result-modal.tsx
Muestra el resultado de cada apuesta y el desglose de señales.

### autoMixMemory.ts
Módulo de almacenamiento de señales y resultados.

### macd-decision.ts
Lógica del algoritmo de decisión multi-voto basada en MACD.

---

## Integración con Binance API

Cómo se conecta el sistema a la API de Binance para obtener datos de mercado en tiempo real.

---

## Memorias, Transparencia y Análisis

Explicación sobre cómo se almacenan las decisiones, cómo auditar el histórico y cómo analizar patrones de éxito/error.

---

## Extensión, Personalización y FAQ

Guía para modificar umbrales, añadir señales, personalizar la lógica y preguntas frecuentes.

---

## Créditos y Licencia

Desarrollado por el equipo de CandleRush2. Código abierto bajo licencia MIT.

¿Preguntas, sugerencias o mejoras? ¡Abre un issue o contribuye!


- **Mayoría de velas:** Determina si han predominado las velas alcistas o bajistas en la ventana reciente.
- **RSI:** Si el RSI supera 60 es señal alcista, si baja de 40 es bajista.
- **MACD:** Analiza el cruce de medias para identificar la tendencia.
- **Fibonacci:** Detecta rebotes en niveles clave del precio.
- **Valle:** Busca patrones de reversión en la serie de velas.
- **Tendencia general:** Calcula la dirección predominante en las últimas 70 velas.
- **Tendencia de volumen:** Compara cómo evoluciona el volumen respecto al precio.

La decisión final se toma sumando los votos de cada señal. Si hay empate, decide el MACD. Si no hay mayoría ni RSI claro, la dirección se elige aleatoriamente. Si el sistema pierde cinco apuestas seguidas en una dirección, la siguiente apuesta se fuerza en la dirección contraria para evitar rachas largas perdedoras.

### Ejemplo de funcionamiento de AutoMix

Imagina que el sistema analiza las señales y obtiene:
- Mayoría de velas: alcista
- RSI: neutro
- MACD: bajista
- Valle: sin señal
- Fibonacci: sin señal
- Tendencia general: alcista
- Tendencia de volumen: bajista

En este caso, habría dos votos alcistas y dos bajistas. Como hay empate, el sistema mira el MACD, que es bajista, y finalmente apuesta bajista.

Si todas las señales fueran neutras, la apuesta se decidiría al azar.

Si el sistema apostara cinco veces seguidas en la misma dirección y perdiera todas, la sexta apuesta sería forzada en la dirección opuesta.

Todas las decisiones quedan registradas para su análisis posterior.

---

## Componentes Clave

- game-screen.tsx: Pantalla principal y lógica de interacción.
- bet-result-modal.tsx: Muestra el resultado de cada apuesta y el desglose de señales.
- bet-result-modal-automix-info.tsx: Explica la decisión de AutoMix en detalle.
- autoMixMemory.ts: Almacenamiento de señales y resultados.
- macd-decision.ts: Núcleo del algoritmo de decisión multi-voto.

---

## Integración con Binance API

El sistema puede conectarse a la API de Binance para obtener datos de mercado en tiempo real y simular apuestas sobre datos reales.

---

## Memorias y Transparencia

Cada decisión, señal y resultado se guarda en localStorage. Así puedes revisar el histórico, auditar el algoritmo y analizar patrones de éxito y error fácilmente.

---

## Personalización y Extensión

Puedes modificar los umbrales de los indicadores, añadir nuevas señales o cambiar la lógica de votación editando los módulos correspondientes.

---

## Créditos y Licencia

Desarrollado por el equipo de CandleRush2. Código abierto bajo licencia MIT.



# Introducción General
CandleRush2 es una plataforma gamificada de predicción de mercados, donde los usuarios apuestan sobre el comportamiento de velas japonesas (candlesticks) en criptomonedas. El objetivo es ofrecer una experiencia educativa, transparente y científicamente fundamentada, combinando análisis técnico, probabilidad y gamificación.

---



# Arquitectura y Estructura del Proyecto

El proyecto CandleRush2 está organizado para facilitar el desarrollo, la escalabilidad y la comprensión del código. A continuación se describe la estructura principal de carpetas y su propósito:

- **app/**: Contiene las rutas y el layout principal de la aplicación.
- **components/**: Incluye todos los componentes de la interfaz de usuario y del juego.
    - Dentro de esta carpeta, `game/` alberga la lógica y la UI específica del juego principal.
    - La subcarpeta `ui/` contiene componentes reutilizables de la interfaz.
- **context/**: Aquí se encuentran los contextos globales, como el contexto de juego, autenticación de usuario y logros.

Esta organización permite separar claramente la lógica de presentación, la gestión de estado global y los módulos reutilizables, haciendo el desarrollo más eficiente y el mantenimiento más sencillo.

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
