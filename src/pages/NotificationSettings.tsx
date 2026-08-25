import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  MessageSquare, 
  MapPin, 
  ShieldAlert, 
  Mail, 
  Volume2, 
  Vibrate, 
  Check, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function NotificationSettings() {
  const { user, updateNotificationSettings } = useAuth();
  const navigate = useNavigate();
  const [savedMessage, setSavedMessage] = useState(false);

  const settings = user.notificationSettings || {
    pushEnabled: true,
    rallyMatches: true,
    chatMessages: true,
    activityReminders: true,
    safetyAlerts: true,
    emailDigest: false,
    marketingUpdates: false,
    soundEnabled: true,
    vibrationEnabled: true,
  };

  const handleToggle = (key: keyof typeof settings) => {
    updateNotificationSettings({ [key]: !settings[key] });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 1500);
  };

  return (
    <PageShell 
      title="Notification Preferences"
      subtitle="Control how and when RALLY sends you alerts"
      headerAction={
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors inline-flex items-center gap-1 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      }
    >
      <div className="space-y-6 max-w-2xl mx-auto pb-12">
        {savedMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-4 h-4 text-emerald-400" />
            Notification preferences saved
          </div>
        )}

        {/* Master Push Switch */}
        <div className="bg-zinc-900 text-white p-6 md:rounded-[2rem] border-y md:border border-zinc-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Push Notifications</h3>
              <p className="text-xs text-zinc-300 font-medium">Receive real-time alerts on your device</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              checked={settings.pushEnabled} 
              onChange={() => handleToggle('pushEnabled')}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>

        {/* Activity & Matching Alerts */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Activity & Discovery</h3>
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm sm:text-base">Nearby RALLY Matches</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">When neighbors post activities in your categories or nearby</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.rallyMatches} 
                  onChange={() => handleToggle('rallyMatches')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm sm:text-base">Chat & Direct Messages</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">When someone messages you regarding a RALLY meetup</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.chatMessages} 
                  onChange={() => handleToggle('chatMessages')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm sm:text-base">Activity Reminders & Status</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Reminders 1 hour before scheduled meetups and status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.activityReminders} 
                  onChange={() => handleToggle('activityReminders')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Safety & Emergency */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Safety & Alerts</h3>
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm sm:text-base">Community Safety Broadcasts</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Crucial safety updates and neighborhood warnings (Recommended)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.safetyAlerts} 
                  onChange={() => handleToggle('safetyAlerts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Sound & Haptics */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Sounds & Feedback</h3>
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm sm:text-base">In-App Notification Sounds</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Play pleasant chime sounds for incoming messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.soundEnabled} 
                  onChange={() => handleToggle('soundEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm sm:text-base">Vibration / Haptic Feedback</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Vibrate device on alert</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.vibrationEnabled} 
                  onChange={() => handleToggle('vibrationEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Email Preferences */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Email Updates</h3>
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm sm:text-base">Weekly Activity Digest</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">A summary of the most popular RALLYS in your area</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.emailDigest} 
                  onChange={() => handleToggle('emailDigest')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm sm:text-base">Product Announcements & Features</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">News on feature drops, community rewards, and RALLY+ perks</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.marketingUpdates} 
                  onChange={() => handleToggle('marketingUpdates')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
