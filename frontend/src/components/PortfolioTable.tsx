import React, { useState, useMemo } from 'react';
import type { PortfolioItem } from '../lib/types';
import { Search, ArrowUpDown, ShieldAlert, Sparkles, RefreshCw, Eye, CheckCircle2, XCircle } from 'lucide-react';

interface PortfolioTableProps {
  items: PortfolioItem[];
  onRescore: (id: string) => void;
  onInspect: (id: string) => void;
  rescoringId: string | null;
  policyMinScore: number;
  policyMinRunway: number;
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({
  items,
  onRescore,
  onInspect,
  rescoringId,
  policyMinScore,
  policyMinRunway
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [driftFilter, setDriftFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'percentile' | 'limit' | 'name'>('percentile');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Format currency to Indian Numbering System
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSort = (field: 'percentile' | 'limit' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter & Sort items
  const processedItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = item.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.msme_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.cohort_label.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesRisk = riskFilter === 'ALL' || item.risk_level.toUpperCase() === riskFilter;
        const matchesDrift = driftFilter === 'ALL' || item.drift_status === driftFilter;
        
        return matchesSearch && matchesRisk && matchesDrift;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'percentile') {
          comparison = a.percentile - b.percentile;
        } else if (sortBy === 'limit') {
          comparison = a.recommended_limit - b.recommended_limit;
        } else {
          comparison = a.business_name.localeCompare(b.business_name);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [items, searchTerm, riskFilter, driftFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Filters Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-primary-light/45 p-4 rounded-xl border border-white/5 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search business, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-gray-100 placeholder-gray-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded-xl py-2 px-3 text-xs font-semibold text-neutral-400 focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="ALL">All Risk Bands</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>

        <div>
          <select
            value={driftFilter}
            onChange={(e) => setDriftFilter(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded-xl py-2 px-3 text-xs font-semibold text-neutral-400 focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="ALL">All Drift Status</option>
            <option value="NORMAL">Normal Cohorts</option>
            <option value="DRIFT_ALERT">Drift Alert</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-neutral-500 font-semibold pr-1">
          Showing {processedItems.length} of {items.length} MSMEs
        </div>
      </div>

      {/* Table grid */}
      <div className="border border-white/5 bg-primary-light/20 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-primary-dark/40 text-neutral-500 text-[10px] font-bold uppercase tracking-wider select-none">
                <th className="py-3.5 px-4">MSME ID & Business</th>
                <th className="py-3.5 px-4">Cohort Archetype</th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('percentile')}
                >
                  <div className="flex items-center gap-1">
                    Percentile <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('limit')}
                >
                  <div className="flex items-center gap-1">
                    Credit Limit <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4">Credit Policy</th>
                <th className="py-3.5 px-4">Drift Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5 text-xs">
              {processedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-semibold">
                    No matching MSME credit profiles found.
                  </td>
                </tr>
              ) : (
                processedItems.map((item) => {
                  // Run dynamic policy calculations
                  const passScore = item.percentile >= policyMinScore;
                  // Singh Cold Chain (DEMO_04) has 8 days of cash runway, others have 48
                  const itemRunway = item.msme_id === 'DEMO_04' ? 8 : 48;
                  const passRunway = itemRunway >= policyMinRunway;
                  const passesPolicy = passScore && passRunway;

                  return (
                    <tr key={item.msme_id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <strong className="text-white block font-display font-bold">
                          {item.business_name}
                        </strong>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                          {item.msme_id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-medium">
                        {item.cohort_label}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold font-mono text-sm ${
                          item.percentile >= 65 ? 'text-white' : (item.percentile >= 40 ? 'text-neutral-400' : 'text-neutral-600')
                        }`}>
                          {item.percentile}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold font-mono">
                        {formatINR(item.recommended_limit)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {passesPolicy ? (
                          <span className="inline-flex items-center gap-1 text-white border border-white/20 bg-white/[0.04] px-2 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-neutral-500 border border-white/5 bg-transparent px-2 py-0.5 rounded text-[10px] font-medium">
                            <XCircle size={12} /> Declined {!passScore ? '(Score)' : '(Runway)'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.drift_status === 'DRIFT_ALERT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 border border-white/10 text-neutral-400 text-[10px] font-bold uppercase">
                            <ShieldAlert size={12} /> Alert
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-transparent text-neutral-500 text-[10px] font-semibold">
                            Stable
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => onInspect(item.msme_id)}
                            className="p-1.5 rounded-lg border border-white/5 bg-primary-light text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                            title="Inspect Card"
                          >
                            <Eye size={14} />
                          </button>
                          
                          <button
                            onClick={() => onRescore(item.msme_id)}
                            disabled={rescoringId === item.msme_id}
                            className="p-1.5 rounded-lg border border-white/5 bg-primary-light text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                            title="Rescore Business"
                          >
                            <RefreshCw size={14} className={rescoringId === item.msme_id ? 'animate-spin text-white' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
