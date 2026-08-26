import React from 'react';
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
  LifeBuoy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { logout, user } = useAuth();

  const mainSettings = [
    { 
      label: 'Verification (NIN)', 
      desc: user.isNINVerified ? 'NIN Verified Neighbor' : 'Verify your national identity for trust', 
      path: '/verification', 
      icon: ShieldCheck, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      badge: user.isNINVerified ? 'Verified' : 'Get Verified' 
    },
    { 
      label: 'RALLY+ Premium', 
      desc: 'Unlimited activity boosts and filters', 
      path: '/plus', 
      icon: Crown, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Notification Settings', 
      desc: 'Push alerts, sound, chat & RALLY matches', 
      path: '/settings/notifications', 
      icon: Bell, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Privacy & Safety', 
      desc: 'Location precision, visibility & blocked users', 
      path: '/settings/privacy', 
      icon: Lock, 
      color: 'text-violet-600', 
      bg: 'bg-violet-50' 
    },
    { 
      label: 'Emergency Contacts & Safety', 
      desc: 'Emergency hotlines, trusted contacts & guides', 
      path: '/safety', 
      icon: ShieldAlert, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50' 
    },
    { 
      label: 'App Settings', 
      desc: 'Theme, language, data saver & cache storage', 
      path: '/settings/app', 
      icon: Sliders, 
      color: 'text-zinc-600', 
      bg: 'bg-zinc-100' 
    },
    { 
      label: 'Help & Support', 
      desc: 'FAQs, contact support, guides & reporting', 
      path: '/settings/help', 
      icon: LifeBuoy, 
      color: 'text-teal-600', 
      bg: 'bg-teal-50' 
    },
  ];

  const secondarySettings = [
    { 
      label: 'Terms of Service', 
      path: '/terms', 
      icon: FileText, 
      color: 'text-zinc-600', 
      bg: 'bg-zinc-100' 
    },
    { 
      label: 'Privacy Policy', 
      path: '/privacy', 
      icon: ShieldCheck, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Admin CRM & Control Panel', 
      path: '/admin', 
      icon: LayoutDashboard, 
      color: 'text-zinc-900', 
      bg: 'bg-zinc-100', 
      badge: 'Super Admin' 
    },
  ];

  return (
    <PageShell 
      title="Settings" 
      subtitle="Manage your account preferences and safety controls"
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        
        {/* Continuous Settings Card */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
          
          {/* 1. Integrated Profile Summary Section */}
          <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50/60 transition-colors">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover bg-zinc-200 border-2 border-white shadow-xs ring-1 ring-zinc-200"
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
                  {user.username} · {user.location || 'Lagos, Nigeria'}
                </p>
              </div>
            </div>

            <Link
              to="/settings/personal-info"
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ml-3 active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Edit</span>
            </Link>
          </div>

          {/* 2. Main Settings Items */}
          <div>
            {mainSettings.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.label}
                  to={item.path}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group border-b border-zinc-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 border border-zinc-200/50 shadow-2xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                          {item.label}
                        </p>
                        {item.badge && (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                            item.badge === 'Verified' 
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' 
                              : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium truncate">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
              );
            })}
          </div>

          {/* 3. Support, Legal & Admin */}
          <div>
            {secondarySettings.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.label}
                  to={item.path}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors group border-b border-zinc-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0 border border-zinc-200/40`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-zinc-800 text-xs sm:text-sm group-hover:text-black transition-colors truncate">
                          {item.label}
                        </p>
                        {item.badge && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 text-white shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
              );
            })}
          </div>

        </div>

        {/* Log Out Action */}
        <div className="pt-2 px-3 sm:px-0">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-100 hover:bg-red-50 hover:text-red-700 text-zinc-700 rounded-xl transition-all font-bold text-xs sm:text-sm active:scale-98 border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

      </div>
    </PageShell>
  );
}
