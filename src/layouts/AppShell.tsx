import React, { useState, useEffect } from 'react';
import Avatar from '../components/Avatar';
import BrandLogo from '../components/BrandLogo';
import { Outlet, NavLink, useNavigate, Link, useLocation as useRouteLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Compass, 
  HelpingHand, 
  MessageSquare, 
  Bell, 
  User, 
  ShieldCheck, 
  Crown, 
  Zap, 
  Shield, 
  Settings, 
  Plus, 
  LogOut, 
  CheckCircle2, 
  LayoutDashboard,
  MapPin,
  ChevronDown,
  ArrowLeft,
  Building2,
  Store
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import CreateRallyModal from '../components/CreateRallyModal';
import CreateContentSheet from '../components/CreateContentSheet';
import LocationFilterModal from '../components/LocationFilterModal';
import LocationDebug from '../components/LocationDebug';
import NotificationListener from '../components/NotificationListener';
import NotificationPanel from '../components/NotificationPanel';
import { initNotificationSound } from '../lib/notificationSound';

export default function AppShell() {
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();
  const { user, logout, convexUserId } = useAuth();
  const { 
    city, 
    radius, 
    radiusKm,
    locationLabel,
    geoState,
    isLocationModalOpen, 
    closeLocationModal, 
    openLocationModal, 
    updateLocation 
  } = useLocationContext();
  
  const SUPER_ADMIN_EMAIL = 'osiobeprovidence@gmail.com';
  const isAdmin =
    user.email === SUPER_ADMIN_EMAIL ||
    (user as any).role === 'super_admin' ||
    (user as any).role === 'admin';
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<'POST' | 'EVENT' | undefined>(undefined);
  const [isCreateContentOpen, setIsCreateContentOpen] = useState(false);
  const [toastConfig, setToastConfig] = useState<{ title: string, subtitle: string } | null>(null);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);

  const unreadCount = useQuery(
    api.notifications.unreadCount,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  // Live conversation list, used to (a) show an unread badge on the Messages
  // nav items and (b) drive the real-time message toasts in NotificationListener.
  const conversations = useQuery(
    api.messages.listConversationsWithParticipants,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const unreadMessages = (conversations ?? []).reduce(
    (sum: number, c: any) => sum + (c.myUnread ?? 0),
    0
  );

  useEffect(() => {
    initNotificationSound();
  }, []);

  useEffect(() => {
    setIsNotifPanelOpen(false);
  }, [routeLocation.pathname]);

  const isLocationHidden = 
    routeLocation.pathname !== '/';

  useEffect(() => {
    // "Create" / "open-create-rally" buttons (e.g. empty states) open the
    // creation flow. The event payload may carry a content type to pre-select:
    //   { type?: 'POST' | 'EVENT' }
    // Without a type the modal opens on the Rally picker (Ask/Help/Join).
    const handleOpenCreate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const t = detail?.type === 'POST' || detail?.type === 'EVENT' ? detail.type : undefined;
      setCreateInitialType(t || undefined);
      setIsCreateModalOpen(true);
    };

    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastConfig(customEvent.detail);
      setTimeout(() => setToastConfig(null), 4000);
    };

    window.addEventListener('open-create-rally', handleOpenCreate);
    window.addEventListener('show-toast', handleShowToast);
    
    return () => {
      window.removeEventListener('open-create-rally', handleOpenCreate);
      window.removeEventListener('show-toast', handleShowToast);
    };
  }, []);

  // Called when the user picks an option in the create sheet.
  const handleCreateSelect = (choice: 'post' | 'rally' | 'page') => {
    setIsCreateContentOpen(false);
    if (choice === 'page') {
      navigate('/pages?create=true');
      return;
    }
    if (choice === 'post') setCreateInitialType('POST');
    else setCreateInitialType(undefined);
    setIsCreateModalOpen(true);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setCreateInitialType(undefined);
  };

  const handleRallyCreated = () => {
    setIsCreateModalOpen(false);
    setToastConfig({
      title: "Posted to lalao.",
      subtitle: "People around you can now discover it."
    });
    setTimeout(() => setToastConfig(null), 4000);
  };

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Explore', icon: Compass, path: '/explore' },
    { label: 'My RALLYS', icon: HelpingHand, path: '/my-rallys' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
  ];

  const secondaryNavItems = [
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'My Page', icon: Building2, path: '/pages' },
    { label: 'Verification', icon: ShieldCheck, path: '/verification' },
    { label: 'RALLY+', icon: Crown, path: '/plus' },
  ];

  const tertiaryNavItems = [
    { label: 'Safety', icon: Shield, path: '/safety' },
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Admin CRM', icon: LayoutDashboard, path: '/admin', adminOnly: true },
  ].filter((item) => !(item as any).adminOnly || isAdmin);

  const getMobileHeaderTitle = () => {
    const path = routeLocation.pathname;
    if (path === '/') return null;
    if (path === '/messages') return 'Messages';
    if (path.startsWith('/messages/')) return null;
    if (path === '/explore') return 'Explore';
    if (path === '/my-rallys') return 'My RALLYS';
    if (path === '/notifications') return 'Notifications';
    if (path === '/profile') return 'Profile';
    if (path === '/manage') return 'My Page';
    if (path === '/profile/edit') return 'Edit Profile';
    if (path === '/verification') return 'Verification';
    if (path === '/plus') return 'RALLY+';
    if (path === '/safety') return 'Safety';
    if (path === '/settings') return 'Settings';
    if (path === '/settings/personal-info') return 'Personal Info';
    if (path === '/settings/notifications') return 'Notification Settings';
    if (path === '/settings/privacy') return 'Privacy & Safety';
    if (path === '/settings/location') return 'Location Settings';
    if (path === '/settings/app') return 'App Settings';
    if (path === '/settings/help' || path === '/help') return 'Help & Support';
    if (path === '/terms') return 'Terms of Service';
    if (path === '/privacy') return 'Privacy Policy';
    return 'lalao';
  };

  const mobileTitle = getMobileHeaderTitle();
  const isChatPage = routeLocation.pathname.startsWith('/messages/') && routeLocation.pathname !== '/messages';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      <AnimatePresence>
        {toastConfig && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-0 right-0 mx-auto w-max z-[100] bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div className="text-sm">
              <p className="font-semibold">{toastConfig.title}</p>
              {toastConfig.subtitle && <p className="text-zinc-400">{toastConfig.subtitle}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateRallyModal 
        isOpen={isCreateModalOpen} 
        onClose={handleCreateModalClose} 
        onCreated={handleRallyCreated}
        initialType={createInitialType}
      />

      <CreateContentSheet
        isOpen={isCreateContentOpen}
        onClose={() => setIsCreateContentOpen(false)}
        onSelect={handleCreateSelect}
      />

      <LocationFilterModal 
        isOpen={isLocationModalOpen}
        onClose={closeLocationModal}
      />

      <LocationDebug />
      <NotificationListener conversations={conversations} />
      <NotificationPanel open={isNotifPanelOpen} onClose={() => setIsNotifPanelOpen(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed h-full bg-white border-r border-zinc-200 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-zinc-900 mb-6 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo boxClassName="w-8 h-8" rounded="rounded-lg" nameClassName="text-2xl" />
          </div>

          {/* Desktop Location Selector */}
          <button
            onClick={openLocationModal}
            className="flex items-center justify-between w-full px-3 py-2 mb-6 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 rounded-xl text-xs font-bold transition-all border border-zinc-200/70 group"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-zinc-800 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">{city || locationLabel || 'Set location'} · {radiusKm} km</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <nav className="space-y-1 mb-8">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-600 font-bold"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.path === '/messages' && !!unreadMessages && (
                  <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="h-px bg-zinc-100 my-4" />

          <nav className="space-y-1 mb-8">
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-600 font-bold"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )
                }
              >
                <item.icon className={cn("w-5 h-5", item.label === 'RALLY+' ? 'text-amber-500' : '')} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="h-px bg-zinc-100 my-4" />

          <nav className="space-y-1">
            {tertiaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-600 font-bold"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-zinc-100 flex items-center gap-2">
          <div 
            className="flex-1 flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors"
            onClick={() => navigate('/profile')}
          >
            <Avatar src={user.avatar} name={user.name} size="md" className="border-2 border-white shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">{user.name}</p>
              <div className={cn("flex items-center gap-1 text-xs font-semibold", user.isNINVerified ? "text-emerald-600" : "text-zinc-400")}>
                {user.isNINVerified && <ShieldCheck className="w-3.5 h-3.5" />}
                {user.isNINVerified ? 'NIN Verified' : 'Unverified'}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      {!isChatPage && (
        <header className="md:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-zinc-100 z-50 px-4 py-2.5 flex items-center justify-between gap-3 safe-area-top min-h-[53px]">
          {/* Header Location Pill on Left for Home, or Page Title for other routes */}
          {!isLocationHidden ? (
            <button
              onClick={openLocationModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full text-xs font-bold transition-all border border-zinc-200/70 active:scale-95 shadow-xs shrink-0 max-w-[240px]"
              title="Change location and radius"
            >
              <MapPin className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
              <span className="truncate">{city || locationLabel || 'Set location'} · {radiusKm} km</span>
              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
            </button>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              {(routeLocation.pathname === '/settings' ||
                routeLocation.pathname.startsWith('/settings/') || 
                routeLocation.pathname === '/profile/edit' || 
                routeLocation.pathname === '/verification' || 
                routeLocation.pathname === '/manage' ||
                routeLocation.pathname === '/plus' ||
                routeLocation.pathname === '/safety' || 
                routeLocation.pathname === '/terms' || 
                routeLocation.pathname === '/privacy' ||
                routeLocation.pathname === '/help' ||
                routeLocation.pathname.startsWith('/review/') ||
                routeLocation.pathname.startsWith('/report/')) && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-1 -ml-1 text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors active:scale-95 shrink-0"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-black tracking-tight text-zinc-900 truncate">
                {mobileTitle || 'lalao'}
              </h1>
            </div>
          )}

          {routeLocation.pathname === '/profile' ? (
            <NavLink 
              to="/settings" 
              className={({isActive}) => cn("p-2 rounded-full transition-colors shrink-0", isActive ? "text-indigo-600 bg-indigo-50" : "text-zinc-600 hover:bg-zinc-100")}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </NavLink>
          ) : (routeLocation.pathname === '/settings' ||
               routeLocation.pathname === '/settings/personal-info' || 
               routeLocation.pathname === '/profile/edit' || 
               routeLocation.pathname.startsWith('/settings/') ||
               routeLocation.pathname === '/verification' ||
               routeLocation.pathname === '/manage' ||
               routeLocation.pathname === '/plus' ||
               routeLocation.pathname === '/safety' ||
               routeLocation.pathname === '/terms' ||
               routeLocation.pathname === '/privacy' ||
               routeLocation.pathname === '/help') ? (
            <div className="w-6 shrink-0" />
          ) : (
            <button
              onClick={() => setIsNotifPanelOpen((v) => !v)}
              className={cn("relative p-2 rounded-full transition-colors shrink-0", isNotifPanelOpen ? "text-indigo-600 bg-indigo-50" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {!!unreadCount && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-[53px] md:pt-0 min-h-screen">
        <div className="max-w-3xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Desktop Floating Create Button */}
      <button
        onClick={() => setIsCreateContentOpen(true)}
        className="hidden md:flex fixed bottom-6 right-6 items-center gap-2 px-5 py-3 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all z-40"
        title="Create"
      >
        <Plus className="w-5 h-5" />
        Create
      </button>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 z-50 px-4 py-3 flex items-center justify-between safe-area-bottom">
        <div className="flex-1 flex justify-around items-center">
          <NavLink to="/" className={({isActive}) => cn("flex flex-col items-center gap-1 w-12", isActive ? "text-indigo-600" : "text-zinc-500")}>
            <Home className="w-6 h-6" />
          </NavLink>
          <NavLink to="/explore" className={({isActive}) => cn("flex flex-col items-center gap-1 w-12", isActive ? "text-indigo-600" : "text-zinc-500")}>
            <Compass className="w-6 h-6" />
          </NavLink>
        </div>
        
        <div className="relative -top-6 px-4">
          <button 
            className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
            onClick={() => setIsCreateContentOpen(true)}
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 flex justify-around items-center">
          <NavLink to="/messages" className={({isActive}) => cn("relative flex flex-col items-center gap-1 w-12", isActive ? "text-indigo-600" : "text-zinc-500")}>
            <MessageSquare className="w-6 h-6" />
            {!!unreadMessages && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => cn("flex flex-col items-center gap-1 w-12", isActive ? "text-indigo-600" : "text-zinc-500")}>
            <User className="w-6 h-6" />
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
