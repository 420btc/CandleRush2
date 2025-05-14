import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { hexbin } from 'd3-hexbin';

interface BetData {
  id: string;
  amount: number;
  prediction: 'BULLISH' | 'BEARISH';
  timestamp: number;
  price: number;
  status: string;
}

interface HexbinAreaChartProps {
  data: BetData[];
  width?: number;
  height?: number;
}

const HexbinAreaChart: React.FC<HexbinAreaChartProps> = (props) => {
  const { data = [], width = 800, height = 600 } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Referencia para almacenar el rango de precios actual
  const priceRangeRef = useRef<{min: number, max: number} | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Limpiar el SVG antes de dibujar
    d3.select(svgRef.current).selectAll("*").remove();

    // Aumentar el margen izquierdo para que los precios se vean claramente
    const margin = { top: 30, right: 40, bottom: 50, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Crear el SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Añadir un fondo para mejorar la visibilidad
    svg.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "rgba(0,0,0,0.1)");
      

    // Filtrar solo las apuestas de las últimas 2 horas
    const twoHoursAgo = Date.now() - 120 * 60 * 1000;
    const recentBets = data.filter(bet => bet.timestamp > twoHoursAgo);

    if (recentBets.length === 0) {
      // Si no hay datos recientes, mostrar un mensaje
      svg.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#888")
        .text("No hay apuestas recientes para mostrar");
      return;
    }

    // Escalas para X (tiempo) e Y (precio)
    // Añadir un pequeño padding a los dominios para que los hexágonos no queden cortados
    const timeExtent = d3.extent(recentBets, d => new Date(d.timestamp)) as [Date, Date];
    const timeMin = new Date(timeExtent[0]);
    const timeMax = new Date(timeExtent[1]);
    // Añadir 10 minutos de padding a cada lado
    timeMin.setMinutes(timeMin.getMinutes() - 10);
    timeMax.setMinutes(timeMax.getMinutes() + 10);
    
    const x = d3.scaleTime()
      .domain([timeMin, timeMax])
      .range([0, innerWidth]);

    // Para el eje Y, añadir un padding del 10% arriba y abajo para asegurar visibilidad
    const priceExtent = d3.extent(recentBets, d => d.price) as [number, number];
    const priceRange = priceExtent[1] - priceExtent[0];
    const paddingY = priceRange * 0.1; // Aumentamos el padding al 10%
    
    // Si ya teníamos un rango de precios, comprobamos si necesitamos expandirlo
    let minPrice = priceExtent[0] - paddingY;
    let maxPrice = priceExtent[1] + paddingY;
    
    if (priceRangeRef.current) {
      // Expandir el rango si los nuevos datos tienen precios fuera del rango actual
      minPrice = Math.min(minPrice, priceRangeRef.current.min);
      maxPrice = Math.max(maxPrice, priceRangeRef.current.max);
      
      // Si la diferencia es muy grande, ajustamos para centrarnos en los datos actuales
      // pero manteniendo algo de contexto del rango anterior
      const newRange = maxPrice - minPrice;
      const currentRange = priceRangeRef.current.max - priceRangeRef.current.min;
      
      // Si el nuevo rango es más del doble del actual, hacemos un ajuste gradual
      if (newRange > currentRange * 2) {
        // Ajuste gradual: 70% del nuevo rango, 30% del rango anterior
        minPrice = Math.min(priceExtent[0] - paddingY, priceRangeRef.current.min * 0.3 + (priceExtent[0] - paddingY) * 0.7);
        maxPrice = Math.max(priceExtent[1] + paddingY, priceRangeRef.current.max * 0.3 + (priceExtent[1] + paddingY) * 0.7);
      }
    }
    
    // Guardamos el nuevo rango para futuras actualizaciones
    priceRangeRef.current = { min: minPrice, max: maxPrice };
    
    const y = d3.scaleLinear()
      .domain([minPrice, maxPrice])
      .range([innerHeight, 0]);

    // Crear el generador de hexbin con un radio adaptativo basado en la densidad de datos
    // Calcular el radio óptimo basado en la cantidad de datos y el tamaño del área
    const dataCount = recentBets.length;
    
    // Función para calcular el radio óptimo basado en la densidad de datos
    const calculateOptimalRadius = (count: number, width: number, height: number) => {
      // Área total disponible
      const area = width * height;
      
      // Densidad: puntos por unidad de área
      const density = count / area;
      
      // Base: más datos = hexágonos más pequeños, pero con un mínimo y máximo
      let radius;
      
      if (count < 10) {
        // Pocos datos: hexágonos más grandes
        radius = 15;
      } else if (count < 50) {
        // Datos moderados
        radius = 12;
      } else if (count < 200) {
        // Muchos datos
        radius = 10;
      } else {
        // Muchísimos datos
        radius = 8;
      }
      
      return radius;
    };
    
    const optimalRadius = calculateOptimalRadius(dataCount, innerWidth, innerHeight);
    
    const hexbinGenerator = hexbin()
      .x((d: BetData) => x(new Date(d.timestamp)))
      .y((d: BetData) => y(d.price))
      .radius(optimalRadius)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    // Generar los hexbins
    const bins = hexbinGenerator(recentBets);

    // Escala de color basada en la proporción de apuestas bullish vs bearish
    const colorScale = d3.scaleLinear<string>()
      .domain([-1, 0, 1])
      .range(["#b91c1c", "#888888", "#15803d"])
      .clamp(true);

    // Dibujar los hexágonos
    svg.append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    svg.append("g")
      .attr("clip-path", "url(#clip)")
      .selectAll(".hexbin")
      .data(bins)
      .enter().append("path")
      .attr("class", "hexbin")
      .attr("d", hexbinGenerator.hexagon())
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .attr("fill", d => {
        // Calcular la proporción de bullish vs bearish
        const bullishCount = d.filter((p: BetData) => p.prediction === "BULLISH").length;
        const bearishCount = d.filter((p: BetData) => p.prediction === "BEARISH").length;
        const total = bullishCount + bearishCount;
        
        if (total === 0) return "#888888";
        
        // Valor entre -1 (todos bearish) y 1 (todos bullish)
        const ratio = (bullishCount - bearishCount) / total;
        return colorScale(ratio);
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("opacity", d => {
        // Opacidad basada en la cantidad de apuestas en el hexágono
        const count = d.length;
        return Math.min(0.9, 0.4 + count * 0.1);
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke-width", 2)
          .attr("stroke", "#fff");
        
        const bullishCount = d.filter((p: BetData) => p.prediction === "BULLISH").length;
        const bearishCount = d.filter((p: BetData) => p.prediction === "BEARISH").length;
        const total = bullishCount + bearishCount;
        const avgPrice = d3.mean(d, (p: BetData) => p.price);
        
        // Crear tooltip
        const tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background-color", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("pointer-events", "none")
          .style("opacity", 0.9)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px")
          .html(`<strong>Total: ${total}</strong><br/>
                 <span style="color: #15803d">Bullish: ${bullishCount}</span><br/>
                 <span style="color: #b91c1c">Bearish: ${bearishCount}</span><br/>
                 Precio Promedio: $${avgPrice?.toFixed(2)}`);
      })
      .on("mousemove", function(event) {
        d3.select("body")
          .selectAll(".tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke-width", 0.5)
          .attr("stroke", "#000");
        
        d3.select("body")
          .selectAll(".tooltip")
          .remove();
      });

    // Ejes X e Y con mejoras visuales
    // Eje X (tiempo) - Aumentar el número de ticks para mejor legibilidad
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(x).ticks(8).tickFormat(d => {
        const date = new Date(d as Date);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#000")
      .style("font-weight", "bold");

    // Eje Y (precio) - Mejorar formato y aumentar ticks
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(10).tickFormat(d => d3.format("$,.0f")(d as number)))
      .selectAll("text")
      .style("font-size", "13px")
      .style("fill", "#000")
      .style("font-weight", "bold");
      
    // Añadir líneas de cuadrícula horizontales para mejor lectura de precios
    svg.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(10))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "rgba(0,0,0,0.1)")
      .attr("stroke-dasharray", "3,3");
      
    // Añadir un rectángulo semitransparente en la parte superior para indicar
    // que el gráfico se adaptará si aparecen precios fuera del rango actual
    svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerWidth)
      .attr("height", 20)
      .attr("fill", "url(#gradient-top)")
      .attr("opacity", 0.3);
      
    // Añadir un rectángulo semitransparente en la parte inferior para indicar
    // que el gráfico se adaptará si aparecen precios fuera del rango actual
    svg.append("rect")
      .attr("x", 0)
      .attr("y", innerHeight - 20)
      .attr("width", innerWidth)
      .attr("height", 20)
      .attr("fill", "url(#gradient-bottom)")
      .attr("opacity", 0.3);
      
    // Crear gradientes para los indicadores de expansión
    const defs = svg.append("defs");
    
    // Gradiente superior
    const gradientTop = defs.append("linearGradient")
      .attr("id", "gradient-top")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
      
    gradientTop.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#15803d")
      .attr("stop-opacity", 0.7);
      
    gradientTop.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#15803d")
      .attr("stop-opacity", 0);
      
    // Gradiente inferior
    const gradientBottom = defs.append("linearGradient")
      .attr("id", "gradient-bottom")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "100%")
      .attr("y2", "0%");
      
    gradientBottom.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#b91c1c")
      .attr("stop-opacity", 0.7);
      
    gradientBottom.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#b91c1c")
      .attr("stop-opacity", 0);
      
    // Etiquetas de los ejes - Mejoradas y más visibles
    svg.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("fill", "#000")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Hora");
      
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 20)
      .attr("text-anchor", "middle")
      .style("fill", "#000")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Precio BTC ($)");

    // Limpiar tooltip al desmontar
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };

  }, [data, width, height]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] rounded-b-md z-10 shadow-lg border border-yellow-500/30 flex items-center">
        <div className="flex items-center border-r border-yellow-500/30 px-2">
          <div className="w-2 h-2 rounded-full bg-green-600 mr-1"></div>
          <span>BULLISH</span>
        </div>
        <div className="flex items-center border-r border-yellow-500/30 px-2">
          <div className="w-2 h-2 rounded-full bg-red-600 mr-1"></div>
          <span>BEARISH</span>
        </div>
        <div className="text-[9px] text-gray-300 px-2">
          <span>Auto-adaptable a nuevos precios</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default HexbinAreaChart;
