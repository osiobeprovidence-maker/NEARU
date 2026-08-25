import React from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, MapPin, Settings, Star, Award, BadgeCheck, Edit3, ChevronRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();

  return (
    <PageShell 
      title="Profile" 
      headerAction={
        <div className="flex items-center gap-2">
          <Link 
            to="/settings/personal-info" 
            className="px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </Link>
          <Link to="/settings" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors inline-flex">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      }
    >
      {/* Main Profile Summary Card */}
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-8 text-center mb-6">
        <div className="relative inline-block mb-4">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-24 h-24 rounded-full mx-auto bg-zinc-200 object-cover shadow-sm border-4 border-white ring-1 ring-zinc-200"
          />
          <Link
            to="/settings/personal-info"
            className="absolute bottom-0 right-0 p-1.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95"
            title="Edit Photo"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{user.name}</h2>
          {user.isNINVerified && (
            <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
        </div>
        <p className="text-xs font-bold text-zinc-400 mb-3">{user.username}</p>
        
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {user.isNINVerified ? (
            <Link 
              to="/verification"
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors rounded-full text-xs font-bold ring-1 ring-inset ring-emerald-200"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              NIN Verified
            </Link>
          ) : (
            <Link 
              to="/verification"
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors rounded-full text-xs font-bold ring-1 ring-inset ring-indigo-200"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              Get NIN Verified
            </Link>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold ring-1 ring-inset ring-zinc-200">
            <MapPin className="w-4 h-4 text-zinc-500" />
            {user.location || 'Lagos, Nigeria'}
          </div>
        </div>

        {user.badges && user.badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {user.badges.map(badge => (
              <div 
                key={badge} 
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold ring-1 ring-inset ring-amber-200"
              >
                {badge.includes('Hero') ? (
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                ) : (
                  <Award className="w-4 h-4 text-amber-600" />
                )}
                {badge}
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-zinc-600 font-medium max-w-sm mx-auto leading-relaxed">
          "{user.bio || 'Active neighbor on RALLY.'}"
        </p>

        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4 mt-4 border-t border-zinc-100">
            {user.interests.map((interest) => (
              <span key={interest} className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-lg">
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Activity Stats Card */}
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-3 divide-x divide-zinc-100 text-center">
          <div className="px-2">
            <div className="text-2xl font-black text-zinc-900">{user.stats?.rallies || 24}</div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Rallys</div>
          </div>
          <div className="px-2">
            <div className="text-2xl font-black text-zinc-900">{user.stats?.completed || 18}</div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Completed</div>
          </div>
          <div className="px-2">
            <div className="text-2xl font-black text-amber-500">{user.stats?.rating || 4.9}</div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Rating</div>
          </div>
        </div>
      </div>

      {/* Account Navigation Group */}
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
        <Link to="/settings/personal-info" className="flex items-center justify-between p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group">
          <span>Edit Profile Information</span>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
        </Link>
        <Link to="/my-rallys" className="flex items-center justify-between p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group">
          <span>My RALLYS</span>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
        </Link>
        <Link to="/verification" className="flex items-center justify-between p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group">
          <span>NIN Verification & Badges</span>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
        </Link>
        <Link to="/safety" className="flex items-center justify-between p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group">
          <span>Safety Center & Emergency Contacts</span>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </PageShell>
  );
}

