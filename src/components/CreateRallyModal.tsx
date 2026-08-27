import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, Heart, Users, MapPin, Calendar, Clock, DollarSign, Loader2, Camera, Video, FileText, Hash, ChevronDown, Check } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
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

const CATEGORIES = [
  { id: 'sports', label: 'Outdoor & Sports', icon: '🏃' },
  { id: 'music', label: 'Music & Events', icon: '🎵' },
  { id: 'gaming', label: 'Tech & Gaming', icon: '🎮' },
  { id: 'social', label: 'Social Hangouts', icon: '☕' },
  { id: 'work', label: 'Work & Business', icon: '💼' },
  { id: 'education', label: 'Learning & Skills', icon: '📚' },
  { id: 'creative', label: 'Art & Creativity', icon: '🎨' },
  { id: 'fitness', label: 'Fitness & Health', icon: '💪' },
  { id: 'travel', label: 'Travel & Explore', icon: '🧭' },
  { id: 'food', label: 'Food & Cooking', icon: '🍽️' },
  { id: 'general', label: 'General', icon: '📌' },
];

export default function CreateRallyModal({ isOpen, onClose, onCreated }: CreateRallyModalProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [peopleNeeded, setPeopleNeeded] = useState(1);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { city, locationLabel, position, geoState } = useLocation();
  const { firebaseUser } = useAuth();
  const createRally = useMutation(api.rallies.create);
  const getOrCreateUser = useMutation(api.users.getOrCreateByEmail);
  const convexUser = useQuery(
    api.users.getByEmail,
    firebaseUser?.email ? { email: firebaseUser.email } : 'skip'
  );

  const rallyLocation = city || locationLabel || 'Unknown location';
  const hasLocation = geoState === 'active' || geoState === 'manual' || geoState === 'updating';

  const resetAndClose = () => {
    setStep(1);
    setType(null);
    setDescription('');
    setIsPaid(null);
    setPrice('');
    setCategory('');
    setEventDate('');
    setEventTime('');
    setPeopleNeeded(1);
    setMediaUrl('');
    setMediaType(null);
    setShowCategoryPicker(false);
    onClose();
  };

  const handleMediaUrl = (url: string) => {
    setMediaUrl(url);
    if (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(url)) {
      setMediaType('image');
    } else if (/\.(mp4|webm|ogg)/i.test(url)) {
      setMediaType('video');
    } else {
      setMediaType(null);
    }
  };

  const ensureConvexUser = useCallback(async (): Promise<string> => {
    if (convexUser?._id) return convexUser._id;
    if (!firebaseUser?.email) throw new Error('Please complete onboarding first');
    const userId = await getOrCreateUser({
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
    });
    return userId;
  }, [convexUser, firebaseUser, getOrCreateUser]);

  const handlePost = async () => {
    if (!type || !description || isPaid === null) return;
    setIsPosting(true);
    try {
      const convexUserId = await ensureConvexUser();

      const title = description.split('\n')[0].slice(0, 80) || `${type} RALLY`;

      await createRally({
        type,
        title,
        description,
        distance: 0,
        time: eventTime || 'Soon',
        peopleNeeded,
        isPaid: isPaid,
        price: isPaid && price ? parseInt(price, 10) : undefined,
        creatorId: convexUserId as any,
        city: city || undefined,
        locationLabel: rallyLocation,
        rallyLatitude: position?.latitude,
        rallyLongitude: position?.longitude,
        category: category || undefined,
        eventDate: eventDate || undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
      });

      onCreated();
      setTimeout(() => resetAndClose(), 500);
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
    ASK: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' },
    HELP: { icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    JOIN: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
  };

  const selectedCategory = CATEGORIES.find(c => c.id === category);

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
              <h2 className="text-xl font-black text-zinc-900">
                {step === 1 ? 'Create a RALLY' : step === 2 ? 'Details' : 'Review & Post'}
              </h2>
              <button onClick={resetAndClose} className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="flex gap-1.5 px-6 pt-3">
              {[1, 2, 3].map(s => (
                <div key={s} className={cn("h-1 flex-1 rounded-full transition-all", s <= step ? 'bg-zinc-900' : 'bg-zinc-200')} />
              ))}
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
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
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                    <h3 className="text-sm font-bold text-zinc-900">Media (optional)</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                        <Camera className="w-4 h-4 text-zinc-400 shrink-0" />
                        <input
                          type="url"
                          value={mediaUrl}
                          onChange={(e) => handleMediaUrl(e.target.value)}
                          placeholder="Paste image or video URL"
                          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-400"
                        />
                      </div>
                      {mediaUrl && (
                        <button onClick={() => { setMediaUrl(''); setMediaType(null); }} className="p-2 rounded-lg hover:bg-zinc-100">
                          <X className="w-4 h-4 text-zinc-400" />
                        </button>
                      )}
                    </div>
                    {mediaUrl && mediaType && (
                      <div className="rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100">
                        {mediaType === 'image' ? (
                          <img src={mediaUrl} alt="" className="w-full h-full object-cover" onError={() => { setMediaType(null); }} />
                        ) : (
                          <video src={mediaUrl} className="w-full h-full object-cover" controls onError={() => { setMediaType(null); }} />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900">Category</h3>
                    <button
                      onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Hash className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-900">
                          {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.label}` : 'Select a category'}
                        </span>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", showCategoryPicker && "rotate-180")} />
                    </button>
                    {showCategoryPicker && (
                      <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => { setCategory(cat.id === category ? '' : cat.id); setShowCategoryPicker(false); }}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl text-left text-sm font-medium transition-all",
                              category === cat.id ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-white border border-zinc-200 hover:border-zinc-300"
                            )}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-zinc-900">Date</h3>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full p-3 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl transition-colors text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-zinc-900">Time</h3>
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full p-3 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl transition-colors text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-zinc-900">People needed</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPeopleNeeded(Math.max(1, peopleNeeded - 1))}
                        className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-600 hover:bg-zinc-200 active:scale-95 transition-all"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-lg font-bold text-zinc-900">{peopleNeeded}</span>
                      <button
                        onClick={() => setPeopleNeeded(Math.min(50, peopleNeeded + 1))}
                        className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-600 hover:bg-zinc-200 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
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
                          {hasLocation ? '📍 Posted at your current location' : 'Enable location to attach your position'}
                        </div>
                      </div>
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
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
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

              {step === 3 && type && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", typeConfig[type].bg, typeConfig[type].color)}>
                        {React.createElement(typeConfig[type].icon, { className: "w-5 h-5" })}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 text-sm">{type} RALLY</div>
                        {selectedCategory && <div className="text-xs text-zinc-500">{selectedCategory.icon} {selectedCategory.label}</div>}
                      </div>
                      {isPaid !== null && (
                        <div className={cn("ml-auto px-2.5 py-1 rounded-full text-xs font-bold", isPaid ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                          {isPaid ? `₦${price || '?'}` : 'FREE'}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed">{description}</p>
                    {mediaUrl && mediaType && (
                      <div className="rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100">
                        {mediaType === 'image' ? (
                          <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={mediaUrl} className="w-full h-full object-cover" controls />
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                      {eventDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{eventDate}</span>}
                      {eventTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{eventTime}</span>}
                      {peopleNeeded > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{peopleNeeded} needed</span>}
                      {hasLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rallyLocation}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 bg-white">
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={!description || isPaid === null || (isPaid && !price)}
                  className="w-full py-4 bg-zinc-900 disabled:bg-zinc-300 disabled:text-zinc-500 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all"
                >
                  Review
                </button>
              )}
              {step === 3 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-4 bg-zinc-100 text-zinc-700 rounded-2xl font-bold text-sm hover:bg-zinc-200 active:scale-[0.98] transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={isPosting}
                    className="flex-1 py-4 bg-zinc-900 disabled:bg-zinc-300 disabled:text-zinc-500 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isPosting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
                    ) : (
                      'POST RALLY'
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
