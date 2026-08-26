import React from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { Settings, BadgeCheck, Edit3, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const defaultInterests = ['Outdoor & Sports', 'Social Hangouts', 'Music & Events'];
  const interestsList = user.interests && user.interests.length > 0 ? user.interests : defaultInterests;

  return (
    <PageShell title="Profile">
      {/* Unified Continuous Profile Container */}
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
        {/* 1. Identity Section */}
        <div className="p-6 sm:p-8 text-center">
          {/* Profile Photo */}
          <div className="relative inline-block mb-3">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto bg-zinc-200 object-cover shadow-sm border-2 border-white ring-1 ring-zinc-200"
            />
            <Link
              to="/settings/personal-info"
              className="absolute bottom-0 right-0 p-1.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95"
              title="Change Photo"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Name + Verification */}
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">{user.name}</h2>
            {user.isNINVerified && (
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
          </div>

          {/* Username */}
          <p className="text-xs font-bold text-zinc-400 mb-2.5">{user.username}</p>

          {/* Bio */}
          <p className="text-sm text-zinc-700 font-medium max-w-sm mx-auto leading-relaxed mb-2">
            "{user.bio || 'Always looking for something fun to do.'}"
          </p>

          {/* Location + Interests */}
          <div className="text-xs text-zinc-500 font-medium space-y-1 mb-4">
            <div className="flex items-center justify-center gap-1 text-zinc-600">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>{user.location || 'Location not set'}</span>
            </div>
            <p className="text-zinc-400">
              {interestsList.join(' · ')}
            </p>
          </div>

          {/* Edit Profile Action Button */}
          <Link
            to="/settings/personal-info"
            className="w-full sm:w-auto sm:px-8 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
            Edit Profile
          </Link>
        </div>

        {/* 2. Statistics Section */}
        <div className="py-4 sm:py-5 px-4 bg-zinc-50/50">
          <div className="grid grid-cols-3 divide-x divide-zinc-200/70 text-center max-w-md mx-auto">
            <div className="px-2">
              <div className="text-xl sm:text-2xl font-black text-zinc-900">{user.stats?.rallies ?? 0}</div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Rallys</div>
            </div>
            <div className="px-2">
              <div className="text-xl sm:text-2xl font-black text-zinc-900">{user.stats?.completed ?? 0}</div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Completed</div>
            </div>
            <div className="px-2">
              <div className="text-xl sm:text-2xl font-black text-amber-500">{user.stats?.rating ?? '—'}</div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Rating</div>
            </div>
          </div>
        </div>

        {/* 3. Navigation / Action Group */}
        <div>
          <Link to="/settings/personal-info" className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group">
            <span>Edit Profile Information</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link to="/my-rallys" className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100">
            <span>My RALLYS</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link to="/verification" className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100">
            <span>NIN Verification & Badges</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link to="/safety" className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100">
            <span>Safety Center & Emergency Contacts</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

