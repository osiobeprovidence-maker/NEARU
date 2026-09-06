import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Info,
  TrendingUp,
  MessageSquare,
  Shield,
  Award,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import VerificationBadge from './VerificationBadge';

interface GetVerifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Creator & Influencer',
  'Public Figure',
  'Business / Brand',
  'Community Leader',
  'Tech & Founder',
  'Journalist & Media',
  'Athlete / Fitness',
  'Artist / Musician',
  'Other',
];

export default function GetVerifiedModal({ isOpen, onClose }: GetVerifiedModalProps) {
  const { user, convexUserId } = useAuth();

  // Query live status from Convex
  const statusData = useQuery(
    api.blueCheck.getMyStatus,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const submitMutation = useMutation(api.blueCheck.submitRequest);

  // Form State
  const [fullName, setFullName] = useState(user.name || '');
  const [category, setCategory] = useState('Creator & Influencer');
  const [links, setLinks] = useState<string[]>(['']);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReapplying, setIsReapplying] = useState(false);

  useEffect(() => {
    if (user.name && !fullName) {
      setFullName(user.name);
    }
  }, [user.name]);

  if (!isOpen) return null;

  const currentStatus = statusData?.blueCheckStatus || (user.isBlueVerified ? 'verified' : 'unverified');
  const latestRequest = statusData?.latestRequest;

  const handleAddLink = () => {
    if (links.length < 5) {
      setLinks([...links, '']);
    }
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleLinkChange = (idx: number, val: string) => {
    const updated = [...links];
    updated[idx] = val;
    setLinks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter your full name or public figure/brand name.');
      return;
    }

    const filteredLinks = links.map((l) => l.trim()).filter((l) => l.length > 0);
    if (filteredLinks.length === 0) {
      setErrorMsg('Please provide at least one public profile link, portfolio, or website.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMutation({
        userId: convexUserId as any,
        fullName: trimmedName,
        category,
        links: filteredLinks,
        evidenceNote: evidenceNote.trim() || undefined,
      });
      setIsReapplying(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit verification request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient accent */}
        <div className="relative px-6 pt-6 pb-4 border-b border-zinc-100 bg-gradient-to-b from-blue-50/60 to-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-[#1D9BF0]/10 flex items-center justify-center text-[#1D9BF0] ring-4 ring-[#1D9BF0]/10">
              <VerificationBadge isBlueCheck size="lg" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-1.5">
                RALLY Profile Verification
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Unlock the official blue check badge and creator perks
              </p>
            </div>
          </div>

          {/* Strict Separation Notice Banner */}
          <div className="mt-3 p-3 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-[12px] text-blue-900 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#1D9BF0] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Social Profile Status: </span>
              This is <strong>RALLY Profile Verification</strong>, which gives you the blue check badge and perks. It is completely independent from NIN/KYC identity verification.
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* STATE: VERIFIED */}
          {currentStatus === 'verified' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 flex items-center justify-center ring-8 ring-blue-50/50">
                <VerificationBadge isBlueCheck size="xl" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900">Your Profile is Verified!</h3>
                <p className="text-sm text-zinc-600 mt-1 max-w-sm mx-auto">
                  Your official blue checkmark is active and displayed beside your name across all RALLY posts, comments, and discovery surfaces.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Boosted replies active</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified profile recognition active</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enhanced reach on your rallies</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* STATE: PENDING */}
          {currentStatus === 'pending' && !isReapplying && (
            <div className="py-4 space-y-5">
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 mb-1">
                    Application Under Review
                  </span>
                  <h3 className="text-base font-bold text-amber-950">
                    We are reviewing your submission
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 max-w-xs mx-auto leading-relaxed">
                    Our team reviews profile verification requests to maintain community authenticity. You’ll receive an in-app notification once a decision is made.
                  </p>
                </div>
              </div>

              {latestRequest && (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs text-zinc-700">
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 font-medium">Submitted Name:</span>
                    <span className="font-bold text-zinc-900">{latestRequest.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 font-medium">Category:</span>
                    <span className="font-bold text-zinc-900">{latestRequest.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Links Provided:</span>
                    <span className="font-bold text-zinc-900">{latestRequest.links.length} public link(s)</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* STATE: REJECTED (with reapply option) */}
          {currentStatus === 'rejected' && !isReapplying && (
            <div className="py-3 space-y-4">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 mb-1">
                    Request Not Approved
                  </span>
                  <h3 className="text-base font-bold text-rose-950">
                    Verification Could Not Be Completed
                  </h3>
                  {latestRequest?.rejectionReason && (
                    <p className="text-xs text-rose-800 mt-1 max-w-sm mx-auto leading-relaxed bg-white/70 p-2.5 rounded-xl border border-rose-200">
                      <strong>Feedback:</strong> {latestRequest.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsReapplying(true)}
                  className="flex-1 py-3 rounded-2xl bg-[#1D9BF0] hover:bg-blue-600 text-white font-bold text-sm transition-colors shadow-sm"
                >
                  Update & Reapply →
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* STATE: UNVERIFIED OR REAPPLYING (Full Form & Benefits) */}
          {((currentStatus === 'unverified') || isReapplying) && (
            <>
              {/* Benefits Grid */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                  Verification Perks
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100 text-[#1D9BF0] shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-900">Boosted Replies</h5>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                        Your comments and replies rise to the top of discussions.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-900">Profile Analytics</h5>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                        See who views your profile and monitors post performance.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-900">Ad-Free Browsing</h5>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                        Seamless, distraction-free scrolling on feeds and rallies.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-600 shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-900">Official Blue Check</h5>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                        Recognized checkmark beside your name everywhere on RALLY.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-zinc-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Verification Application
                </h4>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Full Name / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe or Acme Studios"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/30 focus:border-[#1D9BF0] transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/30 focus:border-[#1D9BF0] transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Links */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Public Links & Presence *
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Add links to your social handles (Instagram, X, TikTok), website, portfolio, or press coverage.
                  </p>
                  <div className="space-y-2">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => handleLinkChange(idx, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/30 focus:border-[#1D9BF0]"
                        />
                        {links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(idx)}
                            className="p-2 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {links.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D9BF0] hover:text-blue-700 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Another Link
                      </button>
                    )}
                  </div>
                </div>

                {/* Evidence / Note */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Supporting Bio / Note <span className="text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    placeholder="Tell us briefly about your work, audience, or why you are applying for profile verification."
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/30 focus:border-[#1D9BF0] resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#1D9BF0] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit Verification Request →'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
