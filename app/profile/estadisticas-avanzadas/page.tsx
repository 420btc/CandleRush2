"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import TestBetGenerator from "@/components/test-bet-generator";

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

// Tipo para eventos personalizados de nuevas apuestas
type NewBetEvent = CustomEvent<StoredBet>;

// Extender la interfaz Window para incluir nuestro evento personalizado
declare global {
  interface WindowEventMap {
    'newBet': NewBetEvent;
  }
}

// Almacenamiento en memoria para las apuestas activas
let activeBets: StoredBet[] = [];

// Función para obtener apuestas activas (últimos 15 minutos)
function getActiveBets(): StoredBet[] {
  const MAX_BETS = 15; // Limitar a 15 apuestas para mejor visualización
  const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
  
  return activeBets
    .filter(bet => bet.timestamp >= fifteenMinutesAgo)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_BETS);
}

// Función para agregar una nueva apuesta activa
function addActiveBet(bet: StoredBet) {
  // Evitar duplicados
  if (!activeBets.some(b => b.id === bet.id)) {
    activeBets = [bet, ...activeBets].slice(0, 30); // Mantener máximo 30 apuestas en memoria
  }
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
  const [treeData, setTreeData] = useState<TreeNode>(convertBetsToTreeData([]));
  const [isAnimating, setIsAnimating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  // Función para manejar el clic en el botón de retroceso
  const handleBack = () => {
    router.back();
  };

  // Sincronizar con apuestas activas
  const syncWithActiveBets = useCallback(() => {
    try {
      // Obtener apuestas de los últimos 15 minutos
      const recentBets = getActiveBets();
      
      // Actualizar estados
      setBets(recentBets);
      setTreeData(convertBetsToTreeData(recentBets));
    } catch (error) {
      console.error('Error sincronizando apuestas activas:', error);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    try {
      // Sincronizar con apuestas activas
      syncWithActiveBets();
    } catch (error) {
      console.error('Error cargando datos de apuestas:', error);
    } finally {
      setIsLoading(false);
    }

    // Configurar un intervalo para actualizar los datos cada 10 segundos
    const updateInterval = setInterval(() => {
      syncWithActiveBets();
      setIsLive(prev => !prev); // Alternar para mostrar que está actualizando
    }, 10000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(updateInterval);
  }, [syncWithActiveBets]);

  // Escuchar eventos de nuevas apuestas
  useEffect(() => {
    const handleNewBet = (event: NewBetEvent) => {
      if (event.detail) {
        // Agregar la nueva apuesta a las apuestas activas
        addActiveBet(event.detail);
        // Sincronizar con las apuestas activas
        syncWithActiveBets();
      }
    };

    // Agregar listener para el evento 'newBet'
    window.addEventListener('newBet', handleNewBet);

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener('newBet', handleNewBet);
    };
  }, [syncWithActiveBets]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Test Bet Generator - Remove in production */}
      <TestBetGenerator />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-6 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver al perfil
        </Button>

        <h1 className="text-3xl font-bold mb-8 text-yellow-400">Estadísticas Avanzadas</h1>

        <Card className="bg-black/50 border-yellow-500/30 rounded-xl overflow-hidden shadow-xl mb-8">
          <CardHeader className="border-b border-yellow-500/20">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <h3 className="text-yellow-400">Visor Tangle Tree</h3>
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                  <span className="text-xs text-yellow-400/70">Últimos 15 minutos</span>
                </div>
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
                  data={treeData || convertBetsToTreeData([])} 
                />
              ) : (
                <div className="h-full flex items-center justify-center p-4">
                  <p className="text-yellow-300/80 text-center">No hay datos de apuestas recientes en los últimos 15 minutos</p>
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