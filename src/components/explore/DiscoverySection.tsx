import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DiscoverySectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export default function DiscoverySection({
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  onAction,
  badge,
  children,
  className,
}: DiscoverySectionProps) {
  return (
    <section className={cn("py-4 sm:py-5", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 px-1 sm:px-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight truncate">
                {title}
              </h2>
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-100/60">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-zinc-500 font-medium line-clamp-1 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline shrink-0 group transition-colors active:scale-95"
          >
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>
    </section>
  );
}
