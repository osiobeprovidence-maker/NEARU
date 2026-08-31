import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  MapPin, 
  Users, 
  Lock, 
  Database, 
  History, 
  Check, 
  Save, 
  UserPlus, 
  ShieldCheck, 
  AlertTriangle, 
  Globe, 
  Bell, 
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { cn } from '../../lib/utils';

export default function AdminSettings() {
  const { systemSettings, updateSettings, auditLogs, users, showToast, metrics } = useAdmin();
  const [activeTab, setActiveTab] = useState<'general' | 'moderation' | 'location' | 'verification' | 'team' | 'audit'>('general');

  // Local form state
  const [formData, setFormData] = useState({ ...systemSettings });
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'moderator' | 'admin' | 'support'>('moderator');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Keep the form in sync with backend-persisted settings once they load.
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      platformName: systemSettings.platformName,
      defaultRadiusKm: systemSettings.defaultRadiusKm,
      supportedCities: systemSettings.supportedCities,
    }));
  }, [systemSettings.platformName, systemSettings.defaultRadiusKm, systemSettings.supportedCities]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      platformName: formData.platformName,
      defaultRadiusKm: formData.defaultRadiusKm,
      supportedCities: formData.supportedCities,
    });
  };

  const adminTeamMembers = users.filter(u => u.role !== 'user');

  const auditColumns: Column<any>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (a) => (
        <span className="text-xs font-mono text-zinc-500">{a.timestamp}</span>
      ),
    },
    {
      key: 'adminName',
      header: 'Admin Member',
      sortable: true,
      render: (a) => (
        <span className="text-xs font-bold text-zinc-900">{a.adminName}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action Executed',
      sortable: true,
      render: (a) => (
        <span className="text-xs font-black uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800">
          {(a.action || '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Target Entity',
      render: (a) => (
        <span className="text-xs text-zinc-700 font-medium">
          {[a.targetType, a.targetId].filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      sortable: true,
      render: (a) => (
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
          {a.result || 'SUCCESS'}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Details & Reason',
      render: (a) => (
        <span className="text-xs text-zinc-500 font-medium line-clamp-1">{a.details || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">System Settings & Governance</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
            Configure platform policies, moderation rules, supported locations, team permissions, and audit trails.
          </p>
        </div>

        {activeTab !== 'audit' && activeTab !== 'team' && (
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-all shadow-sm self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto custom-scrollbar">
        {[
          { id: 'general', label: 'General' },
          { id: 'moderation', label: 'Content Moderation' },
          { id: 'location', label: 'Geofencing & Cities' },
          { id: 'verification', label: 'NIN & Safety' },
          { id: 'team', label: 'Admin Team' },
          { id: 'audit', label: 'Audit Trail' },
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

      {/* Tab Panels */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs space-y-6">
          <h3 className="text-lg font-black text-zinc-900">General Platform Configuration</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Support Inquiries Email
              </label>
              <input
                type="email"
                disabled
                value={formData.supportEmail}
                placeholder="chronicled-when-applied"
                className="w-full p-3 bg-zinc-100 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium opacity-60 cursor-not-allowed"
              />
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Managed by the platform backend — not editable here.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Default Feed Discovery Radius (Kilometers)
              </label>
              <input
                type="number"
                value={formData.defaultRadiusKm}
                onChange={(e) => setFormData({ ...formData, defaultRadiusKm: Number(e.target.value) })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Max Concurrent Live RALLYS Per User
              </label>
              <input
                type="number"
                disabled
                value={formData.maxRalliesPerUser || ''}
                placeholder="Enforced by app logic"
                className="w-full p-3 bg-zinc-100 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium opacity-60 cursor-not-allowed"
              />
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Managed by the platform backend — not editable here.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs space-y-6">
          <h3 className="text-lg font-black text-zinc-900">Safety & Content Moderation Policies</h3>
          <p className="text-xs text-zinc-500 font-medium">These automatic policies are enforced server-side by the lalao backend.</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div>
                <h4 className="text-xs font-black text-zinc-900">Auto-approve new RALLYS</h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">New posts go live immediately or require admin review.</p>
              </div>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">BACKEND-MANAGED</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div>
                <h4 className="text-xs font-black text-zinc-900">Require email verification</h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Accounts must confirm their email before posting.</p>
              </div>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">BACKEND-MANAGED</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div>
                <h4 className="text-xs font-black text-zinc-900">Auto-verify phone numbers</h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Phone verification outcomes feed into reputation scoring.</p>
              </div>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">BACKEND-MANAGED</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div>
                <h4 className="text-xs font-black text-zinc-900">Maintenance mode</h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Global read-only lockdown during deploys.</p>
              </div>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">BACKEND-MANAGED</span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                Moderation flags, report thresholds and scam filters are handled by the moderation pipeline
                (reports, rally FLAG/HIDE/REMOVE and user ban/suspend actions from this CRM).
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'location' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs space-y-6">
          <h3 className="text-lg font-black text-zinc-900">Active Geofenced Cities</h3>
          <p className="text-xs text-zinc-500 font-medium">Metropolitan areas with dedicated discovery nodes</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.supportedCities?.map((city, idx) => (
              <div key={city} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-zinc-900">{city}</span>
                </div>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs space-y-6">
          <h3 className="text-lg font-black text-zinc-900">NIN Provider API Integration</h3>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <h4 className="text-xs font-black text-emerald-900">NIMC Identity Gateway</h4>
                <p className="text-[11px] text-emerald-700 font-medium">Verification runs through the provider — the CRM never overwrites outcomes.</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-800 bg-white px-3 py-1 rounded-xl shadow-2xs">ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Total Submissions</span>
              <p className="text-2xl font-black text-zinc-900 mt-1">{metrics?.totalVerifications ?? 0}</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Pending Review</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{metrics?.pendingVerifications ?? 0}</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Verified Today</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{metrics?.todayApprovedVerifications ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-zinc-900">Administrative Team Directory</h3>
              <p className="text-xs text-zinc-500 font-medium">Staff with elevated dashboard and moderation privileges</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminTeamMembers.map((member) => (
              <div key={member.id} className="p-5 bg-white rounded-3xl border border-zinc-200 shadow-xs flex items-center gap-4">
                <img src={member.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-zinc-200" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-zinc-900 truncate">{member.name}</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium truncate">{member.email}</p>
                  <span className="inline-block mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {member.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-black text-zinc-900">Administrative Audit Trail</h3>
            <p className="text-xs text-zinc-500 font-medium">Immutable log of all user bans, content removals, and configuration edits.</p>
          </div>

          <AdminDataTable
            data={auditLogs}
            columns={auditColumns}
            keyExtractor={(a) => a.id}
            searchPlaceholder="Search admin name, action, or target entity..."
            searchFields={['adminName', 'action', 'targetType', 'targetId', 'details']}
            exportFileName="admin-audit-log"
          />
        </div>
      )}

      {/* MODAL: INVITE ADMIN MEMBER */}
      <AdminModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Administrative Member"
        subtitle="Send an invitation link with specified access privileges."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Work Email Address *
            </label>
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="moderator@rallyapp.ng"
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Role & Clearance Level
            </label>
            <select
              value={newAdminRole}
              onChange={(e) => setNewAdminRole(e.target.value as any)}
              className="w-full p-3 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
            >
              <option value="moderator">Content Moderator (Triage posts & reports)</option>
              <option value="support">Support Agent (Reply to user inquiries)</option>
              <option value="admin">Platform Admin (Manage settings & broadcasts)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                showToast('Team invites are provisioned through the auth backend — not sent from the CRM.', 'warning');
                setShowInviteModal(false);
                setNewAdminEmail('');
              }}
              disabled={!newAdminEmail.trim()}
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-colors shadow-sm"
            >
              Dispatch Invitation
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
