import React from 'react';
import { motion } from 'framer-motion';

interface DimensionBarsProps {
  dimensions: {
    "Revenue Consistency": number;
    "Cashflow Resilience": number;
    "EPFO Discipline": number;
    "GST Filing Regularity": number;
    "Collection Velocity": number;
    "AA Consent Completeness": number;
  };
}

export const DimensionBars: React.FC<DimensionBarsProps> = ({ dimensions }) => {
  const getProgressColor = (val: number) => {
    if (val >= 65) return 'bg-accent';       // Teal success
    if (val >= 40) return 'bg-warning';      // Amber warn
    return 'bg-danger';                      // Coral risk
  };

  const getBorderColor = (val: number) => {
    if (val >= 65) return 'border-accent/25';
    if (val >= 40) return 'border-warning/25';
    return 'border-danger/25';
  };

  return (
    <div className="space-y-4">
      {Object.entries(dimensions).map(([name, value]) => (
        <div key={name} className="relative">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-1.5 px-0.5">
            <span>{name}</span>
            <span className="font-mono text-gray-100">{value}th percentile</span>
          </div>
          
          <div className="w-full h-3 rounded-full bg-primary-dark border border-white/5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`h-full rounded-full ${getProgressColor(value)} shadow-sm`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
