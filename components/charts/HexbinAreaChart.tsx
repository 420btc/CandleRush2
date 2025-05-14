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

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Limpiar el SVG antes de dibujar
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 80 };
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
    const x = d3.scaleTime()
      .domain(d3.extent(recentBets, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain(d3.extent(recentBets, d => d.price) as [number, number])
      .range([innerHeight, 0]);

    // Crear el generador de hexbin
    const hexbinGenerator = hexbin()
      .x((d: BetData) => x(new Date(d.timestamp)))
      .y((d: BetData) => y(d.price))
      .radius(10)
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
    // Eje X (tiempo)
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => {
        const date = new Date(d as Date);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#000");

    // Eje Y (precio)
    svg.append("g")
      .call(d3.axisLeft(y).ticks(8).tickFormat(d => d3.format("$,.0f")(d as number)))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#000");
      
    // Etiquetas de los ejes
    svg.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 5)
      .attr("text-anchor", "middle")
      .style("fill", "#000")
      .style("font-size", "14px")
      .text("Hora");
      
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .style("fill", "#000")
      .style("font-size", "14px")
      .text("Precio BTC");

    // Limpiar tooltip al desmontar
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };

  }, [data, width, height]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-2 rounded-md z-10">
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span>Apuestas alcistas</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span>Apuestas bajistas</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default HexbinAreaChart;
