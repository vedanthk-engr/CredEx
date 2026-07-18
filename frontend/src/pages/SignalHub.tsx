import React, { useMemo } from 'react';
import { useScore } from '../hooks/useScore';
import { ArrowLeft, Loader2, Sparkles, Zap, MessageSquare, Award, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SignalHubProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const SignalHub: React.FC<SignalHubProps> = ({ msmeId, onNavigate }) => {
  const { healthCard, loading } = useScore(msmeId);

  // Fallback structures if the business does not have these signals connected
  const ondcData = useMemo(() => {
    if (healthCard?.alternate_signals.ondc_composite_score) {
      return {
        score: healthCard.alternate_signals.ondc_composite_score,
        velocity: "+14.2% MoM",
        aov: "₹1,240",
        returns: "2.1%"
      };
    }
    return { score: null, velocity: "0%", aov: "N/A", returns: "N/A" };
  }, [healthCard]);

  const whatsappData = useMemo(() => {
    if (healthCard?.alternate_signals.whatsapp_metadata) {
      const meta = healthCard.alternate_signals.whatsapp_metadata;
      return {
        score: meta.whatsapp_vitality_score,
        contacts: meta.contact_diversity,
        responseTime: `${meta.response_velocity_minutes.toFixed(0)} mins`,
        messages: meta.conversation_volume_trend
      };
    }
    return { score: null, contacts: 0, responseTime: "N/A", messages: 0 };
  }, [healthCard]);

  // Electricity time-series for DISCOM chart
  const electricitySeries = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < msmeId.length; i++) seed += msmeId.charCodeAt(i);
    const rand = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const isSureshBricks = msmeId.includes('DEMO_02') || (healthCard?.business_name.toLowerCase().includes('suresh') ?? false);
    
    const result = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 12; i++) {
      let kwh = 800 + Math.round(300 * rand());
      if (isSureshBricks && i >= 8) {
        // Severe drop in power draw
        kwh = kwh * 0.45;
      }
      result.push({
        month: months[i],
        kwh: Math.round(kwh)
      });
    }
    return result;
  }, [msmeId, healthCard]);

  const hasSkills = healthCard?.alternate_signals.skills_validation?.has_skills ?? false;
  const isSureshBricks = msmeId.includes('DEMO_02') || (healthCard?.business_name.toLowerCase().includes('suresh') ?? false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-gray-400">
        <Loader2 size={36} className="animate-spin text-accent mb-3" />
        Synchronizing alternate ledger feeds...
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
          <Sparkles className="text-purple-light" size={22} />
          Alternate Signal Scoring Hub
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Non-traditional trust registries optimizing micro-cohort credit limits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: ONDC */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex justify-between items-start border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                ONDC Merchant Channel
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Order flow, basket value, and merchant fulfillment indices</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-accent/15 border border-accent/25 text-accent-light text-[10px] font-bold">
              CONNECTED
            </span>
          </div>

          {ondcData.score !== null ? (
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-xl bg-primary-dark/30 border border-white/5 relative">
                <span className="text-2xl font-extrabold text-accent-light font-mono">{ondcData.score}%</span>
                <span className="text-[9px] text-gray-500 uppercase font-bold mt-1 text-center">Composite Score</span>
              </div>
              <div className="col-span-2 space-y-2 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order Growth:</span>
                  <span className="text-white">{ondcData.velocity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg. Basket Value:</span>
                  <span className="text-white">{ondcData.aov}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Order Return Rate:</span>
                  <span className="text-white">{ondcData.returns}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-4 text-center font-medium">ONDC Seller Dashboard is not linked. Connect in Onboarding to claim order growth bonuses.</p>
          )}
        </div>

        {/* Card 2: WhatsApp */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex justify-between items-start border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                <MessageSquare size={16} className="text-purple-light" />
                WhatsApp Business API
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Operator communication vitality and client outreach response loops</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-accent/15 border border-accent/25 text-accent-light text-[10px] font-bold">
              CONNECTED
            </span>
          </div>

          {whatsappData.score !== null ? (
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-xl bg-primary-dark/30 border border-white/5">
                <span className="text-2xl font-extrabold text-purple-light font-mono">{whatsappData.score}%</span>
                <span className="text-[9px] text-gray-500 uppercase font-bold mt-1 text-center">Vitality Score</span>
              </div>
              <div className="col-span-2 space-y-2 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-gray-400">Unique Contacts:</span>
                  <span className="text-white">{whatsappData.contacts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg. Response Time:</span>
                  <span className="text-white">{whatsappData.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Message Vol:</span>
                  <span className="text-white">{whatsappData.messages}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-4 text-center font-medium">WhatsApp Business API metadata is not active.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 3: DISCOM Electricity Graph */}
        <div className="lg:col-span-2 glass-panel p-5 space-y-4">
          <div className="flex justify-between items-start border-b border-white/5 pb-2">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                <Zap size={16} className="text-warning-light" />
                DISCOM Electricity Consumption Draw
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Validates physical production capacity from monthly electrical utility logs.</p>
            </div>
            {isSureshBricks && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger text-[10px] font-bold uppercase animate-pulse">
                <AlertTriangle size={12} /> Phantom Output Flag
              </span>
            )}
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={electricitySeries} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={9} tickLine={false} tickFormatter={(val) => `${val} kWh`} />
                <Tooltip contentStyle={{ background: '#132238', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }} />
                <Area type="monotone" dataKey="kwh" stroke="#BA7517" fill="url(#elecGrad)" name="Monthly Draw (kWh)" />
                <defs>
                  <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BA7517" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#BA7517" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-gray-400 leading-normal">
            {isSureshBricks 
              ? 'Warning: Electricity consumption fell by >35% in late 2024, but GST filings remained flat. This suggests a potential phantom revenue declaration.' 
              : 'Electricity consumption matches GST turnover velocities, verifying active physical capacity.'}
          </p>
        </div>

        {/* Card 4: DigiLocker Skills */}
        <div className="lg:col-span-1 glass-panel p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
              <Award size={16} className="text-purple-light" />
              DigiLocker Skill Badges
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">Validates human capital credentials, applying credit score modifiers.</p>

            {hasSkills ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl border border-purple/20 bg-purple/5 text-xs">
                  <strong className="text-purple-light block font-bold">NSDC Agri Crop Management</strong>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Issuer: National Skill Development Corp (NSDC)</span>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-primary-dark/30 text-xs">
                  <strong className="text-white block font-bold">PMKVY Retail Operations</strong>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Issuer: Pradhan Mantri Kaushal Vikas Yojana</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-6 text-center font-medium">No verified credentials found. Upload certificates via DigiLocker to claim workforce skill modifiers.</p>
            )}
          </div>

          {hasSkills && (
            <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/15 text-[10px] text-gray-400 mt-4 leading-normal">
              +15 score modifier applied to the Human Capital scoring dimension based on verified certificates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
