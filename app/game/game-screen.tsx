import React, { useState, useEffect, useRef } from 'react';
import { useGame } from "@/context/game-context";

const GameScreen = () => {
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  const [betAmount, setBetAmount] = useState(1);
  const [leverage, setLeverage] = useState(2000);
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
    console.log('[DEBUG] Iniciando registro del Service Worker...');
    console.log('[DEBUG] Location:', window.location.href);
    console.log('[DEBUG] Protocol:', window.location.protocol);
    console.log('[DEBUG] Hostname:', window.location.hostname);
    
    if ('serviceWorker' in navigator) {
      console.log('[DEBUG] Service Worker soportado, registrando automix-worker.js');
      
      // Verificar si estamos en un entorno seguro
      const isSecureContext = window.isSecureContext;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      console.log('[DEBUG] Secure context:', isSecureContext);
      console.log('[DEBUG] Is localhost:', isLocalhost);
      
      if (!isSecureContext && !isLocalhost) {
        console.error('[DEBUG] Service Workers requieren HTTPS o localhost');
        return;
      }
      
      navigator.serviceWorker.register('/automix-worker.js')
        .then((registration) => {
          console.log('[DEBUG] AutoMix Service Worker registered:', registration);
          console.log('[DEBUG] Registration scope:', registration.scope);
          console.log('[DEBUG] Registration state:', registration.installing ? 'installing' : registration.waiting ? 'waiting' : registration.active ? 'active' : 'unknown');
          
          // Esperar a que el Service Worker esté activo
          if (registration.installing) {
            console.log('[DEBUG] Service Worker instalando...');
            registration.installing.addEventListener('statechange', () => {
              console.log('[DEBUG] Service Worker state changed:', registration.installing?.state);
              if (registration.installing?.state === 'activated') {
                console.log('[DEBUG] Service Worker activado');
                setServiceWorkerRegistered(true);
              }
            });
          } else if (registration.waiting) {
            console.log('[DEBUG] Service Worker esperando...');
            setServiceWorkerRegistered(true);
          } else if (registration.active) {
            console.log('[DEBUG] Service Worker ya activo');
            setServiceWorkerRegistered(true);
          }
          
          // Forzar activación si está esperando
          if (registration.waiting) {
            console.log('[DEBUG] Forzando activación del Service Worker...');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          // Escuchar mensajes del Service Worker
          const messageHandler = async (event: MessageEvent) => {
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
                
                const bet = await placeBet(direction, betAmount, leverage, { esAutomatica: 'Sí', autoType: 'MIX' });
                if (bet) {
                  setLastFlyupAmount(betAmount);
                  setShowFlyup(true);
                }
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
          console.error('[DEBUG] Error registering AutoMix Service Worker:', error);
          console.error('[DEBUG] Error details:', error.message);
          console.error('[DEBUG] Error stack:', error.stack);
        });
    } else {
      console.error('[DEBUG] Service Worker no soportado en este navegador');
    }
  }, [gamePhaseContext, currentCandleBetsContext, userBalanceContext, betAmount, leverage, placeBet]);

  // Sincronizar el estado de AutoMix con el Service Worker
  useEffect(() => {
    console.log('[DEBUG] useEffect sincronización - serviceWorkerRegistered:', serviceWorkerRegistered);
    console.log('[DEBUG] useEffect sincronización - navigator.serviceWorker.controller:', navigator.serviceWorker.controller);
    
    if (!serviceWorkerRegistered || !navigator.serviceWorker.controller) {
      console.log('[DEBUG] No se puede sincronizar - SW no registrado o no hay controller');
      return;
    }

    console.log('[DEBUG] Sincronizando estado AutoMix:', { autoMix, userBalance: userBalanceContext });

    if (autoMix) {
      const config = {
        betAmount: Math.max(1, Math.min(userBalanceContext * 0.01, 10)), // 1% del balance, mínimo 1, máximo 10
        leverage: leverage || 2000,
        userBalance: userBalanceContext
      };
      console.log('[DEBUG] Enviando ACTIVATE_AUTO_MIX con config:', config);
      navigator.serviceWorker.controller.postMessage({
        type: 'ACTIVATE_AUTO_MIX',
        config: config
      });
    } else {
      console.log('[DEBUG] Enviando DEACTIVATE_AUTO_MIX');
      navigator.serviceWorker.controller.postMessage({
        type: 'DEACTIVATE_AUTO_MIX'
      });
    }
  }, [autoMix, serviceWorkerRegistered, userBalanceContext, leverage]);

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