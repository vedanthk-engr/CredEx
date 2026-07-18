import React from 'react';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import type { RoadmapActionItem } from '../lib/types';

interface RoadmapCardProps {
  action: RoadmapActionItem;
  onComplete: (id: number) => void;
  loading?: boolean;
}

export const RoadmapCard: React.FC<RoadmapCardProps> = ({ 
  action, 
  onComplete, 
  loading = false 
}) => {
  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
      action.completed 
        ? 'border-accent/40 bg-accent/5' 
        : 'border-white/5 bg-white/5 hover:border-white/10'
    }`}>
      <div className="flex items-start gap-4">
        <button
          onClick={() => !action.completed && onComplete(action.id)}
          disabled={action.completed || loading}
          className={`mt-1 flex-shrink-0 transition-colors ${
            action.completed 
              ? 'text-accent' 
              : 'text-gray-500 hover:text-accent-light'
          } disabled:opacity-50`}
        >
          {action.completed ? (
            <CheckCircle2 size={22} className="fill-accent/15" />
          ) : (
            <Circle size={22} />
          )}
        </button>

        <div className="flex-grow">
          <p className={`text-sm font-semibold leading-relaxed ${
            action.completed ? 'text-gray-400 line-through' : 'text-gray-100'
          }`}>
            {action.action}
          </p>
          
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            <span className="font-semibold text-gray-300">Why it matters:</span> {action.why_it_matters}
          </p>

          <div className="flex flex-wrap gap-2.5 mt-4">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple/10 border border-purple-light/20 text-purple-light text-[10px] font-bold uppercase tracking-wider">
              Score Delta: {action.projected_score_delta}
            </div>
            
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-accent-light text-[10px] font-bold uppercase tracking-wider">
              Limit Delta: {action.projected_limit_delta}
            </div>

            <div className="inline-flex items-center gap-1 text-[11px] text-gray-400 ml-auto">
              <Calendar size={12} />
              <span>Target: {action.timeline_days} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
