import React from 'react';
import PageShell from '../components/PageShell';
import { 
  LogOut, 
  ChevronRight, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Bell, 
  Lock, 
  ShieldAlert, 
  FileText, 
  Sliders, 
  HelpCircle,
  Smartphone,
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { logout, user } = useAuth();

  const settingsGroups = [
    {
      title: 'Account & Identity',
      items: [
        { label: 'Personal Information', desc: 'Name, username, bio, photo & contact info', path: '/settings/personal-info', icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Verification (NIN)', desc: user.isNINVerified ? 'NIN Verified Neighbor' : 'Verify your national identity for trust', path: '/verification', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: user.isNINVerified ? 'Verified' : 'Get Verified' },
        { label: 'RALLY+ (Premium)', desc: 'Unlimited activity boosts and filters', path: '/plus', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
      ]
    },
    {
      title: 'Preferences & Privacy',
      items: [
        { label: 'Notification Settings', desc: 'Push alerts, sound, chat & RALLY matches', path: '/settings/notifications', icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Privacy & Permissions', desc: 'Location precision, visibility & blocked users', path: '/settings/privacy', icon: Lock, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'App Settings', desc: 'Theme, language, data saver & cache storage', path: '/settings/app', icon: Sliders, color: 'text-zinc-600', bg: 'bg-zinc-100' },
      ]
    },
    {
      title: 'Safety, Legal & Support',
      items: [
        { label: 'Safety Center', desc: 'Emergency hotlines, trusted contacts & guides', path: '/safety', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Terms of Service', desc: 'Community rules and peer conduct agreements', path: '/terms', icon: FileText, color: 'text-zinc-600', bg: 'bg-zinc-100' },
        { label: 'Privacy Policy', desc: 'How your data & NIN are encrypted and safeguarded', path: '/privacy', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      ]
    },
    {
      title: 'Platform Administration',
      items: [
        { label: 'Admin CRM & Control Panel', desc: 'Manage users, moderate RALLYS, reviews & platform reports', path: '/admin', icon: LayoutDashboard, color: 'text-zinc-900', bg: 'bg-zinc-100', badge: 'Super Admin' },
      ]
    }
  ];

  return (
    <PageShell title="Settings" subtitle="Manage your account preferences and safety controls">
      <div className="space-y-6 max-w-2xl mx-auto pb-12">
        {/* User Card Summary */}
        <Link 
          to="/settings/personal-info"
          className="flex items-center justify-between p-5 sm:p-6 bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 hover:bg-zinc-50/80 transition-all group"
        >
          <div className="flex items-center gap-4 min-w-0">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-14 h-14 rounded-full object-cover bg-zinc-200 border-2 border-white shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-black text-zinc-900 text-base sm:text-lg truncate group-hover:text-black transition-colors">{user.name}</h3>
                {user.isNINVerified && (
                  <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200 shrink-0">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-semibold truncate">{user.username} • {user.location}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0 ml-3">
            Edit
            <ChevronRight className="w-4 h-4" />
          </span>
        </Link>

        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">{group.title}</h3>
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.label}
                    to={item.path}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 border border-zinc-200/60 shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-zinc-900 text-sm sm:text-base group-hover:text-black transition-colors truncate">{item.label}</p>
                          {item.badge && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium truncate">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 px-4 md:px-0">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-100 text-zinc-800 rounded-2xl hover:bg-zinc-200 transition-colors font-bold text-sm active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>
    </PageShell>
  );
}

