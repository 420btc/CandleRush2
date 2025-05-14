'use client';

import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import * as ReactDOM from 'react-dom/client';

export interface Node {
  id: string;
  type: 'win' | 'loss' | 'liquidation' | 'balance';
  timestamp: number;
  value: number;
  label?: string;
  info?: {
    prediction: string;
    entryPrice: number;
    status: string;
    amount: number;
  };
  children?: Node[];
}

export interface TangledTreeChartProps {
  width: number;
  height: number;
  data: Node;
  linkColor?: string;
  linkWidth?: number;
  nodeColors?: {
    win: string;
    loss: string;
    liquidation: string;
    balance: string;
  };
  showTooltip?: boolean;
  tooltipContent?: (node: Node) => React.ReactNode;
}

export default function TangledTreeChart({ 
  width, 
  height, 
  data, 
  linkColor = '#374151',
  linkWidth = 1.5,
  nodeColors = {
    win: '#22c55e',
    loss: '#ef4444',
    liquidation: '#6b7280',
    balance: '#3b82f6'
  },
  showTooltip = false,
  tooltipContent
}: TangledTreeChartProps): React.ReactElement {
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

    // Función para obtener el color del nodo
    const getNodeColor = (type: Node['type']) => nodeColors[type];

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
      .attr('stroke', linkColor)
      .attr('stroke-width', linkWidth);

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
      .attr('fill', d => getNodeColor(d.data.type))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1.5);

    // Añadir etiquetas a los nodos
    nodes.append('text')
      .attr('dy', -10)
      .attr('text-anchor', 'middle')
      .text(d => d.data.label || `$${d.data.value}`)
      .style('fill', '#9ca3af')
      .style('font-size', '10px')
      .style('font-weight', 'bold');

    // Añadir tooltips si están habilitados
    if (showTooltip && tooltipContent) {
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

      nodes
        .on('mouseover', (event, d) => {
          const content = tooltipContent(d.data);
          tooltip
            .style('visibility', 'visible')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .html(() => {
              const div = document.createElement('div');
              // @ts-ignore - React 18 createRoot API
              const root = ReactDOM.createRoot(div);
              root.render(content);
              return div.innerHTML;
            });
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        })
        .on('mouseout', () => {
          tooltip.style('visibility', 'hidden');
        });
    }

    // Cleanup function
    return () => {
      d3.selectAll('.tooltip').remove();
    };
  }, [data, width, height, linkColor, linkWidth, nodeColors, showTooltip, tooltipContent]);

  return <svg ref={svgRef} width={width} height={height} />;
}
