import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { 
  Eye, 
  MapPin, 
  UserX, 
  Download, 
  Trash2, 
  Check, 
  AlertTriangle
} from 'lucide-react';

export default function PrivacySettings() {
  const { user, updatePrivacySettings, unblockUser } = useAuth();
  const [savedToast, setSavedToast] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const privacy = user.privacySettings || {
    profileVisibility: 'public',
    locationPrecision: 'approximate',
    whoCanMessage: 'everyone',
    showOnlineStatus: true,
    showReadReceipts: true,
  };

  const handleUpdate = (key: keyof typeof privacy, value: any) => {
    updatePrivacySettings({ [key]: value });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  const handleDownloadData = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `rally_user_data_${user.username}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setDownloadSuccess(false);
    }, 1000);
  };

  return (
    <PageShell 
      title="Privacy & Safety"
      subtitle="Manage profile visibility, location resolution, and personal data"
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {savedToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Settings saved
          </div>
        )}

        {/* Unified Continuous Container */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
          
          {/* Section 1: Profile Visibility */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Profile Visibility
              </h3>
            </div>

            <div className="space-y-2">
              {[
                { id: 'public', label: 'Public to Everyone', desc: 'Discoverable by all neighbors in your city.' },
                { id: 'verified_only', label: 'NIN Verified Only', desc: 'Only identity-verified members can see your profile.' },
                { id: 'private', label: 'Activity Participants Only', desc: 'Visible only to people joining your accepted RALLYS.' },
              ].map((option) => (
                <label 
                  key={option.id}
                  onClick={() => handleUpdate('profileVisibility', option.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    privacy.profileVisibility === option.id 
                      ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900' 
                      : 'border-zinc-200 hover:bg-zinc-50/60'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="profileVisibility" 
                    checked={privacy.profileVisibility === option.id}
                    onChange={() => {}}
                    className="mt-0.5 text-zinc-900 focus:ring-zinc-900"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900">{option.label}</p>
                    <p className="text-[11px] text-zinc-500 font-medium">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Location Sharing */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Location Sharing
              </h3>
            </div>

            <div className="space-y-2">
              {[
                { id: 'approximate', label: 'Approximate (~500m radius)', desc: 'Shows approximate neighborhood distance (Recommended).' },
                { id: 'city_only', label: 'City / District Only', desc: 'Shows city only without specific distances.' },
                { id: 'exact', label: 'Exact Spot (After Meetup Acceptance)', desc: 'Reveals exact venue after RSVP confirmation.' },
              ].map((option) => (
                <label 
                  key={option.id}
                  onClick={() => handleUpdate('locationPrecision', option.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    privacy.locationPrecision === option.id 
                      ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900' 
                      : 'border-zinc-200 hover:bg-zinc-50/60'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="locationPrecision" 
                    checked={privacy.locationPrecision === option.id}
                    onChange={() => {}}
                    className="mt-0.5 text-zinc-900 focus:ring-zinc-900"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900">{option.label}</p>
                    <p className="text-[11px] text-zinc-500 font-medium">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Direct Messages & Online Presence */}
          <div className="p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Activity & Chat
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Show Online Status</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Let neighbors see when you are active</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={privacy.showOnlineStatus} 
                    onChange={() => handleUpdate('showOnlineStatus', !privacy.showOnlineStatus)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Read Receipts</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Show when you have read direct messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={privacy.showReadReceipts} 
                    onChange={() => handleUpdate('showReadReceipts', !privacy.showReadReceipts)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Blocked Users */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-zinc-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Blocked Users
                </h3>
              </div>
              <span className="text-xs font-bold text-zinc-400">
                {user.blockedUsers?.length || 0}
              </span>
            </div>

            {user.blockedUsers && user.blockedUsers.length > 0 ? (
              <div className="space-y-2">
                {user.blockedUsers.map((blocked) => (
                  <div key={blocked.id} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={blocked.avatar} alt={blocked.name} className="w-8 h-8 rounded-full object-cover bg-zinc-200 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 text-xs truncate">{blocked.name}</p>
                        <p className="text-[10px] text-zinc-400 font-medium truncate">{blocked.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblockUser(blocked.id)}
                      className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-lg text-xs font-bold transition-colors shrink-0 ml-2"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-medium">No accounts currently blocked.</p>
            )}
          </div>

          {/* Section 5: Data & Privacy */}
          <div className="p-4 sm:p-5 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Data & Privacy
            </h3>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadData}
                disabled={downloadSuccess}
                className="w-full flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors font-bold text-zinc-800 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-zinc-600" />
                  <span>{downloadSuccess ? 'Preparing export...' : 'Download personal data'}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors font-bold text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete account</span>
                </div>
                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Permanent</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-xl border border-zinc-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900">Delete Account?</h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-1">
                This action is irreversible. All your profile data, chat history, and verification records will be permanently removed.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
