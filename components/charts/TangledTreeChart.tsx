'use client';

import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import * as ReactDOM from 'react-dom/client';

export interface Node {
  id: string;
  type: 'win' | 'loss' | 'liquidation' | 'pending' | 'balance' | 'bullish' | 'bearish' | 'liquidated';
  timestamp: number;
  value: number;
  label?: string;
  info?: {
    prediction: string;
    entryPrice?: number;
    status: string;
    amount: number;
    remainingTime?: {
      total: number;
      minutes: number;
      seconds: number;
      formatted: string;
    };
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
    pending: string;
    balance: string;
    bullish: string;
    bearish: string;
    liquidated: string;
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
    liquidation: '#000000',
    pending: '#a855f7',
    balance: '#3b82f6',
    bullish: '#15803d',  // Verde oscuro
    bearish: '#b91c1c',  // Rojo oscuro
    liquidated: '#000000' // Negro
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
      .attr('transform', `translate(${width / 2 + 1},${height / 2})`);

    // Configuración del layout
    const treeLayout = d3.tree<Node>()
      .size([2 * Math.PI, Math.min(width, height) / 2 - 40])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    // Procesar datos
    const root = d3.hierarchy(data);
    // Ajustar la posición del nodo raíz para que esté exactamente en el centro
    root.x = 0;
    root.y = 0;
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
        // Para el nodo raíz (central), posicionarlo exactamente en el centro
        if (d.depth === 0) {
          return `translate(1,0)`;
        }
        // Para los demás nodos, usar la posición calculada por el layout
        const radius = d.y;
        const angle = d.x;
        return `translate(${radius * Math.sin(angle)},${-radius * Math.cos(angle)})`;
      });

    // Añadir círculos a los nodos
    nodes.append('circle')
      .attr('r', d => d.depth === 0 ? 8 : 6) // Nodo central más grande
      .attr('fill', d => getNodeColor(d.data.type))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1.5)
      // Ajustar la posición del nodo central específicamente
      .attr('transform', d => d.depth === 0 ? 'translate(10, 0)' : '')
      // Añadir una clase para facilitar la selección
      .attr('class', 'node-circle')
      // Añadir un área de interacción más grande para los tooltips
      .style('cursor', 'pointer');

    // Añadir etiquetas a los nodos
    nodes.append('text')
      .attr('dy', -10)
      .attr('text-anchor', 'middle')
      .text(d => d.data.label || `$${d.data.value}`)
      .style('fill', d => d.depth === 0 ? '#ffffff' : '#9ca3af')
      .style('font-size', d => d.depth === 0 ? '12px' : '10px')
      .style('font-weight', 'bold')
      // Añadir un fondo para el texto del balance para que se vea sobre las líneas
      .each(function(d) {
        if (d.depth === 0) {
          const textElement = this;
          const textBBox = textElement.getBBox();
          
          // Insertar un rectángulo detrás del texto
          const parentNode = d3.select(this.parentElement);
          parentNode.insert('rect', 'text')
            .attr('x', textBBox.x - 5)
            .attr('y', textBBox.y - 2)
            .attr('width', textBBox.width + 10)
            .attr('height', textBBox.height + 4)
            .attr('rx', 4)
            .attr('fill', '#3b82f6')
            .attr('opacity', 0.9);
            
          // Mover el texto al frente
          parentNode.append(() => textElement);
        }
      });

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
            
          // Resaltar el nodo activo
          d3.select(event.currentTarget).select('.node-circle')
            .transition()
            .duration(200)
            .attr('r', d.depth === 0 ? 10 : 8)
            .attr('stroke-width', 2);
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        })
        .on('mouseout', (event, d) => {
          tooltip.style('visibility', 'hidden');
          
          // Restaurar el tamaño normal del nodo
          d3.select(event.currentTarget).select('.node-circle')
            .transition()
            .duration(200)
            .attr('r', d.depth === 0 ? 8 : 6)
            .attr('stroke-width', 1.5);
        });
    }

    // Cleanup function
    return () => {
      d3.selectAll('.tooltip').remove();
    };
  }, [data, width, height, linkColor, linkWidth, nodeColors, showTooltip, tooltipContent]);

  return <svg ref={svgRef} width={width} height={height} />;
}
