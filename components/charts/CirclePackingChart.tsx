import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export interface PackData {
  name: string;
  value?: number;
  children?: PackData[];
  color?: string;
}

type HierarchyNodeWithData = d3.HierarchyNode<PackData>;

interface CirclePackingChartProps {
  data: PackData;
  width?: number;
  height?: number;
}

const CirclePackingChart: React.FC<CirclePackingChartProps> = (props) => {
  const { data, width = 800, height = 600 } = props;
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Limpiar el SVG antes de dibujar
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Crear el SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Crear una jerarquía de datos
    const root = d3.hierarchy<PackData>(data)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Crear una función de empaquetado
    const pack = d3.pack<PackData>()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
      .padding(3);

    // Aplicar el layout
    const packedData = pack(root);

    // Definir una escala de color
    const defaultColor = d3.scaleOrdinal(d3.schemeCategory10);

    // Crear un grupo para cada nodo
    const node = svg.selectAll("g")
      .data<d3.HierarchyCircularNode<PackData>>(packedData.descendants())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Añadir círculos
    node.append("circle")
      .attr("r", d => (d as d3.HierarchyCircularNode<PackData>).r)
      .attr("fill", d => {
        // Usar el color definido en los datos o un color por defecto
        const node = d as d3.HierarchyNode<PackData>;
        return node.data.color || defaultColor(node.depth.toString());
      })
      .attr("stroke", d => {
        const node = d as d3.HierarchyNode<PackData>;
        return node.depth === 1 ? "#fff" : "rgba(255,255,255,0.3)";
      })
      .attr("stroke-width", d => {
        const node = d as d3.HierarchyNode<PackData>;
        return node.depth === 1 ? 2 : 1;
      })
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 3);

        // Mostrar tooltip
        const node = d as d3.HierarchyNode<PackData>;
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
          .style("z-index", 1000)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px")
          .html(`
            <strong>${node.data.name}</strong><br/>
            ${node.value ? `Valor: ${node.value.toLocaleString()}` : ''}
          `);
      })
      .on("mousemove", function(event) {
        d3.select("body")
          .selectAll(".tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .attr("stroke", (d: any) => {
            const node = d as d3.HierarchyNode<PackData>;
            return node.depth === 1 ? "#fff" : "rgba(255,255,255,0.3)";
          })
          .attr("stroke-width", (d: any) => {
            const node = d as d3.HierarchyNode<PackData>;
            return node.depth === 1 ? 2 : 1;
          });

        d3.select("body")
          .selectAll(".tooltip")
          .remove();
      });

    // Añadir texto para nodos grandes
    node.append("text")
      .filter(d => (d as d3.HierarchyCircularNode<PackData>).r > 20)
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("font-size", d => (d as d3.HierarchyCircularNode<PackData>).r / 5)
      .attr("fill", "white")
      .text(d => (d as d3.HierarchyNode<PackData>).data.name);

    // Añadir texto para el valor en nodos muy grandes
    node.append("text")
      .filter(d => {
        const node = d as d3.HierarchyCircularNode<PackData>;
        return node.r > 40 && node.value !== undefined;
      })
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .attr("font-size", d => (d as d3.HierarchyCircularNode<PackData>).r / 7)
      .attr("fill", "white")
      .text(d => {
        const node = d as d3.HierarchyNode<PackData>;
        return node.value ? node.value.toLocaleString() : '';
      });

    // Limpiar tooltip al desmontar
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [data, width, height]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default CirclePackingChart;
