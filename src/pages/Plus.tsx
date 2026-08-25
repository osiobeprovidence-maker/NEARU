import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { Zap, Check, Sparkles } from 'lucide-react';

export default function Plus() {
  const [selectedPlan, setSelectedPlan] = useState<'1m' | '3m' | '1y'>('1m');

  return (
    <PageShell 
      title="RALLY+" 
      subtitle="Less distraction. More RALLY."
    >
      <div className="space-y-6 max-w-xl mx-auto pb-12">
        {/* Banner Card */}
        <div className="bg-zinc-900 text-white md:rounded-[2rem] border-y md:border border-zinc-800 p-8 text-center relative overflow-hidden shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Zap className="w-7 h-7" />
          </div>
          
          <h2 className="text-2xl font-black mb-2 text-white">RALLY is free for everyone.</h2>
          <p className="text-zinc-300 text-sm mb-6 max-w-sm mx-auto font-medium leading-relaxed">
            RALLY+ removes advertising and supports the community infrastructure.
          </p>

          <div className="space-y-3 mb-2 text-left max-w-xs mx-auto text-sm">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-zinc-200">Zero advertisements</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-zinc-200">Premium profile badge</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-zinc-200">Early access to new features</span>
            </div>
          </div>
        </div>

        {/* Plan selection */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Choose your plan</h3>
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            <button 
              type="button"
              onClick={() => setSelectedPlan('1m')}
              className={`w-full flex items-center justify-between p-5 sm:p-6 transition-colors text-left ${
                selectedPlan === '1m' ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === '1m' ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                }`}>
                  {selectedPlan === '1m' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-base">1 Month</div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">Billed monthly</div>
                </div>
              </div>
              <div className="font-black text-lg text-zinc-900">₦1,000</div>
            </button>
            
            <button 
              type="button"
              onClick={() => setSelectedPlan('3m')}
              className={`w-full flex items-center justify-between p-5 sm:p-6 transition-colors text-left ${
                selectedPlan === '3m' ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === '3m' ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                }`}>
                  {selectedPlan === '3m' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-base">3 Months</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">Save 16%</span>
                  </div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">₦833 / month</div>
                </div>
              </div>
              <div className="font-black text-lg text-zinc-900">₦2,500</div>
            </button>

            <button 
              type="button"
              onClick={() => setSelectedPlan('1y')}
              className={`w-full flex items-center justify-between p-5 sm:p-6 transition-colors text-left ${
                selectedPlan === '1y' ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === '1y' ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                }`}>
                  {selectedPlan === '1y' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-base">1 Year</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">Save 33%</span>
                  </div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">₦667 / month</div>
                </div>
              </div>
              <div className="font-black text-lg text-zinc-900">₦8,000</div>
            </button>
          </div>
        </div>

        <div className="px-4 md:px-0">
          <button 
            type="button"
            className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold tracking-wide hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>GET RALLY+</span>
          </button>
        </div>
      </div>
    </PageShell>
  );
}
