import React, { useState, useEffect, useRef } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle2, 
  Check, 
  Loader2, 
  Lock, 
  Calendar,
  User as UserIcon,
  Fingerprint,
  BadgeCheck,
  Shield,
  X,
  ArrowRight,
  Landmark,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createNinPayment, getVerificationStatus } from '../lib/verification';

type FlowState =
  | 'idle'        // not started / not verified
  | 'form'        // collecting details + pay button
  | 'init'        // initializing payment
  | 'payment'     // awaiting Paystack
  | 'verifying'   // payment confirmed, verifying identity
  | 'verified'    // success
  | 'verify_failed'
  | 'provider_error';

const VERIFICATION_FEE = 150; // naira

export default function Verification() {
  const { user, updateUserVerification } = useAuth();
  const [flow, setFlow] = useState<FlowState>('idle');
  const [fullName, setFullName] = useState(user.name || '');
  const [ninNumber, setNinNumber] = useState(user.nin || '');
  const [dob, setDob] = useState(user.birthday || '');
  const [formError, setFormError] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const STORAGE_KEY = 'rally_nin_payment_pending';
  const readPendingTx = (): { transactionId: string; paymentReference: string } | null => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.transactionId && parsed.paymentReference) return parsed;
      return null;
    } catch {
      return null;
    }
  };
  const clearPendingTx = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const metaRef = useRef<{ transactionId: string; paymentReference: string; polled: boolean }>({
    transactionId: '', paymentReference: '', polled: false,
  });

  const verificationDate = user.isNINVerified
    ? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const formatDisplayDate = (d: string) => {
    try {
      if (!d) return '';
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return d;
      return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const resetFlow = () => {
    setFlow('idle');
    setFormError('');
    setProcessingMsg('');
    metaRef.current = { transactionId: '', paymentReference: '', polled: false };
    clearPendingTx();
  };

  // Resume an in-flight payment (e.g. after returning from the Paystack
  // redirect, which reloads the page and loses in-memory ref state).
  useEffect(() => {
    const pending = readPendingTx();
    if (pending && !user.isNINVerified) {
      metaRef.current = { ...pending, polled: false };
      setFlow('payment');
      setProcessingMsg('Processing payment...');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll backend once we have a transaction id and are in payment/verifying.
  useEffect(() => {
    if (!metaRef.current.transactionId) return;
    if (flow !== 'payment' && flow !== 'verifying') return;

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      try {
        const st = await getVerificationStatus(metaRef.current.transactionId);
        if (cancelled) return;
        if (st.status === 'VERIFIED') {
          clearPendingTx();
          setFlow('verified');
          updateUserVerification();
        } else if (st.status === 'VERIFICATION_FAILED') {
          clearPendingTx();
          setFlow('verify_failed');
        } else if (st.status === 'PROVIDER_ERROR') {
          clearPendingTx();
          setFlow('provider_error');
        } else if (st.status === 'PAYMENT_FAILED') {
          clearPendingTx();
          setFlow('form');
          setFormError('Payment was not completed. Please try again.');
        } else {
          // still pending / verifying
          if (st.status === 'PAYMENT_SUCCESS' || flow === 'payment') {
            setProcessingMsg('Payment successful. Verifying your identity...');
          } else {
            setProcessingMsg('Verifying your identity...');
          }
          attempts++;
          if (attempts < 30) {
            setTimeout(poll, 2500);
          } else {
            setFlow('provider_error');
          }
        }
      } catch {
        if (!cancelled && attempts < 40) {
          setTimeout(poll, 2500);
        }
      }
    };

    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  const handleStartFlow = () => {
    setFlow('form');
    setFormError('');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNIN = ninNumber.replace(/\D/g, '');
    if (cleanNIN.length !== 11) {
      setFormError('Please enter a valid 11-digit NIN.');
      return;
    }
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) {
      setFormError('Please enter your legal full name (first and last name).');
      return;
    }
    if (!dob) {
      setFormError('Please select your date of birth.');
      return;
    }

    setFormError('');
    setFlow('init');
    setProcessingMsg('Contacting payment gateway...');

    const firstName = parts.slice(0, -1).join(' ');
    const lastName = parts[parts.length - 1];

    try {
      const init = await createNinPayment({
        nin: cleanNIN,
        firstName,
        lastName,
        dateOfBirth: dob,
      });

      metaRef.current = {
        transactionId: init.transactionId,
        paymentReference: init.paymentReference,
        polled: false,
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          transactionId: init.transactionId,
          paymentReference: init.paymentReference,
        }));
      } catch {}

      // Open Paystack via redirect (authorization_url).
      setFlow('payment');
      setProcessingMsg('Processing payment...');
      window.location.href = init.authorization_url;
    } catch (err: any) {
      setFlow('form');
      setFormError(err.message || 'Could not start payment. Please try again.');
    }
  };

  // The verified / not-verified shell.
  const notVerifiedShell = (
    <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight mb-1">
            Identity Verification
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
            Verify your NIN securely to build trust within the community.
          </p>
        </div>

        {/* Fee card */}
        <div className="flex items-center gap-3 bg-zinc-50/80 rounded-2xl p-4 border border-zinc-200/80">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-zinc-500 font-medium">Verification fee</p>
            <p className="text-lg font-black text-zinc-900">₦{VERIFICATION_FEE}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100/80 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" /> Secure
            </span>
          </div>
        </div>

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

        <div className="pt-2">
          <button
            type="button"
            onClick={handleStartFlow}
            className="w-full py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Pay ₦{VERIFICATION_FEE} &amp; Verify</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Payment form.
  const formView = (
    <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
      <div className="p-4 sm:p-5 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-xs font-black tracking-wider uppercase text-zinc-500">Identity Verification</span>
        <button type="button" onClick={resetFlow} className="text-xs font-bold text-zinc-500 hover:text-zinc-800">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmitPayment} className="p-5 sm:p-7 space-y-5">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">Enter your details</h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            As registered on your National ID slip. Fee: <span className="font-bold text-zinc-800">₦{VERIFICATION_FEE}</span>.
          </p>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
            {formError}
          </div>
        )}

        <div className="space-y-4">
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
            <p className="text-[11px] text-zinc-400 font-medium mt-1">
              Enter your legal name as printed on your National ID slip.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
              11-Digit NIN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={11}
                value={ninNumber}
                onChange={(e) => {
                  setNinNumber(e.target.value.replace(/\D/g, ''));
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

        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-700 font-medium leading-relaxed flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            You'll be charged a one-time fee of <b>₦{VERIFICATION_FEE}</b> to verify your National Identification Number securely.
          </span>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>Pay ₦{VERIFICATION_FEE} &amp; Verify</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  // Processing / verifying view (shared).
  const processingView = (
    <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-8 sm:p-12 text-center space-y-6">
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
          {flow === 'init' ? 'Processing payment...' : flow === 'payment' ? 'Processing payment...' : 'Verifying your identity...'}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium">
          {processingMsg || 'Please wait, this may take a few seconds.'}
        </p>
      </div>
      <p className="text-[11px] text-zinc-400 font-medium">
        Do not close this window. Payment is confirmed by our secure server.
      </p>
    </div>
  );

  // Verified success view.
  const verifiedView = (
    <div className="p-6 sm:p-10 text-center space-y-6">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
        <BadgeCheck className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-600" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Identity Verified</h3>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium">
          Your identity has been successfully verified.
        </p>
      </div>

      <div className="bg-zinc-50/80 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 max-w-md mx-auto divide-y divide-zinc-200/60 text-left">
        <div className="pb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500">Status</span>
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

      <Link
        to="/profile"
        className="inline-block w-full max-w-md py-3 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all text-center"
      >
        Return to Profile
      </Link>
    </div>
  );

  // Failed identity verification view.
  const failedView = (
    <div className="p-6 sm:p-10 text-center space-y-5">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
        <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
          Identity verification unsuccessful.
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium">
          We couldn't verify the information provided. Please check your NIN, name and date of birth and try again.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
        <button
          type="button"
          onClick={resetFlow}
          className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs sm:text-sm font-bold transition-all"
        >
          Back to start
        </button>
        <Link
          to="/settings/help"
          className="flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all text-center"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );

  // Provider / system error view.
  const providerErrorView = (
    <div className="p-6 sm:p-10 text-center space-y-5">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
        <Shield className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
          Verification temporarily unavailable.
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
          Your payment was received, but verification could not be completed right now. Please try again or contact support.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
        <button
          type="button"
          onClick={resetFlow}
          className="flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all"
        >
          Try again
        </button>
        <Link
          to="/settings/help"
          className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs sm:text-sm font-bold transition-all text-center"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );

  const shell = (
    <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
      {flow === 'form' ? formView : flow === 'init' || flow === 'payment' || flow === 'verifying' ? processingView : flow === 'verified' ? verifiedView : flow === 'verify_failed' ? failedView : flow === 'provider_error' ? providerErrorView : null}
    </div>
  );

  return (
    <PageShell
      title="Verification"
      subtitle="Verify your identity to build trust within the community."
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {flow === 'idle' ? (
          user.isNINVerified ? (
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                    <BadgeCheck className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Identity Verified</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                      Your identity is confirmed and protected.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50/70 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 divide-y divide-zinc-200/60">
                  <div className="pb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">Status</span>
                    <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                  </div>
                  <div className="pt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">Badge</span>
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(true)}
                    className="w-full sm:flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs sm:text-sm font-bold transition-all text-center"
                  >
                    Verification Details
                  </button>
                  <Link
                    to="/profile"
                    className="w-full sm:flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all text-center"
                  >
                    Return to Profile
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            notVerifiedShell
          )
        ) : (
          shell
        )}

        {/* Verification details modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-xl border border-zinc-100 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-black text-zinc-900 text-base">Verification Certificate</h4>
                </div>
                <button type="button" onClick={() => setShowDetailsModal(false)} className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
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
                    <span className="text-zinc-500 font-medium">Credential Mask</span>
                    <span className="font-mono font-bold text-zinc-900">•••••••••••</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Issued Date</span>
                    <span className="font-bold text-zinc-900">{formatDisplayDate(user.birthday || '') || 'Verified'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                  Your identity was verified through a trusted national identity gateway. Private biometric and demographic data remains hidden.
                </p>
              </div>
              <button type="button" onClick={() => setShowDetailsModal(false)} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
