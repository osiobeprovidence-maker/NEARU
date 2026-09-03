import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  Crown, 
  Bell, 
  Lock, 
  ShieldAlert, 
  FileText, 
  Sliders, 
  LayoutDashboard,
  Edit3,
  BadgeCheck,
  LifeBuoy,
  Download,
  BellRing,
  Building2,
  Store,
  User as UserIcon,
  Tag,
  Compass,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import { usePwaInstall } from '../hooks/usePwaInstall';

const SUPER_ADMIN_EMAIL = 'osiobeprovidence@gmail.com';

export default function Settings() {
  const { logout, user, convexUserId, persistProfile, isPro, setAccountType } = useAuth();
  const navigate = useNavigate();
  const isAdmin =
    user.email === SUPER_ADMIN_EMAIL ||
    (user as any).role === 'super_admin' ||
    (user as any).role === 'admin';
  const { isInstallable, install } = usePwaInstall();
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  // Account type state
  const [orgName, setOrgName] = useState(user.organizationName || '');
  const [pendingType, setPendingType] = useState<'organization' | 'business' | null>(null);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (title: string, subtitle: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));

  const accountTypes: {
    key: 'personal' | 'organization' | 'business';
    label: string;
    desc: string;
    icon: any;
    needsPro: boolean;
  }[] = [
    { key: 'personal', label: 'Personal', desc: 'A standard personal profile for yourself.', icon: UserIcon, needsPro: false },
    { key: 'organization', label: 'Organization', desc: 'Manage events, RALLYs and posts as an organization.', icon: Building2, needsPro: true },
    { key: 'business', label: 'Business', desc: 'Promote a business and run events & offers.', icon: Store, needsPro: true },
  ];

  const currentType = user.accountType || 'personal';

  const requestType = async (key: 'personal' | 'organization' | 'business') => {
    const t = accountTypes.find((a) => a.key === key)!;
    if (t.needsPro && !isPro) {
      showToast('lalao Pro required', 'Upgrade to create an Organization or Business account.');
      navigate('/plus');
      return;
    }
    if (key === 'personal') {
      await apply(key);
    } else {
      setOrgName(user.organizationName || user.name || '');
      setPendingType(key);
      setOrgModalOpen(true);
    }
  };

  const apply = async (key: 'personal' | 'organization' | 'business', name?: string) => {
    setSaving(true);
    try {
      await setAccountType(key, name);
      showToast('Account type updated', accountTypes.find((a) => a.key === key)?.label || '');
      setOrgModalOpen(false);
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not update account type.');
    } finally {
      setSaving(false);
      setOrgModalOpen(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      setNotifStatus('Notifications not supported on this device');
      setTimeout(() => setNotifStatus(null), 3000);
      return;
    }
    if (Notification.permission === 'granted') {
      setNotifStatus('Notifications already enabled');
      setTimeout(() => setNotifStatus(null), 3000);
      return;
    }
    if (Notification.permission === 'denied') {
      setNotifStatus('Notifications blocked. Enable in browser settings.');
      setTimeout(() => setNotifStatus(null), 4000);
      return;
    }
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setNotifStatus('Notifications enabled!');
    } else {
      setNotifStatus('Permission denied');
    }
    setTimeout(() => setNotifStatus(null), 3000);
  };

  return (
    <PageShell 
      title="Settings" 
      subtitle="Manage your profile, preferences, events and safety controls"
    >
      <div className="space-y-6 max-w-2xl mx-auto pb-16">
        
        {/* ================================================================= */}
        {/* 1. PROFILE / PERSONAL INFORMATION                                  */}
        {/* ================================================================= */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
            Profile / Personal Information
          </h3>
          <div className="bg-white md:rounded-3xl border-y md:border border-zinc-200 shadow-sm divide-y divide-zinc-100 overflow-hidden">
            
            {/* Identity Card */}
            <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50/60 transition-colors">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="relative shrink-0">
                  <Avatar 
                    src={user.avatar} 
                    name={user.name} 
                    size="lg"
                    className="border-2 border-white shadow-xs ring-1 ring-zinc-200"
                  />
                  {user.isNINVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-xs">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h2 className="font-black text-zinc-900 text-base sm:text-lg truncate">{user.name}</h2>
                    {user.isNINVerified && (
                      <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ring-1 ring-emerald-200 shrink-0">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-semibold truncate">
                    {user.username ? `@${user.username}` : ''} {user.location ? `· ${user.location}` : ''}
                  </p>
                </div>
              </div>

              <Link
                to="/settings/personal-info"
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ml-3 active:scale-95 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
            </div>

            {/* Edit Profile Information */}
            <Link
              to="/settings/personal-info"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 border border-zinc-200/50">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    Edit Profile Information
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    Update your photo, name, bio, phone, and gender
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* View Public Profile */}
            {convexUserId && (
              <Link
                to={`/user/${convexUserId}`}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                      View Public Profile
                    </p>
                    <p className="text-[11px] text-zinc-500 font-medium truncate">
                      See how your profile appears to other neighbors
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            )}

            {/* Show interests on profile toggle */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Show interests on profile</p>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Display your selected interest tags publicly on your profile
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={user.showInterests !== false}
                  onChange={(e) => persistProfile({ showInterests: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. RALLYS / EVENTS                                                 */}
        {/* ================================================================= */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
            RALLYS / Events
          </h3>
          <div className="bg-white md:rounded-3xl border-y md:border border-zinc-200 shadow-sm divide-y divide-zinc-100 overflow-hidden">
            
            {/* My RALLYS */}
            <Link
              to="/my-rallys"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    My RALLYS
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    View created, interested, and participating RALLYS
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* Manage Events */}
            <Link
              to="/manage"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                      Manage Events
                    </p>
                    {isPro && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200 shrink-0 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" /> Pro
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    Organize schedules, ticketing, announcements & check-ins
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* RALLY+ Premium */}
            <Link
              to="/plus"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    RALLY+ Premium
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    Unlimited activity boosts, pro badges & advanced filters
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. VERIFICATION & SAFETY                                           */}
        {/* ================================================================= */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
            Verification & Safety
          </h3>
          <div className="bg-white md:rounded-3xl border-y md:border border-zinc-200 shadow-sm divide-y divide-zinc-100 overflow-hidden">
            
            {/* NIN Verification */}
            <Link
              to="/verification"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                      NIN Verification & Badges
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                      user.isNINVerified 
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' 
                        : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                    }`}>
                      {user.isNINVerified ? 'Verified' : 'Get Verified'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    {user.isNINVerified ? 'National ID verified badge active' : 'Verify national identity for verified neighbor trust'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* Safety Center & Emergency Contacts */}
            <Link
              to="/safety"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    Safety Center & Emergency Contacts
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    Emergency hotlines, trusted contacts & safety guidelines
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* Privacy & Safety Settings */}
            <Link
              to="/settings/privacy"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    Privacy Controls
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    Location precision, profile visibility & blocked neighbors
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. ACCOUNT / ACCOUNT TYPE                                         */}
        {/* ================================================================= */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
            Account / Account Type
          </h3>
          <div className="bg-white md:rounded-3xl border-y md:border border-zinc-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-500" />
              <h4 className="font-black text-zinc-900 text-sm">Account Mode</h4>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mb-4">
              {isPro
                ? 'Select how you want to act on lalao. You can switch between Personal, Organization or Business.'
                : 'Personal accounts are free. Organizations & Businesses require lalao Pro.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {accountTypes.map((t) => {
                const active = currentType === t.key;
                const locked = t.needsPro && !isPro;
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => requestType(t.key)}
                    className={`text-left rounded-2xl border p-4 transition-all active:scale-98 ${
                      active
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                      active ? 'bg-white/10 text-amber-400' : 'bg-white text-zinc-700 border border-zinc-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`font-bold text-sm flex items-center gap-1.5 ${active ? 'text-white' : 'text-zinc-900'}`}>
                      {t.label}
                      {locked && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {active && (
                        <span className="ml-auto text-[9px] font-bold bg-white/15 px-1.5 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </p>
                    <p className={`text-[11px] font-medium mt-1 leading-snug ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {t.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 5. APP PREFERENCES & SUPPORT                                      */}
        {/* ================================================================= */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
            Preferences & Support
          </h3>
          <div className="bg-white md:rounded-3xl border-y md:border border-zinc-200 shadow-sm divide-y divide-zinc-100 overflow-hidden">
            
            {/* Notification Settings */}
            <Link
              to="/settings/notifications"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    Notification Preferences
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    Push alerts, sound, chat, and RALLY matches
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* Location Settings */}
            <Link
              to="/settings/location"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    Location Settings
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    GPS access, discovery radius & manual location override
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* App Settings */}
            <Link
              to="/settings/app"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 border border-zinc-200/50">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    App Settings
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    Theme, language, data saver & cache storage
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {/* Help & Support */}
            <Link
              to="/settings/help"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    Help & Support
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    FAQs, contact support, community guides & reports
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

          </div>
        </div>

        {/* ================================================================= */}
        {/* 6. LEGAL & ADMINISTRATION                                         */}
        {/* ================================================================= */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
            Legal & Administration
          </h3>
          <div className="bg-white md:rounded-3xl border-y md:border border-zinc-200 shadow-sm divide-y divide-zinc-100 overflow-hidden">
            
            <Link 
              to="/terms"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 border border-zinc-200/40">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-800 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    Terms of Service
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            <Link 
              to="/privacy"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-800 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                    Privacy Policy
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>

            {isAdmin && (
              <Link 
                to="/admin"
                className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                        Admin CRM & Control Panel
                      </p>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 text-white shrink-0">
                        Admin
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            )}

          </div>
        </div>

        {/* ================================================================= */}
        {/* 7. SYSTEM ACTIONS (INSTALL, NOTIFICATIONS, LOGOUT)                */}
        {/* ================================================================= */}
        <div className="pt-2 px-3 sm:px-0 space-y-2">
          {isInstallable && (
            <button 
              onClick={install}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-xs sm:text-sm active:scale-98 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Install lalao</span>
            </button>
          )}

          {('Notification' in window) && Notification.permission !== 'granted' && (
            <button 
              onClick={handleEnableNotifications}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-all font-bold text-xs sm:text-sm active:scale-98"
            >
              <BellRing className="w-4 h-4" />
              <span>Enable Notifications</span>
            </button>
          )}

          {notifStatus && (
            <div className="text-center text-xs font-bold text-zinc-500 py-1">{notifStatus}</div>
          )}

          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-100 hover:bg-red-50 hover:text-red-700 text-zinc-700 rounded-xl transition-all font-bold text-xs sm:text-sm active:scale-98 border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

      </div>

      {/* Organization/Business name modal */}
      {orgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => !saving && setOrgModalOpen(false)}>
          <div
            className="w-full sm:max-w-md bg-white sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-black text-zinc-900 text-lg mb-1">
              {pendingType === 'business' ? 'Business' : 'Organization'} name
            </h3>
            <p className="text-xs text-zinc-500 font-medium mb-4">
              Choose the {pendingType === 'business' ? 'business' : 'organization'} name shown on your profile and events.
            </p>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={user.name || 'Organization name'}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 mb-4"
            />
            <div className="flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setOrgModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-sm hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !orgName.trim()}
                onClick={() => pendingType && apply(pendingType, orgName.trim())}
                className="flex-1 py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
