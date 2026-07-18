import React, { useState } from 'react';
import type { NetworkNode, NetworkLink } from '../lib/types';
import { Share2, Users2, ShieldAlert } from 'lucide-react';

interface NetworkVizProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  customerConc: number;
  supplierConc: number;
  resilienceScore: number;
}

export const NetworkViz: React.FC<NetworkVizProps> = ({ 
  nodes, 
  links, 
  customerConc, 
  supplierConc, 
  resilienceScore 
}) => {
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);

  // Layout parameters
  const width = 500;
  const height = 350;
  const cx = width / 2;
  const cy = height / 2;

  // Calculate coordinates for nodes dynamically in circles
  const layoutNodes = () => {
    const arrangedNodes = new Map<string, { x: number; y: number }>();
    
    // 1. Center node (Self)
    const centerNode = nodes.find(n => n.group === 'center');
    if (centerNode) {
      arrangedNodes.set(centerNode.id, { x: cx, y: cy });
    }

    // 2. Customers and Suppliers
    const customers = nodes.filter(n => n.group === 'customer');
    const suppliers = nodes.filter(n => n.group === 'supplier');

    // Arrange customers on the left arc
    customers.forEach((node, idx) => {
      const angle = Math.PI / 2 + (Math.PI * 0.9 * idx) / Math.max(1, customers.length - 1) - 0.45 * Math.PI;
      const radius = 110 + (idx % 2 === 0 ? 25 : 0); // Alternate radii to prevent overlap
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      arrangedNodes.set(node.id, { x, y });
    });

    // Arrange suppliers on the right arc
    suppliers.forEach((node, idx) => {
      const angle = -Math.PI / 2 + (Math.PI * 0.9 * idx) / Math.max(1, suppliers.length - 1) - 0.45 * Math.PI;
      const radius = 110 + (idx % 2 === 0 ? 25 : 0);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      arrangedNodes.set(node.id, { x, y });
    });

    return arrangedNodes;
  };

  const nodePositions = layoutNodes();

  const getNodeColor = (group: string) => {
    if (group === 'center') return 'fill-purple stroke-purple-light';
    if (group === 'customer') return 'fill-accent stroke-accent-light';
    return 'fill-danger stroke-danger-light'; // supplier
  };

  return (
    <div className="glass-panel p-5 grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
      <div className="lg:col-span-3 bg-primary-dark/30 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center min-h-[350px]">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="select-none">
          {/* 1. Links */}
          {links.map((link, idx) => {
            // Find positions
            const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
            const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
            const p1 = nodePositions.get(sourceId);
            const p2 = nodePositions.get(targetId);

            if (!p1 || !p2) return null;

            // Highlight link if node hovered
            const isHighlighted = hoveredNode && (hoveredNode.id === sourceId || hoveredNode.id === targetId);

            return (
              <line
                key={`link-${idx}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isHighlighted ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth={Math.min(5, Math.max(1, link.weight / 15000))}
                strokeDasharray={idx % 2 === 0 ? '5,5' : undefined}
                className="transition-all duration-300"
              />
            );
          })}

          {/* 2. Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isCenter = node.group === 'center';
            const isHovered = hoveredNode && hoveredNode.id === node.id;

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group"
              >
                {/* Glow ring on hover */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.size + (isHovered ? 6 : 0)}
                  className={`transition-all duration-300 ${
                    node.group === 'center' 
                      ? 'fill-purple/5 stroke-purple-light/20' 
                      : node.group === 'customer' 
                        ? 'fill-accent/5 stroke-accent-light/10' 
                        : 'fill-danger/5 stroke-danger-light/10'
                  }`}
                  strokeWidth={2}
                />
                
                {/* Core node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.size}
                  className={`stroke-[1.5px] transition-all duration-300 ${getNodeColor(node.group)}`}
                />

                {/* Node labels */}
                {(!isCenter || isHovered) && (
                  <text
                    x={pos.x}
                    y={pos.y - node.size - 6}
                    textAnchor="middle"
                    className="fill-gray-300 font-sans font-semibold text-[10px] drop-shadow-md"
                  >
                    {node.label}
                  </text>
                )}

                {isCenter && !isHovered && (
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    className="fill-white font-sans font-extrabold text-[9px] uppercase tracking-wider"
                  >
                    Self
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredNode && (
          <div className="absolute bottom-3 left-3 bg-primary-dark/95 border border-white/10 px-3 py-2 rounded-lg text-xs backdrop-blur-md pointer-events-none">
            <span className="text-gray-400 font-semibold block uppercase text-[10px]">
              {hoveredNode.group} Details
            </span>
            <strong className="text-white block mt-0.5">{hoveredNode.label}</strong>
            <span className="text-gray-300 block text-[11px] mt-1 font-mono">
              Weight Index: {hoveredNode.size * 3}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-100 flex items-center gap-1.5 border-b border-white/5 pb-2">
            <Share2 size={16} className="text-accent" />
            Supply Network Graph
          </h4>
          
          <div>
            <span className="text-gray-400 text-xs font-semibold block uppercase">
              Customer Concentration
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-lg font-bold text-accent-light font-display">
                {(customerConc * 100).toFixed(1)}%
              </div>
              {customerConc > 0.4 && (
                <span className="px-1.5 py-0.5 rounded bg-danger/10 text-danger text-[9px] font-bold uppercase">
                  HIGH
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
              Max single buyer transaction value share.
            </p>
          </div>

          <div>
            <span className="text-gray-400 text-xs font-semibold block uppercase">
              Supplier Concentration
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-lg font-bold text-danger-light font-display">
                {(supplierConc * 100).toFixed(1)}%
              </div>
              {supplierConc > 0.4 && (
                <span className="px-1.5 py-0.5 rounded bg-danger/10 text-danger text-[9px] font-bold uppercase">
                  HIGH
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
              Max single vendor payeeship value share.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl border border-white/5 bg-primary-dark/30 flex items-start gap-2.5">
          <Users2 size={20} className="text-purple-light mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-gray-300 text-xs font-bold block uppercase">
              Resilience Score: {resilienceScore}
            </span>
            <p className="text-gray-400 text-[10px] leading-relaxed mt-0.5">
              High score implies a highly diversified client base and supply chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
