import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminStatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: string;
  bg?: string;
  subtitle?: string;
  isUrgent?: boolean;
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  label,
  value,
  change,
  trend = 'up',
  icon: Icon,
  color = 'text-indigo-600',
  bg = 'bg-indigo-50',
  subtitle,
  isUrgent,
}) => {
  return (
    <div className={cn(
      "bg-white p-6 rounded-[2rem] border transition-all duration-200 group hover:shadow-md",
      isUrgent ? "border-rose-200 shadow-xs shadow-rose-100" : "border-zinc-200 shadow-xs"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105",
          bg
        )}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full",
            trend === 'up' 
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
              : trend === 'down' && isUrgent
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : "bg-zinc-100 text-zinc-600"
          )}>
            {trend === 'up' ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
            {change}
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-black text-zinc-900 mt-1 tracking-tight">{value}</h3>
      {subtitle && (
        <p className="text-xs text-zinc-500 font-medium mt-1">{subtitle}</p>
      )}
    </div>
  );
};
