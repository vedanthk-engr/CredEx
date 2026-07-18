import React from 'react';
import { CohortBadge } from './CohortBadge';
import { MomentumBadge } from './MomentumBadge';
import { ZKProofBadge } from './ZKProofBadge';
import { ShieldAlert, ShieldCheck, Activity } from 'lucide-react';

interface HealthCardProps {
  businessName: string;
  cohortLabel: string;
  percentile: number;
  momentum: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  zkProofToken?: string;
  msmeId: string;
}

export const HealthCard: React.FC<HealthCardProps> = ({
  businessName,
  cohortLabel,
  percentile,
  momentum,
  riskLevel,
  zkProofToken,
  msmeId,
}) => {
  const getRiskBadge = () => {
    if (riskLevel === 'Low') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent-light text-xs font-bold uppercase tracking-wide">
          <ShieldCheck size={14} /> Low Risk
        </span>
      );
    }
    if (riskLevel === 'Medium') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning/15 border border-warning/25 text-warning-light text-xs font-bold uppercase tracking-wide">
          <Activity size={14} /> Medium Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-danger/15 border border-danger/25 text-danger-light text-xs font-bold uppercase tracking-wide animate-pulse">
        <ShieldAlert size={14} /> High Risk
      </span>
    );
  };

  // Convert ordinal (72 -> 72nd)
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-44 h-44 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <span className="text-gray-400 text-xs font-semibold block uppercase tracking-wider mb-1">
            MSME Financial Health Card
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
            {businessName}
          </h2>
          <div className="flex flex-wrap gap-2.5 mt-2.5">
            <CohortBadge label={cohortLabel} />
            {getRiskBadge()}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MomentumBadge momentum={momentum} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-6">
        {/* Scoring Radial/Percentile Ring */}
        <div className="md:col-span-1 flex flex-col items-center justify-center p-4 rounded-xl bg-primary-dark/30 border border-white/5 relative">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#FFFFFF"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentile / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold font-display tracking-tighter text-white">
                {percentile}%
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                Percentile
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
            Rated <strong className="text-gray-200">{getOrdinal(percentile)}</strong> against peers in the cohort archetype.
          </p>
        </div>

        {/* Dynamic description & ZK attestation */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">
              Assessment Summary
            </span>
            <p className="text-sm text-gray-200 leading-relaxed">
              Based on historical GST declarations, UPI cash inflow velocities, and payroll filing consistencies, this business represents a <strong className="text-accent-light uppercase">{riskLevel} risk profile</strong> with stable seasonal performance.
            </p>
          </div>
          
          <ZKProofBadge token={zkProofToken} msmeId={msmeId} />
        </div>
      </div>
    </div>
  );
};
