import React from 'react';
import { CloudLightning, Flame, ShieldAlert, Award } from 'lucide-react';

interface ClimateRiskProps {
  zone: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  earnedBonus: boolean;
}

export const ClimateRisk: React.FC<ClimateRiskProps> = ({ zone, earnedBonus }) => {
  const zoneColors = {
    LOW: 'text-accent-light bg-accent/5 border-accent/20',
    MEDIUM: 'text-warning-light bg-warning/5 border-warning/20',
    HIGH: 'text-danger bg-danger/5 border-danger/20',
    VERY_HIGH: 'text-danger bg-danger/10 border-danger/30 animate-pulse-slow',
  };

  const zoneNames = {
    LOW: 'Low Risk Zone (Stable)',
    MEDIUM: 'Medium Risk Zone (Moderate Flood/Drought)',
    HIGH: 'High Risk Zone (Active Flood/Cyclones)',
    VERY_HIGH: 'Very High Risk Zone (Severe IMD Risk)',
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <h3 className="text-gray-100 text-sm font-bold flex items-center gap-2 mb-3">
        <CloudLightning size={16} className="text-orange-400" />
        Climate Resilience Signals
      </h3>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-gray-400 text-xs font-semibold block uppercase tracking-wider mb-1">
            IMD Risk Classification
          </span>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${zoneColors[zone]}`}>
            <ShieldAlert size={14} />
            <span>{zoneNames[zone]}</span>
          </div>
        </div>

        {earnedBonus && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 max-w-sm">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 flex-shrink-0 animate-bounce">
              <Award size={20} />
            </div>
            <div>
              <span className="text-yellow-400 text-xs font-bold block uppercase tracking-wider">
                Antifragility Bonus Applied
              </span>
              <p className="text-gray-300 text-[11px] leading-relaxed mt-0.5">
                +5 percentile boost awarded for post-shock recovery (survived historical climate anomaly).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
