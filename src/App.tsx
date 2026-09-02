/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';
import AuthErrorBoundary from './components/AuthErrorBoundary';
import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import Onboarding from './pages/Onboarding';

// Lazy load pages for now
const Home = React.lazy(() => import('./pages/Home'));
const Explore = React.lazy(() => import('./pages/Explore'));
const MyRallys = React.lazy(() => import('./pages/MyRallys'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Chat = React.lazy(() => import('./pages/Chat'));
const ChatRequest = React.lazy(() => import('./pages/ChatRequest'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Profile = React.lazy(() => import('./pages/Profile'));
const ManagePage = React.lazy(() => import('./pages/ManagePage'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const InterestPage = React.lazy(() => import('./pages/InterestPage'));
const RallyDetail = React.lazy(() => import('./pages/RallyDetail'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const Verification = React.lazy(() => import('./pages/Verification'));
const Plus = React.lazy(() => import('./pages/Plus'));
const Safety = React.lazy(() => import('./pages/Safety'));
const Settings = React.lazy(() => import('./pages/Settings'));
const NotificationSettings = React.lazy(() => import('./pages/NotificationSettings'));
const PrivacySettings = React.lazy(() => import('./pages/PrivacySettings'));
const AppSettingsPage = React.lazy(() => import('./pages/AppSettingsPage'));
const LocationSettings = React.lazy(() => import('./pages/LocationSettings'));
const HelpSupport = React.lazy(() => import('./pages/HelpSupport'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const ReviewUser = React.lazy(() => import('./pages/ReviewUser'));
const ReportUser = React.lazy(() => import('./pages/ReportUser'));

// Admin Pages
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/Users'));
const AdminRallies = React.lazy(() => import('./pages/admin/Rallies'));
const AdminReports = React.lazy(() => import('./pages/admin/Reports'));
const AdminVerification = React.lazy(() => import('./pages/admin/Verification'));
const AdminNotifications = React.lazy(() => import('./pages/admin/Notifications'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/Analytics'));
const AdminSettings = React.lazy(() => import('./pages/admin/Settings'));
const AdminAds = React.lazy(() => import('./pages/admin/Ads'));

const SUPER_ADMIN_EMAIL = 'riderezzy@gmail.com';

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthLoading, isProfileLoading } = useAuth();
  if (isAuthLoading || isProfileLoading) return null;
  if (user.email !== SUPER_ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isLoggedIn, isAuthLoading, isProfileLoading, hasConvexProfile, user } = useAuth();

  // Onboarding is required when the user has a Convex profile but has NOT
  // completed onboarding yet (new accounts). Existing accounts without the
  // field are treated as completed (onboardingCompleted defaults to true in
  // convexUserToUser for existing records).
  const needsOnboarding = hasConvexProfile && user.onboardingCompleted === false;

  const Spinner = () => (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center animate-pulse">
        <span className="text-white font-black text-lg tracking-tighter">L</span>
      </div>
    </div>
  );

  if (isAuthLoading) return <Spinner />;

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  if (isProfileLoading) return <Spinner />;

  // No Convex profile yet (mid-onboarding, or getOrCreateByFirebaseUid still running)
  if (!hasConvexProfile || needsOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <ChunkErrorBoundary>
      <React.Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
        <Routes>
        {/* Admin CRM Routes */}
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="rallies" element={<AdminRallies />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="my-rallys" element={<MyRallys />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/request/:id" element={<ChatRequest />} />
          <Route path="messages/:id" element={<Chat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="manage" element={<ManagePage />} />
          <Route path="user/:id" element={<UserProfile />} />
          <Route path="interest/:label" element={<InterestPage />} />
          <Route path="rally/:id" element={<RallyDetail />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="verification" element={<Verification />} />
          <Route path="plus" element={<Plus />} />
          <Route path="safety" element={<Safety />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/personal-info" element={<EditProfile />} />
          <Route path="settings/notifications" element={<NotificationSettings />} />
          <Route path="settings/privacy" element={<PrivacySettings />} />
          <Route path="settings/location" element={<LocationSettings />} />
          <Route path="settings/app" element={<AppSettingsPage />} />
          <Route path="settings/help" element={<HelpSupport />} />
          <Route path="help" element={<HelpSupport />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="review/:id" element={<ReviewUser />} />
          <Route path="report/:id" element={<ReportUser />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </React.Suspense>
    </ChunkErrorBoundary>
  );
};

export default function App() {
  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}

