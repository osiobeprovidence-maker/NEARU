import React, { useState, useEffect } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Bell,
  MessageSquare,
  Compass,
  Mail,
  Volume2,
  Check,
  Radio,
  Send,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  isPushSupported,
  getPushPermissionState,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from '../utils/pushManager';

export default function NotificationSettings() {
  const { user, updateNotificationSettings } = useAuth();
  const [savedToast, setSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Preferences saved');
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const savePushSubscription = useMutation(api.notifications.savePushSubscription);
  const clearPushSubscriptions = useMutation(api.notifications.clearUserPushSubscriptions);
  const sendTestPushMutation = useMutation(api.notifications.sendTestPush);

  useEffect(() => {
    setBrowserPermission(getPushPermissionState());
  }, []);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleToggle = (key: keyof typeof settings) => {
    updateNotificationSettings({ [key]: !settings[key] });
    showToast('Preferences saved');
  };

  const handlePushMasterToggle = async () => {
    setErrorMessage(null);
    const targetState = !settings.pushEnabled;

    if (targetState) {
      // User is enabling push notifications
      if (!isPushSupported()) {
        setErrorMessage('Push notifications are not supported in this browser.');
        return;
      }

      setIsSubscribing(true);
      try {
        const result = await subscribeUserToPush(user.id, savePushSubscription);
        setBrowserPermission(getPushPermissionState());

        if (result.success) {
          updateNotificationSettings({ pushEnabled: true });
          showToast('Push notifications activated!');
        } else {
          setErrorMessage(result.error || 'Failed to enable push notifications.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to subscribe to push notifications.');
      } finally {
        setIsSubscribing(false);
      }
    } else {
      // User is disabling push notifications
      setIsSubscribing(true);
      try {
        await unsubscribeUserFromPush(user.id, clearPushSubscriptions);
        updateNotificationSettings({ pushEnabled: false });
        showToast('Push notifications disabled');
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to unsubscribe.');
      } finally {
        setIsSubscribing(false);
      }
    }
  };

  const handleSendTestNotification = async () => {
    if (!user.id) return;
    setIsTestingPush(true);
    setErrorMessage(null);
    try {
      // First ensure the subscription is fresh
      await subscribeUserToPush(user.id, savePushSubscription);
      await sendTestPushMutation({ userId: user.id as any });
      showToast('Test notification dispatched! Check your desktop/device.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to trigger test notification.');
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <PageShell 
      title="Notification Settings"
      subtitle="Control how and when lalao sends you alerts and updates"
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {savedToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              {browserPermission === 'denied' && (
                <p className="mt-1 text-[11px] text-rose-600 font-normal">
                  To enable notifications: click the site settings / lock icon in your browser address bar and change Notifications to "Allow".
                </p>
              )}
            </div>
          </div>
        )}

        {/* Unified Continuous Container */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
          
          {/* Master Push Toggle & OS Status */}
          <div className="p-4 sm:p-5 bg-zinc-50/50 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/70">
                  {isSubscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-zinc-900 text-sm">OS System Push Notifications</p>
                    {browserPermission === 'granted' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                    {browserPermission === 'denied' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Blocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    Receive real-time desktop & mobile system banners even when app is closed
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={settings.pushEnabled && browserPermission === 'granted'} 
                  disabled={isSubscribing}
                  onChange={handlePushMasterToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            {/* Test Push Notification button */}
            {browserPermission === 'granted' && settings.pushEnabled && (
              <div className="pt-2 flex items-center justify-between border-t border-zinc-200/60 text-xs">
                <span className="text-zinc-500 font-medium">Want to see how notifications look?</span>
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  disabled={isTestingPush}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isTestingPush ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Test Notification
                </button>
              </div>
            )}
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
