"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

// Importación dinámica para evitar problemas de SSR
const TangledTreeChart = dynamic(
  () => import('@/components/charts/TangledTreeChart'),
  { ssr: false }
);

// Definir tipos para los nodos del árbol
type TreeNodeType = 'win' | 'loss' | 'liquidation';

interface TreeNode {
  id: string;
  type: TreeNodeType;
  timestamp: number;
  value: number;
  children: TreeNode[];
}

// Función para convertir datos de apuestas al formato del árbol
function convertBetsToTreeData(bets: any[]): TreeNode {
  if (!bets || bets.length === 0) {
    return {
      id: 'root',
      type: 'win' as const,
      timestamp: Date.now(),
      value: 0,
      children: []
    };
  }

  // Ordenar apuestas por timestamp (más recientes primero)
  const sortedBets = [...bets].sort((a, b) => b.timestamp - a.timestamp);

  // Función para mapear el estado de la apuesta al tipo de nodo
  const getNodeType = (status: string): TreeNodeType => {
    if (status === 'WON') return 'win';
    if (status === 'LOST') return 'loss';
    return 'liquidation';
  };

  // Crear el nodo raíz con la apuesta más reciente
  const rootBet = sortedBets[0];
  const rootNode: TreeNode = {
    id: rootBet.id,
    type: getNodeType(rootBet.status),
    timestamp: rootBet.timestamp,
    value: rootBet.amount,
    children: []
  };

  // Agregar apuestas posteriores como hijos
  const addChildren = (node: TreeNode, parentBet: any, remainingBets: any[]): void => {
    if (remainingBets.length === 0) return;

    // Tomar hasta 3 apuestas aleatorias como hijos
    const childCount = Math.min(3, remainingBets.length);
    const childIndices = Array.from({ length: remainingBets.length }, (_, i) => i)
      .sort(() => 0.5 - Math.random())
      .slice(0, childCount);

    childIndices.forEach(idx => {
      const bet = remainingBets[idx];
      const childNode: TreeNode = {
        id: bet.id,
        type: getNodeType(bet.status),
        timestamp: bet.timestamp,
        value: bet.amount,
        children: []
      };
      
      // Agregar el nodo hijo
      node.children.push(childNode);
      
      // Llamada recursiva para agregar más niveles
      const newRemainingBets = remainingBets.filter((_, i) => i !== idx);
      if (newRemainingBets.length > 0) {
        addChildren(childNode, bet, newRemainingBets);
      }
    });
  };

  // Comenzar a construir el árbol con las apuestas restantes
  if (sortedBets.length > 1) {
    addChildren(rootNode, rootBet, sortedBets.slice(1));
  }

  return rootNode;
}

// Interface para los datos de apuestas en localStorage
interface StoredBet {
  id: string;
  status: string;
  timestamp: number;
  amount: number;
  prediction?: 'BULLISH' | 'BEARISH';
  leverage?: number;
  entryPrice?: number;
  symbol?: string;
  timeframe?: string;
  // Otros campos necesarios
}

// Claves para localStorage
const STORAGE_KEY = 'betting_stats_data';
const BETS_BY_PAIR_KEY = 'betsByPair';

// Función para obtener todas las apuestas de localStorage
function getAllBetsFromStorage(): StoredBet[] {
  try {
    // Intentar obtener de nuestra clave primero
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Si no hay datos en nuestra clave, intentar obtener de betsByPair
    const betsByPairData = localStorage.getItem(BETS_BY_PAIR_KEY);
    if (betsByPairData) {
      const parsed = JSON.parse(betsByPairData);
      // Aplanar el objeto de apuestas por par y timeframe
      return Object.values(parsed).flatMap((pairData: any) => 
        Object.values(pairData).flat()
      ) as StoredBet[];
    }
  } catch (error) {
    console.error('Error al leer apuestas de localStorage:', error);
  }
  return [];
}

