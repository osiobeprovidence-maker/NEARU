import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BadgeCheck,
  RefreshCw,
  Eye,
  Search,
  Banknote,
  Landmark,
  Wallet,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  Loader2,
  Fingerprint,
} from 'lucide-react';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { cn } from '../../lib/utils';
import {
  AdminVerificationTx,
  AdminVerificationReport,
  getAdminVerifications,
  getAdminVerificationReport,
  formatNaira,
  formatDate,
  getPaymentStatusLabel,
  getVerificationStatusLabel,
} from '../../lib/adminVerification';

type FilterKey =
  | 'ALL'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'FAILED'
  | 'VERIFICATION_FAILED'
  | 'PROVIDER_ERROR';

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PAYMENT_PENDING', label: 'Payment Pending' },
  { id: 'PAYMENT_SUCCESS', label: 'Paid' },
  { id: 'VERIFICATION_PENDING', label: 'Verification Pending' },
  { id: 'VERIFIED', label: 'Verified' },
  { id: 'VERIFICATION_FAILED', label: 'Verification Failed' },
  { id: 'PROVIDER_ERROR', label: 'Provider Error' },
];

function filterMatches(tx: AdminVerificationTx, filter: FilterKey): boolean {
  switch (filter) {
    case 'ALL': return true;
    case 'PAYMENT_PENDING': return tx.paymentStatus === 'PAYMENT_PENDING';
    case 'PAYMENT_SUCCESS': return tx.paymentStatus === 'PAYMENT_SUCCESS';
    case 'VERIFICATION_PENDING':
      return tx.paymentStatus === 'PAYMENT_SUCCESS' && tx.verificationStatus === 'VERIFICATION_PENDING';
    case 'VERIFIED': return tx.verificationStatus === 'VERIFIED';
    case 'VERIFICATION_FAILED': return tx.verificationStatus === 'VERIFICATION_FAILED';
    case 'PROVIDER_ERROR': return tx.verificationStatus === 'PROVIDER_ERROR';
    default: return true;
  }
}

