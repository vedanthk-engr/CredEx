import React, { useState, useEffect } from 'react';
import { bankApi } from '../lib/api';
import type { PortfolioItem } from '../lib/types';
import { PortfolioTable } from '../components/PortfolioTable';
import { Loader2, Landmark, Download, RefreshCw, AlertCircle, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BankDashboardProps {
  onInspect: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const BankDashboard: React.FC<BankDashboardProps> = ({ onInspect, onNavigate }) => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [rescoringId, setRescoringId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bankApi.getPortfolio();
      setPortfolio(data.msmes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch bank portfolio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleRescore = async (msmeId: string) => {
    setRescoringId(msmeId);
    try {
      // Simulate minor rescoring trigger
      await new Promise(resolve => setTimeout(resolve, 800));
      // Refresh portfolio
      const data = await bankApi.getPortfolio();
      setPortfolio(data.msmes);
    } catch (err) {
      alert("Failed to rescore MSME.");
    } finally {
      setRescoringId(null);
    }
  };

  const handleBulkRescore = async () => {
    setBulkLoading(true);
    try {
      await bankApi.rescorePortfolio();
      await fetchPortfolio();
    } catch (err) {
      alert("Failed to trigger bulk rescore.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Compute stats for charts
  const stats = React.useMemo(() => {
    if (portfolio.length === 0) return { riskData: [], sectorData: [], totalLimit: 0 };
    
    // Risk counts
    let low = 0, med = 0, high = 0;
    let totalLimit = 0;
    
    // Sectors mapping
    const sectors: Record<string, number> = {};

    portfolio.forEach(item => {
      totalLimit += item.recommended_limit;
      
      if (item.risk_level === 'Low') low++;
      else if (item.risk_level === 'Medium') med++;
      else high++;
      
      const s = item.cohort_label.split(' ')[1] || 'Retail';
      sectors[s] = (sectors[s] || 0) + 1;
    });

    const riskData = [
      { name: 'Low Risk', value: low, color: '#1D9E75' },
      { name: 'Medium Risk', value: med, color: '#BA7517' },
      { name: 'High Risk', value: high, color: '#D85A30' }
    ];

    const sectorData = Object.entries(sectors).map(([name, count]) => ({
      name,
      count
    }));

    return { riskData, sectorData, totalLimit };
  }, [portfolio]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-gray-400">
        <Loader2 size={36} className="animate-spin text-accent mb-3" />
        Loading underwriter portfolio database...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Bulk Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            <Landmark className="text-accent" size={22} />
            Underwriter Credit Portfolio
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Monitor, assess, and dispatch capital offers across registered MSMEs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkRescore}
            disabled={bulkLoading}
            className="px-4 py-2.5 rounded-xl bg-primary-light border border-white/5 hover:bg-white/5 text-gray-200 text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            <RefreshCw size={14} className={bulkLoading ? 'animate-spin text-accent' : ''} />
            Bulk Re-score Stale
          </button>
          
          <a
            href={bankApi.getExportUrl()}
            className="px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-light text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-accent/15"
          >
            <Download size={14} /> Export CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 flex items-start gap-2.5 text-xs text-danger-light leading-normal">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Portolio Summary Cards & Analytics Charts */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution Donut */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <PieIcon size={14} className="text-accent" />
              Risk Classification
            </h3>
            <div className="h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#132238', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sector distribution */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={14} className="text-purple-light" />
              Sector Breakdown
            </h3>
            <div className="h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sectorData} margin={{ bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#132238', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }} />
                  <Bar dataKey="count" fill="#534AB7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Portfolio metrics */}
          <div className="glass-panel p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Portfolio Valuation
              </h3>
              
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold block">
                  Total Allocated Exposure Limit
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-1 font-display">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalLimit)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-primary-dark/30 text-[11px] text-gray-400 leading-relaxed mt-4">
              All dynamic limits recalculate automatically when raw bank statement or GSTR logs refresh on client accounts.
            </div>
          </div>
        </div>
      )}

      {/* Main Table view */}
      <PortfolioTable
        items={portfolio}
        onRescore={handleRescore}
        onInspect={onInspect}
        rescoringId={rescoringId}
      />
    </div>
  );
};
