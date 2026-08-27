import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import { cn } from '../lib/utils';
import { Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MyRallys() {
  const navigate = useNavigate();
  const { convexUserId } = useAuth();
  const [activeTab, setActiveTab] = useState('Created');
  const [isLoading, setIsLoading] = useState(true);

  const myRallies = useQuery(
    api.rallies.listByCreator,
    convexUserId ? { creatorId: convexUserId as any } : 'skip'
  );

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const tabs = ['Created', 'Interested', 'Completed'];

  return (
    <PageShell title="My RALLYS">
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
        {isLoading || (activeTab === 'Created' && myRallies === undefined) ? (
          <>
            <RallyCardSkeleton />
            <RallyCardSkeleton />
          </>
        ) : activeTab === 'Created' ? (
          myRallies && myRallies.length > 0 ? (
            myRallies.map(rally => (
              <RallyCard
                key={rally._id}
                rally={{
                  id: rally._id,
                  type: rally.type,
                  title: rally.title,
                  description: rally.description,
                  distance: 0,
                  time: rally.time,
                  peopleNeeded: rally.peopleNeeded,
                  peopleInterested: rally.peopleInterested,
                  isPaid: rally.isPaid,
                  price: rally.price,
                  creator: { id: rally.creatorId, name: 'You', username: '', avatar: '', isNINVerified: false, isPhoneVerified: false },
                  status: rally.status,
                  createdAt: new Date(rally.createdAt).toISOString(),
                  city: rally.city,
                  locationLabel: rally.locationLabel,
                }}
              />
            ))
          ) : (
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
                You haven't created any RALLYS yet. Time to start an adventure!
              </p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-create-rally'))}
                className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-bold shadow-md shadow-zinc-200 transition-all hover:scale-105 active:scale-95"
              >
                Create a RALLY
              </button>
            </div>
          )
        ) : (
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
        )}
      </div>
    </PageShell>
  );
}
