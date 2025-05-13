"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Importación dinámica para evitar problemas de SSR
const TangledTreeChart = dynamic(
  () => import('@/components/charts/TangledTreeChart'),
  { ssr: false }
);

// Función para generar datos de ejemplo
function generateRandomData() {
  const types: ('win' | 'loss' | 'liquidation')[] = ['win', 'loss', 'liquidation'];
  const data = {
    id: 'root',
    type: 'win' as const,
    timestamp: Date.now(),
    value: 0,
    children: [] as any[]
  };

  // Generar datos iniciales
  for (let i = 0; i < 5; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    data.children.push({
      id: `node-${i}`,
      type,
      timestamp: Date.now() - Math.random() * 10000000,
      value: Math.floor(Math.random() * 100) + 10,
      children: []
    });
  }

  return data;
}

export default function EstadisticasAvanzadas() {
  const router = useRouter();
  const [treeData, setTreeData] = useState(generateRandomData());
  const [isAnimating, setIsAnimating] = useState(true);

  // Efecto para actualizar los datos cada 5 segundos
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      const newData = { ...treeData };
      const types: ('win' | 'loss' | 'liquidation')[] = ['win', 'loss', 'liquidation'];
      
      // Añadir un nuevo nodo aleatorio
      const newNode = {
        id: `node-${Date.now()}`,
        type: types[Math.floor(Math.random() * types.length)],
        timestamp: Date.now(),
        value: Math.floor(Math.random() * 100) + 10,
        children: []
      };

      // Añadir el nuevo nodo a un nodo aleatorio existente o a la raíz
      const addToRandomNode = (node: any) => {
        if (node.children.length > 0 && Math.random() > 0.3) {
          const randomChild = node.children[Math.floor(Math.random() * node.children.length)];
          addToRandomNode(randomChild);
        } else {
          node.children.push(newNode);
        }
      };

      addToRandomNode(newData);
      setTreeData(JSON.parse(JSON.stringify(newData)));
    }, 5000);

    return () => clearInterval(interval);
  }, [treeData, isAnimating]);

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
                  Visualización de operaciones en tiempo real
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
              <TangledTreeChart 
                width={800} 
                height={600} 
                data={treeData} 
              />
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