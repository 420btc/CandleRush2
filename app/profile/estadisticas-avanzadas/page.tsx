"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useGame } from "@/context/game-context";

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

export default function EstadisticasAvanzadas() {
  const router = useRouter();
  const { bets } = useGame();
  const [treeData, setTreeData] = useState(convertBetsToTreeData(bets));
  const [isAnimating, setIsAnimating] = useState(true);

  // Actualizar los datos cuando cambian las apuestas
  useEffect(() => {
    if (bets.length > 0) {
      setTreeData(convertBetsToTreeData(bets));
    }
  }, [bets]);

  // Efecto para actualizar los datos periódicamente
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      // Actualizar el árbol con los datos actuales para la animación
      setTreeData(prevData => {
        const newData = {...prevData};
        // Forzar actualización del timestamp
        newData.timestamp = Date.now();
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="container mx-auto p-4 max-w-7xl min-h-screen">
      {/* Botón de volver */}
      <Button 
        onClick={() => router.back()}
        variant="outline" 
        className="mb-6 bg-black/50 border-yellow-500/50 hover:bg-yellow-500/20 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Volver al perfil
      </Button>

      <h1 className="text-3xl font-bold text-white mb-8">Estadísticas Avanzadas</h1>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Gráfico de árbol enredado */}
        <Card className="bg-black/50 border-yellow-500/30 rounded-xl overflow-hidden shadow-xl">
          <CardHeader className="border-b border-yellow-500/20">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-yellow-400">Árbol de Operaciones</CardTitle>
                <CardDescription className="text-yellow-100/60">
                  Visualización de tus apuestas en tiempo real
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAnimating(!isAnimating)}
                className="bg-black/30 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400"
              >
                {isAnimating ? 'Pausar' : 'Reanudar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[600px] w-full">
              {bets.length > 0 ? (
                <TangledTreeChart 
                  width={800} 
                  height={600} 
                  data={treeData} 
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-yellow-400/70">No hay datos de apuestas para mostrar</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-300">Ganadas</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-gray-300">Perdidas</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-gray-300">Liquidadas</span>
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