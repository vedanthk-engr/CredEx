import React, { useState, useEffect } from 'react';
import { networkApi } from '../lib/api';
import type { NetworkGraphData } from '../lib/types';
import { NetworkViz } from '../components/NetworkViz';
import { ArrowLeft, Loader2, Share2, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NetworkGraphProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ msmeId, onNavigate }) => {
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await networkApi.getGraph(msmeId);
        setGraphData(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch network graph.');
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [msmeId]);

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
            Payment Network Analysis
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Anonymized directed graph mapping the diversity of your suppliers and buyers from raw UPI transaction registers
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

        {/* Network Graph Visualizer */}
        <NetworkViz
          nodes={graphData.graph_data.nodes}
          links={graphData.graph_data.links}
          customerConc={graphData.customer_concentration}
          supplierConc={graphData.supplier_concentration}
          resilienceScore={graphData.network_resilience_score}
        />

        {/* Explanatory notes */}
        <div className="glass-panel p-5 text-xs text-gray-400 space-y-2 leading-relaxed">
          <h4 className="text-white font-bold flex items-center gap-1.5 mb-1 select-none">
            <Info size={14} className="text-accent" /> Network Scoring Methodologies
          </h4>
          <p>
            • <strong>In-Degree Centrality (Buyer Diversity):</strong> Evaluates the total number of unique client channels feeding funds into your UPI gateway. Higher buyer diversity reduces credit risk.
          </p>
          <p>
            • <strong>Out-Degree Centrality (Supplier Diversity):</strong> Evaluates vendor payment distributions. High vendor diversity protects operations from supply disruption.
          </p>
          <p>
            • <strong>Resilience Score:</strong> Formulated as <code className="font-mono text-gray-300">1.0 - max(customer_concentration, supplier_concentration)</code>. High scores lower collateral premiums.
          </p>
        </div>
      </div>
    </div>
  );
};
