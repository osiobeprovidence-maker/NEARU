import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  FileSpreadsheet, 
  Trash2, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  ChevronDown,
  UserPlus,
  BadgeCheck,
  Flag,
  Calendar,
  Send,
  RotateCcw,
  Edit,
  ExternalLink,
  Crown,
  Activity,
  History,
  MessageSquare,
  Shield
} from 'lucide-react';
import { useAdmin, AdminUser } from '../../contexts/AdminContext';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { cn } from '../../lib/utils';

export default function AdminUsers() {
  const { 
    users, 
    verifyUser, 
    suspendUser, 
    banUser, 
    unbanUser, 
    updateUserRole, 
    addUser, 
    sendBroadcast,
    showToast,
    loading,
    userDetails,
    loadUserDetail
  } = useAdmin();

  // Active filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Selected user for detailed view / drawer modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userProfileTab, setUserProfileTab] = useState<'overview' | 'activity' | 'rallies' | 'messages' | 'reports' | 'verification' | 'history'>('overview');

  // Action modals
  const [actionUser, setActionUser] = useState<AdminUser | null>(null);
  const [modalType, setModalType] = useState<'ban' | 'suspend' | 'verify' | 'role' | 'message' | 'addUser' | 'editUser' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('7_days');
  const [selectedRole, setSelectedRole] = useState<AdminUser['role']>('user');
  const [directMessageText, setDirectMessageText] = useState('');

  // Add User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    location: 'Lagos',
    role: 'user' as AdminUser['role'],
    isNINVerified: false,
    bio: '',
  });

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== 'ALL' && u.status !== statusFilter.toLowerCase()) return false;
      if (verificationFilter === 'VERIFIED' && !u.isNINVerified) return false;
      if (verificationFilter === 'UNVERIFIED' && u.isNINVerified) return false;
      if (locationFilter !== 'ALL' && !(u.location || '').toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (roleFilter !== 'ALL' && u.role !== roleFilter.toLowerCase()) return false;
      return true;
    });
  }, [users, statusFilter, verificationFilter, locationFilter, roleFilter]);

  const openUserProfile = (u: AdminUser) => {
    setSelectedUser(u);
    loadUserDetail(u.id);
  };

  // Handle Ban confirmation
  const handleConfirmBan = () => {
    if (!actionUser) return;
    banUser(actionUser.id, actionReason || 'Violation of community safety policy');
    setModalType(null);
    setActionUser(null);
    setActionReason('');
    if (selectedUser?.id === actionUser.id) {
      setSelectedUser(prev => prev ? { ...prev, status: 'banned' } : null);
    }
  };

  // Handle Suspend confirmation
  const handleConfirmSuspend = () => {
    if (!actionUser) return;
    suspendUser(actionUser.id, `${actionReason || 'Policy check'} (Duration: ${actionDuration})`);
    setModalType(null);
    setActionUser(null);
    setActionReason('');
    if (selectedUser?.id === actionUser.id) {
      setSelectedUser(prev => prev ? { ...prev, status: 'suspended' } : null);
    }
  };

  // Handle Role Change confirmation
  const handleConfirmRoleChange = () => {
    if (!actionUser) return;
    updateUserRole(actionUser.id, selectedRole);
    setModalType(null);
    setActionUser(null);
    if (selectedUser?.id === actionUser.id) {
      setSelectedUser(prev => prev ? { ...prev, role: selectedRole } : null);
    }
  };

  // Handle Send Direct Notification
  const handleSendDirectMessage = () => {
    if (!actionUser || !directMessageText.trim()) return;
    sendBroadcast({
      title: `Notice for ${actionUser.name}`,
      message: directMessageText,
      audience: 'SPECIFIC',
      targetUserId: actionUser.id,
      type: 'SYSTEM',
    });
    setModalType(null);
    setActionUser(null);
    setDirectMessageText('');
  };

  // Handle Add User Form Submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;
    addUser({
      ...newUserForm,
      username: newUserForm.username.startsWith('@') ? newUserForm.username : `@${newUserForm.username}`,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(newUserForm.email)}`,
    });
    setModalType(null);
    setNewUserForm({
      name: '',
      username: '',
      email: '',
      phone: '',
      location: 'Lagos',
      role: 'user',
      isNINVerified: false,
      bio: '',
    });
  };

  // Table Columns
  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-2xl object-cover border border-zinc-200" />
            {u.isPlus && (
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5" title="RALLY+ Member">
                <Crown className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-zinc-900 truncate">{u.name}</span>
              {u.isNINVerified && (
                <span title="NIN Verified">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-400 font-medium block truncate">{u.username}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact & Phone',
      render: (u) => (
        <div className="text-xs font-medium">
          <div className="text-zinc-800 truncate">{u.email}</div>
          <div className="text-zinc-400 text-[11px]">{u.phone}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      render: (u) => (
        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold">
          {u.location}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u) => (
        <span className={cn(
          "text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider",
          u.role === 'super_admin' ? "bg-zinc-950 text-white" :
          u.role === 'admin' ? "bg-indigo-100 text-indigo-700" :
          u.role === 'moderator' ? "bg-amber-100 text-amber-800" :
          "bg-zinc-100 text-zinc-600"
        )}>
          {u.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'ralliesCreatedCount',
      header: 'Activity',
      sortable: true,
      render: (u) => (
        <div className="text-xs">
          <span className="font-bold text-zinc-900">{u.ralliesCreatedCount}</span> created ·{' '}
          <span className="text-zinc-500">{u.ralliesJoinedCount} joined</span>
        </div>
      ),
    },
    {
      key: 'reportsReceivedCount',
      header: 'Reports',
      sortable: true,
      render: (u) => (
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-full",
          u.reportsReceivedCount > 0 
            ? "bg-rose-50 text-rose-600 border border-rose-100 font-black" 
            : "text-zinc-400"
        )}>
          {u.reportsReceivedCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u) => (
        <span className={cn(
          "text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
          u.status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
          u.status === 'suspended' ? "bg-amber-50 text-amber-700 border border-amber-200" :
          "bg-rose-50 text-rose-700 border border-rose-200"
        )}>
          {u.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openUserProfile(u)}
            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="View Full Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setActionUser(u);
              setDirectMessageText('');
              setModalType('message');
            }}
            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
          {u.status !== 'banned' ? (
            <button
              onClick={() => {
                setActionUser(u);
                setActionReason('');
                setModalType('ban');
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Ban User"
            >
              <Lock className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => unbanUser(u.id)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              title="Unban User"
            >
              <Unlock className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Title & Add User Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">User Management</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
            Directory of registered accounts, roles, trust scores, and access control.
          </p>
        </div>

        <button
          onClick={() => setModalType('addUser')}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-all shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add / Invite User</span>
        </button>
      </div>

      {/* Main Data Table */}
      <AdminDataTable
        data={filteredUsers}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchPlaceholder="Search by name, username, email, phone, or location..."
        searchFields={['name', 'username', 'email', 'phone', 'location']}
        exportFileName="rally-users"
        onRowClick={(u) => openUserProfile(u)}
        emptyTitle="No users found"
        emptySubtitle="No registered accounts match the current search or filter criteria."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
              { label: 'Banned', value: 'BANNED' },
            ]
          },
          {
            id: 'verification',
            label: 'Verification',
            value: verificationFilter,
            onChange: setVerificationFilter,
            options: [
              { label: 'All Verification', value: 'ALL' },
              { label: 'NIN Verified', value: 'VERIFIED' },
              { label: 'Unverified', value: 'UNVERIFIED' },
            ]
          },
          {
            id: 'location',
            label: 'Location',
            value: locationFilter,
            onChange: setLocationFilter,
            options: [
              { label: 'All Locations', value: 'ALL' },
              { label: 'Lagos', value: 'Lagos' },
              { label: 'Abuja', value: 'Abuja' },
              { label: 'Port Harcourt', value: 'Port Harcourt' },
            ]
          },
          {
            id: 'role',
            label: 'Role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: 'All Roles', value: 'ALL' },
              { label: 'User', value: 'USER' },
              { label: 'Moderator', value: 'MODERATOR' },
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Super Admin', value: 'SUPER_ADMIN' },
            ]
          }
        ]}
        bulkActions={[
          {
            label: 'Verify Selected',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            variant: 'success',
            action: (ids) => {
              ids.forEach(id => verifyUser(id));
            }
          },
          {
            label: 'Suspend Selected',
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            variant: 'danger',
            action: (ids) => {
              ids.forEach(id => suspendUser(id, 'Bulk admin suspension'));
            }
          }
        ]}
      />

      {/* SECTION 5: ADMIN DETAILED USER PROFILE MODAL / DRAWER */}
      {selectedUser && (
        <AdminModal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`User Profile: ${selectedUser.name}`}
          subtitle={`Account ID: ${selectedUser.id} · Joined ${selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString() : '—'}`}
          maxWidth="3xl"
        >
          {(function () {
            const detail = userDetails[selectedUser.id];
            const createdCount = detail?.ralliesCreated ?? selectedUser.ralliesCreatedCount;
            const joinedCount = detail?.ralliesJoined ?? selectedUser.ralliesJoinedCount;
            const reportsReceived = detail?.reportsReceived ?? selectedUser.reportsReceivedCount;
            const totalSpent = detail?.totalSpentNaira ?? selectedUser.totalSpentOrShared;
            const joinedDate = selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString() : '—';

            return (
              <div className="space-y-6">
            {/* Top User Header Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-zinc-50 rounded-3xl border border-zinc-200">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedUser.avatar} 
                  alt={selectedUser.name} 
                  className="w-16 h-16 rounded-3xl object-cover border-2 border-white shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-zinc-900">{selectedUser.name}</h3>
                    {selectedUser.isNINVerified && (
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        NIN Verified
                      </span>
                    )}
                    {selectedUser.isPlus && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        RALLY+
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-zinc-400 mt-0.5">{selectedUser.username} · {selectedUser.email}</p>
                  <p className="text-xs text-zinc-500 font-medium mt-1">{selectedUser.location} · {selectedUser.phone}</p>
                </div>
              </div>

              {/* Status & Trust Score */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-200">
                <span className={cn(
                  "text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider",
                  selectedUser.status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  selectedUser.status === 'suspended' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-rose-50 text-rose-700 border border-rose-200"
                )}>
                  {selectedUser.status}
                </span>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase">Trust Score</span>
                  <span className="text-lg font-black text-indigo-600">{selectedUser.trustScore}/100</span>
                </div>
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">RALLYS Created</span>
                <p className="text-xl font-black text-zinc-900 mt-0.5">{createdCount}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">RALLYS Joined</span>
                <p className="text-xl font-black text-zinc-900 mt-0.5">{joinedCount}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Reports Received</span>
                <p className={cn("text-xl font-black mt-0.5", reportsReceived > 0 ? "text-rose-600" : "text-zinc-900")}>
                  {reportsReceived}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Total Activity</span>
                <p className="text-xl font-black text-zinc-900 mt-0.5">₦{totalSpent.toLocaleString()}</p>
              </div>
            </div>

            {/* Profile Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-zinc-200 pb-1 overflow-x-auto custom-scrollbar">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'activity', label: 'Activity' },
                { id: 'rallies', label: 'RALLYS' },
                { id: 'messages', label: 'Messages' },
                { id: 'reports', label: 'Reports' },
                { id: 'verification', label: 'Verification' },
                { id: 'history', label: 'Account History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setUserProfileTab(tab.id as any)}
                  className={cn(
                    "px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap",
                    userProfileTab === tab.id
                      ? "bg-zinc-900 text-white font-black"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[160px]">
              {userProfileTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider">Bio</h4>
                    <p className="text-zinc-800 font-medium mt-1 leading-relaxed">{selectedUser.bio || 'No bio provided.'}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider">Community Badges</h4>
                    {selectedUser.badges && selectedUser.badges.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {selectedUser.badges.map((badge) => (
                          <span key={badge} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-bold">
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-400 font-medium mt-1">No badges earned yet.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <span className="text-[10px] font-bold text-zinc-400">NIN Number (Masked)</span>
                      <p className="font-mono font-bold text-zinc-800 mt-0.5">
                        {selectedUser.nin ? `•••••••${selectedUser.nin.slice(-4)}` : 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <span className="text-[10px] font-bold text-zinc-400">Last Active Session</span>
                      <p className="font-bold text-zinc-800 mt-0.5">{selectedUser.lastActive || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {userProfileTab === 'activity' && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">Account lifecycle</p>
                      <p className="text-[11px] text-zinc-500">Registered {joinedDate} · Role: {selectedUser.role} · Status: {selectedUser.status}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">Account type</p>
                      <p className="text-[11px] text-zinc-500">{selectedUser.accountType || 'personal'}{selectedUser.organizationName ? ` · ${selectedUser.organizationName}` : ''}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">Relationships</p>
                      <p className="text-[11px] text-zinc-500">{detail?.followersCount ?? 0} followers · {detail?.followingCount ?? 0} following</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">Ratings</p>
                      <p className="text-[11px] text-zinc-500">{detail ? `${(detail.rating ?? 0).toFixed(1)} avg from ${detail.ratingsCount ?? 0} ratings` : 'Loading extended profile…'}</p>
                    </div>
                  </div>
                </div>
              )}

              {userProfileTab === 'rallies' && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">RALLYS Created</p>
                      <p className="text-[11px] text-zinc-500">Posts this member has published on the platform</p>
                    </div>
                    <span className="text-base font-black text-zinc-900">{createdCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">RALLYS Joined</p>
                      <p className="text-[11px] text-zinc-500">Participations in neighbors' posts</p>
                    </div>
                    <span className="text-base font-black text-zinc-900">{joinedCount}</span>
                  </div>
                  {detail && (
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-900">RALLY+ Status</p>
                        <p className="text-[11px] text-zinc-500">{selectedUser.isPlus ? 'Active premium subscriber' : 'Standard member'}</p>
                      </div>
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md", selectedUser.isPlus ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600")}>
                        {selectedUser.isPlus ? 'RALLY+' : 'FREE'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {userProfileTab === 'messages' && (
                <div className="p-6 text-center text-zinc-400 text-xs font-medium bg-zinc-50 rounded-2xl border border-zinc-100">
                  <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  No flagged safety concerns detected in user chat logs.
                </div>
              )}

              {userProfileTab === 'reports' && (
                <div className="text-xs">
                  {reportsReceived > 0 ? (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-rose-700 uppercase tracking-wider text-[10px]">Flagged Reports</span>
                        <span className="text-rose-500 font-bold">{reportsReceived} shown in queue</span>
                      </div>
                      <p className="font-bold text-zinc-900">This account has safety reports filed against it.</p>
                      <p className="text-zinc-600 text-[11px]">Open the Safety Reports module to investigate each case.</p>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      Clean record. Zero safety reports filed against this user.
                    </div>
                  )}
                </div>
              )}

              {userProfileTab === 'verification' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">National Identification Number (NIN)</p>
                      <p className="text-zinc-500 text-[11px] mt-0.5">NIMC Registry Verification Status</p>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-black",
                      selectedUser.isNINVerified ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"
                    )}>
                      {selectedUser.isNINVerified ? 'NIN Verified' : 'Unverified'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-800 font-medium leading-relaxed">
                    Verification is granted by the automated NIMC check through the verification provider — it cannot be granted manually from the CRM.
                  </div>
                </div>
              )}

              {userProfileTab === 'history' && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">Account Created</p>
                      <p className="text-zinc-500 text-[11px]">{joinedDate}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">Moderation Status</p>
                      <p className="text-zinc-500 text-[11px]">Current standing on the platform</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
                      selectedUser.status === 'active' ? "bg-emerald-50 text-emerald-700" :
                      selectedUser.status === 'suspended' ? "bg-amber-50 text-amber-700" :
                      "bg-rose-50 text-rose-700"
                    )}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Action Buttons with Confirmation Dialogs */}
            <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActionUser(selectedUser);
                    setSelectedRole(selectedUser.role);
                    setModalType('role');
                  }}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Change Role
                </button>
                <button
                  onClick={() => {
                    setActionUser(selectedUser);
                    setDirectMessageText('');
                    setModalType('message');
                  }}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Send Alert
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedUser.status === 'active' ? (
                  <button
                    onClick={() => {
                      setActionUser(selectedUser);
                      setActionReason('');
                      setModalType('suspend');
                    }}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      unbanUser(selectedUser.id);
                      setSelectedUser(prev => prev ? { ...prev, status: 'active' } : null);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Restore Account
                  </button>
                )}

                {selectedUser.status !== 'banned' && (
                  <button
                    onClick={() => {
                      setActionUser(selectedUser);
                      setActionReason('');
                      setModalType('ban');
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    Ban Account
                  </button>
                )}
              </div>
            </div>
              </div>
            );
          })()}
        </AdminModal>
      )}

      {/* MODAL: BAN CONFIRMATION */}
      <AdminModal
        isOpen={modalType === 'ban'}
        onClose={() => setModalType(null)}
        title={`Permanently Ban ${actionUser?.name}?`}
        subtitle="This action will immediately disable login, hide all active RALLYS, and restrict platform access."
        variant="danger"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Reason for Ban (Audit Requirement)
            </label>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Confirmed fraudulent behavior, persistent spamming, safety violation..."
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
              onClick={handleConfirmBan}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-colors"
            >
              Confirm Permanent Ban
            </button>
          </div>
        </div>
      </AdminModal>

      {/* MODAL: SUSPEND CONFIRMATION */}
      <AdminModal
        isOpen={modalType === 'suspend'}
        onClose={() => setModalType(null)}
        title={`Suspend Account: ${actionUser?.name}`}
        subtitle="Temporarily pause user posting and joining privileges."
        variant="warning"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Suspension Duration
            </label>
            <select
              value={actionDuration}
              onChange={(e) => setActionDuration(e.target.value)}
              className="w-full p-2.5 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
            >
              <option value="24_hours">24 Hours (Warning)</option>
              <option value="7_days">7 Days (Standard)</option>
              <option value="30_days">30 Days (Extended)</option>
              <option value="indefinite">Indefinite (Pending Investigation)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Reason / Internal Note
            </label>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Explain the cause of temporary suspension..."
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
              onClick={handleConfirmSuspend}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-colors"
            >
              Confirm Suspension
            </button>
          </div>
        </div>
      </AdminModal>

      {/* MODAL: CHANGE ROLE */}
      <AdminModal
        isOpen={modalType === 'role'}
        onClose={() => setModalType(null)}
        title={`Update Role: ${actionUser?.name}`}
        subtitle="Manage access privileges and admin permissions."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Assign Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full p-3 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
            >
              <option value="user">Standard User</option>
              <option value="moderator">Content Moderator</option>
              <option value="support">Support Agent</option>
              <option value="verification_agent">Verification Agent</option>
              <option value="analyst">Data Analyst</option>
              <option value="admin">Platform Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setModalType(null)}
              className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRoleChange}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-colors"
            >
              Save Role
            </button>
          </div>
        </div>
      </AdminModal>

      {/* MODAL: DIRECT NOTIFICATION */}
      <AdminModal
        isOpen={modalType === 'message'}
        onClose={() => setModalType(null)}
        title={`Send Direct Notification to ${actionUser?.name}`}
        subtitle="This message will be delivered directly to the user's mobile app notification tray."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Message Content
            </label>
            <textarea
              value={directMessageText}
              onChange={(e) => setDirectMessageText(e.target.value)}
              placeholder="e.g. Please update your phone number verification to continue posting..."
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
              onClick={handleSendDirectMessage}
              disabled={!directMessageText.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-colors"
            >
              Dispatch Notification
            </button>
          </div>
        </div>
      </AdminModal>

      {/* MODAL: ADD / INVITE USER */}
      <AdminModal
        isOpen={modalType === 'addUser'}
        onClose={() => setModalType(null)}
        title="Add or Invite User"
        subtitle="Create a new user account or administrative team member."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                placeholder="e.g. Chioma Adebayo"
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                placeholder="@chioma"
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="chioma@example.com"
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                placeholder="+234 812 000 0000"
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Location
              </label>
              <select
                value={newUserForm.location}
                onChange={(e) => setNewUserForm({ ...newUserForm, location: e.target.value })}
                className="w-full p-3 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
              >
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Port Harcourt">Port Harcourt</option>
                <option value="Ibadan">Ibadan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Assigned Role
              </label>
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                className="w-full p-3 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support</option>
                <option value="verification_agent">Verification Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isNINVerified"
              checked={newUserForm.isNINVerified}
              onChange={(e) => setNewUserForm({ ...newUserForm, isNINVerified: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
            />
            <label htmlFor="isNINVerified" className="text-xs font-bold text-zinc-700 cursor-pointer">
              Mark NIN identity verification as pre-approved
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-colors shadow-sm"
            >
              Create Account
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
