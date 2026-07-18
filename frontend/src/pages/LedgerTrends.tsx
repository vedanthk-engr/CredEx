import React, { useMemo } from 'react';
import { useScore } from '../hooks/useScore';
import { ArrowLeft, Loader2, BarChart3, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from 'recharts';

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
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const year = i < 12 ? "2024" : "2025";
      const label = `${monthNames[monthIdx]} ${year}`;

      // Trend growth
      let trend = baseRev * (1.0 + (i / 24) * 0.18);
      
      // Seasonal cycle (peak in monsoon/festivals depending on sector)
      const seasonal = baseRev * 0.14 * Math.sin((2 * Math.PI * (i - 2)) / 12);
      
      // Residuals
      let residual = baseRev * 0.04 * (rand() - 0.5);

      if (isArjunAgro && i === 12) {
        // Severe climate dip
        residual = -baseRev * 0.5;
      }
      if (isSureshBricks && i >= 18) {
        // Decline trend
        trend = trend * (1 - (i - 17) * 0.04);
      }

      const raw = Math.max(20000, trend + seasonal + residual);

      result.push({
        month: label,
        raw: Math.round(raw),
        trend: Math.round(trend),
        seasonal: Math.round(seasonal),
        residual: Math.round(residual)
      });
    }
    return result;
  }, [msmeId, healthCard]);

  // Compute metrics from data
  const summaryStats = useMemo(() => {
    if (stlData.length === 0) return { growthRate: 0, seasonalityIndex: 0, anomalyCount: 0 };
    
    const first = stlData[0].raw;
    const last = stlData[stlData.length - 1].raw;
    const growthRate = ((last - first) / first) * 100;
    
    // Average seasonality amplitude
    const maxSeason = Math.max(...stlData.map(d => Math.abs(d.seasonal)));
    const seasonalityIndex = (maxSeason / first) * 100;
    
    // Count residual variance > 10%
    const anomalies = stlData.filter(d => Math.abs(d.residual) > first * 0.12);

    return {
      growthRate,
      seasonalityIndex,
      anomalyCount: anomalies.length
    };
  }, [stlData]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-gray-400">
        <Loader2 size={36} className="animate-spin text-accent mb-3" />
        Processing time-series decomposition...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 select-none text-xs font-semibold">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
          <BarChart3 className="text-accent" size={22} />
          STL Time-Series Trend Analyzer
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          GST Ledger decomposition separating long-term expansion from periodic trade seasonality and anomalies
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-start gap-3">
          <TrendingUp className="text-accent-light mt-0.5" size={20} />
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Underlying growth (24M)</span>
            <strong className={`text-lg font-mono font-bold block mt-1 ${summaryStats.growthRate >= 0 ? 'text-accent-light' : 'text-danger-light'}`}>
              {summaryStats.growthRate >= 0 ? '+' : ''}{summaryStats.growthRate.toFixed(1)}%
            </strong>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-start gap-3">
          <Calendar className="text-purple-light mt-0.5" size={20} />
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Seasonality amplitude</span>
            <strong className="text-lg font-mono font-bold text-purple-light block mt-1">
              {summaryStats.seasonalityIndex.toFixed(1)}%
            </strong>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-start gap-3">
          <AlertTriangle className={summaryStats.anomalyCount > 1 ? 'text-danger mt-0.5' : 'text-accent-light mt-0.5'} size={20} />
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Anomalous Months (Variance)</span>
            <strong className={`text-lg font-mono font-bold block mt-1 ${summaryStats.anomalyCount > 1 ? 'text-danger-light' : 'text-gray-300'}`}>
              {summaryStats.anomalyCount} periods
            </strong>
          </div>
        </div>
      </div>

      {/* Chart 1: Raw vs Trend */}
      <div className="glass-panel p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">1. Trend Extraction</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Smooths out short-term fluctuations to reveal underlying credit expansion rate.</p>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stlData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip formatter={(value) => formatINR(value as number)} contentStyle={{ background: '#132238', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="raw" stroke="#1d4ed8" strokeWidth={1.5} dot={{ r: 2 }} name="Raw GST Turnover" />
              <Line type="monotone" dataKey="trend" stroke="#1D9E75" strokeWidth={2.5} dot={false} name="STL Trend Line" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Seasonality */}
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">2. Seasonal Cycle</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Filters periodic annual trade cycles (e.g. agricultural harvesting/monsoon slows).</p>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stlData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={9} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(value) => formatINR(value as number)} contentStyle={{ background: '#132238', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Area type="monotone" dataKey="seasonal" stroke="#A78BFA" fill="url(#seasonalGrad)" name="Seasonality Amplitude" />
                <defs>
                  <linearGradient id="seasonalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Residuals */}
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">3. Residual Variance (Irregular Anomalies)</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Reveals erratic anomalies, such as supply delays or weather-induced lockouts.</p>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stlData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={9} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(value) => formatINR(value as number)} contentStyle={{ background: '#132238', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                <Bar dataKey="residual" name="Residual Variance">
                  {stlData.map((entry, index) => {
                    const isNeg = entry.residual < 0;
                    return <Cell key={`cell-${index}`} fill={isNeg ? '#D85A30' : '#1D9E75'} fillOpacity={0.7} />;
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
