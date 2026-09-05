import React from 'react';
import { cn } from '../lib/utils';

interface PageShellProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export default function PageShell({ title, subtitle, backTo, children, headerAction, className }: PageShellProps) {
  return (
    <div className={cn("px-0 md:px-8 pt-0 md:pt-8 pb-24 md:pb-8", className)}>
      {/* Desktop Header */}
      <div className="hidden md:flex px-6 md:px-0 items-end justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500 mt-1 sm:mt-2">{subtitle}</p>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {/* Mobile Subtitle and Header Action (if present) */}
      {(subtitle || headerAction) && (
        <div className="md:hidden px-4 pt-3 mb-3 flex items-center justify-between gap-3">
          {subtitle ? (
            <p className="text-xs text-zinc-500 font-medium">{subtitle}</p>
          ) : (
            <div />
          )}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {children}
    </div>
  );
}