export default function EstadisticasAvanzadas() {
  const router = useRouter();
  const [bets, setBets] = useState<StoredBet[]>([]);
  const [treeData, setTreeData] = useState(convertBetsToTreeData([]));
  const [isAnimating, setIsAnimating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    try {
      // Obtener todas las apuestas de localStorage
      const allBets = getAllBetsFromStorage();
      
      // Filtrar solo las apuestas de las últimas 24 horas
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentBets = allBets.filter(bet => 
        bet.timestamp >= twentyFourHoursAgo
      );
      
      // Ordenar por timestamp (más recientes primero)
      recentBets.sort((a, b) => b.timestamp - a.timestamp);
      
      setBets(recentBets);
      setTreeData(convertBetsToTreeData(recentBets));
      
      // Si hay apuestas, guardarlas en nuestro formato para futuras cargas
      if (recentBets.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentBets));
      }
    } catch (error) {
      console.error('Error cargando datos de apuestas:', error);
    } finally {
      setIsLoading(false);
    }

    // Configurar un intervalo para limpiar datos antiguos
    const cleanupInterval = setInterval(() => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
          const recentBets = parsedData.filter((bet: StoredBet) => 
            bet.timestamp >= twentyFourHoursAgo
          );
          
          if (recentBets.length !== parsedData.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentBets));
            setBets(recentBets);
            setTreeData(convertBetsToTreeData(recentBets));
          }
        }
      } catch (error) {
        console.error('Error cleaning up old betting data:', error);
      }
    }, 5 * 60 * 1000); // Verificar cada 5 minutos

    return () => clearInterval(cleanupInterval);
  }, []);

  // Función para agregar una nueva apuesta (puede ser llamada desde otros componentes)
  const addBet = (bet: StoredBet) => {
    setBets(prevBets => {
      // Evitar duplicados
      if (prevBets.some(b => b.id === bet.id)) return prevBets;
      
      const newBets = [bet, ...prevBets]; // Agregar al inicio para mantener orden cronológico
      // Mantener solo las últimas 100 apuestas para evitar que el localStorage crezca demasiado
      const limitedBets = newBets.slice(0, 100);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedBets));
      } catch (error) {
        console.error('Error guardando datos de apuestas:', error);
      }
      
      return limitedBets;
    });
  };
  
  // Función para sincronizar con las apuestas existentes
  const syncWithExistingBets = () => {
    try {
      const allBets = getAllBetsFromStorage();
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentBets = allBets.filter(bet => bet.timestamp >= twentyFourHoursAgo);
      recentBets.sort((a, b) => b.timestamp - a.timestamp);
      
      setBets(recentBets);
      setTreeData(convertBetsToTreeData(recentBets));
      
      if (recentBets.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentBets));
      }
    } catch (error) {
      console.error('Error sincronizando apuestas:', error);
    }
  };
  
  // Sincronizar cuando se monta el componente
  useEffect(() => {
    syncWithExistingBets();
  }, []);
  // Efecto para actualizar los datos periódicamente
  useEffect(() => {
    if (!isAnimating || isLoading) return;

    const interval = setInterval(() => {
      // Actualizar el árbol con los datos actuales para la animación
      setTreeData(prevData => {
        if (!prevData) return prevData;
        const newData = {...prevData};
        // Forzar actualización del timestamp
        newData.timestamp = Date.now();
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAnimating, isLoading]);

  return (
    <div className="container mx-auto p-4 max-w-7xl min-h-screen">
      {/* Botón de volver */}
      <Button 
        onClick={() => router.back()}
        variant="outline" 
        className="mb-4 bg-black/50 border-yellow-500/50 hover:bg-yellow-500/20 hover:text-yellow-400 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Volver al perfil
      </Button>

      <h1 className="text-3xl font-bold text-yellow-400 mb-6">Estadísticas Avanzadas</h1>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Gráfico de árbol enredado */}
        <Card className="bg-black/50 border-yellow-500/30 rounded-xl overflow-hidden shadow-xl">
          <CardHeader className="border-b border-yellow-500/20 p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-yellow-400 text-2xl font-bold tracking-tight [&>h3]:text-yellow-400">
                <h3 className="text-yellow-400">Visor Tangle Tree</h3>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="bg-black/30 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 h-8 px-3"
                >
                  {isAnimating ? 'Pausar' : 'Reanudar'}
                </Button>
              </div>
            </div>
            <CardDescription className="text-white text-sm mt-0.5 [&>p]:text-white">
              <p className="text-white">Visualización de tus apuestas en tiempo real</p>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[600px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-yellow-300/80">Cargando datos...</p>
                </div>
              ) : bets.length > 0 ? (
                <TangledTreeChart 
                  width={800} 
                  height={600} 
                  data={treeData} 
                />
              ) : (
                <div className="h-full flex items-center justify-center p-4">
                  <p className="text-yellow-300/80 text-center">No hay datos de apuestas recientes en las últimas 24 horas</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-center gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div>
                <span className="text-yellow-100/80">Ganadas</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
                <span className="text-yellow-100/80">Perdidas</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>
                <span className="text-yellow-100/80">Liquidadas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primera tarjeta de gráfico */}
        <Card className="bg-black/50 border-yellow-500/30 rounded-xl overflow-hidden shadow-xl">
          <CardHeader className="border-b border-yellow-500/20">
            <CardTitle className="text-yellow-400">Mapa de Calor - Análisis de Horario</CardTitle>
            <CardDescription className="text-yellow-100/60">Distribución de apuestas por hora del día</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px] flex items-center justify-center bg-black/30 rounded-lg border-2 border-dashed border-yellow-500/20">
              <p className="text-yellow-400/70">Gráfico de mapa de calor se cargará aquí</p>
            </div>
          </CardContent>
        </Card>

        {/* Segunda tarjeta de gráfico */}
        <Card className="bg-black/50 border-yellow-500/30 rounded-xl overflow-hidden shadow-xl mb-12">
          <CardHeader className="border-b border-yellow-500/20">
            <CardTitle className="text-yellow-400">Rendimiento por Par</CardTitle>
            <CardDescription className="text-yellow-100/60">Efectividad de apuestas por par de trading</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px] flex items-center justify-center bg-black/30 rounded-lg border-2 border-dashed border-yellow-500/20">
              <p className="text-yellow-400/70">Gráfico de rendimiento por par se cargará aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}