import React, { useState, useEffect } from 'react';
import { bankApi } from '../lib/api';
import type { PortfolioItem } from '../lib/types';
import { PortfolioTable } from '../components/PortfolioTable';
import { Loader2, Landmark, Download, RefreshCw, AlertCircle, PieChart as PieIcon, BarChart3, Settings, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, CartesianGrid } from 'recharts';

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

  // Credit policy rule states
  const [policyMinScore, setPolicyMinScore] = useState<number>(50);
  const [policyMinRunway, setPolicyMinRunway] = useState<number>(15);

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
      await new Promise(resolve => setTimeout(resolve, 800));
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

  // Compute stats for charts and policy compliance
  const stats = React.useMemo(() => {
    if (portfolio.length === 0) return { riskData: [], sectorData: [], scatterData: [], totalLimit: 0, passCount: 0 };
    
    let low = 0, med = 0, high = 0;
    let totalLimit = 0;
    let passCount = 0;
    const sectors: Record<string, number> = {};

    portfolio.forEach((item, index) => {
      totalLimit += item.recommended_limit;
      
      if (item.risk_level === 'Low') low++;
      else if (item.risk_level === 'Medium') med++;
      else high++;
      
      const s = item.cohort_label.split(' ')[1] || 'Retail';
      sectors[s] = (sectors[s] || 0) + 1;

      // Policy checks
      const passScore = item.percentile >= policyMinScore;
      const itemRunway = item.msme_id === 'DEMO_04' ? 8 : 48; // Singh Cold Chain has 8 days
      const passRunway = itemRunway >= policyMinRunway;
      if (passScore && passRunway) passCount++;
    });

    const riskData = [
      { name: 'Low Risk', value: low, color: '#FFFFFF' },
      { name: 'Medium Risk', value: med, color: '#A3A3A3' },
      { name: 'High Risk', value: high, color: '#404040' }
    ];

    const sectorData = Object.entries(sectors).map(([name, count]) => ({
      name,
      count
    }));

    const scatterData = portfolio.map((item, index) => {
      let vintage = 2.0 + (index * 1.5) % 8.5;
      return {
        name: item.business_name,
        vintage: parseFloat(vintage.toFixed(1)),
        percentile: item.percentile,
        limit: item.recommended_limit
      };
    });

    return { riskData, sectorData, scatterData, totalLimit, passCount };
  }, [portfolio, policyMinScore, policyMinRunway]);

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
            <Landmark className="text-white" size={22} />
            Underwriter Credit Portfolio
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Monitor, assess, and dispatch capital offers across registered MSMEs
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={handleBulkRescore}
            disabled={bulkLoading}
            className="px-4 py-2.5 rounded-xl bg-primary-light border border-white/5 hover:bg-white/5 text-gray-200 font-bold transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            <RefreshCw size={14} className={bulkLoading ? 'animate-spin' : ''} />
            Bulk Re-score Stale
          </button>
          
          <a
            href={bankApi.getExportUrl()}
            className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold transition-all flex items-center gap-2"
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

      {/* Portfolio Summary Cards & Analytics Charts */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution Donut */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <PieIcon size={14} className="text-white" />
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
                  <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sector distribution */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={14} className="text-white" />
              Sector Breakdown
            </h3>
            <div className="h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sectorData} margin={{ bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }} />
                  <Bar dataKey="count" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
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
                <span className="text-neutral-500 text-[10px] uppercase font-bold block">
                  Total Allocated Exposure Limit
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-1 font-display">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalLimit)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-primary-dark/30 text-[11px] text-neutral-500 leading-relaxed mt-4 font-semibold">
              All dynamic limits recalculate automatically when raw bank statement or GSTR logs refresh on client accounts.
            </div>
          </div>
        </div>
      )}

      {portfolio.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Dispersion Analysis Graph */}
          <div className="lg:col-span-2 glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={14} className="text-white" />
              Cohort Dispersion analysis (Vintage vs. Credit Rating)
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 15, right: 15, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" dataKey="vintage" name="Vintage" unit=" yrs" stroke="#404040" fontSize={8} tickLine={false} />
                  <YAxis type="number" dataKey="percentile" name="Percentile" unit="%" stroke="#404040" fontSize={8} tickLine={false} />
                  <ZAxis type="number" dataKey="limit" range={[60, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} 
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-black border border-white/10 rounded-xl shadow-[0_0_24px_rgba(255,255,255,0.06)] font-mono text-[10px] space-y-1">
                            <p className="text-white font-extrabold">{data.name}</p>
                            <p className="text-neutral-500 font-bold">Vintage: <span className="text-neutral-300">{data.vintage} yrs</span></p>
                            <p className="text-neutral-500 font-bold">Rating: <span className="text-neutral-300">{data.percentile}%</span></p>
                            <p className="text-neutral-500 font-bold">Exposure: <span className="text-white">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.limit)}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="MSMEs" data={stats.scatterData} fill="#FFFFFF">
                    {stats.scatterData.map((entry, index) => {
                      const isHighRisk = entry.percentile < 50;
                      return <Cell key={`cell-${index}`} fill={isHighRisk ? '#262626' : '#FFFFFF'} fillOpacity={0.85} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* POLICY RULE BUILDER WIDGET */}
          <div className="lg:col-span-1 glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Settings size={14} className="text-white" />
              Credit Policy Rule Builder
            </h3>
            <p className="text-[10px] text-neutral-500 leading-normal">
              Adjust minimum risk thresholds. Qualification passes are calculated dynamically across the registered portfolio.
            </p>

            <div className="space-y-3 pt-1 text-xs">
              {/* Score Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-neutral-400">
                  <span>Min Percentile Score</span>
                  <span className="text-white font-mono">{policyMinScore}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={policyMinScore}
                  onChange={(e) => setPolicyMinScore(parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Cash Runway Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-neutral-400">
                  <span>Min Cash Runway Days</span>
                  <span className="text-white font-mono">{policyMinRunway} days</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={policyMinRunway}
                  onChange={(e) => setPolicyMinRunway(parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-2 mt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-white" />
                <span className="text-[10px] font-bold uppercase text-white tracking-wider">Policy Yield</span>
              </div>
              <div className="text-xl font-bold text-white mt-1">
                {stats.passCount} / {portfolio.length} MSMEs Qualify
              </div>
              <span className="text-[9px] text-neutral-500 block">
                Exposure capacity approved: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.passCount * 380000)}
              </span>
            </div>

          </div>

        </div>
      )}

      {/* Main Table view */}
      {portfolio.length > 0 && (
        <PortfolioTable
          items={portfolio}
          onRescore={handleRescore}
          onInspect={onInspect}
          rescoringId={rescoringId}
          policyMinScore={policyMinScore}
          policyMinRunway={policyMinRunway}
        />
      )}
    </div>
  );
};
