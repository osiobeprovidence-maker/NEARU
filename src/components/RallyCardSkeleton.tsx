import React from 'react';

export default function RallyCardSkeleton() {
  return (
    <div className="bg-white p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-6 bg-zinc-200 rounded-full"></div>
          <div className="w-12 h-6 bg-zinc-200 rounded-full"></div>
        </div>
        <div className="w-5 h-5 bg-zinc-200 rounded-full"></div>
      </div>

      {/* Body */}
      <div className="w-3/4 h-6 bg-zinc-200 rounded-md mb-4"></div>
      <div className="space-y-2 mb-6">
        <div className="w-full h-4 bg-zinc-200 rounded-md"></div>
        <div className="w-5/6 h-4 bg-zinc-200 rounded-md"></div>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="w-20 h-4 bg-zinc-200 rounded-md"></div>
        <div className="w-16 h-4 bg-zinc-200 rounded-md"></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200"></div>
          <div className="space-y-2">
            <div className="w-24 h-4 bg-zinc-200 rounded-md"></div>
            <div className="w-16 h-3 bg-zinc-200 rounded-md"></div>
          </div>
        </div>
        <div className="w-24 h-9 bg-zinc-200 rounded-full"></div>
      </div>
    </div>
  );
}
