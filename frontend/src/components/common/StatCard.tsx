import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-5 rounded-xl border border-[#e6e4dc] hover:border-[#c8c5b9] transition-all duration-150 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-[#52606d] uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[#f4f3ef] border border-[#e6e4dc] text-[#064e3b] flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-[#141d24]">{value}</span>
        {trend && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              trend.isPositive
                ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-[11px] text-[#8896a4]">{subtitle}</p>}
    </div>
  );
};
