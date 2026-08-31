import React, { useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { BadgeCheck, Edit3, ChevronRight, MapPin, Tag, Crown, Building2, Store, MoreHorizontal, Share2, Camera, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import CoverBanner, { CoverBannerHandle } from '../components/CoverBanner';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getPublicInterests } from '../lib/utils';

export default function Profile() {
  const { user, convexUserId, persistProfile, isPro, setAccountType, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState(user.organizationName || '');
  const [pendingType, setPendingType] = useState<'organization' | 'business' | null>(null);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const coverRef = useRef<CoverBannerHandle>(null);
  const updateUserMutation = useMutation(api.users.update);

  const showToast = (t: string, s: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: t, subtitle: s } }));

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
      showToast('Account type updated', accountTypes.find((a) => a.key === key)?.label);
      setOrgModalOpen(false);
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not update account type.');
    } finally {
      setSaving(false);
      setOrgModalOpen(false);
    }
  };

  // Live stats derived from actual database records
  const stats = useQuery(
    api.rallies.getProfileStats,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const followerCount = useQuery(
    api.follows.getFollowerCount,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const followingCount = useQuery(
    api.follows.getFollowingCount,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const profile = useQuery(
    api.users.getProfile,
    convexUserId ? { userId: convexUserId as any, viewerId: convexUserId as any } : 'skip'
  );
  const [moreOpen, setMoreOpen] = useState(false);

  const shareProfile = () => {
    const url = `${window.location.origin}/user/${convexUserId}`;
    if (navigator.share) {
      navigator.share({ title: user.name || 'Profile', url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied', 'Profile link copied to clipboard.'));
    }
  };

  const publicInterests = getPublicInterests(user);

  const handleCoverUploaded = async (storageId: string, blobUrl: string) => {
    if (!convexUserId) return;
    try {
      await updateUserMutation({
        userId: convexUserId as any,
        coverImage: storageId,
      });
      updateUser({ coverImage: blobUrl });
      showToast('Cover photo updated', '');
    } catch {
      showToast('Error', 'Could not save cover photo.');
    }
  };

  const coverUrl =
    user.coverImage && /^(https?:|blob:|data:)/.test(user.coverImage)
      ? user.coverImage
      : null;

  // Three distinct stat states: loading (undefined), loaded, or fallback zero
  const posted   = stats?.posted   ?? (stats === undefined ? null : 0);
  const completed = stats?.completed ?? (stats === undefined ? null : 0);
  const rated    = stats?.rated    ?? (stats === undefined ? null : 0);

  return (
    <PageShell title="Profile">
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">

        {/* 1. Identity */}
        <div>
          {/* Cover */}
          <CoverBanner
            ref={coverRef}
            coverImage={coverUrl}
            canEdit
            onCoverUploaded={handleCoverUploaded}
            onError={(msg) => showToast('Error', msg)}
          />

          <div className="px-4 sm:px-6 pb-2">
            {/* Avatar overlapping cover, left-aligned */}
            <div className="relative -mt-10 sm:-mt-14 z-10 w-fit">
              <Avatar
                src={user.avatar}
                name={user.name}
                size="xl"
                className="border-4 border-white shadow-lg"
              />
              <Link
                to="/settings/personal-info"
                className="absolute bottom-0 right-0 p-1.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                title="Change Photo"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-1.5 mt-3 mb-0.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                {user.name}
              </h2>
              {user.isNINVerified && (
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
            </div>
            <p className="text-sm font-semibold text-zinc-400 mb-1">
              {user.username ? `@${user.username}` : ''}
            </p>

            <p className="text-sm text-zinc-700 font-medium leading-relaxed mb-1 max-w-xl">
              {user.bio || 'Always looking for something fun to do.'}
            </p>
          </div>

          {/* Action row */}
          <div className="px-4 sm:px-6 mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/settings/personal-info"
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold inline-flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </Link>
              <button
                onClick={() => coverRef.current?.openPicker()}
                className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-bold inline-flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Camera className="w-4 h-4" /> Edit Cover
              </button>
              <div className="relative ml-auto">
                <button
                  onClick={() => setMoreOpen((o) => !o)}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 inline-flex items-center transition-colors active:scale-95"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-40 w-52 bg-white rounded-2xl shadow-lg border border-zinc-100 overflow-hidden py-1 text-left animate-in fade-in zoom-in-95 duration-150">
                      <Link
                        to={`/user/${convexUserId}`}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-zinc-500" /> View Public Profile
                      </Link>
                      <button
                        onClick={() => { setMoreOpen(false); shareProfile(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-indigo-500" /> Share Profile
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metadata under bio/actions */}
          <div className="px-4 sm:px-6 mt-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 font-medium">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-zinc-400" />
                {user.location || 'Location not set'}
              </span>
              {user.gender && user.gender !== 'Prefer not to say' && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span>{user.gender}</span>
                </>
              )}
            </div>

            {publicInterests.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {publicInterests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold ring-1 ring-inset ring-indigo-100"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-xs font-medium mt-2.5">Add interests to personalize your feed.</p>
            )}
          </div>
        </div>

        {/* Interests visibility toggle */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-900 text-xs sm:text-sm">Show interests on profile</p>
              <p className="text-[11px] text-zinc-500 font-medium">Your interest tags are always used for recommendations, but you control whether they appear publicly.</p>
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

        {/* 2. Statistics — live from DB */}
        <div className="py-4 sm:py-5 px-4 bg-zinc-50/50">
          <div className="grid grid-cols-5 divide-x divide-zinc-200/70 text-center max-w-lg mx-auto">
            <StatCell label="Posted"    value={posted} />
            <StatCell label="Followers" value={followerCount ?? (followerCount === undefined ? null : 0)} />
            <StatCell label="Following" value={followingCount ?? (followingCount === undefined ? null : 0)} />
            <StatCell label="Rated"     value={rated} amber />
            <StatCell label="Done"      value={completed} />
          </div>
        </div>

        {/* Public profile + navigation */}
        <div>
          <Link
            to={`/user/${convexUserId}`}
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group"
          >
            <span>View Public Profile</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            to="/settings/personal-info"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group"
          >
            <span>Edit Profile Information</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            to="/my-rallys"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
          >
            <span>My RALLYS</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          {isPro && (
            <Link
              to="/my-rallys"
              className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
            >
              <span className="flex items-center gap-2">
                Manage Events
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}
          <Link
            to="/verification"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
          >
            <span>NIN Verification & Badges</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            to="/safety"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
          >
            <span>Safety Center & Emergency Contacts</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Account Type */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-amber-500" />
            <h3 className="font-black text-zinc-900 text-sm">Account Type</h3>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mb-4">
            {isPro
              ? 'You can act as a Personal, Organization or Business account.'
              : 'Organizations & Businesses require lalao Pro.'}
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
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    active
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${active ? 'bg-white/10 text-amber-400' : 'bg-zinc-100 text-zinc-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className={`font-bold text-sm flex items-center gap-1 ${active ? 'text-white' : 'text-zinc-900'}`}>
                    {t.label}
                    {locked && <Crown className="w-3 h-3 text-amber-500" />}
                    {active && <span className="ml-auto text-[9px] font-bold bg-white/15 px-1.5 py-0.5 rounded-full">Active</span>}
                  </p>
                  <p className={`text-[11px] font-medium mt-0.5 ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {orgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => !saving && setOrgModalOpen(false)}>
          <div
            className="w-full sm:max-w-md bg-white sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl"
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

// ---------------------------------------------------------------------------
// Stat cell: shows "…" while loading, real number when ready, "0" as a valid state
// ---------------------------------------------------------------------------
function StatCell({
  label,
  value,
  amber = false,
}: {
  label: string;
  value: number | null;
  amber?: boolean;
}) {
  return (
    <div className="px-2">
      <div
        className={`text-xl sm:text-2xl font-black ${
          amber ? 'text-amber-500' : 'text-zinc-900'
        }`}
      >
        {value === null ? (
          <span className="text-zinc-300 text-lg">…</span>
        ) : (
          value
        )}
      </div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}
