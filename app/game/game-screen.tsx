import React, { useState, useEffect, useRef } from 'react';
import { useGame } from "@/context/game-context";

const GameScreen = () => {
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  const [autoMix, setAutoMix] = useState(false);
  const [betAmount, setBetAmount] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [userBalance, setUserBalance] = useState(100);
  const [gamePhase, setGamePhase] = useState('BETTING');
  const [currentCandleBets, setCurrentCandleBets] = useState(0);
  const [lastFlyupAmount, setLastFlyupAmount] = useState(0);
  const [showFlyup, setShowFlyup] = useState(false);
  const betAudioRef = useRef<HTMLAudioElement>(null);

  // Obtener la función placeBet del contexto
  const { placeBet, gamePhase: gamePhaseContext, currentCandleBets: currentCandleBetsContext, userBalance: userBalanceContext } = useGame();

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/automix-worker.js')
        .then((registration) => {
          console.log('AutoMix Service Worker registered:', registration);
          setServiceWorkerRegistered(true);
          
          // Escuchar mensajes del Service Worker
          navigator.serviceWorker.addEventListener('message', (event) => {
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
          });
        })
        .catch((error) => {
          console.error('Error registering AutoMix Service Worker:', error);
        });
    }
  }, [gamePhaseContext, currentCandleBetsContext, userBalanceContext, betAmount, leverage, placeBet]);

  useEffect(() => {
    if (!serviceWorkerRegistered) return;

    const updateAutoMixConfig = async () => {
      try {
        if (autoMix && navigator.serviceWorker.controller) {
          // Activar AutoMix en el Service Worker
          navigator.serviceWorker.controller.postMessage({
            type: 'ACTIVATE_AUTO_MIX',
            config: {
              betAmount,
              leverage,
              userBalance
            }
          });
          
          // Guardar configuración en IndexedDB
          if ('indexedDB' in window) {
            const request = indexedDB.open('AutoMixDB', 1);
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              request.onerror = () => reject(request.error);
              request.onsuccess = () => resolve(request.result);
            });
            
            const transaction = db.transaction('automix_store', 'readwrite');
            const store = transaction.objectStore('automix_store');
            await new Promise<void>((resolve, reject) => {
              const req = store.put({
                isActive: true,
                betAmount,
                leverage,
                userBalance,
                timestamp: Date.now()
              }, 'config');
              req.onsuccess = () => resolve();
              req.onerror = () => reject(req.error);
            });
          }
        } else if (navigator.serviceWorker.controller) {
          // Desactivar AutoMix en el Service Worker
          navigator.serviceWorker.controller.postMessage({
            type: 'DEACTIVATE_AUTO_MIX'
          });
          
          // Actualizar configuración en IndexedDB
          if ('indexedDB' in window) {
            const request = indexedDB.open('AutoMixDB', 1);
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              request.onerror = () => reject(request.error);
              request.onsuccess = () => resolve(request.result);
            });
            
            const transaction = db.transaction('automix_store', 'readwrite');
            const store = transaction.objectStore('automix_store');
            await new Promise<void>((resolve, reject) => {
              const req = store.put({
                isActive: false,
                timestamp: Date.now()
              }, 'config');
              req.onsuccess = () => resolve();
              req.onerror = () => reject(req.error);
            });
          }
        }
      } catch (error) {
        console.error('Error updating AutoMix configuration:', error);
      }
    };

    updateAutoMixConfig();
  }, [autoMix, serviceWorkerRegistered, betAmount, leverage, userBalance]);

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default GameScreen; 