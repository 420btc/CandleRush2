import { useState, useEffect } from 'react';

export function useVisitCounter() {
  const [visitCount, setVisitCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    const LAST_VISIT_KEY = 'candle-rush-last-api-visit';
    
    const fetchAndUpdateCounter = async () => {
      try {
        // Verificar si ya visitamos recientemente (localStorage como cache)
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const now = Date.now();
        const fourYears = 4 * 365 * 24 * 60 * 60 * 1000; // 4 años en milisegundos
        
        const shouldIncrement = !lastVisit || (now - parseInt(lastVisit)) > fourYears;
        
        if (shouldIncrement) {
          // Intentar incrementar el contador
          const response = await fetch('/api/visit-counter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setVisitCount(data.totalVisits);
            
            // Solo actualizar localStorage si fue una nueva visita
            if (data.newVisit) {
              localStorage.setItem(LAST_VISIT_KEY, now.toString());
            }
          } else {
            throw new Error('Failed to increment counter');
          }
        } else {
          // Solo obtener el contador actual sin incrementar
          const response = await fetch('/api/visit-counter');
          
          if (response.ok) {
            const data = await response.json();
            setVisitCount(data.totalVisits);
          } else {
            throw new Error('Failed to fetch counter');
          }
        }
      } catch (error) {
        console.error('Error with visit counter API:', error);
        // Fallback: usar contador local
        const localCount = localStorage.getItem('candle-rush-visit-count-fallback') || '0';
        setVisitCount(parseInt(localCount));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndUpdateCounter();
  }, []);

  return { visitCount, isLoading };
} 