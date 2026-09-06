import React, { useState, useMemo, useRef } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import VerificationBadge from '../components/VerificationBadge';
import {
  Building2,
  Users,
  User as UserIcon,
  CheckCircle2,
  Shield,
  Upload,
  Clock,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  XCircle,
  FileText,
  BadgeCheck,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

type VerificationCategory = 'lalao_buz' | 'organization' | 'personal';

export default function Verification() {
  const { user } = useAuth();
  const pricingList = useQuery(api.verificationWorkflow.getPricing);
  const myApplications = useQuery(api.verificationWorkflow.getMyApplications);

  const submitAppMut = useMutation(api.verificationWorkflow.submitApplication);
  const submitPaymentMut = useMutation(api.verificationWorkflow.submitPayment);
  const cancelAppMut = useMutation(api.verificationWorkflow.cancelApplication);
  const generateUploadUrlMut = useMutation(api.verificationWorkflow.generateDocumentUploadUrl);

  const [selectedType, setSelectedType] = useState<VerificationCategory>('personal');
  const [step, setStep] = useState<'select' | 'form' | 'payment'>('select');

  // Form inputs
  const [applicantName, setApplicantName] = useState(user.name || '');
  const [contactEmail, setContactEmail] = useState(user.email || '');
  const [contactPhone, setContactPhone] = useState(user.phone || '');
  const [entityName, setEntityName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Payment inputs
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Check active application for current category or overall
  const activeAppForSelectedType = useMemo(() => {
    if (!myApplications) return null;
    return myApplications.find(
      (a) =>
        a.verificationType === selectedType &&
        a.status !== 'Cancelled'
    );
  }, [myApplications, selectedType]);

  const latestActiveApp = useMemo(() => {
    if (!myApplications) return null;
    return myApplications.find(
      (a) =>
        a.status === 'Payment Pending' ||
        a.status === 'Payment Submitted' ||
        a.status === 'Payment Confirmed' ||
        a.status === 'Under Review'
    );
  }, [myApplications]);

  const approvedApp = useMemo(() => {
    if (!myApplications) return null;
    return myApplications.find((a) => a.status === 'Approved');
  }, [myApplications]);

  const currentPricing = useMemo(() => {
    if (!pricingList) return null;
    return pricingList.find((p) => p.type === selectedType);
  }, [pricingList, selectedType]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!applicantName.trim()) {
      setFormError('Please enter the applicant name.');
      return;
    }

    if (selectedType === 'lalao_buz' && !entityName.trim()) {
      setFormError('Please enter your business or brand name.');
      return;
    }

    if (selectedType === 'organization' && !entityName.trim()) {
      setFormError('Please enter your organization or institution name.');
      return;
    }

    setIsSubmitting(true);
    try {
      let documentStorageIds: string[] = [];

      // Upload supporting doc if provided
      if (docFile) {
        const uploadUrl = await generateUploadUrlMut();
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': docFile.type || 'application/octet-stream' },
          body: docFile,
        });
        const { storageId } = await res.json();
        if (storageId) documentStorageIds.push(storageId);
      }

      await submitAppMut({
        verificationType: selectedType,
        applicantName: applicantName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        entityName: entityName.trim() || undefined,
        registrationNumber: registrationNumber.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        socialHandle: socialHandle.trim() || undefined,
        additionalInfo: additionalInfo.trim() || undefined,
        documentStorageIds,
      });

      setStep('payment');
    } catch (err: any) {
      setFormError(err.message || 'Could not submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPaymentProof = async (appId: any, reference: string) => {
    setIsSubmittingPayment(true);
    try {
      let paymentProofStorageId: string | undefined = undefined;

      if (paymentProofFile) {
        const uploadUrl = await generateUploadUrlMut();
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': paymentProofFile.type || 'application/octet-stream' },
          body: paymentProofFile,
        });
        const { storageId } = await res.json();
        if (storageId) paymentProofStorageId = storageId;
      }

      await submitPaymentMut({
        applicationId: appId,
        paymentReference: paymentRefInput.trim() || reference,
        paymentProofStorageId,
      });

      setPaymentProofFile(null);
      setPaymentRefInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit payment proof.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCancel = async (appId: any) => {
    if (!confirm('Are you sure you want to cancel this application?')) return;
    try {
      await cancelAppMut({ applicationId: appId });
    } catch (err: any) {
      alert(err.message || 'Could not cancel application.');
    }
  };

  // If user has an already approved badge, show congratulatory verified card
  if (user.isVerified || approvedApp) {
    const verifiedType = user.verificationType || approvedApp?.verificationType || 'personal';
    return (
      <PageShell title="Verified Member">
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner">
              <VerificationBadge type={verifiedType} isVerified={true} size="xl" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Account Active
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {user.name}
            </h1>
            <p className="text-sm font-bold text-zinc-500 mt-1">
              @{user.username?.replace(/^@+/, '')}
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Verification Category:</span>
                <span className="font-bold text-zinc-900 capitalize">
                  {verifiedType === 'lalao_buz' ? 'Lalao Buz (Blue)' : verifiedType === 'organization' ? 'Organization (Green)' : 'Personal (Black)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Status:</span>
                <span className="font-bold text-emerald-600">Official Badge Active</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Badge Placement:</span>
                <span className="font-bold text-zinc-900">Beside name across all Lalao surfaces</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-medium mt-6">
              Your verified checkmark distinguishes your authentic presence and protects your community reputation on Lalao.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Link
                to="/profile"
                className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm transition-colors shadow-sm"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Active in-progress application screen
  const displayedActiveApp = activeAppForSelectedType || latestActiveApp;
  if (displayedActiveApp && displayedActiveApp.status !== 'Approved' && displayedActiveApp.status !== 'Cancelled') {
    const isPaymentPending = displayedActiveApp.status === 'Payment Pending' || displayedActiveApp.status === 'Payment Failed';
    const isPaymentSubmitted = displayedActiveApp.status === 'Payment Submitted';
    const isPaymentConfirmed = displayedActiveApp.status === 'Payment Confirmed';
    const isUnderReview = displayedActiveApp.status === 'Under Review';
    const isRejected = displayedActiveApp.status === 'Rejected';

    return (
      <PageShell title="Verification Status">
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <VerificationBadge type={displayedActiveApp.verificationType} isVerified={true} size="md" />
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-600">
                    {displayedActiveApp.verificationType === 'lalao_buz' ? 'Lalao Buz' : displayedActiveApp.verificationType === 'organization' ? 'Organization' : 'Personal'} Verification
                  </span>
                </div>
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                  Application Status
                </h1>
                <p className="text-xs text-zinc-500 mt-1 font-medium">
                  Reference: <span className="font-mono font-bold text-zinc-800">{displayedActiveApp.paymentReference}</span>
                </p>
              </div>

              <span
                className={cn(
                  'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border whitespace-nowrap',
                  isPaymentPending && 'bg-amber-50 text-amber-800 border-amber-200',
                  isPaymentSubmitted && 'bg-blue-50 text-blue-800 border-blue-200',
                  isPaymentConfirmed && 'bg-indigo-50 text-indigo-800 border-indigo-200',
                  isUnderReview && 'bg-purple-50 text-purple-800 border-purple-200',
                  isRejected && 'bg-rose-50 text-rose-800 border-rose-200'
                )}
              >
                {displayedActiveApp.status}
              </span>
            </div>

            {/* Visual Progress Steps */}
            <div className="mt-8 pt-6 border-t border-zinc-100">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black uppercase tracking-wider">
                <div className="space-y-1.5">
                  <div className={cn('h-1.5 rounded-full', 'bg-emerald-500')} />
                  <span className="text-emerald-700">1. Applied</span>
                </div>
                <div className="space-y-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full',
                      isPaymentPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                    )}
                  />
                  <span className={isPaymentPending ? 'text-amber-700' : 'text-emerald-700'}>
                    2. Payment
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full',
                      isPaymentSubmitted ? 'bg-blue-500 animate-pulse' : isPaymentConfirmed || isUnderReview ? 'bg-emerald-500' : 'bg-zinc-200'
                    )}
                  />
                  <span className={isPaymentSubmitted ? 'text-blue-700' : isPaymentConfirmed || isUnderReview ? 'text-emerald-700' : 'text-zinc-400'}>
                    3. Confirmed
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full',
                      isUnderReview ? 'bg-purple-500 animate-pulse' : isRejected ? 'bg-rose-400' : 'bg-zinc-200'
                    )}
                  />
                  <span className={isUnderReview ? 'text-purple-700' : isRejected ? 'text-rose-700' : 'text-zinc-400'}>
                    4. Review
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Stage Messages */}
            <div className="mt-6">
              {isPaymentPending && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Payment Required (₦{displayedActiveApp.priceAmountNaira.toLocaleString()})
                  </p>
                  <p className="text-amber-800 leading-relaxed font-medium">
                    Please make payment using the bank transfer details below and upload your receipt to move your application to <b>Payment Submitted</b>.
                  </p>
                </div>
              )}

              {isPaymentSubmitted && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    Payment Submitted — Awaiting Admin Confirmation
                  </p>
                  <p className="text-blue-800 leading-relaxed font-medium">
                    Your payment submission has been received. Our admin team will verify the payment against our bank records. Once confirmed, your application will advance to Under Review.
                  </p>
                </div>
              )}

              {isPaymentConfirmed && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-2">
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Payment Confirmed by Admin!
                  </p>
                  <p className="text-indigo-800 leading-relaxed font-medium">
                    Your payment of ₦{displayedActiveApp.priceAmountNaira.toLocaleString()} has been confirmed. The verification agent will now inspect your submitted documentation and credentials.
                  </p>
                </div>
              )}

              {isUnderReview && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-600" />
                    Application Under Review
                  </p>
                  <p className="text-purple-800 leading-relaxed font-medium">
                    Our compliance team is currently reviewing your identity and business credentials. Once approved, your badge will be activated immediately!
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Application Not Approved
                  </p>
                  <p className="text-rose-800 leading-relaxed font-medium">
                    <b>Reason:</b> {displayedActiveApp.rejectionReason || 'Documentation did not meet verification criteria.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Instructions & Upload Form (if pending payment) */}
          {isPaymentPending && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-6">
              <h3 className="font-black text-lg text-zinc-900">Make Payment</h3>

              <div className="p-5 rounded-2xl bg-zinc-900 text-white space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-xs text-white/70 font-medium">Total Amount Due</span>
                  <span className="text-2xl font-black text-white">
                    ₦{displayedActiveApp.priceAmountNaira.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-white/50 block font-medium">Bank Name</span>
                    <span className="font-bold text-white text-sm">Zenith Bank</span>
                  </div>
                  <div>
                    <span className="text-white/50 block font-medium">Account Name</span>
                    <span className="font-bold text-white text-sm">Lalao Community Tech</span>
                  </div>
                  <div>
                    <span className="text-white/50 block font-medium">Account Number</span>
                    <span className="font-mono font-bold text-white text-sm">1224890123</span>
                  </div>
                  <div>
                    <span className="text-white/50 block font-medium">Payment Narration / Memo</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {displayedActiveApp.paymentReference}
                      </span>
                      <button
                        onClick={() => handleCopy(displayedActiveApp.paymentReference)}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-white/70"
                        title="Copy Reference"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Payment Proof */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-sm text-zinc-900">Submit Proof of Payment</h4>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Upload Transfer Receipt / Screenshot
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Transaction / Transfer Reference (optional)
                  </label>
                  <input
                    type="text"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    placeholder={displayedActiveApp.paymentReference}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleCancel(displayedActiveApp._id)}
                    className="px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors"
                  >
                    Cancel Application
                  </button>
                  <button
                    onClick={() => handleSubmitPaymentProof(displayedActiveApp._id, displayedActiveApp.paymentReference)}
                    disabled={isSubmittingPayment}
                    className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Payment…
                      </>
                    ) : (
                      'I Have Paid · Submit Payment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  // Application creation flow: Step 1 = Select Category, Step 2 = Application Form
  return (
    <PageShell title="Get Verified on Lalao">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-800 text-xs font-black uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5 text-zinc-700" />
            Official Lalao Verification
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
            Build Trust With a Verified Badge
          </h1>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto font-medium">
            Distinguish your presence with an authentic verified badge beside your name across all posts, profile views, and messages.
          </p>
        </div>

        {/* Step 1: Category Selection */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lalao Buz */}
              {(() => {
                const p = pricingList?.find((item) => item.type === 'lalao_buz');
                const price = p?.priceNaira ?? 25000;
                const enabled = p?.isEnabled ?? true;
                const isSelected = selectedType === 'lalao_buz';

                return (
                  <button
                    type="button"
                    onClick={() => enabled && setSelectedType('lalao_buz')}
                    disabled={!enabled}
                    className={cn(
                      'text-left p-6 rounded-3xl border-2 transition-all relative flex flex-col justify-between',
                      isSelected
                        ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-600/10'
                        : 'border-zinc-200 bg-white hover:border-zinc-300',
                      !enabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <VerificationBadge type="lalao_buz" isVerified={true} size="lg" />
                      </div>
                      <h3 className="font-black text-lg text-zinc-900">Lalao Buz</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-2">
                        Blue Badge
                      </span>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-4">
                        For businesses, commercial brands, stores, and registered companies.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-baseline justify-between">
                      <span className="text-xs text-zinc-400 font-bold uppercase">Price</span>
                      <span className="text-xl font-black text-zinc-900">
                        {enabled ? `₦${price.toLocaleString()}` : 'Unavailable'}
                      </span>
                    </div>
                  </button>
                );
              })()}

              {/* Organization */}
              {(() => {
                const p = pricingList?.find((item) => item.type === 'organization');
                const price = p?.priceNaira ?? 15000;
                const enabled = p?.isEnabled ?? true;
                const isSelected = selectedType === 'organization';

                return (
                  <button
                    type="button"
                    onClick={() => enabled && setSelectedType('organization')}
                    disabled={!enabled}
                    className={cn(
                      'text-left p-6 rounded-3xl border-2 transition-all relative flex flex-col justify-between',
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-600/10'
                        : 'border-zinc-200 bg-white hover:border-zinc-300',
                      !enabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <VerificationBadge type="organization" isVerified={true} size="lg" />
                      </div>
                      <h3 className="font-black text-lg text-zinc-900">Organization</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-2">
                        Green Badge
                      </span>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-4">
                        For organizations, community groups, clubs, associations, and NGOs.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-baseline justify-between">
                      <span className="text-xs text-zinc-400 font-bold uppercase">Price</span>
                      <span className="text-xl font-black text-zinc-900">
                        {enabled ? `₦${price.toLocaleString()}` : 'Unavailable'}
                      </span>
                    </div>
                  </button>
                );
              })()}

              {/* Personal */}
              {(() => {
                const p = pricingList?.find((item) => item.type === 'personal');
                const price = p?.priceNaira ?? 5000;
                const enabled = p?.isEnabled ?? true;
                const isSelected = selectedType === 'personal';

                return (
                  <button
                    type="button"
                    onClick={() => enabled && setSelectedType('personal')}
                    disabled={!enabled}
                    className={cn(
                      'text-left p-6 rounded-3xl border-2 transition-all relative flex flex-col justify-between',
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50 shadow-md ring-2 ring-zinc-900/10'
                        : 'border-zinc-200 bg-white hover:border-zinc-300',
                      !enabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <VerificationBadge type="personal" isVerified={true} size="lg" />
                      </div>
                      <h3 className="font-black text-lg text-zinc-900">Personal</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 block mb-2">
                        Black Badge
                      </span>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-4">
                        For individuals, creators, journalists, influencers, and public figures.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-baseline justify-between">
                      <span className="text-xs text-zinc-400 font-bold uppercase">Price</span>
                      <span className="text-xl font-black text-zinc-900">
                        {enabled ? `₦${price.toLocaleString()}` : 'Unavailable'}
                      </span>
                    </div>
                  </button>
                );
              })()}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                Continue to Application
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Application Form */}
        {step === 'form' && (
          <form onSubmit={handleCreateApplication} className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <VerificationBadge type={selectedType} isVerified={true} size="md" />
                <div>
                  <h2 className="text-lg font-black text-zinc-900 capitalize">
                    {selectedType === 'lalao_buz' ? 'Lalao Buz' : selectedType === 'organization' ? 'Organization' : 'Personal'} Application
                  </h2>
                  <span className="text-xs text-zinc-400 font-medium">
                    Fee: <b className="text-zinc-800">₦{currentPricing?.priceNaira?.toLocaleString()}</b>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-xs text-zinc-500 hover:text-zinc-900 font-bold"
              >
                Change Type
              </button>
            </div>

            {formError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Applicant Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              {selectedType !== 'personal' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    {selectedType === 'lalao_buz' ? 'Business / Brand Name *' : 'Organization Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  {selectedType === 'personal'
                    ? 'Govt ID Number (NIN, Passport or DL)'
                    : 'Registration / CAC / Tax ID'}
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder={selectedType === 'personal' ? 'e.g. 11-digit NIN' : 'e.g. RC-1234567'}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Official Website or Social Handle
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https:// or @handle"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Upload Verification Document / Identity Proof
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
              />
              <span className="text-[11px] text-zinc-400 font-medium block mt-1">
                Upload business registration certificate, CAC certificate, official ID card, or verification credential.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Additional Information / Context (optional)
              </label>
              <textarea
                rows={3}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Share any other links, publications, or details that verify your entity..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Application…
                  </>
                ) : (
                  'Submit & Proceed to Payment'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
}
