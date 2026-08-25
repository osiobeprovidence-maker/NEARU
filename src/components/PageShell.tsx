import React from 'react';
import { cn } from '../lib/utils';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export default function PageShell({ title, subtitle, children, headerAction, className }: PageShellProps) {
  return (
    <div className={cn("px-0 md:px-8 py-6 md:py-8 min-h-screen", className)}>
      <div className="px-6 md:px-0 flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500 mt-2">{subtitle}</p>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      {children}
    </div>
  );
}
