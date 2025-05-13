'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface Node {
  id: string;
  type: 'win' | 'loss' | 'liquidation';
  timestamp: number;
  value: number;
  children?: Node[];
}

interface TangledTreeChartProps {
  width: number;
  height: number;
  data: Node;
}

export default function TangledTreeChart({ width, height, data }: TangledTreeChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Limpiar SVG
    d3.select(svgRef.current).selectAll('*').remove();

    // Crear SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Configuración del layout
    const treeLayout = d3.tree<Node>()
      .size([2 * Math.PI, Math.min(width, height) / 2 - 40])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    // Procesar datos
    const root = d3.hierarchy(data);
    const treeData = treeLayout(root);

    // Escala de colores
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['win', 'loss', 'liquidation'])
      .range(['#10b981', '#ef4444', '#f59e0b']);

    // Dibujar enlaces
    svg.append('g')
      .selectAll('path')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('d', d => {
        const startAngle = d.source.x;
        const endAngle = d.target.x;
        const startRadius = d.source.y;
        const endRadius = d.target.y;
        
        const x1 = startRadius * Math.sin(startAngle);
        const y1 = -startRadius * Math.cos(startAngle);
        const x2 = endRadius * Math.sin(endAngle);
        const y2 = -endRadius * Math.cos(endAngle);
        
        // Crear una curva suave entre los puntos
        return `M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1.5);

    // Dibujar nodos
    const nodes = svg.append('g')
      .selectAll('g')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('transform', d => {
        const radius = d.y;
        const angle = d.x;
        return `translate(${radius * Math.sin(angle)},${-radius * Math.cos(angle)})`;
      });

    // Añadir círculos a los nodos
    nodes.append('circle')
      .attr('r', 6)
      .attr('fill', d => colorScale(d.data.type))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1.5);

    // Añadir etiquetas a los nodos
    nodes.append('text')
      .attr('dy', -10)
      .attr('text-anchor', 'middle')
      .text(d => `$${d.data.value}`)
      .style('fill', '#9ca3af')
      .style('font-size', '10px')
      .style('font-weight', 'bold');

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
