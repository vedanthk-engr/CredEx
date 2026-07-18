import React from 'react';
import { ShieldAlert, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

interface DriftAlertProps {
  driftStatus: string;
  driftType: string | null;
}

export const DriftAlert: React.FC<DriftAlertProps> = ({ driftStatus, driftType }) => {
  if (driftStatus !== 'DRIFT_ALERT' || !driftType) return null;

  const contentMap = {
    UPGRADE: {
      title: 'Upgrade Drift Detected',
      description: 'Your business features are moving towards a higher-revenue, more-established cohort. This indicates positive operational expansion.',
      colorClass: 'border-accent/40 bg-accent/5 text-accent-light',
      icon: <TrendingUp size={20} className="text-accent" />,
      badge: 'Scaling Opportunity'
    },
    STRESS: {
      title: 'Stress Drift Detected',
      description: 'Alert: Your metrics are shifting towards a lower-activity or declining cohort. We recommend completing your Roadmap Actions immediately.',
      colorClass: 'border-danger/45 bg-danger/5 text-danger-light',
      icon: <ShieldAlert size={20} className="text-danger" />,
      badge: 'Early Warning Risk'
    },
    DIVERSIFICATION: {
      title: 'Sector Mix Diversification',
      description: 'Your business profile is drifting towards a different sector mix centroid. Lenders will monitor this transition.',
      colorClass: 'border-purple/40 bg-purple/5 text-purple-light',
      icon: <Sparkles size={20} className="text-purple-light" />,
      badge: 'Sector Transition'
    }
  };

  const details = contentMap[driftType as keyof typeof contentMap] || contentMap.DIVERSIFICATION;

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${details.colorClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {details.icon}
        </div>
        <div>
          <h4 className="text-sm font-bold flex items-center gap-2">
            {details.title}
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] uppercase tracking-wider font-extrabold text-gray-200">
              {details.badge}
            </span>
          </h4>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed max-w-2xl">
            {details.description}
          </p>
        </div>
      </div>

      <button className="flex items-center gap-1.5 text-xs font-bold text-gray-100 bg-white/10 px-3.5 py-2 rounded-xl border border-white/5 hover:bg-white/20 transition-all flex-shrink-0 self-end sm:self-center">
        Analyze Trend <ArrowRight size={14} />
      </button>
    </div>
  );
};
