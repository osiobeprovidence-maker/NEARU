import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  DollarSign,
  Shield,
  FileText,
  AlertTriangle,
  History,
  Sliders,
  Building2,
  Users,
  User as UserIcon,
  ExternalLink,
  Save,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Avatar from '../../components/Avatar';
import VerificationBadge from '../../components/VerificationBadge';
import { AdminModal } from '../../components/admin/AdminModal';

type AdminTab = 'blue_check' | 'applications' | 'pricing' | 'audit_log';
type StatusFilter =
  | 'ALL'
  | 'Payment Pending'
  | 'Payment Submitted'
  | 'Payment Confirmed'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Payment Failed';

export default function AdminVerification() {
  const [activeTab, setActiveTab] = useState<AdminTab>('applications');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const applications = useQuery(api.verificationWorkflow.adminListApplications, {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    search: searchQuery.trim() || undefined,
  });

  const pricingList = useQuery(api.verificationWorkflow.getPricing);
  const auditLogs = useQuery(api.verificationWorkflow.adminListAuditLogs, { limit: 100 });

  // Mutations
  const updatePricingMut = useMutation(api.verificationWorkflow.updatePricing);
  const confirmPaymentMut = useMutation(api.verificationWorkflow.adminConfirmPayment);
  const rejectPaymentMut = useMutation(api.verificationWorkflow.adminRejectPayment);
  const startReviewMut = useMutation(api.verificationWorkflow.adminStartReview);
  const approveVerificationMut = useMutation(api.verificationWorkflow.adminApproveVerification);
  const rejectVerificationMut = useMutation(api.verificationWorkflow.adminRejectVerification);

  // Modals state
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [confirmPaymentModal, setConfirmPaymentModal] = useState<any | null>(null);
  const [approveModal, setApproveModal] = useState<any | null>(null);
  const [rejectPaymentModal, setRejectPaymentModal] = useState<any | null>(null);
  const [rejectVerificationModal, setRejectVerificationModal] = useState<any | null>(null);

  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Pricing edit local state
  const [pricingEdits, setPricingEdits] = useState<
    Record<string, { priceNaira: number; isEnabled: boolean }>
  >({});
  const [pricingSaving, setPricingSaving] = useState<Record<string, boolean>>({});
  const [pricingSavedToast, setPricingSavedToast] = useState<string | null>(null);

  // Blue Check Requests state
  const [blueCheckStatusFilter, setBlueCheckStatusFilter] = useState<'ALL' | 'pending' | 'verified' | 'rejected'>('ALL');
  const [blueCheckSearch, setBlueCheckSearch] = useState('');
  const blueCheckRequests = useQuery(api.blueCheck.adminListRequests, {
    status: blueCheckStatusFilter === 'ALL' ? undefined : blueCheckStatusFilter,
    search: blueCheckSearch.trim() || undefined,
  });

  const approveBlueCheckMut = useMutation(api.blueCheck.adminApproveRequest);
  const rejectBlueCheckMut = useMutation(api.blueCheck.adminRejectRequest);

  const [approveBlueModal, setApproveBlueModal] = useState<any | null>(null);
  const [rejectBlueModal, setRejectBlueModal] = useState<any | null>(null);
  const [viewBlueModal, setViewBlueModal] = useState<any | null>(null);
  const [blueRejectionReason, setBlueRejectionReason] = useState('');
  const [blueActionLoading, setBlueActionLoading] = useState(false);

  const blueStats = useMemo(() => {
    if (!blueCheckRequests) return { total: 0, pending: 0, verified: 0, rejected: 0 };
    return {
      total: blueCheckRequests.length,
      pending: blueCheckRequests.filter((r) => r.status === 'pending').length,
      verified: blueCheckRequests.filter((r) => r.status === 'verified').length,
      rejected: blueCheckRequests.filter((r) => r.status === 'rejected').length,
    };
  }, [blueCheckRequests]);

  const handleApproveBlue = async () => {
    if (!approveBlueModal) return;
    setBlueActionLoading(true);
    try {
      await approveBlueCheckMut({ requestId: approveBlueModal._id });
      setApproveBlueModal(null);
      if (viewBlueModal?._id === approveBlueModal._id) {
        setViewBlueModal(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve verification.');
    } finally {
      setBlueActionLoading(false);
    }
  };

  const handleRejectBlue = async () => {
    if (!rejectBlueModal || !blueRejectionReason.trim()) {
      alert('Please provide a reason for rejecting the request.');
      return;
    }
    setBlueActionLoading(true);
    try {
      await rejectBlueCheckMut({
        requestId: rejectBlueModal._id,
        reason: blueRejectionReason.trim(),
      });
      setRejectBlueModal(null);
      setBlueRejectionReason('');
      if (viewBlueModal?._id === rejectBlueModal._id) {
        setViewBlueModal(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject verification.');
    } finally {
      setBlueActionLoading(false);
    }
  };

  // Quick stats
  const stats = useMemo(() => {
    if (!applications) return { total: 0, submitted: 0, underReview: 0, approved: 0 };
    return {
      total: applications.length,
      submitted: applications.filter((a) => a.status === 'Payment Submitted').length,
      underReview: applications.filter((a) => a.status === 'Under Review' || a.status === 'Payment Confirmed').length,
      approved: applications.filter((a) => a.status === 'Approved').length,
    };
  }, [applications]);

  // Actions
  const handleConfirmPayment = async () => {
    if (!confirmPaymentModal) return;
    setActionLoading(true);
    try {
      await confirmPaymentMut({ applicationId: confirmPaymentModal._id });
      setConfirmPaymentModal(null);
      if (selectedApp?._id === confirmPaymentModal._id) {
        setSelectedApp(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectPaymentModal || !rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      await rejectPaymentMut({
        applicationId: rejectPaymentModal._id,
        reason: rejectionReason.trim(),
      });
      setRejectPaymentModal(null);
      setRejectionReason('');
      if (selectedApp?._id === rejectPaymentModal._id) setSelectedApp(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reject payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartReview = async (appId: any) => {
    setActionLoading(true);
    try {
      await startReviewMut({ applicationId: appId });
      if (selectedApp?._id === appId) {
        setSelectedApp((prev: any) => (prev ? { ...prev, status: 'Under Review' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start review.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveVerification = async () => {
    if (!approveModal) return;
    setActionLoading(true);
    try {
      await approveVerificationMut({ applicationId: approveModal._id });
      setApproveModal(null);
      if (selectedApp?._id === approveModal._id) {
        setSelectedApp(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVerification = async () => {
    if (!rejectVerificationModal || !rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      await rejectVerificationMut({
        applicationId: rejectVerificationModal._id,
        reason: rejectionReason.trim(),
      });
      setRejectVerificationModal(null);
      setRejectionReason('');
      if (selectedApp?._id === rejectVerificationModal._id) setSelectedApp(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reject verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePrice = async (type: 'lalao_buz' | 'organization' | 'personal') => {
    const current = pricingList?.find((p) => p.type === type);
    const edits = pricingEdits[type];
    const priceNaira = edits?.priceNaira ?? current?.priceNaira ?? 0;
    const isEnabled = edits?.isEnabled ?? current?.isEnabled ?? true;

    setPricingSaving((prev) => ({ ...prev, [type]: true }));
    try {
      await updatePricingMut({ type, priceNaira, isEnabled });
      setPricingSavedToast(`Saved price for ${type.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setPricingSavedToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Could not save pricing.');
    } finally {
      setPricingSaving((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Verification Management
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
            Review paid applications, confirm transactions, and control verification pricing.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-zinc-100 rounded-2xl border border-zinc-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('blue_check')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'blue_check'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            <VerificationBadge isBlueCheck size="xs" />
            Blue Check Requests
            {blueStats.pending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#1D9BF0] text-white text-[10px] font-bold">
                {blueStats.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
              activeTab === 'applications'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            Paid Applications ({stats.submitted + stats.underReview})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'pricing'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            Verification Pricing
          </button>
          <button
            onClick={() => setActiveTab('audit_log')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'audit_log'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            <History className="w-3.5 h-3.5" />
            Audit Log
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 0: BLUE CHECK PROFILE VERIFICATION REQUESTS */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'blue_check' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-zinc-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Requests</span>
              <p className="text-2xl font-black text-zinc-900 mt-1">{blueStats.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{blueStats.pending}</p>
              <span className="text-[10px] font-bold text-amber-700 mt-0.5 block">Requires Decision</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D9BF0]">Verified Active</span>
              <p className="text-2xl font-black text-blue-900 mt-1">{blueStats.verified}</p>
              <span className="text-[10px] font-bold text-[#1D9BF0] mt-0.5 block">Blue Badge Live</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Rejected</span>
              <p className="text-2xl font-black text-rose-900 mt-1">{blueStats.rejected}</p>
              <span className="text-[10px] font-bold text-rose-700 mt-0.5 block">Not Approved</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={blueCheckSearch}
                onChange={(e) => setBlueCheckSearch(e.target.value)}
                placeholder="Search by applicant, username, category..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={blueCheckStatusFilter}
                onChange={(e) => setBlueCheckStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="pending">Pending Review ({blueStats.pending})</option>
                <option value="verified">Verified ({blueStats.verified})</option>
                <option value="rejected">Rejected ({blueStats.rejected})</option>
              </select>
            </div>
          </div>

          {/* Requests Table / Cards */}
          <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
            {blueCheckRequests === undefined ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-[#1D9BF0] animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-zinc-400">Loading Blue Check requests…</p>
              </div>
            ) : blueCheckRequests.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                  <VerificationBadge isBlueCheck size="md" />
                </div>
                <p className="text-sm font-bold text-zinc-700">No verification requests found</p>
                <p className="text-xs text-zinc-400">
                  {blueCheckSearch ? 'Try a different search keyword.' : 'When users submit Blue Check requests, they will appear here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Applicant</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Links / Portfolio</th>
                      <th className="p-4">Submitted Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {blueCheckRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-zinc-50/60 transition-colors">
                        {/* Applicant */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={req.user?.avatar} name={req.fullName} size="md" />
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-sm">
                                <span>{req.fullName}</span>
                                {req.status === 'verified' && <VerificationBadge isBlueCheck size="sm" />}
                              </div>
                              <p className="text-[11px] text-zinc-400 font-medium">
                                @{req.username?.replace(/^@+/, '')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#1D9BF0] border border-blue-100 whitespace-nowrap">
                            {req.category}
                          </span>
                        </td>

                        {/* Links */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {req.links.map((link, i) => (
                              <a
                                key={i}
                                href={link.startsWith('http') ? link : `https://${link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-blue-50 hover:text-[#1D9BF0] text-zinc-600 text-[11px] font-medium transition-colors"
                              >
                                <span>Link {i + 1}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-4 text-zinc-500 font-medium whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Status */}
                        <td className="p-4 whitespace-nowrap">
                          {req.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                            </span>
                          )}
                          {req.status === 'verified' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#1D9BF0] border border-blue-200">
                              <CheckCircle2 className="w-3 h-3 text-[#1D9BF0]" /> Verified
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewBlueModal(req)}
                              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>

                            {req.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setApproveBlueModal(req)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs inline-flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectBlueModal(req);
                                    setBlueRejectionReason('');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {req.status === 'rejected' && (
                              <button
                                type="button"
                                onClick={() => setApproveBlueModal(req)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors"
                              >
                                Re-approve
                              </button>
                            )}

                            {req.status === 'verified' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectBlueModal(req);
                                  setBlueRejectionReason('Revoked verification status');
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: APPLICATIONS LIST */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-zinc-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Applications</span>
              <p className="text-2xl font-black text-zinc-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Payment Submitted</span>
              <p className="text-2xl font-black text-blue-900 mt-1">{stats.submitted}</p>
              <span className="text-[10px] font-bold text-blue-600 mt-0.5 block">Needs Payment Confirmation</span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Under Review</span>
              <p className="text-2xl font-black text-purple-900 mt-1">{stats.underReview}</p>
              <span className="text-[10px] font-bold text-purple-600 mt-0.5 block">Awaiting Verification Decision</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Approved Badges</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{stats.approved}</p>
              <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block">Active across Lalao</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applicant, username, ref..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Payment Submitted">Payment Submitted</option>
                <option value="Payment Confirmed">Payment Confirmed</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Payment Pending">Payment Pending</option>
                <option value="Payment Failed">Payment Failed</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 bg-white"
              >
                <option value="ALL">All Types</option>
                <option value="lalao_buz">Lalao Buz (Blue)</option>
                <option value="organization">Organization (Green)</option>
                <option value="personal">Personal (Black)</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            {!applications ? (
              <div className="py-20 text-center text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-zinc-300" />
                <span className="text-xs font-bold">Loading applications...</span>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <Shield className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                <h4 className="font-bold text-zinc-700 text-sm">No verification applications found</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Applications matching your filters will show up here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Applicant</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Price Paid</th>
                      <th className="px-5 py-3.5">Payment Ref</th>
                      <th className="px-5 py-3.5">Current Status</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                    {applications.map((app) => {
                      const isSubmitted = app.status === 'Payment Submitted';
                      const isConfirmed = app.status === 'Payment Confirmed';
                      const isReview = app.status === 'Under Review';
                      const isApprovable = isReview || isConfirmed;

                      return (
                        <tr
                          key={app._id}
                          className="hover:bg-zinc-50/60 transition-colors cursor-pointer"
                          onClick={() => setSelectedApp(app)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={app.userAvatar} name={app.applicantName} size="sm" />
                              <div className="min-w-0">
                                <span className="font-bold text-zinc-900 block truncate">
                                  {app.applicantName}
                                </span>
                                <span className="text-[11px] text-zinc-400 block truncate">
                                  @{app.username?.replace(/^@+/, '')}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <VerificationBadge type={app.verificationType} isVerified={true} size="sm" />
                              <span className="font-bold text-zinc-800 capitalize">
                                {app.verificationType === 'lalao_buz'
                                  ? 'Lalao Buz'
                                  : app.verificationType === 'organization'
                                  ? 'Organization'
                                  : 'Personal'}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-black text-zinc-900">
                            ₦{app.priceAmountNaira?.toLocaleString()}
                          </td>

                          <td className="px-5 py-4 font-mono text-[11px] font-bold text-zinc-600">
                            {app.paymentReference}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap',
                                app.status === 'Payment Pending' && 'bg-amber-50 text-amber-800 border-amber-200',
                                app.status === 'Payment Submitted' && 'bg-blue-50 text-blue-800 border-blue-200',
                                app.status === 'Payment Confirmed' && 'bg-indigo-50 text-indigo-800 border-indigo-200',
                                app.status === 'Under Review' && 'bg-purple-50 text-purple-800 border-purple-200',
                                app.status === 'Approved' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                                app.status === 'Rejected' && 'bg-rose-50 text-rose-800 border-rose-200',
                                app.status === 'Payment Failed' && 'bg-rose-50 text-rose-700 border-rose-200'
                              )}
                            >
                              {app.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-zinc-500 whitespace-nowrap text-[11px]">
                            {new Date(app.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Step 1: Confirm Payment */}
                              {isSubmitted && (
                                <>
                                  <button
                                    onClick={() => setConfirmPaymentModal(app)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm"
                                  >
                                    Confirm Payment
                                  </button>
                                  <button
                                    onClick={() => setRejectPaymentModal(app)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] border border-rose-200"
                                  >
                                    Reject Payment
                                  </button>
                                </>
                              )}

                              {/* Intermediate: Start Review */}
                              {isConfirmed && (
                                <button
                                  onClick={() => handleStartReview(app._id)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm"
                                >
                                  Start Review
                                </button>
                              )}

                              {/* Step 2: Approve Verification */}
                              {isApprovable && (
                                <>
                                  <button
                                    onClick={() => setApproveModal(app)}
                                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[11px] shadow-sm"
                                  >
                                    Approve Verification
                                  </button>
                                  <button
                                    onClick={() => setRejectVerificationModal(app)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] border border-rose-200"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setSelectedApp(app)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: VERIFICATION PRICING */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-zinc-900">Verification Pricing Settings</h2>
              <p className="text-xs text-zinc-500 font-medium mt-1">
                Configure prices and availability for each verification type. Changes are saved directly to the database and reflected immediately in the user app.
              </p>
            </div>

            {pricingSavedToast && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {pricingSavedToast}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Lalao Buz Card */}
              {(() => {
                const item = pricingList?.find((p) => p.type === 'lalao_buz');
                const edits = pricingEdits['lalao_buz'];
                const priceNaira = edits?.priceNaira ?? item?.priceNaira ?? 25000;
                const isEnabled = edits?.isEnabled ?? item?.isEnabled ?? true;
                const saving = pricingSaving['lalao_buz'];

                return (
                  <div className="p-6 rounded-3xl border-2 border-blue-200 bg-blue-50/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          Blue Badge
                        </span>
                        <VerificationBadge type="lalao_buz" isVerified={true} size="lg" />
                      </div>
                      <h3 className="text-lg font-black text-zinc-900">Lalao Buz</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-1">
                        For businesses, commercial entities, stores, and companies.
                      </p>

                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Price (₦ Naira)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-500 text-sm">₦</span>
                            <input
                              type="number"
                              min={0}
                              value={priceNaira}
                              onChange={(e) =>
                                setPricingEdits((prev) => ({
                                  ...prev,
                                  lalao_buz: {
                                    priceNaira: Number(e.target.value),
                                    isEnabled,
                                  },
                                }))
                              }
                              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-black text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-bold text-zinc-700">Open For Applications</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) =>
                                setPricingEdits((prev) => ({
                                  ...prev,
                                  lalao_buz: {
                                    priceNaira,
                                    isEnabled: e.target.checked,
                                  },
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSavePrice('lalao_buz')}
                      disabled={saving}
                      className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Lalao Buz Price
                    </button>
                  </div>
                );
              })()}

              {/* Organization Card */}
              {(() => {
                const item = pricingList?.find((p) => p.type === 'organization');
                const edits = pricingEdits['organization'];
                const priceNaira = edits?.priceNaira ?? item?.priceNaira ?? 15000;
                const isEnabled = edits?.isEnabled ?? item?.isEnabled ?? true;
                const saving = pricingSaving['organization'];

                return (
                  <div className="p-6 rounded-3xl border-2 border-emerald-200 bg-emerald-50/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Green Badge
                        </span>
                        <VerificationBadge type="organization" isVerified={true} size="lg" />
                      </div>
                      <h3 className="text-lg font-black text-zinc-900">Organization</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-1">
                        For organizations, community groups, clubs, associations, and NGOs.
                      </p>

                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Price (₦ Naira)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-500 text-sm">₦</span>
                            <input
                              type="number"
                              min={0}
                              value={priceNaira}
                              onChange={(e) =>
                                setPricingEdits((prev) => ({
                                  ...prev,
                                  organization: {
                                    priceNaira: Number(e.target.value),
                                    isEnabled,
                                  },
                                }))
                              }
                              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-black text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-bold text-zinc-700">Open For Applications</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) =>
                                setPricingEdits((prev) => ({
                                  ...prev,
                                  organization: {
                                    priceNaira,
                                    isEnabled: e.target.checked,
                                  },
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSavePrice('organization')}
                      disabled={saving}
                      className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Organization Price
                    </button>
                  </div>
                );
              })()}

              {/* Personal Card */}
              {(() => {
                const item = pricingList?.find((p) => p.type === 'personal');
                const edits = pricingEdits['personal'];
                const priceNaira = edits?.priceNaira ?? item?.priceNaira ?? 5000;
                const isEnabled = edits?.isEnabled ?? item?.isEnabled ?? true;
                const saving = pricingSaving['personal'];

                return (
                  <div className="p-6 rounded-3xl border-2 border-zinc-300 bg-zinc-50 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-200 text-zinc-800 border border-zinc-300">
                          Black Badge
                        </span>
                        <VerificationBadge type="personal" isVerified={true} size="lg" />
                      </div>
                      <h3 className="text-lg font-black text-zinc-900">Personal</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-1">
                        For individuals, creators, journalists, influencers, and public figures.
                      </p>

                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Price (₦ Naira)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-500 text-sm">₦</span>
                            <input
                              type="number"
                              min={0}
                              value={priceNaira}
                              onChange={(e) =>
                                setPricingEdits((prev) => ({
                                  ...prev,
                                  personal: {
                                    priceNaira: Number(e.target.value),
                                    isEnabled,
                                  },
                                }))
                              }
                              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-black text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-bold text-zinc-700">Open For Applications</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) =>
                                setPricingEdits((prev) => ({
                                  ...prev,
                                  personal: {
                                    priceNaira,
                                    isEnabled: e.target.checked,
                                  },
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSavePrice('personal')}
                      disabled={saving}
                      className="w-full mt-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Personal Price
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: ADMIN AUDIT LOG */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div>
            <h2 className="text-lg font-black text-zinc-900">Verification Audit Trail</h2>
            <p className="text-xs text-zinc-500 font-medium">
              Permanent immutable log of all verification status transitions, pricing changes, and admin decisions.
            </p>
          </div>

          {!auditLogs ? (
            <div className="py-12 text-center text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-300" />
              <span className="text-xs font-bold">Loading audit logs...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <History className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              <p className="text-xs font-bold text-zinc-600">No audit records found yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Previous Status</th>
                    <th className="px-4 py-3">New Status</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Date / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3 font-bold text-zinc-900">{log.adminName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-800">{log.applicantName || '—'}</td>
                      <td className="px-4 py-3 text-zinc-500">{log.previousStatus || '—'}</td>
                      <td className="px-4 py-3 font-bold text-zinc-900">{log.newStatus}</td>
                      <td className="px-4 py-3 text-zinc-500 max-w-xs truncate">{log.details || '—'}</td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-[11px]">
                        {new Date(log.createdAt).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CONFIRM PAYMENT (Exact required prompt) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={Boolean(confirmPaymentModal)}
        onClose={() => setConfirmPaymentModal(null)}
        title="Confirm Payment?"
        subtitle="Verify that the payment has been credited to the corporate account before confirming."
        maxWidth="md"
      >
        {confirmPaymentModal && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500 font-bold">Payment Reference:</span>
                <span className="font-mono font-bold text-zinc-900">{confirmPaymentModal.paymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500 font-bold">Amount:</span>
                <span className="font-black text-zinc-900 text-base">
                  ₦{confirmPaymentModal.priceAmountNaira?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500 font-bold">Applicant:</span>
                <span className="font-bold text-zinc-800">{confirmPaymentModal.applicantName}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Confirming payment moves the application to <b>Payment Confirmed</b> so that documents can be reviewed. It does <b>NOT</b> activate the verification badge.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmPaymentModal(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm Payment
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: APPROVE VERIFICATION (Exact required prompt) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={Boolean(approveModal)}
        onClose={() => setApproveModal(null)}
        title="Approve Verification?"
        subtitle="This action will officially activate the verification badge."
        maxWidth="md"
      >
        {approveModal && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500 font-bold">Applicant:</span>
                <span className="font-bold text-zinc-900">{approveModal.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500 font-bold">Username:</span>
                <span className="font-bold text-zinc-800">@{approveModal.username?.replace(/^@+/, '')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-bold">Type:</span>
                <div className="flex items-center gap-1.5">
                  <VerificationBadge type={approveModal.verificationType} isVerified={true} size="sm" />
                  <span className="font-bold text-zinc-900 capitalize">
                    {approveModal.verificationType === 'lalao_buz'
                      ? 'Lalao Buz (Blue)'
                      : approveModal.verificationType === 'organization'
                      ? 'Organization (Green)'
                      : 'Personal (Black)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 leading-relaxed">
              "Approving this application will activate the verification badge."
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModal(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveVerification}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />}
                Approve Verification
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: REJECT PAYMENT / REJECT VERIFICATION */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={Boolean(rejectPaymentModal || rejectVerificationModal)}
        onClose={() => {
          setRejectPaymentModal(null);
          setRejectVerificationModal(null);
          setRejectionReason('');
        }}
        title={rejectPaymentModal ? 'Reject Payment' : 'Reject Verification'}
        subtitle="Explain why this application or payment cannot be approved."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Payment reference not found in bank statement / Document unreadable..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setRejectPaymentModal(null);
                setRejectVerificationModal(null);
                setRejectionReason('');
              }}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={rejectPaymentModal ? handleRejectPayment : handleRejectVerification}
              disabled={actionLoading || !rejectionReason.trim()}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Processing…' : 'Submit Rejection'}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: FULL APPLICATION DETAILS */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
        subtitle={selectedApp ? `Ref: ${selectedApp.paymentReference}` : ''}
        maxWidth="2xl"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-3">
                <Avatar src={selectedApp.userAvatar} name={selectedApp.applicantName} size="lg" />
                <div>
                  <h3 className="text-base font-black text-zinc-900">{selectedApp.applicantName}</h3>
                  <span className="text-xs text-zinc-500 font-medium">@{selectedApp.username}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-zinc-900">
                  ₦{selectedApp.priceAmountNaira?.toLocaleString()}
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  {selectedApp.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-400 font-bold uppercase block text-[10px]">Verification Type</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <VerificationBadge type={selectedApp.verificationType} isVerified={true} size="sm" />
                  <span className="font-bold text-zinc-900 capitalize">{selectedApp.verificationType}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-400 font-bold uppercase block text-[10px]">Payment Reference</span>
                <span className="font-mono font-bold text-zinc-900 block mt-1">{selectedApp.paymentReference}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-400 font-bold uppercase block text-[10px]">Contact Email</span>
                <span className="font-bold text-zinc-900 block mt-1">{selectedApp.contactEmail || '—'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-400 font-bold uppercase block text-[10px]">Contact Phone</span>
                <span className="font-bold text-zinc-900 block mt-1">{selectedApp.contactPhone || '—'}</span>
              </div>

              {selectedApp.entityName && (
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-400 font-bold uppercase block text-[10px]">Entity / Org Name</span>
                  <span className="font-bold text-zinc-900 block mt-1">{selectedApp.entityName}</span>
                </div>
              )}

              {selectedApp.registrationNumber && (
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-400 font-bold uppercase block text-[10px]">Registration / ID Number</span>
                  <span className="font-mono font-bold text-zinc-900 block mt-1">{selectedApp.registrationNumber}</span>
                </div>
              )}
            </div>

            {/* Document Attachments */}
            {selectedApp.resolvedDocUrls && selectedApp.resolvedDocUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-zinc-700 uppercase tracking-wider">
                  Submitted Verification Documents
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedApp.resolvedDocUrls.map((url: string, i: number) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-bold text-xs text-zinc-800 truncate">Document {i + 1}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Proof Attachment */}
            {selectedApp.paymentProofUrl && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-zinc-700 uppercase tracking-wider">
                  Payment Receipt / Transfer Proof
                </h4>
                <a
                  href={selectedApp.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 flex items-center justify-between group transition-colors bg-zinc-50"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-zinc-800">View Attached Payment Receipt</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
                </a>
              </div>
            )}

            {selectedApp.additionalInfo && (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                <span className="text-zinc-400 font-bold uppercase block text-[10px] mb-1">Additional Information</span>
                <p className="text-zinc-700 leading-relaxed font-medium">{selectedApp.additionalInfo}</p>
              </div>
            )}

            {/* Admin Actions Bar inside Modal */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-zinc-500 font-medium">
                Status: <b>{selectedApp.status}</b>
              </span>

              <div className="flex gap-2">
                {selectedApp.status === 'Payment Submitted' && (
                  <>
                    <button
                      onClick={() => setConfirmPaymentModal(selectedApp)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                    >
                      Confirm Payment
                    </button>
                    <button
                      onClick={() => setRejectPaymentModal(selectedApp)}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200"
                    >
                      Reject Payment
                    </button>
                  </>
                )}

                {selectedApp.status === 'Payment Confirmed' && (
                  <button
                    onClick={() => handleStartReview(selectedApp._id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                  >
                    Start Review
                  </button>
                )}

                {(selectedApp.status === 'Under Review' || selectedApp.status === 'Payment Confirmed') && (
                  <>
                    <button
                      onClick={() => setApproveModal(selectedApp)}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm"
                    >
                      Approve Verification
                    </button>
                    <button
                      onClick={() => setRejectVerificationModal(selectedApp)}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminModal>
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BLUE CHECK APPROVE MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={Boolean(approveBlueModal)}
        onClose={() => setApproveBlueModal(null)}
        title="Approve Blue Check Verification?"
        subtitle="This action activates the official RALLY blue check badge across their profile and posts."
        maxWidth="md"
      >
        {approveBlueModal && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500 font-bold">Applicant:</span>
                <span className="font-bold text-zinc-900">{approveBlueModal.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500 font-bold">Username:</span>
                <span className="font-bold text-zinc-800">@{approveBlueModal.username?.replace(/^@+/, '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500 font-bold">Category:</span>
                <span className="font-bold text-[#1D9BF0]">{approveBlueModal.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-bold">Badge to Activate:</span>
                <div className="flex items-center gap-1.5">
                  <VerificationBadge isBlueCheck size="sm" />
                  <span className="font-bold text-[#1D9BF0]">RALLY Profile Verification (Blue)</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-950 leading-relaxed">
              "Approving this request will immediately activate the Blue Check badge on the user's account, display it beside their name across RALLY, and remove any unverified banner from their profile."
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApproveBlueModal(null)}
                disabled={blueActionLoading}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveBlue}
                disabled={blueActionLoading}
                className="px-5 py-2.5 rounded-xl bg-[#1D9BF0] hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {blueActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <VerificationBadge isBlueCheck size="xs" />
                )}
                Confirm Approval & Activate Blue Check
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BLUE CHECK REJECT MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={Boolean(rejectBlueModal)}
        onClose={() => {
          setRejectBlueModal(null);
          setBlueRejectionReason('');
        }}
        title="Reject Verification Request"
        subtitle="Provide a reason explaining why the request was not approved."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={blueRejectionReason}
              onChange={(e) => setBlueRejectionReason(e.target.value)}
              placeholder="e.g. Profile links could not be verified / insufficient public presence..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setRejectBlueModal(null);
                setBlueRejectionReason('');
              }}
              disabled={blueActionLoading}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRejectBlue}
              disabled={blueActionLoading || !blueRejectionReason.trim()}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {blueActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Confirm Rejection
            </button>
          </div>
        </div>
      </AdminModal>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BLUE CHECK DETAILS MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={Boolean(viewBlueModal)}
        onClose={() => setViewBlueModal(null)}
        title="Blue Check Request Details"
        subtitle="Review submitted information for RALLY profile verification."
        maxWidth="lg"
      >
        {viewBlueModal && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3.5">
              <Avatar src={viewBlueModal.user?.avatar} name={viewBlueModal.fullName} size="lg" />
              <div>
                <h4 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                  {viewBlueModal.fullName}
                  {viewBlueModal.status === 'verified' && <VerificationBadge isBlueCheck size="sm" />}
                </h4>
                <p className="text-zinc-500 font-medium">@{viewBlueModal.username?.replace(/^@+/, '')}</p>
                {viewBlueModal.user?.email && (
                  <p className="text-zinc-400 text-[11px] mt-0.5">{viewBlueModal.user.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Category</span>
                <p className="font-bold text-zinc-900 mt-0.5">{viewBlueModal.category}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Status</span>
                <p className="font-bold mt-0.5 capitalize text-zinc-900">{viewBlueModal.status}</p>
              </div>
            </div>

            {viewBlueModal.evidenceNote && (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Supporting Bio / Note</span>
                <p className="text-zinc-700 leading-relaxed font-medium">{viewBlueModal.evidenceNote}</p>
              </div>
            )}

            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Submitted Links</span>
              <div className="space-y-1.5">
                {viewBlueModal.links.map((link: string, i: number) => (
                  <a
                    key={i}
                    href={link.startsWith('http') ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-blue-50 text-blue-600 font-medium transition-colors"
                  >
                    <span className="truncate">{link}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2 text-zinc-400" />
                  </a>
                ))}
              </div>
            </div>

            {viewBlueModal.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <span className="text-[10px] uppercase font-bold text-rose-600 block mb-0.5">Rejection Reason</span>
                <p className="font-medium">{viewBlueModal.rejectionReason}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setViewBlueModal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold"
              >
                Close
              </button>
              {viewBlueModal.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectBlueModal(viewBlueModal);
                      setBlueRejectionReason('');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveBlueModal(viewBlueModal)}
                    className="px-5 py-2 rounded-xl bg-[#1D9BF0] hover:bg-blue-600 text-white font-bold"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
