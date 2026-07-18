import React from 'react';
import { Users } from 'lucide-react';

interface CohortBadgeProps {
  label: string;
  peerSize?: number;
}

export const CohortBadge: React.FC<CohortBadgeProps> = ({ label, peerSize = 42 }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple/10 border border-purple-light/20 text-purple-light text-xs font-semibold shadow-sm shadow-purple/5">
      <Users size={14} className="animate-pulse" />
      <span>
        Peer Group: <strong className="text-gray-100">{label}</strong> ({peerSize} businesses)
      </span>
    </div>
  );
};
