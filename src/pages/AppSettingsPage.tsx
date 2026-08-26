import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { 
  Smartphone, 
  Moon, 
  Sun, 
  Globe, 
  Database, 
  Trash2, 
  Check, 
  Wifi,
  Sparkles
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'pcm', name: 'Nigerian Pidgin' },
  { code: 'yo', name: 'Yorùbá' },
  { code: 'ig', name: 'Asụsụ Igbo' },
  { code: 'ha', name: 'Harshen Hausa' },
  { code: 'fr', name: 'Français' },
];

export default function AppSettingsPage() {
  const { user, updateAppSettings, clearAppCache } = useAuth();
  const [toastMessage, setToastMessage] = useState('');

  const appSettings = user.appSettings || {
    theme: 'system',
    language: 'English (US)',
    dataSaver: false,
    autoPlayMedia: true,
    cacheSizeMB: 24.8,
  };

  const handleUpdate = (key: keyof typeof appSettings, value: any, label: string) => {
    updateAppSettings({ [key]: value });
    setToastMessage(`${label} updated`);
    setTimeout(() => setToastMessage(''), 1500);
  };

  const handleClearCache = () => {
    clearAppCache();
    setToastMessage('Cache cleared');
    setTimeout(() => setToastMessage(''), 1500);
  };

  return (
    <PageShell 
      title="App Settings"
      subtitle="Theme, language, network efficiency, and device storage"
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {/* Unified Continuous Container */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
          
          {/* Section 1: Appearance / Theme */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Appearance
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'system', label: 'System', icon: Smartphone },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
              ].map((theme) => {
                const Icon = theme.icon;
                const isSelected = appSettings.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleUpdate('theme', theme.id, 'Theme')}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      isSelected 
                        ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-xs' 
                        : 'border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:bg-zinc-100 font-semibold'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Language */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Language
              </h3>
            </div>

            <select
              value={appSettings.language}
              onChange={(e) => handleUpdate('language', e.target.value, 'Language')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 font-bold text-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section 3: Data Saver */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Data Saver
              </h3>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Data Saver Mode</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Compress images and reduce mobile data consumption</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={appSettings.dataSaver} 
                    onChange={() => handleUpdate('dataSaver', !appSettings.dataSaver, 'Data Saver')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Auto-play Media</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Play animations and previews on Wi-Fi</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={appSettings.autoPlayMedia} 
                    onChange={() => handleUpdate('autoPlayMedia', !appSettings.autoPlayMedia, 'Auto-play Media')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Storage & Cache */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Storage & Cache
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-400">
                {appSettings.cacheSizeMB.toFixed(1)} MB
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearCache}
              className="w-full py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Clear Temporary Cache</span>
            </button>
          </div>

          {/* Section 5: App Version */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-900">App Version</p>
              <p className="text-[11px] text-zinc-400 font-mono">v2.4.0 (Build 2026.08) · Up to date</p>
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded ring-1 ring-emerald-200">
              Latest
            </span>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
