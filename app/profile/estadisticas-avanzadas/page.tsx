"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function EstadisticasAvanzadas() {
  const router = useRouter();

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