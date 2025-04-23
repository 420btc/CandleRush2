<p align="center">
  <img src="./public/btcc.png" alt="CandleRush2 Logo" width="220" />
</p>

# CandleRush2: Crypto Betting Game

## Descripción General
CandleRush2 es una plataforma web gamificada donde los usuarios pueden apostar en tiempo real sobre el comportamiento de velas (candlesticks) de criptomonedas. El objetivo es predecir si la próxima vela será alcista (bullish) o bajista (bearish), apostando una cantidad de monedas virtuales. El juego integra datos de mercado en vivo, un sistema de logros, historial detallado de apuestas y un diseño atractivo e intuitivo.

---

## Características Principales

- **Apuestas en tiempo real:** Predice la dirección de la próxima vela en pares de criptomonedas populares y diferentes timeframes.
- **Modal de resultado de apuesta:** Visualiza el detalle de cada apuesta resuelta, incluyendo resultado (ganada/perdida), precios de apertura/cierre, y diferencia.
- **Historial de apuestas:** Consulta todas tus apuestas realizadas, con acceso rápido al detalle de cada una mediante un botón dedicado.
- **Sistema de logros:** Desbloquea logros por hitos y actividades dentro del juego.
- **Balance virtual y estadísticas:** Visualiza tu saldo, ganancias, pérdidas y estadísticas de desempeño.
- **Interfaz moderna y responsiva:** UI/UX optimizada para escritorio y móvil, con animaciones y feedback visual claro.

---

## Tecnologías Utilizadas

- **Frontend:** React + Next.js (App Router, Client Components)
- **UI:** TailwindCSS, Radix UI, Lucide Icons
- **Estado global:** React Context API
- **Datos de mercado:** Integración con Binance API (WebSocket y REST para velas históricas y en tiempo real)
- **Autenticación:** (Opcional, según configuración)

---

## Estructura del Proyecto

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
├── package.json               # Dependencias y scripts
└── README.md                  # Este archivo
```

---

## Instalación y Puesta en Marcha

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

## Uso de la Aplicación

- **Apostar:** Selecciona el par de criptomoneda y timeframe. Haz tu predicción (alcista/bajista) y apuesta una cantidad.
- **Ver resultados:** Cuando una apuesta se resuelve, aparecerá un modal con el resultado. Puedes revisar resultados pasados en el historial.
- **Logros y estadísticas:** Consulta el panel de usuario para ver tu progreso y estadísticas.

---

## Personalización y Extensión

- **Agregar nuevos pares/timeframes:** Modifica los arrays `AVAILABLE_SYMBOLS` y `AVAILABLE_TIMEFRAMES` en `game-controls.tsx`.
- **Cambiar lógica de premios:** Ajusta el cálculo de ganancias/pérdidas en el contexto del juego.
- **Integrar autenticación:** Implementa el contexto de auth y enlaza con tu backend si lo deseas.
- **Internacionalización:** La UI está preparada para textos en español, pero puedes adaptar fácilmente a otros idiomas.

---

## Contribución

¡Pull requests y sugerencias son bienvenidas! Si encuentras un bug o tienes una idea para mejorar el juego, abre un issue o envía tu PR siguiendo las buenas prácticas del repositorio.

---

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

---

## Créditos y Reconocimientos

- Inspirado por la emoción de los mercados financieros y la gamificación educativa.
- Gracias a las librerías open source que hacen posible este proyecto: React, Next.js, TailwindCSS, Radix UI, Lucide Icons y Binance API.
- **Autor:** Carlos Freire

---

## Contacto

¿Dudas o sugerencias? Puedes contactarnos vía GitHub Issues o en el correo asociado al repo.

**Autor principal:** Carlos Freire
