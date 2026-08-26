import React, { useState, useEffect } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle2, 
  Check, 
  ArrowRight, 
  Loader2, 
  Lock, 
  Calendar,
  User as UserIcon,
  Fingerprint,
  RotateCcw,
  BadgeCheck,
  Shield,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Verification() {
  const { user, verifyNIN, updateUser } = useAuth();

  // Verification flow state: 'idle' (when not verifying or showing status), or 1 | 2 | 3 | 4
  const [step, setStep] = useState<'idle' | 1 | 2 | 3 | 4>('idle');
  
  // Step 1 Form Inputs
  const [fullName, setFullName] = useState(user.name || 'Alex Johnson');
  const [ninNumber, setNinNumber] = useState(user.nin || '23481920384');
  const [dob, setDob] = useState(user.birthday || '1998-05-12');
  const [formError, setFormError] = useState('');
  
  // Step 2 processing stage simulation
  const [processingStage, setProcessingStage] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const verificationDate = '12 July 2026';

  // Format Date of Birth for human-readable confirmation
  const formatDisplayDate = (dateStr: string) => {
    try {
      if (!dateStr) return '12 May 1998';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '12 May 1998';
    }
  };

  // Step 1 -> Step 2
  const handleStartFlow = () => {
    setStep(1);
    setFormError('');
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNIN = ninNumber.replace(/\D/g, '');
    if (cleanNIN.length !== 11) {
      setFormError('Please enter a valid 11-digit National Identification Number (NIN).');
      return;
    }
    if (!fullName.trim()) {
      setFormError('Please provide your legal full name.');
      return;
    }
    setFormError('');
    setStep(2);
  };

  // Step 2 Auto Processing Animation & Transition
  useEffect(() => {
    if (step === 2) {
      setProcessingStage(1);
      const timer1 = setTimeout(() => setProcessingStage(2), 700);
      const timer2 = setTimeout(() => setProcessingStage(3), 1400);
      const timer3 = setTimeout(() => {
        setStep(3);
      }, 2200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [step]);

  // Step 3 -> Step 4
  const handleConfirmIdentity = async () => {
    await verifyNIN(ninNumber);
    updateUser({
      name: fullName,
      birthday: dob,
      isNINVerified: true
    });
    setStep(4);
  };

  // Step 4 Complete -> Verified State
  const handleFinish = () => {
    setStep('idle');
  };

  // Reset to unverified state (for testing / demo purposes)
  const handleResetVerification = () => {
    updateUser({ isNINVerified: false });
    setStep('idle');
    setFormError('');
  };

  return (
    <PageShell 
      title="Verification" 
      subtitle="Verify your identity to build trust within the community."
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        
        {/* =========================================================================
            STATE A: IN-PROGRESS VERIFICATION FLOW (Steps 1 to 4)
           ========================================================================= */}
        {step !== 'idle' ? (
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
            
            {/* Flow Header with Progress Indicator */}
            <div className="p-4 sm:p-5 bg-zinc-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black tracking-wider uppercase text-zinc-500">
                  Step {step} of 4
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {step === 1 && 'Personal Information'}
                  {step === 2 && 'Security Processing'}
                  {step === 3 && 'Confirm Identity'}
                  {step === 4 && 'Success'}
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: Personal Information Form */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="p-5 sm:p-7 space-y-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                    Personal Information
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    Enter your official details as registered on your National ID slip.
                  </p>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                      />
                      <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {/* NIN Number */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                      11-Digit National ID Number (NIN) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        maxLength={11}
                        value={ninNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setNinNumber(val);
                          if (formError) setFormError('');
                        }}
                        placeholder="12345678901"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-mono font-bold text-zinc-900 text-sm tracking-wider transition-colors"
                      />
                      <Fingerprint className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium mt-1">
                      Dial <span className="font-bold text-zinc-700">*346#</span> on your registered SIM to retrieve your NIN.
                    </p>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                      />
                      <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('idle')}
                    className="py-3 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors active:scale-98"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verification Processing */}
            {step === 2 && (
              <div className="p-8 sm:p-12 text-center space-y-6">
                <div className="relative inline-block">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 animate-pulse">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-indigo-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs">
                    <Lock className="w-4 h-4 text-zinc-700" />
                  </div>
                </div>

                <div className="max-w-sm mx-auto space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                    Verifying your identity...
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                    Checking your information securely.
                  </p>
                </div>

                {/* Micro-Progress Stages */}
                <div className="max-w-xs mx-auto space-y-2 text-left pt-2">
                  <div className="flex items-center gap-2.5 text-xs">
                    {processingStage >= 1 ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-300 shrink-0" />
                    )}
                    <span className={processingStage >= 1 ? 'font-bold text-zinc-900' : 'text-zinc-400'}>
                      Connecting to NIMC registry
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    {processingStage >= 2 ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-300 shrink-0" />
                    )}
                    <span className={processingStage >= 2 ? 'font-bold text-zinc-900' : 'text-zinc-400'}>
                      Validating 11-digit NIN token
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    {processingStage >= 3 ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-300 shrink-0" />
                    )}
                    <span className={processingStage >= 3 ? 'font-bold text-zinc-900' : 'text-zinc-400'}>
                      Matching demographic records
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Confirm Identity */}
            {step === 3 && (
              <div className="p-5 sm:p-7 space-y-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                    Confirm Identity
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    Review matched details returned from official verification.
                  </p>
                </div>

                {/* Match Summary Card */}
                <div className="bg-zinc-50/80 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 divide-y divide-zinc-200/60">
                  <div className="pb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/80 border border-emerald-200 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Match Found
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</span>
                    <span className="text-sm font-black text-zinc-900">{fullName}</span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</span>
                    <span className="text-sm font-bold text-zinc-800">{formatDisplayDate(dob)}</span>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">NIN Number</span>
                    <span className="font-mono text-xs font-bold text-zinc-600">
                      •••••••{ninNumber.slice(-4) || '384'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors active:scale-98"
                  >
                    Edit Info
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmIdentity}
                    className="flex-1 py-3 px-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Continue</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success State */}
            {step === 4 && (
              <div className="p-6 sm:p-10 text-center space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-in zoom-in-95 duration-200">
                  <BadgeCheck className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-600" />
                </div>

                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                    Identity Verified
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                    Your account has been successfully verified.
                  </p>
                </div>

                {/* Verified Metadata Card */}
                <div className="bg-zinc-50/80 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 max-w-md mx-auto divide-y divide-zinc-200/60 text-left">
                  <div className="pb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">Verification Date</span>
                    <span className="text-xs sm:text-sm font-bold text-zinc-900">{verificationDate}</span>
                  </div>
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">Verification Status</span>
                    <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <div className="pt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">Verified Badge</span>
                    <div className="flex items-center gap-1 text-xs font-black text-emerald-700">
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full max-w-md mx-auto py-3 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-98"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        ) : (
          /* =========================================================================
              STATE B: VERIFIED vs NOT VERIFIED SCREENS
             ========================================================================= */
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
            
            {user.isNINVerified ? (
              /* =======================
                  VERIFIED STATE
                 ======================= */
              <div className="p-6 sm:p-8 space-y-6">
                {/* Header Badge */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                    <BadgeCheck className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                        Identity Verified
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                      Your identity is confirmed and protected under national trust standards.
                    </p>
                  </div>
                </div>

                {/* Verified Metadata Card */}
                <div className="bg-zinc-50/70 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 divide-y divide-zinc-200/60">
                  <div className="pb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">Verified on</span>
                    <span className="text-xs sm:text-sm font-bold text-zinc-900">{verificationDate}</span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">Status</span>
                    <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">Badge</span>
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(true)}
                    className="w-full sm:flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs sm:text-sm font-bold transition-all text-center active:scale-98"
                  >
                    View Verification Details
                  </button>
                  <Link
                    to="/profile"
                    className="w-full sm:flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all text-center active:scale-98"
                  >
                    Return to Profile
                  </Link>
                </div>

                {/* Subtle Reset Link for Testing / Demo */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResetVerification}
                    className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 transition-colors inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to unverified state (Demo)
                  </button>
                </div>
              </div>
            ) : (
              /* =======================
                  NOT VERIFIED STATE
                 ======================= */
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight mb-1">
                    Verification
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
                    Verify your identity to build trust within the community.
                  </p>
                </div>

                {/* Clean Feature List */}
                <div className="space-y-3 py-1">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Verified Badge</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Increased Trust</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Safer Interactions</span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartFlow}
                    className="w-full py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Start Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Verification Details Modal (Optional) */}
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div 
              className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-150 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-black text-zinc-900 text-base">Verification Certificate</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Authority</span>
                    <span className="font-bold text-zinc-900">NIMC Gateway (Nigeria)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Encryption Standard</span>
                    <span className="font-bold text-zinc-900">AES-256-GCM Encrypted</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Credential Mask</span>
                    <span className="font-mono font-bold text-zinc-900">•••••••••••</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Issued Date</span>
                    <span className="font-bold text-zinc-900">{verificationDate}</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                  Your identity verification ensures genuine neighborhood participation while completely hiding private biometric and demographic data.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
}
