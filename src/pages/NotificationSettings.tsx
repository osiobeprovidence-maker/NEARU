import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bell, 
  MessageSquare, 
  Compass, 
  Mail, 
  Volume2, 
  Check, 
  Radio
} from 'lucide-react';

export default function NotificationSettings() {
  const { user, updateNotificationSettings } = useAuth();
  const [savedToast, setSavedToast] = useState(false);

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
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  return (
    <PageShell 
      title="Notification Settings"
      subtitle="Control how and when RALLY sends you alerts and updates"
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {savedToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Preferences saved
          </div>
        )}

        {/* Unified Continuous Container */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
          
          {/* Master Push Toggle */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-zinc-50/50">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/70">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-zinc-900 text-sm">Push Notifications</p>
                <p className="text-xs text-zinc-500 font-medium">Receive real-time alerts on your device</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={settings.pushEnabled} 
                onChange={() => handleToggle('pushEnabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
            </label>
          </div>

          {/* Group 1: Communication */}
          <div className="p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Communication
            </h3>
            
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Chat & Direct Messages</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Instant alerts when someone messages you about a meetup</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={settings.chatMessages} 
                    onChange={() => handleToggle('chatMessages')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Activity Reminders & Status</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Reminders 1 hour before meetups and status changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={settings.activityReminders} 
                    onChange={() => handleToggle('activityReminders')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Group 2: Matches & Discovery */}
          <div className="p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Matches & Discovery
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Nearby RALLY Matches</p>
                  <p className="text-[11px] text-zinc-500 font-medium">When neighbors post activities in your area or categories</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={settings.rallyMatches} 
                    onChange={() => handleToggle('rallyMatches')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Community Safety Broadcasts</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Crucial safety updates and verified neighborhood warnings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={settings.safetyAlerts} 
                    onChange={() => handleToggle('safetyAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Group 3: Marketing & Updates */}
          <div className="p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Marketing & Updates
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Weekly Activity Digest</p>
                  <p className="text-[11px] text-zinc-500 font-medium">A summary of the most popular RALLYS in your area</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={settings.emailDigest} 
                    onChange={() => handleToggle('emailDigest')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Product Announcements & Perks</p>
                  <p className="text-[11px] text-zinc-500 font-medium">News on feature drops, community rewards, and RALLY+ upgrades</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={settings.marketingUpdates} 
                    onChange={() => handleToggle('marketingUpdates')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Group 4: Feedback & Sound */}
          <div className="p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Sound & Feedback
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Notification Sounds</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Play chime on incoming messages and alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={settings.soundEnabled} 
                    onChange={() => handleToggle('soundEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Haptic Vibration</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Vibrate on alert</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={settings.vibrationEnabled} 
                    onChange={() => handleToggle('vibrationEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
