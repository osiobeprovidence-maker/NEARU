import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Flag, 
  Settings, 
  Bell, 
  LogOut,
  ShieldCheck,
  Search,
  Menu,
  X,
  HelpingHand,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Sliders,
  Send,
  Megaphone
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin, AdminProvider } from '../contexts/AdminContext';
import { AdminToastContainer } from '../components/admin/AdminToastContainer';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'User Management', path: '/admin/users' },
  { icon: HelpingHand, label: 'RALLY Moderation', path: '/admin/rallies' },
  { icon: Flag, label: 'Reports', path: '/admin/reports', badgeKey: 'pendingReports' },
  { icon: BadgeCheck, label: 'Verification', path: '/admin/verification', badgeKey: 'pendingVerifications' },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Megaphone, label: 'Ads', path: '/admin/ads' },
  { icon: Settings, label: 'System Settings', path: '/admin/settings' },
];

function AdminLayoutContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const { logout, user } = useAuth();
  const { users, rallies, reports, verifications, notifications, metrics, markNotificationRead, markAllNotificationsRead } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Grouped search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    const matchedUsers = users.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.username.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      u.location.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedRallies = rallies.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.description.toLowerCase().includes(q) || 
      r.creator.name.toLowerCase().includes(q) ||
      (r.city || '').toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedReports = reports.filter(r => 
      r.id.toLowerCase().includes(q) || 
      r.type.toLowerCase().includes(q) || 
      r.reportedUserName.toLowerCase().includes(q) || 
      r.description.toLowerCase().includes(q)
    ).slice(0, 3);

    return {
      users: matchedUsers,
      rallies: matchedRallies,
      reports: matchedReports,
      total: matchedUsers.length + matchedRallies.length + matchedReports.length
    };
  }, [searchQuery, users, rallies, reports]);

  const unreadNotifsCount = notifications.filter(n => !n.isReadByAdmin).length;

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-zinc-200 fixed inset-y-0 z-40">
        {/* Brand Header */}
        <div className="p-6 sm:p-7 border-b border-zinc-100">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-zinc-950 rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-950/10 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-2xl italic tracking-tighter">R</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-zinc-900 tracking-tight">lalao</h1>
                <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full tracking-wider">
                  CRM
                </span>
              </div>
              <p className="text-[11px] font-bold text-zinc-400">Control Panel & Operations</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const badgeCount = item.badgeKey ? (metrics as any)[item.badgeKey] : 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) => cn(
                  "flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-150",
                  isActive 
                    ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/10 font-black" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {badgeCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white shadow-2xs">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-100 space-y-2 bg-zinc-50/50">
          <Link
            to="/"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500" />
            <span>Back to lalao App</span>
          </Link>

          {/* Admin Info Badge */}
          <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-xs font-black text-zinc-900">Admin Mode Active</p>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium truncate">
              Signed in as <strong className="text-zinc-800">Super Admin</strong> ({user.name})
            </p>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shadow-2xs">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
              aria-label="Open Navigation"
            >
              <Menu className="w-6 h-6 text-zinc-700" />
            </button>
            <div className="w-8 h-8 bg-zinc-950 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg italic">R</span>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative flex-1 max-w-lg mx-2 sm:mx-4" ref={searchRef}>
            <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2.5 rounded-2xl border border-zinc-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search users, RALLYS, reports, or records..."
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs sm:text-sm font-medium w-full placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-zinc-200 shadow-2xl shadow-zinc-950/15 overflow-hidden z-50 max-h-[75vh] overflow-y-auto custom-scrollbar"
                >
                  <div className="p-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-500">
                    <span>Search Results for "{searchQuery}"</span>
                    <span>{searchResults?.total || 0} matches</span>
                  </div>

                  {searchResults && searchResults.total > 0 ? (
                    <div className="p-3 space-y-4">
                      {/* Users Section */}
                      {searchResults.users.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                            Users ({searchResults.users.length})
                          </div>
                          <div className="space-y-1 mt-1">
                            {searchResults.users.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => {
                                  setIsSearchFocused(false);
                                  navigate('/admin/users');
                                }}
                                className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-zinc-50 rounded-xl transition-colors group"
                              >
                                <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-zinc-900 truncate">{u.name}</p>
                                    {u.isNINVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />}
                                  </div>
                                  <p className="text-[11px] text-zinc-400 truncate">{u.username} · {u.location}</p>
                                </div>
                                <span className={cn(
                                  "text-[10px] font-black px-2 py-0.5 rounded-full capitalize",
                                  u.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                  {u.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* RALLYS Section */}
                      {searchResults.rallies.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                            RALLYS ({searchResults.rallies.length})
                          </div>
                          <div className="space-y-1 mt-1">
                            {searchResults.rallies.map((r) => (
                              <button
                                key={r.id}
                                onClick={() => {
                                  setIsSearchFocused(false);
                                  navigate('/admin/rallies');
                                }}
                                className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-zinc-50 rounded-xl transition-colors"
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                                  r.type === 'HELP' && "bg-emerald-100 text-emerald-700",
                                  r.type === 'ASK' && "bg-rose-100 text-rose-700",
                                  r.type === 'JOIN' && "bg-indigo-100 text-indigo-700"
                                )}>
                                  {r.type}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-zinc-900 truncate">{r.title}</p>
                                  <p className="text-[11px] text-zinc-400 truncate">{r.creator.name} · {r.city}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reports Section */}
                      {searchResults.reports.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                            Reports ({searchResults.reports.length})
                          </div>
                          <div className="space-y-1 mt-1">
                            {searchResults.reports.map((rep) => (
                              <button
                                key={rep.id}
                                onClick={() => {
                                  setIsSearchFocused(false);
                                  navigate('/admin/reports');
                                }}
                                className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-zinc-50 rounded-xl transition-colors"
                              >
                                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                  <Flag className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-zinc-900 truncate">{rep.id} · {rep.type}</p>
                                  <p className="text-[11px] text-zinc-400 truncate">Against {rep.reportedUserName}</p>
                                </div>
                                <span className={cn(
                                  "text-[10px] font-black px-2 py-0.5 rounded-full",
                                  rep.priority === 'URGENT' ? "bg-rose-100 text-rose-700" : "bg-zinc-100 text-zinc-600"
                                )}>
                                  {rep.priority}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-400 text-xs font-medium">
                      No matches found for "{searchQuery}".
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2.5 hover:bg-zinc-100 rounded-2xl transition-colors"
                title="Admin Notifications"
              >
                <Bell className="w-5 h-5 text-zinc-700" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-2xs animate-pulse">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-zinc-200 shadow-2xl shadow-zinc-950/15 overflow-hidden z-50"
                  >
                    <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-zinc-900">System Notifications</h4>
                        <p className="text-[11px] text-zinc-500 font-medium">Real-time moderation & alert queue</p>
                      </div>
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 custom-scrollbar">
                      {notifications.slice(0, 5).map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            markNotificationRead(notif.id);
                            setIsNotifOpen(false);
                            navigate('/admin/notifications');
                          }}
                          className={cn(
                            "p-3.5 hover:bg-zinc-50 transition-colors cursor-pointer flex gap-3",
                            !notif.isReadByAdmin && "bg-indigo-50/40"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                            notif.type === 'SAFETY' && "bg-rose-100 text-rose-600",
                            notif.type === 'SYSTEM' && "bg-zinc-100 text-zinc-700",
                            notif.type === 'COMMUNITY' && "bg-indigo-100 text-indigo-600"
                          )}>
                            {notif.type === 'SAFETY' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-900 leading-tight">{notif.title}</p>
                            <p className="text-[11px] text-zinc-500 font-medium line-clamp-2 mt-0.5 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">{notif.sentAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-zinc-50 border-t border-zinc-100 text-center">
                      <Link 
                        to="/admin/notifications" 
                        onClick={() => setIsNotifOpen(false)}
                        className="text-xs font-bold text-zinc-900 hover:text-indigo-600"
                      >
                        View Notification Center →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-7 w-px bg-zinc-200 mx-1 hidden sm:block" />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 hover:bg-zinc-100 rounded-2xl transition-colors text-left"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-zinc-900">{user.name}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px] font-black bg-zinc-900 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                      SUPER ADMIN
                    </span>
                  </div>
                </div>
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-2xs ring-1 ring-zinc-200"
                />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-3xl border border-zinc-200 shadow-2xl shadow-zinc-950/15 p-2 z-50"
                  >
                    <div className="p-3 border-b border-zinc-100 mb-1">
                      <p className="text-xs font-black text-zinc-900">{user.name}</p>
                      <p className="text-[11px] text-zinc-400 font-medium">{user.username}</p>
                    </div>

                    <Link
                      to="/admin/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-zinc-400" />
                      <span>System Settings</span>
                    </Link>

                    <Link
                      to="/"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-zinc-400" />
                      <span>Switch to App View</span>
                    </Link>

                    <div className="h-px bg-zinc-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-72 sm:w-80 bg-white h-full p-6 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-950 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-black text-xl italic">R</span>
                  </div>
                  <div>
                    <h2 className="font-black text-base text-zinc-900">lalao CRM</h2>
                    <p className="text-[10px] font-bold text-zinc-400">Operations Suite</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const badgeCount = item.badgeKey ? (metrics as any)[item.badgeKey] : 0;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all",
                        isActive 
                          ? "bg-zinc-950 text-white shadow-md font-black" 
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {badgeCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white">
                          {badgeCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="pt-4 border-t border-zinc-100 space-y-2">
                <Link
                  to="/"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to lalao App</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast Container */}
      <AdminToastContainer />
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminProvider>
      <AdminLayoutContent />
    </AdminProvider>
  );
}
