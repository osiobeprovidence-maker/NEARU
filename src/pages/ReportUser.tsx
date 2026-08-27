import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { AlertCircle, ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const REPORT_REASONS = [
  'Spam or misleading',
  'Inappropriate behavior or language',
  'Did not show up to RALLY',
  'Requested money outside the app',
  'Harassment or bullying',
  'Other'
];

export default function ReportUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useQuery(api.users.get, id ? { userId: id as any } : 'skip');
  
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'Report Submitted', subtitle: `We'll review your report about ${user?.name || 'this user'} shortly.` }
    }));
    navigate(-1);
  };

  if (!user) {
    return (
      <PageShell title="Report User">
        <div className="p-8 text-center text-zinc-500">Loading...</div>
      </PageShell>
    );
  }

  return (
    <PageShell title={`Report ${user.name}`}>
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 max-w-md mx-auto mt-6">
        <div className="flex items-center gap-4 mb-6 p-4 bg-rose-50 rounded-2xl border border-rose-100">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-rose-900 leading-tight mb-1">
              Safety is our priority
            </h2>
            <p className="text-xs font-medium text-rose-700">
              Your report is anonymous. If you're in immediate danger, please contact local authorities.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-3">
              Why are you reporting {user.name}?
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all",
                    selectedReason === reason 
                      ? "border-rose-600 bg-rose-50 text-rose-700 font-bold" 
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
                  )}
                >
                  {reason}
                  {selectedReason === reason ? (
                    <Check className="w-4 h-4 text-rose-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {selectedReason && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="block text-sm font-bold text-zinc-900 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide any additional context..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-none resize-none h-24 transition-all"
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={!selectedReason}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Submit Report
          </button>
        </form>
      </div>
    </PageShell>
  );
}
