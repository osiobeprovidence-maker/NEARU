import React, { useState, useMemo } from 'react';
import { 
  Flag, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  Clock, 
  Users, 
  UserX, 
  Trash2, 
  MessageSquare, 
  FileText, 
  ArrowUpRight, 
  BadgeCheck, 
  ChevronRight,
  Send,
  Plus
} from 'lucide-react';
import { useAdmin, AdminReport } from '../../contexts/AdminContext';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminStatsCard } from '../../components/admin/AdminStatsCard';
import { cn } from '../../lib/utils';

export default function AdminReports() {
  const { 
    reports, 
    resolveReport, 
    escalateReport, 
    dismissReport, 
    assignReport, 
    addReportNote,
    suspendUser,
    banUser 
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Selected report for investigation modal
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  // Confirmation Modals
  const [modalType, setModalType] = useState<'resolve' | 'escalate' | 'dismiss' | 'banReported' | null>(null);

  // Metrics
  const totalCount = reports.length;
  const pendingCount = reports.filter(r => r.status === 'PENDING').length;
  const underReviewCount = reports.filter(r => r.status === 'UNDER_REVIEW').length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const escalatedCount = reports.filter(r => r.status === 'ESCALATED').length;

  // Filtered dataset
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      return true;
    });
  }, [reports, statusFilter, priorityFilter, typeFilter]);

  const handleAddNote = () => {
    if (!selectedReport || !newAdminNote.trim()) return;
    addReportNote(selectedReport.id, newAdminNote);
    setSelectedReport(prev => prev ? {
      ...prev,
      adminNotes: [...(prev.adminNotes || []), `Alex Johnson: ${newAdminNote}`]
    } : null);
    setNewAdminNote('');
  };

  const handleConfirmResolve = () => {
    if (!selectedReport) return;
    resolveReport(selectedReport.id, resolutionNote || 'Resolved by moderator');
    setSelectedReport(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
    setModalType(null);
    setResolutionNote('');
  };

  const handleConfirmEscalate = () => {
    if (!selectedReport) return;
    escalateReport(selectedReport.id);
    setSelectedReport(prev => prev ? { ...prev, status: 'ESCALATED', priority: 'URGENT' } : null);
    setModalType(null);
  };

  const handleConfirmDismiss = () => {
    if (!selectedReport) return;
    dismissReport(selectedReport.id);
    setSelectedReport(prev => prev ? { ...prev, status: 'DISMISSED' } : null);
    setModalType(null);
  };

  const handleConfirmBanReported = () => {
    if (!selectedReport) return;
    banUser(selectedReport.reportedUserId, `Banned as a result of investigation on report ${selectedReport.id}`);
    resolveReport(selectedReport.id, 'User permanently banned.');
    setSelectedReport(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
    setModalType(null);
  };

  // Table Columns
  const columns: Column<AdminReport>[] = [
    {
      key: 'id',
      header: 'Report ID',
      sortable: true,
      render: (r) => (
        <span className="font-mono font-bold text-zinc-900 text-xs">
          {r.id}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Reason / Type',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-zinc-900 block">{r.type}</span>
          <span className="text-[11px] text-zinc-500 line-clamp-1">{r.description}</span>
        </div>
      ),
    },
    {
      key: 'reportedUserName',
      header: 'Reported Entity',
      render: (r) => (
        <div className="flex items-center gap-2">
          <img src={r.reportedUserAvatar} alt={r.reportedUserName} className="w-6 h-6 rounded-full object-cover" />
          <div className="min-w-0">
            <span className="font-bold text-zinc-800 text-xs truncate block">{r.reportedUserName}</span>
            {r.rallyTitle && (
              <span className="text-[10px] text-zinc-400 truncate block">Post: {r.rallyTitle}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'reporterName',
      header: 'Reporter',
      render: (r) => (
        <div className="flex items-center gap-2">
          <img src={r.reporterAvatar} alt={r.reporterName} className="w-5 h-5 rounded-full object-cover" />
          <span className="text-xs text-zinc-600 font-medium">{r.reporterName}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (r) => (
        <span className={cn(
          "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
          r.priority === 'URGENT' ? "bg-rose-100 text-rose-800 border border-rose-200" :
          r.priority === 'HIGH' ? "bg-amber-100 text-amber-800 border border-amber-200" :
          "bg-zinc-100 text-zinc-600"
        )}>
          {r.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => (
        <span className={cn(
          "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
          r.status === 'PENDING' ? "bg-amber-50 text-amber-700 border border-amber-200" :
          r.status === 'UNDER_REVIEW' ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
          r.status === 'RESOLVED' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
          r.status === 'ESCALATED' ? "bg-rose-50 text-rose-700 border border-rose-200" :
          "bg-zinc-100 text-zinc-500 border border-zinc-200"
        )}>
          {r.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'assignedAdmin',
      header: 'Assigned',
      render: (r) => (
        <span className="text-xs text-zinc-600 font-medium">
          {r.assignedAdmin || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedReport(r)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            Investigate
          </button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Safety Reports & Flags</h2>
        <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
          Review community reports, suspicious activities, scam flags, and harassment inquiries.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 text-center">
          <span className="text-[10px] font-bold text-zinc-400 uppercase">Total Reports</span>
          <p className="text-2xl font-black text-zinc-900 mt-1">{totalCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Pending Triage</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
          <span className="text-[10px] font-bold text-indigo-700 uppercase">Under Review</span>
          <p className="text-2xl font-black text-indigo-900 mt-1">{underReviewCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
          <span className="text-[10px] font-bold text-rose-700 uppercase">Escalated</span>
          <p className="text-2xl font-black text-rose-900 mt-1">{escalatedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Resolved</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Reports Data Table */}
      <AdminDataTable
        data={filteredReports}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Search report ID, reported user, reporter, or description..."
        searchFields={['id', 'type', 'reportedUserName', 'reporterName', 'description']}
        exportFileName="safety-reports"
        onRowClick={(r) => setSelectedReport(r)}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Under Review', value: 'UNDER_REVIEW' },
              { label: 'Escalated', value: 'ESCALATED' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Dismissed', value: 'DISMISSED' },
            ]
          },
          {
            id: 'priority',
            label: 'Priority',
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: [
              { label: 'All Priorities', value: 'ALL' },
              { label: 'Urgent', value: 'URGENT' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ]
          },
          {
            id: 'type',
            label: 'Report Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: 'All Report Types', value: 'ALL' },
              { label: 'Scam/Fraud', value: 'Scam/Fraud' },
              { label: 'Harassment', value: 'Harassment' },
              { label: 'Spam/Bots', value: 'Spam/Bots' },
              { label: 'Suspicious Activity', value: 'Suspicious Activity' },
              { label: 'Safety Concern', value: 'Safety Concern' },
            ]
          }
        ]}
        bulkActions={[
          {
            label: 'Mark Resolved',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            variant: 'success',
            action: (ids) => {
              ids.forEach(id => resolveReport(id, 'Bulk resolved'));
            }
          },
          {
            label: 'Dismiss (False Alarm)',
            variant: 'default',
            action: (ids) => {
              ids.forEach(id => dismissReport(id));
            }
          }
        ]}
      />

      {/* DETAILED INVESTIGATION MODAL */}
      {selectedReport && (
        <AdminModal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title={`Investigation: ${selectedReport.id}`}
          subtitle={`Filed ${selectedReport.createdAt} · Priority: ${selectedReport.priority}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Top Incident Summary */}
            <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-lg uppercase">
                    {selectedReport.type}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">Status: {selectedReport.status}</span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 mt-2">{selectedReport.description}</h3>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedReport.assignedAdmin || 'Unassigned'}
                  onChange={(e) => assignReport(selectedReport.id, e.target.value)}
                  className="bg-white border border-zinc-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  <option value="Alex Johnson">Assign: Alex Johnson</option>
                  <option value="Sarah M.">Assign: Sarah M.</option>
                </select>
              </div>
            </div>

            {/* Evidence & Details */}
            {selectedReport.evidenceText && (
              <div>
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Submitted Evidence & User Context</h4>
                <div className="p-4 bg-white rounded-2xl border border-zinc-200 text-xs font-medium text-zinc-800 leading-relaxed">
                  {selectedReport.evidenceText}
                </div>
              </div>
            )}

            {/* Involved Parties Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reported Account */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Reported Account</span>
                <div className="flex items-center gap-3 mt-2">
                  <img src={selectedReport.reportedUserAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{selectedReport.reportedUserName}</p>
                    <p className="text-[11px] text-zinc-400">Account ID: {selectedReport.reportedUserId}</p>
                  </div>
                </div>
              </div>

              {/* Reporter */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Reporting User</span>
                <div className="flex items-center gap-3 mt-2">
                  <img src={selectedReport.reporterAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{selectedReport.reporterName}</p>
                    <p className="text-[11px] text-zinc-400">Account ID: {selectedReport.reporterId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Internal Notes History */}
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Investigation Notes & Logs</h4>
              <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                {selectedReport.adminNotes && selectedReport.adminNotes.length > 0 ? (
                  selectedReport.adminNotes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-zinc-50 rounded-xl text-xs text-zinc-700 font-medium border border-zinc-100">
                      {note}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">No notes added yet.</p>
                )}
              </div>

              {/* Add Note Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  placeholder="Add internal note to this report..."
                  className="flex-1 px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newAdminNote.trim()}
                  className="px-3.5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 disabled:opacity-40"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Moderation Actions Bar */}
            <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalType('dismiss')}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Dismiss (False Alarm)
                </button>
                <button
                  onClick={() => setModalType('escalate')}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Escalate to Super Admin
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalType('banReported')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Ban Reported User
                </button>
                <button
                  onClick={() => setModalType('resolve')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* CONFIRMATION: RESOLVE MODAL */}
      <AdminModal
        isOpen={modalType === 'resolve'}
        onClose={() => setModalType(null)}
        title="Resolve Incident Report"
        subtitle="Mark this safety report as investigated and resolved."
        variant="success"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Resolution Summary
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Warning issued to user, content removed, no further action required..."
              rows={3}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
              onClick={handleConfirmResolve}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-colors shadow-sm"
            >
              Confirm Resolution
            </button>
          </div>
        </div>
      </AdminModal>

      {/* CONFIRMATION: BAN REPORTED */}
      <AdminModal
        isOpen={modalType === 'banReported'}
        onClose={() => setModalType(null)}
        title={`Ban Reported User (${selectedReport?.reportedUserName})?`}
        subtitle="This will immediately ban the account and close this incident report."
        variant="danger"
      >
        <div className="flex items-center justify-end gap-2.5 pt-4">
          <button
            onClick={() => setModalType(null)}
            className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBanReported}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-colors shadow-sm"
          >
            Confirm Ban & Close
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
