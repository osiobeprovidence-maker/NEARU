/**
 * CreateContentSheet — Phase 1
 *
 * Shown when the user taps the + FAB. Asks "What do you want to create?"
 * and lets them choose between a Post or a RALLY before opening the
 * full creation modal with the correct mode pre-selected.
 *
 * It does NOT replace CreateRallyModal — it sits in front of it.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Zap, Calendar, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface CreateContentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with 'post', 'rally' or 'event' when the user makes a selection. */
  onSelect: (type: 'post' | 'rally' | 'event') => void;
}

export default function CreateContentSheet({
  isOpen,
  onClose,
  onSelect,
}: CreateContentSheetProps) {
  const { isPro } = useAuth();
  const navigate = useNavigate();

  const showToast = (title: string, subtitle: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));

  const handleEventClick = () => {
    if (!isPro) {
      showToast('LALOA Pro required', 'Upgrade to create and manage events.');
      navigate('/plus');
      return;
    }
    onSelect('event');
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet-panel"
            initial={{ opacity: 0, y: 80, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.97 }}
            transition={{ type: 'spring', bounce: 0.18, duration: 0.3 }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[420px] bg-white rounded-t-[2rem] md:rounded-3xl shadow-2xl z-[70] pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-zinc-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                Create
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="px-6 pb-4 text-sm text-zinc-500">
              What do you want to share?
            </p>

            {/* Options */}
            <div className="px-4 pb-6 space-y-3">
              {/* Post */}
              <button
                onClick={() => onSelect('post')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/40 text-left transition-all active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-zinc-900 text-base tracking-tight">
                    Post
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5 leading-snug">
                    Share something with the community.
                    Reach people nearby or by shared interest.
                  </p>
                </div>
              </button>

              {/* RALLY */}
              <button
                onClick={() => onSelect('rally')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 hover:border-amber-200 hover:bg-amber-50/40 text-left transition-all active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-zinc-900 text-base tracking-tight">
                    RALLY
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5 leading-snug">
                    Ask, help, invite, join, or organise
                    something in your area.
                  </p>
                </div>
              </button>

              {/* Event */}
              <button
                onClick={handleEventClick}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 hover:border-violet-200 hover:bg-violet-50/40 text-left transition-all active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                  <Calendar className="w-6 h-6 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-zinc-900 text-base tracking-tight flex items-center gap-1.5">
                    Event
                    {!isPro && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5 leading-snug">
                    {isPro
                      ? 'Plan and manage an event your followers can join.'
                      : 'Plan and manage an event your followers can join.'}
                  </p>
                </div>
                {!isPro && (
                  <span className="shrink-0 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                    PRO
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
