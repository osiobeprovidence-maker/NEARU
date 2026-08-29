import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { Crown, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const PRO_PRICE = 3500;

export default function Plus() {
  const { user, isPro, grantPro } = useAuth() as any;
  const [selectedPlan, setSelectedPlan] = useState<'1m' | '3m' | '1y'>('1m');
  const [busy, setBusy] = useState(false);

  const showToast = (t: string, s: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: t, subtitle: s } }));

  const plans = {
    '1m': { label: '1 Month', perMonth: PRO_PRICE, total: PRO_PRICE, save: 0 },
    '3m': { label: '3 Months', perMonth: PRO_PRICE, total: PRO_PRICE * 3, save: 8 },
    '1y': { label: '1 Year', perMonth: PRO_PRICE, total: PRO_PRICE * 12, save: 20 },
  };

  const handleUpgrade = async () => {
    if (isPro) return;
    setBusy(true);
    try {
      await grantPro();
      showToast('Welcome to LALOA Pro!', 'You can now create an Organization or Business account.');
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not upgrade.');
    } finally {
      setBusy(false);
    }
  };

  if (isPro) {
    return (
      <PageShell title="RALLY+" subtitle="Less distraction. More RALLY.">
        <div className="space-y-6 max-w-xl mx-auto pb-12">
          <div className="bg-emerald-600/10 border border-emerald-200 text-emerald-900 md:rounded-[2rem] border-y p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-5 text-white">
              <Crown className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black mb-2">You're a LALOA Pro member.</h2>
            <p className="text-emerald-800/70 text-sm max-w-sm mx-auto font-medium leading-relaxed">
              Your Pro membership is active. You can now create an Organization or
              Business account and manage events.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-bold">
              <Check className="w-4 h-4" /> Active
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="RALLY+" subtitle="Less distraction. More RALLY.">
      <div className="space-y-6 max-w-xl mx-auto pb-12">
        {/* Banner Card */}
        <div className="bg-zinc-900 text-white md:rounded-[2rem] border-y md:border border-zinc-800 p-8 text-center relative overflow-hidden shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Crown className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-black mb-2 text-white">LALOA Pro</h2>
          <p className="text-zinc-300 text-sm mb-6 max-w-sm mx-auto font-medium leading-relaxed">
            Go professional. Create an Organization or Business account, run
            events, and reach more people.
          </p>

          <div className="space-y-3 mb-2 text-left max-w-xs mx-auto text-sm">
            {[
              'Create Organization & Business accounts',
              'Create and manage Events / RALLYs',
              'Attach posts to your events',
              'Zero advertisements',
              'Premium profile badge',
            ].map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-zinc-200">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan selection */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Choose your plan</h3>
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            {(['1m', '3m', '1y'] as const).map((key) => {
              const p = plans[key];
              const active = selectedPlan === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlan(key)}
                  className={cn(
                    'w-full flex items-center justify-between p-5 sm:p-6 transition-colors text-left',
                    active ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center', active ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300')}>
                      {active && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 text-base">{p.label}</span>
                        {p.save > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                            Save {p.save}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-0.5">₦{p.perMonth.toLocaleString()} / month</div>
                    </div>
                  </div>
                  <div className="font-black text-lg text-zinc-900">₦{p.total.toLocaleString()}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 md:px-0">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold tracking-wide hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4 text-amber-400" />}
            <span>{busy ? 'Activating…' : `GET LALOA PRO — ₦${plans[selectedPlan].perMonth.toLocaleString()}/mo`}</span>
          </button>
          <p className="text-center text-[11px] text-zinc-400 mt-3">
            Billing activation is in progress. Organization & Business accounts are unlocked with Pro.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