function statusPill(paymentStatus: string, verificationStatus: string) {
  // Primary status shown to admins: prefer verification outcome once paid.
  if (verificationStatus === 'VERIFIED') {
    return { label: 'Verified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (verificationStatus === 'VERIFICATION_FAILED') {
    return { label: 'Verification Failed', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (verificationStatus === 'PROVIDER_ERROR') {
    return { label: 'Provider Error', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (paymentStatus === 'PAYMENT_SUCCESS') {
    return { label: 'Paid · Verifying', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  }
  if (paymentStatus === 'PAYMENT_FAILED') {
    return { label: 'Payment Failed', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  return { label: 'Payment Initialised', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
}

export default function AdminVerificationPage() {
  const [verifications, setVerifications] = useState<AdminVerificationTx[]>([]);
  const [report, setReport] = useState<AdminVerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [selected, setSelected] = useState<AdminVerificationTx | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, reportRes] = await Promise.all([
        getAdminVerifications(),
        getAdminVerificationReport(),
      ]);
      setVerifications(listRes.verifications || []);
      setReport(reportRes.report);
    } catch (err: any) {
      setError(err.message || 'Could not load verification records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredList = useMemo(
    () => verifications.filter((v) => filterMatches(v, filter)),
    [verifications, filter]
  );

  const stats = useMemo(() => {
    const paid = verifications.filter((v) => v.paymentStatus === 'PAYMENT_SUCCESS').length;
    const verified = verifications.filter((v) => v.verificationStatus === 'VERIFIED').length;
    const failed = verifications.filter(
      (v) => v.verificationStatus === 'VERIFICATION_FAILED' || v.verificationStatus === 'PROVIDER_ERROR'
    ).length;
    const pendingPayment = verifications.filter((v) => v.paymentStatus === 'PAYMENT_PENDING').length;
    return { paid, verified, failed, pendingPayment };
  }, [verifications]);

  const columns: Column<AdminVerificationTx>[] = [
    {
      key: 'transactionId',
      header: 'Transaction',
      render: (v) => (
        <div className="min-w-0">
          <span className="font-bold text-zinc-900 block truncate text-xs">{v.transactionId}</span>
          <span className="text-[11px] text-zinc-400 font-medium">{v.type || 'NIN_VERIFICATION'}</span>
        </div>
      ),
    },
    {
      key: 'paymentReference',
      header: 'Payment Ref',
      render: (v) => (
        <span className="font-mono text-xs font-bold text-zinc-700">{v.paymentReference}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (v) => (
        <span className="text-xs font-black text-zinc-900">{formatNaira(v.amount)}</span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      sortable: true,
      render: (v) => (
        <span className={cn(
          "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block whitespace-nowrap",
          v.paymentStatus === 'PAYMENT_SUCCESS' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
          v.paymentStatus === 'PAYMENT_FAILED' ? "bg-rose-50 text-rose-700 border border-rose-200" :
          "bg-zinc-100 text-zinc-600 border border-zinc-200"
        )}>
          {getPaymentStatusLabel(v.paymentStatus)}
        </span>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Verification',
      sortable: true,
      render: (v) => {
        const pill = statusPill(v.paymentStatus, v.verificationStatus);
        return (
          <span className={cn(
            "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border inline-block whitespace-nowrap",
            pill.cls
          )}>
            {pill.label}
          </span>
        );
      },
    },
    {
      key: 'ninHashMasked',
      header: 'NIN (masked)',
      render: (v) => (
        <span className="font-mono text-xs font-bold text-zinc-500">{v.ninHashMasked || '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">{formatDate(v.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (v) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelected(v); }}
          className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          title="View details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Identity Verification</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
            Paid NIN verification transactions from the live backend.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Report / Overview */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900 text-white">
            <div className="flex items-center gap-2 text-white/70">
              <Banknote className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin</span>
            </div>
            <p className="text-xl sm:text-2xl font-black mt-2">{formatNaira(report.grossMargin, true)}</p>
            <p className="text-[10px] text-white/50 font-medium mt-1">Est. · {report.unit}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700">
              <Wallet className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Revenue</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-2">{formatNaira(report.totalRevenue, true)}</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-1">{report.totalSuccessfulPayments} payments</p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-2 text-zinc-700">
              <Landmark className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Provider Cost</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-zinc-900 mt-2">{formatNaira(report.totalProviderCost, true)}</p>
            <p className="text-[10px] font-bold text-zinc-500 mt-1">Ninja verification</p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
            <div className="flex items-center gap-2 text-indigo-700">
              <BadgeCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-indigo-900 mt-2">{report.totalSuccessfulVerifications}</p>
            <p className="text-[10px] font-bold text-indigo-600 mt-1">of {report.totalTransactions} txn</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Failed / Errors</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-rose-900 mt-2">{report.failedVerifications + report.providerErrors}</p>
            <p className="text-[10px] font-bold text-rose-600 mt-1">{report.providerErrors} provider errors</p>
          </div>
        </div>
      )}

      {/* Quick status tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-700">Payment Pending</span>
          <span className="text-lg font-black text-amber-900">{stats.pendingPayment}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-700">Paid</span>
          <span className="text-lg font-black text-indigo-900">{stats.paid}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-700">Verified</span>
          <span className="text-lg font-black text-emerald-900">{stats.verified}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-700">Failed</span>
          <span className="text-lg font-black text-rose-900">{stats.failed}</span>
        </div>
      </div>

      {/* Data table */}
      {loading && verifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-zinc-300" />
          <p className="text-xs font-bold">Loading verification records...</p>
        </div>
      ) : (
        <AdminDataTable
          data={filteredList}
          columns={columns}
          keyExtractor={(v) => v.transactionId}
          searchPlaceholder="Search transaction or payment reference..."
          searchFields={['transactionId', 'paymentReference', 'paystackReference', 'ninHashMasked']}
          exportFileName="verification-transactions"
          onRowClick={(v) => setSelected(v)}
          emptyTitle="No verification transactions"
          emptySubtitle="Paid NIN verification records will appear here once customers go through the flow."
          filters={[
            {
              id: 'status',
              label: 'Status',
              value: filter,
              onChange: (v) => setFilter(v as FilterKey),
              options: FILTERS.map((f) => ({ label: f.label, value: f.id })),
            },
          ]}
        />
      )}

      {/* Detail modal */}
      <AdminModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Verification Transaction"
        subtitle={selected ? `ID: ${selected.transactionId}` : ''}
        maxWidth="2xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase">Overall Status</span>
                  {(() => { const p = statusPill(selected.paymentStatus, selected.verificationStatus); return (
                    <span className={cn("text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border inline-block mt-1", p.cls)}>{p.label}</span>
                  ); })()}
                </div>
              </div>
              <span className="text-2xl font-black text-zinc-900">{formatNaira(selected.amount)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">Payment Status</span>
                <span className="font-bold text-zinc-900 block mt-1">{getPaymentStatusLabel(selected.paymentStatus)}</span>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">Verification Status</span>
                <span className="font-bold text-zinc-900 block mt-1">{getVerificationStatusLabel(selected.verificationStatus)}</span>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">Payment Reference</span>
                <span className="font-mono text-xs font-bold text-zinc-800 block mt-1 break-all">{selected.paymentReference}</span>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">Paystack Reference</span>
                <span className="font-mono text-xs font-bold text-zinc-800 block mt-1 break-all">{selected.paystackReference || '—'}</span>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">Ninja Reference</span>
                <span className="font-mono text-xs font-bold text-zinc-800 block mt-1 break-all">{selected.ninjaReference || '—'}</span>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">NIN (masked)</span>
                <span className="font-mono text-xs font-bold text-zinc-800 block mt-1 break-all">{selected.ninHashMasked || '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Clock className="w-4 h-4 text-zinc-400" />
                <div>
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Created</span>
                  <span className="font-bold text-zinc-900">{formatDate(selected.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Paid</span>
                  <span className="font-bold text-zinc-900">{formatDate(selected.paidAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <BadgeCheck className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Verified</span>
                  <span className="font-bold text-zinc-900">{formatDate(selected.verifiedAt)}</span>
                </div>
              </div>
            </div>

            {selected.failureReason && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-xs text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span><b>Failure reason:</b> {selected.failureReason}</span>
              </div>
            )}

            <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" />
              Raw NIN is never stored; only a masked hash {selected.ninHashMasked ? `(${selected.ninHashMasked})` : ''} is shown.
            </p>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
