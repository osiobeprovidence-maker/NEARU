import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, Heart, Users, MapPin, Calendar, Clock, DollarSign, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ActivityType } from '../types';
import { cn } from '../lib/utils';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';

interface CreateRallyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateRallyModal({ isOpen, onClose, onCreated }: CreateRallyModalProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [price, setPrice] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const { city, locationLabel, position, geoState } = useLocation();
  const { firebaseUser } = useAuth();
  const createRally = useMutation(api.rallies.create);

  const rallyLocation = city || locationLabel || 'Unknown location';
  const hasLocation = geoState === 'active' || geoState === 'manual' || geoState === 'updating';

  const resetAndClose = () => {
    setStep(1);
    setType(null);
    setDescription('');
    setIsPaid(null);
    setPrice('');
    onClose();
  };

  const handlePost = async () => {
    if (!type || !description || isPaid === null) return;
    setIsPosting(true);
    try {
      const convexUserId = localStorage.getItem('rally_convex_user_id');
      if (!convexUserId || convexUserId === 'local') {
        throw new Error('Please complete onboarding first');
      }

      const title = description.split('\n')[0].slice(0, 80) || `${type} RALLY`;

      await createRally({
        type,
        title,
        description,
        distance: 0,
        time: 'Soon',
        peopleNeeded: 1,
        isPaid: isPaid,
        price: isPaid && price ? parseInt(price, 10) : undefined,
        creatorId: convexUserId as any,
        city: city || undefined,
        locationLabel: rallyLocation,
        rallyLatitude: position?.latitude,
        rallyLongitude: position?.longitude,
      });

      onCreated();
      setTimeout(() => {
        setStep(1);
        setType(null);
        setDescription('');
        setIsPaid(null);
        setPrice('');
      }, 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to post';
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'Could not post RALLY', subtitle: msg }
      }));
    } finally {
      setIsPosting(false);
    }
  };

  const typeConfig = {
    ASK: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200', hover: 'hover:bg-rose-50' },
    HELP: { icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', hover: 'hover:bg-emerald-50' },
    JOIN: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200', hover: 'hover:bg-indigo-50' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60]"
            onClick={resetAndClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[500px] max-h-[90vh] bg-white rounded-t-[2rem] md:rounded-3xl shadow-2xl z-[70] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-xl font-black text-zinc-900">Create a RALLY</h2>
              <button onClick={resetAndClose} className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-zinc-900">What do you want to do?</h3>
                  
                  <div className="space-y-3">
                    {(['ASK', 'HELP', 'JOIN'] as ActivityType[]).map((t) => {
                      const Icon = typeConfig[t].icon;
                      return (
                        <button
                          key={t}
                          onClick={() => { setType(t); setStep(2); }}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                            type === t ? `border-${typeConfig[t].border.split('-')[1]}-500 ${typeConfig[t].bg}` : "border-zinc-100 hover:border-zinc-200"
                          )}
                        >
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", typeConfig[t].bg, typeConfig[t].color)}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900">{t}</div>
                            <div className="text-sm text-zinc-500 font-medium mt-0.5">
                              {t === 'ASK' ? 'I need something.' : t === 'HELP' ? 'I can help someone.' : 'I want people to join me.'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && type && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-zinc-900">What's happening?</h3>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={type === 'ASK' ? 'Tell people what you need...' : type === 'HELP' ? 'Tell people how you can help...' : 'What are we doing?'}
                      className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900">Location</h3>
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                      <MapPin className={cn("w-5 h-5 shrink-0", hasLocation ? "text-indigo-600" : "text-zinc-400")} />
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {hasLocation ? rallyLocation : 'Location not available'}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {hasLocation
                            ? '📍 Posted at your current location'
                            : 'Enable location to attach your position'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-zinc-900">When?</h3>
                      <button className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl transition-colors text-left">
                        <span className="text-sm font-semibold text-zinc-900">Today</span>
                        <Calendar className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-zinc-900">People needed</h3>
                      <button className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl transition-colors text-left">
                        <span className="text-sm font-semibold text-zinc-900">1</span>
                        <Users className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900">Free or Paid?</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setIsPaid(false)}
                        className={cn(
                          "py-3 rounded-xl font-bold text-sm transition-all border-2",
                          isPaid === false ? "border-zinc-900 bg-zinc-900 text-white shadow-xs" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        FREE
                      </button>
                      <button
                        onClick={() => setIsPaid(true)}
                        className={cn(
                          "py-3 rounded-xl font-bold text-sm transition-all border-2",
                          isPaid === true ? "border-amber-500 bg-amber-50 text-amber-800 shadow-xs" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        PAID
                      </button>
                    </div>
                    
                    {isPaid && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2"
                      >
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-zinc-500 font-semibold">₦</span>
                          </div>
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Amount"
                            className="w-full pl-8 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {step === 2 && (
              <div className="p-6 border-t border-zinc-100 bg-white">
                <button
                  onClick={handlePost}
                  disabled={!description || isPaid === null || (isPaid && !price) || isPosting}
                  className="w-full py-4 bg-zinc-900 disabled:bg-zinc-300 disabled:text-zinc-500 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'POST RALLY'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
