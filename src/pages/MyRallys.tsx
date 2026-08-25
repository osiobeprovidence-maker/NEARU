import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { mockRallies } from '../data/mock';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import { cn } from '../lib/utils';
import { Users, CheckCircle2 } from 'lucide-react';

export default function MyRallys() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Created');
  const [isLoading, setIsLoading] = useState(true);
  const [rallies, setRallies] = useState({
    Created: [{ id: 1, title: 'EXTRA RAVE TICKET', type: 'ACTIVE', interested: 12 }],
    Interested: [{ id: 2, title: 'FOOTBALL TONIGHT', type: 'CONFIRMED' }],
    Completed: [] // Empty by default to show the new empty state
  });

  const tabs = ['Created', 'Interested', 'Completed'];

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600); // Simulate network fetch delay
    return () => clearTimeout(timer);
  }, [activeTab]);

  const clearCurrentTab = () => {
    setRallies(prev => ({ ...prev, [activeTab]: [] }));
  };

  return (
    <PageShell title="My RALLYS" headerAction={
      <button 
        onClick={clearCurrentTab}
        className="px-4 py-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all text-xs font-bold"
      >
        Clear
      </button>
    }>
      <div className="px-6 md:px-0 flex items-center gap-6 border-b border-zinc-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-bold transition-colors relative",
              activeTab === tab ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
        {isLoading ? (
          <>
            <RallyCardSkeleton />
            <RallyCardSkeleton />
          </>
        ) : (
          <>
            {rallies[activeTab as keyof typeof rallies].length === 0 ? (
              <div className="text-center py-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 border-none">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 bg-emerald-50 rounded-full animate-pulse blur-xl opacity-60" />
                  <div className="relative bg-white border border-emerald-100 shadow-xl shadow-emerald-100/50 w-full h-full rounded-[2.5rem] flex items-center justify-center rotate-6 hover:rotate-0 transition-transform duration-500 animate-float">
                    <Users className="w-14 h-14 text-emerald-500" strokeWidth={1.5} />
                    <div className="absolute -top-2 -left-2 bg-indigo-400 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm animate-swing origin-bottom-right">
                      <span className="text-white text-[10px] font-black">?</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">No RALLYS here</h3>
                <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[220px] mx-auto mb-8">
                  You don't have any {activeTab.toLowerCase()} RALLYS yet. Time to start an adventure!
                </p>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-create-rally'))}
                  className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-bold shadow-md shadow-zinc-200 transition-all hover:scale-105 active:scale-95"
                >
                  Create a RALLY
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'Created' && rallies.Created.map(rally => (
                  <div key={rally.id} className="bg-white p-6 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        {rally.type}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        <Users className="w-3.5 h-3.5" />
                        {rally.interested} interested
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-6 leading-tight">{rally.title}</h3>
                    
                    <div className="flex gap-3">
                      <button className="flex-1 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold transition-colors">
                        View
                      </button>
                      <button className="flex-1 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-md shadow-zinc-200">
                        Manage
                      </button>
                    </div>
                  </div>
                ))}

                {activeTab === 'Interested' && rallies.Interested.map(rally => (
                  <div key={rally.id} className="bg-white p-6 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
                        {rally.type}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-1 leading-tight">{rally.title}</h3>
                    <p className="text-sm text-zinc-500 mb-6 font-medium">You joined this RALLY.</p>
                    
                    <button 
                      onClick={() => navigate('/messages/c1')}
                      className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-md shadow-zinc-200"
                    >
                      Open Chat
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}