import React from 'react';

interface MetricTileProps {
  title: string;
  value: string | number;
  subtitle: string;
  type?: 'default' | 'success' | 'warning' | 'danger' | 'purple';
}

export const MetricTile: React.FC<MetricTileProps> = ({ 
  title, 
  value, 
  subtitle, 
  type = 'default' 
}) => {
  const borderColors = {
    default: 'border-white/5 bg-white/5 hover:border-white/10',
    success: 'border-accent/20 bg-accent/5 hover:border-accent/30',
    warning: 'border-warning/20 bg-warning/5 hover:border-warning/30',
    danger: 'border-danger/20 bg-danger/5 hover:border-danger/30',
    purple: 'border-purple/20 bg-purple/5 hover:border-purple/30',
  };

  const textColors = {
    default: 'text-gray-100',
    success: 'text-accent-light',
    warning: 'text-warning-light',
    danger: 'text-danger-light',
    purple: 'text-purple-light',
  };

  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${borderColors[type]}`}>
      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">
        {title}
      </span>
      <div className={`text-2xl font-bold tracking-tight mb-1 font-display ${textColors[type]}`}>
        {value}
      </div>
      <span className="text-gray-400 text-xs font-medium block">
        {subtitle}
      </span>
    </div>
  );
};
