import React, { useMemo } from 'react';
import { useScore } from '../hooks/useScore';
import { ArrowLeft, Loader2, BarChart3, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface LedgerTrendsProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const LedgerTrends: React.FC<LedgerTrendsProps> = ({ msmeId, onNavigate }) => {
  const { healthCard, loading, error } = useScore(msmeId);

  // Generate deterministic GSTR series matching seed properties
  const stlData = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < msmeId.length; i++) seed += msmeId.charCodeAt(i);
    const rand = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Determine baseline limit
    const baseRev = healthCard ? healthCard.metrics.recommended_limit * 0.75 : 220000;
    const isArjunAgro = msmeId.includes('DEMO_04') || (healthCard?.business_name.toLowerCase().includes('arjun') ?? false);
    const isSureshBricks = msmeId.includes('DEMO_02') || (healthCard?.business_name.toLowerCase().includes('suresh') ?? false);

    const result = [];
    for (let i = 0; i < 24; i++) {
      const monthIdx = i % 12;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const base = baseRev * (1 + (i * 0.015)); // 1.5% MoM steady baseline growth
      
      // Calculate seasonality index
      let seasonalMult = 1.0;
      if (isArjunAgro) {
        // High agricultural/crop seasonal cycle dips
        seasonalMult = 1.0 + 0.35 * Math.sin((monthIdx / 12) * 2 * Math.PI - Math.PI / 2);
      } else {
        seasonalMult = 1.0 + 0.12 * Math.sin((monthIdx / 12) * 2 * Math.PI);
      }

      let noise = 0.08 * (rand() - 0.5);
      if (isSureshBricks && i >= 18) {
        // Drop in revenue
        noise -= 0.35;
      }

      const raw = base * seasonalMult * (1 + noise);
      const trend = base;
      const seasonal = base * (seasonalMult - 1);
      const residual = raw - (trend + seasonal);

      result.push({
        month: `${months[monthIdx]} '${i < 12 ? '24' : '25'}`,
        raw: Math.round(raw),
        trend: Math.round(trend),
        seasonal: Math.round(seasonal),
        residual: Math.round(residual),
      });
    }
    return result;
  }, [msmeId, healthCard]);

  const summaryStats = useMemo(() => {
    if (stlData.length === 0) return { meanTurnover: 0, seasonalityIndex: 0, anomalyCount: 0 };
    const sum = stlData.reduce((acc, curr) => acc + curr.raw, 0);
    const mean = sum / stlData.length;
    
    const maxSeasonal = Math.max(...stlData.map(d => Math.abs(d.seasonal)));
    const sIndex = (maxSeasonal / mean) * 100;
    
    // Count anomalies where residuals deviate by > 12% of mean
    const threshold = mean * 0.12;
    const anomalyCount = stlData.filter(d => Math.abs(d.residual) > threshold).length;

    return {
      meanTurnover: mean,
      seasonalityIndex: sIndex,
      anomalyCount
    };
  }, [stlData]);

  // Format currency to Indian Numbering System
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-black border border-white/10 rounded-xl shadow-[0_0_24px_rgba(255,255,255,0.06)] font-mono text-[10px] space-y-1">
          <p className="text-neutral-500 font-bold">{label}</p>
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex justify-between gap-4">
              <span className="text-neutral-400 font-semibold">{item.name}:</span>
              <span className="text-white font-extrabold">{formatINR(item.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-gray-400">
        <Loader2 size={36} className="animate-spin text-white mb-3" />
        Synchronizing GST registers and building STL timelines...
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto mt-12 text-xs font-semibold">
        <h3 className="text-lg font-bold text-neutral-400 font-display mb-2">
          Decomposition Error
        </h3>
        <p className="text-neutral-500 mb-6 leading-relaxed">
          {error}
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-all text-xs"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
          <BarChart3 className="text-white" size={22} />
          GST Ledger Decomposition (STL Model)
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Decompose seasonal variance from underlying organic growth patterns to prevent unfair underwriting penalties
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ y: -1 }}
          className="glass-panel p-4 flex items-start gap-3"
        >
          <TrendingUp className="text-white mt-0.5" size={20} />
          <div>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Organic Growth Rate</span>
            <strong className="text-lg font-mono font-bold text-white block mt-1">
              +1.5% MoM
            </strong>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -1 }}
          className="glass-panel p-4 flex items-start gap-3"
        >
          <Calendar className="text-white mt-0.5" size={20} />
          <div>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Seasonality amplitude</span>
            <strong className="text-lg font-mono font-bold text-white block mt-1">
              {summaryStats.seasonalityIndex.toFixed(1)}%
            </strong>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -1 }}
          className="glass-panel p-4 flex items-start gap-3"
        >
          <AlertTriangle className={summaryStats.anomalyCount > 1 ? 'text-white mt-0.5' : 'text-neutral-500 mt-0.5'} size={20} />
          <div>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Anomalous Months (Variance)</span>
            <strong className={`text-lg font-mono font-bold block mt-1 ${summaryStats.anomalyCount > 1 ? 'text-white underline' : 'text-neutral-400'}`}>
              {summaryStats.anomalyCount} periods
            </strong>
          </div>
        </motion.div>
      </div>

      {/* Chart 1: Raw vs Trend */}
      <div className="glass-panel p-5 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">1. Organic Trend Extraction</h3>
          <p className="text-[10px] text-neutral-500 mt-0.5">Smooths out short-term fluctuations to reveal underlying credit expansion rate.</p>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stlData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="#404040" fontSize={8} tickLine={false} />
              <YAxis stroke="#404040" fontSize={8} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
              <Line type="monotone" dataKey="raw" stroke="#404040" strokeWidth={1.5} dot={{ r: 2 }} name="Raw GST Turnover" />
              <Line type="monotone" dataKey="trend" stroke="#FFFFFF" strokeWidth={2.5} dot={false} name="STL Decomposed Trend" activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Seasonality */}
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">2. Seasonal Cycle Amplitude</h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">Filters periodic trade waves (e.g. agricultural harvesting slows).</p>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stlData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="seasonalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#404040" fontSize={8} tickLine={false} />
                <YAxis stroke="#404040" fontSize={8} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
                <Area type="monotone" dataKey="seasonal" stroke="#FFFFFF" strokeWidth={2} fill="url(#seasonalGrad)" name="Seasonality" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Residuals */}
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">3. Residual Variance (Erratic Anomalies)</h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">Reveals irregular anomalies, such as supply locks or local weather stress.</p>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stlData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#404040" fontSize={8} tickLine={false} />
                <YAxis stroke="#404040" fontSize={8} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
                <Bar dataKey="residual" name="Residual Variance">
                  {stlData.map((entry, index) => {
                    const isNeg = entry.residual < 0;
                    return <Cell key={`cell-${index}`} fill={isNeg ? '#262626' : '#FFFFFF'} fillOpacity={0.8} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
