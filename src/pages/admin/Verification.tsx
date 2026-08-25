import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  BadgeCheck, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  FileText, 
  RotateCcw, 
  Lock, 
  EyeOff, 
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { useAdmin, AdminVerification } from '../../contexts/AdminContext';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminStatsCard } from '../../components/admin/AdminStatsCard';
import { cn } from '../../lib/utils';

export default function AdminVerificationPage() {
  const { 
    verifications, 
    approveVerification, 
    rejectVerification, 
    requestResubmission 
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVerification, setSelectedVerification] = useState<AdminVerification | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'resubmit' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('BLURRY_IMAGE');
  const [customRejectionNote, setCustomRejectionNote] = useState('');
  const [showFullNIN, setShowFullNIN] = useState<Record<string, boolean>>({});

  // Metrics
  const pendingCount = verifications.filter(v => v.status === 'PENDING').length;
  const inReviewCount = verifications.filter(v => v.status === 'IN_REVIEW').length;
  const approvedCount = verifications.filter(v => v.status === 'APPROVED').length;
  const rejectedCount = verifications.filter(v => v.status === 'REJECTED').length;

  const filteredList = useMemo(() => {
    return verifications.filter(v => {
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
      return true;
    });
  }, [verifications, statusFilter]);

  const toggleNINVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullNIN(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmApprove = () => {
    if (!selectedVerification) return;
    approveVerification(selectedVerification.id);
    setSelectedVerification(prev => prev ? { ...prev, status: 'APPROVED' } : null);
    setModalType(null);
  };

  const handleConfirmReject = () => {
    if (!selectedVerification) return;
    const reasonText = rejectionReason === 'OTHER' ? customRejectionNote : rejectionReason.replace('_', ' ');
    rejectVerification(selectedVerification.id, reasonText);
    setSelectedVerification(prev => prev ? { ...prev, status: 'REJECTED', rejectionReason: reasonText } : null);
    setModalType(null);
    setCustomRejectionNote('');
  };

  const handleConfirmResubmit = () => {
    if (!selectedVerification) return;
    requestResubmission(selectedVerification.id, customRejectionNote || 'Please provide a clearer photo of your NIN slip.');
    setSelectedVerification(prev => prev ? { ...prev, status: 'PENDING' } : null);
    setModalType(null);
    setCustomRejectionNote('');
  };

  const columns: Column<AdminVerification>[] = [
    {
      key: 'userName',
      header: 'Applicant',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-3">
          <img src={v.userAvatar} alt={v.userName} className="w-10 h-10 rounded-2xl object-cover border border-zinc-200" />
          <div className="min-w-0">
            <span className="font-bold text-zinc-900 block truncate">{v.userName}</span>
            <span className="text-[11px] text-zinc-400 font-medium">{v.userHandle}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'ninNumber',
      header: 'NIN Number',
      render: (v) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-zinc-800">
            {showFullNIN[v.id] ? v.ninNumber : `•••••••${v.ninNumber.slice(-4)}`}
          </span>
          <button 
            onClick={(e) => toggleNINVisibility(v.id, e)}
            className="text-zinc-400 hover:text-zinc-700 p-1"
            title="Toggle NIN visibility"
          >
            {showFullNIN[v.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
    {
      key: 'confidenceScore',
      header: 'NIMC Match AI',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1",
            v.confidenceScore >= 90 ? "bg-emerald-100 text-emerald-800" :
            v.confidenceScore >= 75 ? "bg-amber-100 text-amber-800" :
            "bg-rose-100 text-rose-800"
          )}>
            <Sparkles className="w-3 h-3" />
            {v.confidenceScore}%
          </span>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-zinc-500 font-medium">
          {v.submittedAt}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => (
        <span className={cn(
          "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
          v.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
          v.status === 'PENDING' ? "bg-amber-50 text-amber-700 border border-amber-200" :
          v.status === 'IN_REVIEW' ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
          "bg-rose-50 text-rose-700 border border-rose-200"
        )}>
          {v.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedVerification(v)}
            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Inspect Verification Documents"
          >
            <Eye className="w-4 h-4" />
          </button>
          {v.status !== 'APPROVED' && (
            <button
              onClick={() => approveVerification(v.id)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              title="Quick Approve"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {v.status !== 'REJECTED' && (
            <button
              onClick={() => {
                setSelectedVerification(v);
                setModalType('reject');
              }}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Reject Application"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Identity Verification Queue</h2>
        <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
          Review National Identity Management Commission (NIMC) NIN credentials and photo identity verification.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Pending Review</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
          <span className="text-[10px] font-bold text-indigo-700 uppercase">In Active Review</span>
          <p className="text-2xl font-black text-indigo-900 mt-1">{inReviewCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Approved Profiles</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{approvedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
          <span className="text-[10px] font-bold text-rose-700 uppercase">Rejected / Flagged</span>
          <p className="text-2xl font-black text-rose-900 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Verification Data Table */}
      <AdminDataTable
        data={filteredList}
        columns={columns}
        keyExtractor={(v) => v.id}
        searchPlaceholder="Search applicant name, handle, or NIN..."
        searchFields={['userName', 'userHandle', 'ninNumber']}
        exportFileName="nin-verifications"
        onRowClick={(v) => setSelectedVerification(v)}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'In Review', value: 'IN_REVIEW' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' },
            ]
          }
        ]}
        bulkActions={[
          {
            label: 'Approve Selected',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            variant: 'success',
            action: (ids) => {
              ids.forEach(id => approveVerification(id));
            }
          }
        ]}
      />

      {/* DETAILED VERIFICATION INSPECTION MODAL */}
      {selectedVerification && (
        <AdminModal
          isOpen={Boolean(selectedVerification)}
          onClose={() => setSelectedVerification(null)}
          title={`NIN Verification: ${selectedVerification.userName}`}
          subtitle={`Application ID: ${selectedVerification.id} · Submitted ${selectedVerification.submittedAt}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Top Match Bar */}
            <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={selectedVerification.userAvatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-zinc-200" />
                <div>
                  <h3 className="text-base font-black text-zinc-900">{selectedVerification.userName}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{selectedVerification.userHandle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase">NIMC AI Match</span>
                  <span className="text-lg font-black text-emerald-600">{selectedVerification.confidenceScore}% Confidence</span>
                </div>
                <span className={cn(
                  "text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider",
                  selectedVerification.status === 'APPROVED' ? "bg-emerald-100 text-emerald-800" :
                  selectedVerification.status === 'PENDING' ? "bg-amber-100 text-amber-800" :
                  "bg-rose-100 text-rose-800"
                )}>
                  {selectedVerification.status}
                </span>
              </div>
            </div>

            {/* Document Previews (Side-by-side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selfie / Profile photo */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Live Camera Selfie</span>
                <div className="h-48 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                  <img src={selectedVerification.selfiePhotoUrl} alt="Selfie" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* NIN Document / Slip */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">NIN Slip / Government Card</span>
                <div className="h-48 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                  <img src={selectedVerification.documentPhotoUrl} alt="NIN Doc" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* NIN Registry Comparison Info */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase">NIN Number</span>
                  <span className="font-mono font-bold text-zinc-900">{selectedVerification.ninNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase">NIMC Match Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Biometrics Valid
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase">Face Similarity</span>
                  <span className="font-bold text-zinc-900">{selectedVerification.confidenceScore}%</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setModalType('resubmit')}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
              >
                Request Re-submission
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalType('reject')}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject Application
                </button>
                <button
                  onClick={handleConfirmApprove}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  APPROVE & GRANT BADGE
                </button>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* MODAL: REJECT VERIFICATION */}
      <AdminModal
        isOpen={modalType === 'reject'}
        onClose={() => setModalType(null)}
        title="Reject Identity Verification?"
        subtitle="Specify the rejection reason to notify the user."
        variant="danger"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Rejection Reason
            </label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
            >
              <option value="BLURRY_IMAGE">Document photo is blurry or unreadable</option>
              <option value="NIN_MISMATCH">Name does not match official NIMC records</option>
              <option value="EXPIRED_DOCUMENT">ID document is expired</option>
              <option value="FACE_MISMATCH">Selfie does not match photo on identity card</option>
              <option value="OTHER">Other Reason...</option>
            </select>
          </div>

          {rejectionReason === 'OTHER' && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Custom Feedback for User
              </label>
              <textarea
                value={customRejectionNote}
                onChange={(e) => setCustomRejectionNote(e.target.value)}
                placeholder="Explain the specific issue with the submission..."
                rows={3}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setModalType(null)}
              className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-colors shadow-sm"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </AdminModal>

      {/* MODAL: REQUEST RESUBMISSION */}
      <AdminModal
        isOpen={modalType === 'resubmit'}
        onClose={() => setModalType(null)}
        title="Request Document Re-submission"
        subtitle="Prompt the user to re-upload clearer verification credentials."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Instruction for User
            </label>
            <textarea
              value={customRejectionNote}
              onChange={(e) => setCustomRejectionNote(e.target.value)}
              placeholder="e.g. Please take a well-lit photo of your original NIMC paper slip..."
              rows={3}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setModalType(null)}
              className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmResubmit}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-colors"
            >
              Send Request
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
