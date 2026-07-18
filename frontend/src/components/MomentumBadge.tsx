import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MomentumBadgeProps {
  momentum: string;
}

export const MomentumBadge: React.FC<MomentumBadgeProps> = ({ momentum }) => {
  const isDeclining = momentum.includes('declining') || momentum.startsWith('-');
  
  if (isDeclining) {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
        <TrendingDown size={14} />
        <span>{momentum}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent-light text-xs font-semibold animate-pulse-slow">
      <TrendingUp size={14} />
      <span>{momentum}</span>
    </div>
  );
};
