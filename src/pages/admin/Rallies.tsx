import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  MapPin, 
  Clock, 
  Users, 
  Flag, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  ChevronDown,
  BadgeCheck,
  Send,
  Trash2,
  EyeOff,
  Check,
  Shield,
  DollarSign,
  Share2,
  Calendar
} from 'lucide-react';
import { useAdmin, AdminRally } from '../../contexts/AdminContext';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { cn } from '../../lib/utils';
import { rallyAccess } from '../../lib/rallyPricing';

export default function AdminRallies() {
  const { 
    rallies, 
    approveRally, 
    hideRally, 
    removeRally, 
    flagRally,
    sendBroadcast,
    loading 
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'FLAGGED' | 'REPORTED' | 'REMOVED' | 'APPROVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Selected rally for detailed moderation view / drawer
  const [selectedRally, setSelectedRally] = useState<AdminRally | null>(null);

  // Action Modals
  const [actionRally, setActionRally] = useState<AdminRally | null>(null);
  const [modalType, setModalType] = useState<'remove' | 'hide' | 'flag' | 'contact' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Filtered Rallies
  const filteredRallies = useMemo(() => {
    return rallies.filter((r) => {
      if (activeTab === 'PENDING' && r.moderationStatus !== 'PENDING') return false;
      if (activeTab === 'FLAGGED' && r.moderationStatus !== 'FLAGGED') return false;
      if (activeTab === 'REPORTED' && r.reportsCount === 0) return false;
      if (activeTab === 'REMOVED' && r.moderationStatus !== 'REMOVED' && r.moderationStatus !== 'HIDDEN') return false;
      if (activeTab === 'APPROVED' && r.moderationStatus !== 'APPROVED') return false;

      if (categoryFilter !== 'ALL' && r.type !== categoryFilter) return false;
      if (cityFilter !== 'ALL' && r.city !== cityFilter) return false;

      return true;
    });
  }, [rallies, activeTab, categoryFilter, cityFilter]);

  const handleConfirmRemove = () => {
    if (!actionRally) return;
    removeRally(actionRally.id, actionReason || 'Violates community guidelines');
    setModalType(null);
    setActionRally(null);
    setActionReason('');
    if (selectedRally?.id === actionRally.id) {
      setSelectedRally(prev => prev ? { ...prev, moderationStatus: 'REMOVED' } : null);
    }
  };

  const handleConfirmHide = () => {
    if (!actionRally) return;
    hideRally(actionRally.id, actionReason || 'Temporarily hidden by moderation');
    setModalType(null);
    setActionRally(null);
    setActionReason('');
    if (selectedRally?.id === actionRally.id) {
      setSelectedRally(prev => prev ? { ...prev, moderationStatus: 'HIDDEN' } : null);
    }
  };

  const handleConfirmFlag = () => {
    if (!actionRally) return;
    flagRally(actionRally.id, actionReason || 'Flagged for investigation');
    setModalType(null);
    setActionRally(null);
    setActionReason('');
    if (selectedRally?.id === actionRally.id) {
      setSelectedRally(prev => prev ? { ...prev, moderationStatus: 'FLAGGED' } : null);
    }
  };

  const handleSendCreatorMessage = () => {
    if (!actionRally || !contactMessage.trim()) return;
    sendBroadcast({
      title: `Moderation Note: "${actionRally.title}"`,
      message: contactMessage,
      audience: 'SPECIFIC',
      targetUserId: actionRally.creator.id,
      type: 'MODERATION'
    });
    setModalType(null);
    setActionRally(null);
    setContactMessage('');
  };

  // Table Columns
  const columns: Column<AdminRally>[] = [
    {
      key: 'title',
      header: 'RALLY Post',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs",
            r.type === 'HELP' ? "bg-emerald-100 text-emerald-800" :
            r.type === 'ASK' ? "bg-rose-100 text-rose-800" :
            "bg-indigo-100 text-indigo-800"
          )}>
            {r.type}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900 truncate">{r.title}</span>
              {(() => {
                const a = rallyAccess(r);
                if (a.kind === 'none') return null;
                return (
                  <span
                    className={cn(
                      'text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0',
                      a.kind === 'paid'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    )}
                  >
                    {a.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-[11px] text-zinc-500 font-medium line-clamp-1 mt-0.5">{r.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'creator',
      header: 'Creator',
      render: (r) => (
        <div className="flex items-center gap-2">
          <img src={r.creator.avatar} alt={r.creator.name} className="w-6 h-6 rounded-full object-cover" />
          <span className="text-xs font-bold text-zinc-800 truncate">{r.creator.name}</span>
          {r.creator.isNINVerified && (
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      sortable: true,
      render: (r) => (
        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold">
          {r.city}
        </span>
      ),
    },
    {
      key: 'peopleInterested',
      header: 'Participants',
      sortable: true,
      render: (r) => (
        <div className="text-xs font-medium text-zinc-700">
          <strong className="text-zinc-900">{r.peopleInterested}</strong> / {r.peopleNeeded} needed
        </div>
      ),
    },
    {
      key: 'reportsCount',
      header: 'Reports',
      sortable: true,
      render: (r) => (
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-full",
          r.reportsCount > 0 
            ? "bg-rose-100 text-rose-700 font-black border border-rose-200" 
            : "text-zinc-400"
        )}>
          {r.reportsCount}
        </span>
      ),
    },
    {
      key: 'moderationStatus',
      header: 'Moderation Status',
      sortable: true,
      render: (r) => (
        <span className={cn(
          "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
          r.moderationStatus === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
          r.moderationStatus === 'PENDING' ? "bg-amber-50 text-amber-700 border border-amber-200" :
          r.moderationStatus === 'FLAGGED' ? "bg-rose-50 text-rose-700 border border-rose-200" :
          r.moderationStatus === 'HIDDEN' ? "bg-zinc-100 text-zinc-700 border border-zinc-200" :
          "bg-rose-900 text-white"
        )}>
          {r.moderationStatus}
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
            onClick={() => setSelectedRally(r)}
            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Inspect RALLY Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {r.moderationStatus !== 'APPROVED' && (
            <button
              onClick={() => approveRally(r.id)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              title="Approve Post"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {r.moderationStatus !== 'HIDDEN' && (
            <button
              onClick={() => {
                setActionRally(r);
                setActionReason('');
                setModalType('hide');
              }}
              className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
              title="Hide from Feed"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}
          {r.moderationStatus !== 'REMOVED' && (
            <button
              onClick={() => {
                setActionRally(r);
                setActionReason('');
                setModalType('remove');
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Remove Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">RALLY Moderation</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
            Review live neighborhood postings, triage reported content, and enforce safety guidelines.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(
        "flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto custom-scrollbar",
        loading && "pointer-events-none opacity-60"
      )}>
        {[
          { id: 'ALL', label: 'All Posts' },
          { id: 'PENDING', label: 'Pending Review' },
          { id: 'FLAGGED', label: 'Flagged' },
          { id: 'REPORTED', label: 'Reported' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'REMOVED', label: 'Removed / Hidden' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-2xs font-black"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <AdminDataTable
        data={filteredRallies}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Search RALLY title, description, or creator..."
        searchFields={['title', 'description', 'city']}
        exportFileName="rally-moderation"
        onRowClick={(r) => setSelectedRally(r)}
        emptyTitle={loading ? "Loading RALLYS..." : "No RALLYS found"}
        emptySubtitle={loading ? "Fetching live posts from the platform." : "No posts match the current moderation filter."}
        filters={[
          {
            id: 'category',
            label: 'Category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'All Categories', value: 'ALL' },
              { label: 'ASK', value: 'ASK' },
              { label: 'HELP', value: 'HELP' },
              { label: 'JOIN', value: 'JOIN' },
            ]
          },
          {
            id: 'city',
            label: 'City',
            value: cityFilter,
            onChange: setCityFilter,
            options: [
              { label: 'All Cities', value: 'ALL' },
              { label: 'Lagos', value: 'Lagos' },
              { label: 'Abuja', value: 'Abuja' },
              { label: 'Port Harcourt', value: 'Port Harcourt' },
            ]
          }
        ]}
        bulkActions={[
          {
            label: 'Approve Selected',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            variant: 'success',
            action: (ids) => {
              ids.forEach(id => approveRally(id));
            }
          },
          {
            label: 'Remove Selected',
            icon: <Trash2 className="w-3.5 h-3.5" />,
            variant: 'danger',
            action: (ids) => {
              ids.forEach(id => removeRally(id, 'Bulk moderation removal'));
            }
          }
        ]}
      />

      {/* DETAILED RALLY MODERATION DRAWER / MODAL */}
      {selectedRally && (
        <AdminModal
          isOpen={Boolean(selectedRally)}
          onClose={() => setSelectedRally(null)}
          title="RALLY Moderation Inspection"
          subtitle={`Post ID: ${selectedRally.id} · Created ${selectedRally.createdAt ? new Date(selectedRally.createdAt).toLocaleDateString() : 'Recently'}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header / Type Banner */}
            <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm",
                  selectedRally.type === 'HELP' ? "bg-emerald-100 text-emerald-800" :
                  selectedRally.type === 'ASK' ? "bg-rose-100 text-rose-800" :
                  "bg-indigo-100 text-indigo-800"
                )}>
                  {selectedRally.type}
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900">{selectedRally.title}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{selectedRally.city} · {selectedRally.locationLabel}</p>
                </div>
              </div>

              <span className={cn(
                "text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto",
                selectedRally.moderationStatus === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                selectedRally.moderationStatus === 'PENDING' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                "bg-rose-50 text-rose-700 border border-rose-200"
              )}>
                {selectedRally.moderationStatus}
              </span>
            </div>

            {/* Content Description */}
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Post Description</h4>
              <div className="p-4 bg-white rounded-2xl border border-zinc-200 text-xs sm:text-sm font-medium text-zinc-800 leading-relaxed">
                {selectedRally.description}
              </div>
            </div>

            {/* Creator Information Card */}
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Creator Details</h4>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedRally.creator.avatar} alt={selectedRally.creator.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-zinc-900">{selectedRally.creator.name}</p>
                      {selectedRally.creator.isNINVerified && (
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium">{selectedRally.creator.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActionRally(selectedRally);
                    setContactMessage('');
                    setModalType('contact');
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  Contact Creator
                </button>
              </div>
            </div>

            {/* Flags & Moderation History */}
            {selectedRally.flagReason && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-2 text-rose-800 text-xs font-black uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Flag Reason</span>
                </div>
                <p className="text-xs text-rose-700 font-medium mt-1">{selectedRally.flagReason}</p>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">People Needed</span>
                <p className="text-base font-black text-zinc-900 mt-0.5">{selectedRally.peopleNeeded}</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Interested</span>
                <p className="text-base font-black text-zinc-900 mt-0.5">{selectedRally.peopleInterested}</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Listing Type</span>
                <p className="text-base font-black text-zinc-900 mt-0.5">
                  {rallyAccess(selectedRally).label}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  setActionRally(selectedRally);
                  setActionReason('');
                  setModalType('flag');
                }}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
              >
                Flag for Investigation
              </button>

              <div className="flex items-center gap-2">
                {selectedRally.moderationStatus !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      approveRally(selectedRally.id);
                      setSelectedRally(prev => prev ? { ...prev, moderationStatus: 'APPROVED' } : null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    APPROVE POST
                  </button>
                )}

                {selectedRally.moderationStatus !== 'HIDDEN' && (
                  <button
                    onClick={() => {
                      setActionRally(selectedRally);
                      setActionReason('');
                      setModalType('hide');
                    }}
                    className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    HIDE
                  </button>
                )}

                {selectedRally.moderationStatus !== 'REMOVED' && (
                  <button
                    onClick={() => {
                      setActionRally(selectedRally);
                      setActionReason('');
                      setModalType('remove');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    REMOVE
                  </button>
                )}
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* MODAL: REMOVE RALLY */}
      <AdminModal
        isOpen={modalType === 'remove'}
        onClose={() => setModalType(null)}
        title="Permanently Remove RALLY Post?"
        subtitle="This action will delete the listing from the neighborhood feed and notify the creator."
        variant="danger"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Removal Reason
            </label>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Inappropriate solicitations, financial scam, forbidden goods..."
              rows={3}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
              onClick={handleConfirmRemove}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-colors shadow-sm"
            >
              Confirm Removal
            </button>
          </div>
        </div>
      </AdminModal>

      {/* MODAL: HIDE RALLY */}
      <AdminModal
        isOpen={modalType === 'hide'}
        onClose={() => setModalType(null)}
        title="Hide RALLY Post from Feed?"
        subtitle="Temporarily hide this post while under review."
        variant="warning"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Reason for Hiding
            </label>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Price dispute, verification required before publishing..."
              rows={3}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
              onClick={handleConfirmHide}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-colors shadow-sm"
            >
              Hide Post
            </button>
          </div>
        </div>
      </AdminModal>

      {/* MODAL: FLAG RALLY */}
      <AdminModal
        isOpen={modalType === 'flag'}
        onClose={() => setModalType(null)}
        title="Flag Post for Investigation"
        subtitle="Mark this post for escalated review by safety moderators."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Flag Reason & Internal Notes
            </label>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Suspected duplicate accounts or safety hazard..."
              rows={3}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
              onClick={handleConfirmFlag}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-colors"
            >
              Submit Flag
            </button>
          </div>
        </div>
      </AdminModal>

      {/* MODAL: CONTACT CREATOR */}
      <AdminModal
        isOpen={modalType === 'contact'}
        onClose={() => setModalType(null)}
        title={`Message Creator: ${actionRally?.creator.name}`}
        subtitle={`Regarding listing "${actionRally?.title}"`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Direct Message
            </label>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="e.g. Please update your meeting spot to a public area or clarify pricing..."
              rows={4}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
              onClick={handleSendCreatorMessage}
              disabled={!contactMessage.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-colors"
            >
              Send Notice
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
