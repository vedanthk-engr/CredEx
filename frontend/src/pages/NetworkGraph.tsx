import React, { useState, useEffect, useMemo } from 'react';
import { networkApi } from '../lib/api';
import type { NetworkGraphData, NetworkNode } from '../lib/types';
import { NetworkViz } from '../components/NetworkViz';
import { ArrowLeft, Loader2, Share2, Info, ShieldAlert, Search, Landmark, ChevronRight, User } from 'lucide-react';

interface NetworkGraphProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ msmeId, onNavigate }) => {
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Node selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await networkApi.getGraph(msmeId);
        setGraphData(data);
        // Default select center business
        const center = data.graph_data.nodes.find(n => n.group === 'center');
        if (center) setSelectedNode(center);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch network graph.');
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [msmeId]);

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    if (!graphData) return [];
    return graphData.graph_data.nodes.filter(node => 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) && node.group !== 'center'
    );
  }, [graphData, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-gray-400">
        <Loader2 size={36} className="animate-spin text-accent mb-3" />
        Traversing ledger and drawing directed transaction network...
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto mt-12 text-xs font-semibold">
        <h3 className="text-lg font-bold text-danger-light font-display mb-2">
          Unable to Load Graph
        </h3>
        <p className="text-gray-400 mb-6 leading-relaxed">
          {error || 'Ensure onboarding is completed and UPI flows are linked.'}
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light transition-all text-xs"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isCustomerHigh = graphData.customer_concentration > 0.40;
  const isSupplierHigh = graphData.supplier_concentration > 0.40;

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center gap-3 select-none text-xs font-semibold">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            <Share2 className="text-accent animate-pulse" size={22} />
            Payment Network Workspace
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Analyze key vendor concentration risk metrics and directed transaction linkages
          </p>
        </div>

        {/* Dynamic Risk Flags Alert Bar */}
        {(isCustomerHigh || isSupplierHigh) && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 flex items-start gap-3 text-xs leading-normal">
            <ShieldAlert size={18} className="text-danger flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-danger-light block font-bold">Supply Chain Concentration Warning</strong>
              <p className="text-gray-300 mt-0.5">
                {isCustomerHigh && 'Your customer concentration exceeds 40%, indicating heavy reliance on a single buyer. '}
                {isSupplierHigh && 'Your supplier concentration exceeds 40%, indicating vendor dependency risks.'}
                {' High concentration patterns increase volatility in scoring models.'}
              </p>
            </div>
          </div>
        )}

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Concentric SVG Graph Workspace */}
          <div className="lg:col-span-3">
            <NetworkViz
              nodes={graphData.graph_data.nodes}
              links={graphData.graph_data.links}
              customerConc={graphData.customer_concentration}
              supplierConc={graphData.supplier_concentration}
              resilienceScore={graphData.network_resilience_score}
            />
          </div>

          {/* Interactive Search & Detail Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Selected Node Details */}
            <div className="glass-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">
                Entity Detail Panel
              </h3>

              {selectedNode ? (
                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">Trade Label</span>
                    <strong className="text-white block mt-0.5 text-sm font-display">{selectedNode.label}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Category</span>
                      <span className="text-accent-light block mt-0.5 uppercase">{selectedNode.group}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Flow weight</span>
                      <span className="text-white font-mono block mt-0.5">x{selectedNode.size}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-3 text-center">Click a node in the graph to inspect.</p>
              )}
            </div>

            {/* Search and filtered nodes list */}
            <div className="glass-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Partner Search
              </h3>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-gray-500" size={14} />
                <input
                  type="text"
                  placeholder="Filter network nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-primary-dark/60 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-[11px] font-semibold text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent/40"
                />
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredNodes.length === 0 ? (
                  <p className="text-[10px] text-gray-500 text-center py-2 font-medium">No matching nodes.</p>
                ) : (
                  filteredNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-[11px] font-semibold transition-all ${
                        selectedNode?.id === node.id 
                          ? 'border-accent/40 bg-accent/5 text-accent-light' 
                          : 'border-transparent hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <User size={12} className={node.group === 'customer' ? 'text-accent' : 'text-purple-light'} />
                        {node.label}
                      </span>
                      <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Explanatory notes */}
        <div className="glass-panel p-5 text-xs text-gray-400 space-y-2 leading-relaxed">
          <h4 className="text-white font-bold flex items-center gap-1.5 mb-1 select-none font-display">
            <Info size={14} className="text-accent" /> Network Analysis Legend
          </h4>
          <p>
            • <strong>Center Node (Teal):</strong> Represents your business gateway centroid.
          </p>
          <p>
            • <strong>Left Arc Nodes (Green):</strong> Customers/Buyers. A wider arc indicating larger buyer diversity protects against sudden client churn.
          </p>
          <p>
            • <strong>Right Arc Nodes (Purple):</strong> Suppliers/Vendors. Evaluates critical raw-materials dependency chains.
          </p>
        </div>
      </div>
    </div>
  );
};
