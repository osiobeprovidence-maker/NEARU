import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Smartphone, 
  Moon, 
  Sun, 
  Globe, 
  Database, 
  Trash2, 
  Check, 
  ArrowLeft, 
  Info,
  Layers,
  Sparkles,
  Wifi
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
  const navigate = useNavigate();

  const [cacheCleared, setCacheCleared] = useState(false);
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
    setCacheCleared(true);
    setToastMessage('Temporary cache and offline files cleared');
    setTimeout(() => {
      setCacheCleared(false);
      setToastMessage('');
    }, 2000);
  };

  return (
    <PageShell 
      title="App Settings"
      subtitle="Customize theme, language, and performance preferences"
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
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {/* Appearance & Theme */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Moon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-zinc-900 text-base">Appearance</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    isSelected 
                      ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-sm' 
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 font-semibold'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-zinc-900 text-base">Language</h3>
          </div>

          <div className="relative">
            <select
              value={appSettings.language}
              onChange={(e) => handleUpdate('language', e.target.value, 'Language')}
              className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 font-bold text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Performance & Data Saver */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Wifi className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-zinc-900 text-base">Data & Performance</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm">Data Saver Mode</p>
                <p className="text-xs text-zinc-500 font-medium">Compress images and lower network usage on mobile data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={appSettings.dataSaver} 
                  onChange={() => handleUpdate('dataSaver', !appSettings.dataSaver, 'Data Saver')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-50">
              <div>
                <p className="font-bold text-zinc-900 text-sm">Auto-play Media on Wi-Fi</p>
                <p className="text-xs text-zinc-500 font-medium">Automatically preview video loops and animations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={appSettings.autoPlayMedia} 
                  onChange={() => handleUpdate('autoPlayMedia', !appSettings.autoPlayMedia, 'Auto-play Media')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Storage & Cache */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-zinc-900 text-base">Storage & Cache</h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500">
              {appSettings.cacheSizeMB.toFixed(1)} MB cached
            </span>
          </div>

          <p className="text-xs text-zinc-500 font-medium">
            Clear temporary image previews and cached maps to free up local device space.
          </p>

          <button
            type="button"
            onClick={handleClearCache}
            className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-zinc-600" />
            {cacheCleared ? 'Cache Cleared!' : 'Clear Cache & Offline Storage'}
          </button>
        </div>

        {/* App Version & Diagnostics */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 text-center space-y-3">
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-2xl mx-auto flex items-center justify-center font-black">
            R
          </div>
          <div>
            <h4 className="font-black text-zinc-900 text-sm">RALLY Community Platform</h4>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Version 2.4.0 (Build 412) • Production</p>
          </div>

          <div className="flex justify-center gap-4 text-xs font-bold text-zinc-600 pt-1">
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
