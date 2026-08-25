import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  HelpCircle, 
  Lock, 
  Smartphone, 
  ScanFace, 
  FileCheck, 
  Check, 
  ArrowRight, 
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function Verification() {
  const { user, verifyNIN } = useAuth();

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [ninInput, setNinInput] = useState('');
  const [ninStep, setNinStep] = useState<1 | 2 | 3>(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [showUSSDGuide, setShowUSSDGuide] = useState(false);

  const handleStartVerification = () => {
    setNinStep(1);
    setNinInput('');
    setVerificationError('');
    setSelfieCaptured(false);
    setShowVerifyModal(true);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNIN = ninInput.replace(/\s+/g, '');
    if (cleanNIN.length !== 11 || !/^\d+$/.test(cleanNIN)) {
      setVerificationError('Please enter a valid 11-digit National Identification Number (NIN).');
      return;
    }
    setVerificationError('');
    setNinStep(2);
  };

  const handleSimulateSelfie = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setSelfieCaptured(true);
      setIsVerifying(false);
    }, 1800);
  };

  const handleCompleteVerification = async () => {
    setIsVerifying(true);
    await verifyNIN(ninInput);
    setIsVerifying(false);
    setNinStep(3);
  };

  return (
    <PageShell 
      title="Trust & Verification"
      subtitle="Verify your identity to build trust with neighbors on RALLY"
    >
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        {/* Banner */}
        <div className="bg-zinc-900 text-white p-6 sm:p-8 md:rounded-[2rem] border-y md:border border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-zinc-200 mb-4 border border-white/15">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Community Trust Standard
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Verified Neighbors Connect Faster
            </h2>
            <p className="text-zinc-300 text-sm font-medium max-w-xl leading-relaxed">
              Verified profiles get up to <strong className="text-white font-bold">3x more responses</strong> to RALLYS and can organize high-trust meetups, group activities, and community initiatives.
            </p>
          </div>
        </div>

        {/* Verification Status Cards */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Your Verification Status</h3>

          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            {/* NIN Verification Item */}
            <div className="p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                    <h4 className="text-base sm:text-lg font-bold text-zinc-900">National ID (NIN) Verification</h4>
                    {user.isNINVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        Recommended
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-500 font-medium mb-4 leading-relaxed">
                    Confirms your identity against official records. Your 11-digit NIN is securely encrypted and <strong className="text-zinc-700">never displayed publicly</strong> on your profile.
                  </p>

                  {user.isNINVerified ? (
                    <div className="flex flex-wrap items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        NIN Verified Badge active on your profile
                      </div>
                      <div className="text-xs text-zinc-400 font-medium">
                        NIN: •••••••••••
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleStartVerification}
                        className="px-6 py-3 rounded-2xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-all active:scale-[0.99] flex items-center gap-2 shadow-sm"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Start NIN Verification
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUSSDGuide(!showUSSDGuide)}
                        className="px-4 py-3 rounded-2xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <HelpCircle className="w-4 h-4 text-zinc-500" />
                        How to find your NIN
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* USSD Guide Dropdown */}
              {showUSSDGuide && !user.isNINVerified && (
                <div className="mt-6 pt-6 border-t border-zinc-100 bg-zinc-50/70 p-5 rounded-2xl animate-in fade-in duration-200">
                  <h5 className="font-bold text-zinc-900 text-sm mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    How to check your 11-digit NIN:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-zinc-200">
                      <p className="font-bold text-zinc-900 mb-1">1. USSD Code (Instant)</p>
                      <p className="text-zinc-600 font-medium">Dial <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">*346#</span> on your registered SIM card.</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-zinc-200">
                      <p className="font-bold text-zinc-900 mb-1">2. NIMC Mobile App</p>
                      <p className="text-zinc-600 font-medium">View your digital ID slip in the official NIMC MWS Mobile ID app.</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-zinc-200">
                      <p className="font-bold text-zinc-900 mb-1">3. Physical Slip</p>
                      <p className="text-zinc-600 font-medium">Check your National e-ID card or printed National Identification Slip.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Phone Verification Item */}
            <div className="p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-base sm:text-lg font-bold text-zinc-900">Phone Number</h4>
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                    Your phone number <strong className="text-zinc-800">{user.phone || '+234 812 345 6789'}</strong> is confirmed for two-factor security and urgent alerts.
                  </p>
                </div>
              </div>
            </div>

            {/* Community Badges Item */}
            <div className="p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-base sm:text-lg font-bold text-zinc-900">Earned Community Badges</h4>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Reputation
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium mb-4">
                    Badges are unlocked automatically as you complete activities, help neighbors, and receive 5-star ratings.
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    {user.badges && user.badges.length > 0 ? (
                      user.badges.map(badge => (
                        <div key={badge} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {badge}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full">
                        No badges earned yet. Complete your first RALLY to unlock!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy Commitment */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
            <Lock className="w-5 h-5 text-zinc-800" />
            <h4 className="font-bold text-zinc-900 text-base">How RALLY Protects Your Data</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-zinc-600">
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>We never store raw unencrypted biometric data or sell your information to advertisers.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Your NIN number is matched via secure NIMC API gateways and hidden from everyone.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Only the verified blue badge and verification date are visible on your public card.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>You can delete or manage your verified account at any time in privacy settings.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive NIN Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-zinc-100 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step 1: NIN Entry */}
            {ninStep === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900">Step 1: Enter 11-Digit NIN</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Provide your National Identification Number for verification.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                    National ID Number (NIN)
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ninInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNinInput(val);
                      if (verificationError) setVerificationError('');
                    }}
                    placeholder="e.g. 12345678901"
                    className="w-full px-4 py-3.5 text-center tracking-widest text-lg font-mono font-bold rounded-2xl border-2 border-zinc-200 focus:border-indigo-600 focus:outline-none transition-colors"
                  />
                  <div className="flex justify-between items-center mt-2 text-[11px] font-semibold text-zinc-400">
                    <span>Dial *346# if you don't know your NIN</span>
                    <span>{ninInput.length}/11 digits</span>
                  </div>

                  {verificationError && (
                    <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {verificationError}
                    </p>
                  )}
                </div>

                <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900 font-medium">
                  <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Your number is strictly protected and never displayed to other users.</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ninInput.length !== 11}
                    className="flex-2 py-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
                  >
                    Continue to Liveness Check
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Facial Liveness Simulation */}
            {ninStep === 2 && (
              <div className="space-y-6 text-center">
                <div>
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
                    <ScanFace className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900">Step 2: Selfie Check</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Position your face within the frame to match with your official records.
                  </p>
                </div>

                {/* Face Frame Simulation */}
                <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-dashed border-indigo-400 bg-zinc-900 flex items-center justify-center overflow-hidden shadow-inner">
                  {selfieCaptured ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'}
                        alt="Captured Selfie" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ) : isVerifying ? (
                    <div className="flex flex-col items-center gap-2 text-white">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                      <span className="text-xs font-bold">Matching NIMC Records...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <ScanFace className="w-12 h-12 text-zinc-500 animate-pulse" />
                      <span className="text-[11px] font-semibold">Frame your face</span>
                    </div>
                  )}
                </div>

                {!selfieCaptured ? (
                  <button
                    type="button"
                    onClick={handleSimulateSelfie}
                    disabled={isVerifying}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-4 h-4" />
                        Take Photo & Match
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Face match confirmed (99.4% confidence)
                    </div>
                    <button
                      type="button"
                      onClick={handleCompleteVerification}
                      disabled={isVerifying}
                      className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Finalizing Verification...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Activate Verified Status
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Success Celebration */}
            {ninStep === 3 && (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center ring-8 ring-emerald-50 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-zinc-900">You are NIN Verified!</h3>
                  <p className="text-sm text-zinc-600 font-medium mt-2 max-w-sm mx-auto">
                    Your National ID verification is complete. The NIN verification badge is now proudly displayed on your profile.
                  </p>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Status</span>
                    <span className="text-emerald-700 font-bold">Verified & Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Badge Awarded</span>
                    <span className="text-indigo-700 font-bold">NIN Verified Neighbor</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
