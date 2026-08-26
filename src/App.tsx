/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';

// Lazy load pages for now
const Home = React.lazy(() => import('./pages/Home'));
const Explore = React.lazy(() => import('./pages/Explore'));
const MyRallys = React.lazy(() => import('./pages/MyRallys'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Profile = React.lazy(() => import('./pages/Profile'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const Verification = React.lazy(() => import('./pages/Verification'));
const Plus = React.lazy(() => import('./pages/Plus'));
const Safety = React.lazy(() => import('./pages/Safety'));
const Settings = React.lazy(() => import('./pages/Settings'));
const NotificationSettings = React.lazy(() => import('./pages/NotificationSettings'));
const PrivacySettings = React.lazy(() => import('./pages/PrivacySettings'));
const AppSettingsPage = React.lazy(() => import('./pages/AppSettingsPage'));
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

const AppRoutes = () => {
  const { isLoggedIn, isAuthLoading } = useAuth();
  
  if (isAuthLoading) {
    return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center animate-pulse">
        <span className="text-white font-black text-lg tracking-tighter">R</span>
      </div>
    </div>;
  }
  
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Onboarding />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  return (
    <React.Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <Routes>
        {/* Admin CRM Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="rallies" element={<AdminRallies />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="my-rallys" element={<MyRallys />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<Chat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="verification" element={<Verification />} />
          <Route path="plus" element={<Plus />} />
          <Route path="safety" element={<Safety />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/personal-info" element={<EditProfile />} />
          <Route path="settings/notifications" element={<NotificationSettings />} />
          <Route path="settings/privacy" element={<PrivacySettings />} />
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
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}

