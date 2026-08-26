import React from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export default function AdCard() {
  return (
    <div className="bg-white overflow-hidden flex flex-col sm:flex-row relative">
      {/* Small Ad Badge */}
      <div className="absolute top-4 left-4 z-10 bg-zinc-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
        Ad
      </div>
      
      {/* Image / Visual Area */}
      <div className="h-48 sm:h-auto sm:w-[40%] bg-zinc-50 relative overflow-hidden flex items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-100">
         {/* Subtle indigo gradient background */}
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-purple-50/80" />
         
         {/* Geometric product mock */}
         <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
           <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-indigo-500 relative">
              <ShoppingBag className="w-10 h-10" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-[10px] uppercase tracking-wider shadow-md border-[3px] border-white">
                Fast
              </div>
           </div>
         </div>
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center bg-white relative overflow-hidden">
        {/* Subtle accent blob */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
              Q
            </div>
            <span className="text-xs font-black text-zinc-900 tracking-tight">QuickMart</span>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight mb-2 leading-tight">
            Groceries, delivered in <span className="text-indigo-600">minutes.</span>
          </h3>
          
          <p className="text-sm text-zinc-500 font-medium mb-6 leading-relaxed max-w-sm">
            Fresh items from your favorite stores, right to your door. Skip the line and get what you need instantly.
          </p>
          
          <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-md shadow-zinc-200">
            Shop Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
