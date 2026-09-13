import React from 'react';
import { cn } from '../../lib/utils';

export default function StatusBadge({ status }: { status: string }) {
  let colorClass = 'bg-zinc-100 text-zinc-700 ring-zinc-200';
  
  switch (status) {
    case 'Draft':
      colorClass = 'bg-zinc-100 text-zinc-700 ring-zinc-200';
      break;
    case 'Published':
      colorClass = 'bg-blue-50 text-blue-700 ring-blue-200';
      break;
    case 'Registration Open':
      colorClass = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      break;
    case 'Registration Closed':
      colorClass = 'bg-orange-50 text-orange-700 ring-orange-200';
      break;
    case 'Completed':
      colorClass = 'bg-purple-50 text-purple-700 ring-purple-200';
      break;
  }
  
  return (
    <span className={cn('px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ring-1 ring-inset shrink-0', colorClass)}>
      {status}
    </span>
  );
}
