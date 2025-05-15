import React, { useState, useEffect, useRef } from 'react';
import { useGame } from "@/context/game-context";

const GameScreen = () => {
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  const [betAmount, setBetAmount] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [lastFlyupAmount, setLastFlyupAmount] = useState(0);
  const [showFlyup, setShowFlyup] = useState(false);
  const betAudioRef = useRef<HTMLAudioElement>(null);

  // Obtener estado y funciones del contexto
  const { 
    placeBet, 
    gamePhase: gamePhaseContext, 
    currentCandleBets: currentCandleBetsContext, 
    userBalance: userBalanceContext,
    autoMix,
    toggleAutoMix
  } = useGame();

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/automix-worker.js')
        .then((registration) => {
          console.log('AutoMix Service Worker registered:', registration);
          setServiceWorkerRegistered(true);
          
          // Escuchar mensajes del Service Worker
          const messageHandler = (event: MessageEvent) => {
            if (event.data.type === 'AUTO_MIX_DECISION') {
              const { direction, timestamp } = event.data.decision;
              console.log('[AutoMix] Recibida decisión del Service Worker:', direction);
              
              // Verificar si podemos hacer la apuesta
              if (
                gamePhaseContext === 'BETTING' &&
                currentCandleBetsContext < 1 &&
                userBalanceContext >= 1 &&
                betAmount >= 1
              ) {
                // Ejecutar la apuesta
                if (betAudioRef.current) {
                  betAudioRef.current.currentTime = 0;
                  betAudioRef.current.play().catch(console.error);
                }
                
                placeBet(direction, betAmount, leverage, { esAutomatica: 'Sí', autoType: 'MIX' });
                setLastFlyupAmount(betAmount);
                setShowFlyup(true);
              }
            }
          };
          
          navigator.serviceWorker.addEventListener('message', messageHandler);
          
          // Limpiar el event listener al desmontar
          return () => {
            navigator.serviceWorker.removeEventListener('message', messageHandler);
          };
        })
        .catch((error) => {
          console.error('Error registering AutoMix Service Worker:', error);
        });
    }
  }, [gamePhaseContext, currentCandleBetsContext, userBalanceContext, betAmount, leverage, placeBet]);

  // Sincronizar el estado de AutoMix con el Service Worker
  useEffect(() => {
    if (!serviceWorkerRegistered || !navigator.serviceWorker.controller) return;

    // El estado de AutoMix ahora se maneja en el contexto global
    // Solo nos aseguramos de que el Service Worker esté al día
    if (autoMix) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ACTIVATE_AUTO_MIX',
        config: {
          betAmount: userBalanceContext >= 1 ? 1 : 0,
          leverage: 1,
          userBalance: userBalanceContext
        }
      });
    } else {
      navigator.serviceWorker.controller.postMessage({
        type: 'DEACTIVATE_AUTO_MIX'
      });
    }
  }, [autoMix, serviceWorkerRegistered, userBalanceContext]);

  return (
    <div className="game-screen">
      {/* ... existing JSX ... */}
      <audio ref={betAudioRef} src="/sounds/bet.mp3" preload="auto" />
      {showFlyup && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-green-500 animate-flyup"
          onAnimationEnd={() => setShowFlyup(false)}
        >
          +{lastFlyupAmount}
        </div>
      )}
    </div>
  );
};

export default GameScreen;