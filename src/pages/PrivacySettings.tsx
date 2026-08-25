import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  MapPin, 
  MessageSquare, 
  UserX, 
  Download, 
  Trash2, 
  Check, 
  ArrowLeft,
  Lock,
  AlertTriangle,
  Radio
} from 'lucide-react';

export default function PrivacySettings() {
  const { user, updatePrivacySettings, unblockUser } = useAuth();
  const navigate = useNavigate();
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
    }, 1200);
  };

  return (
    <PageShell 
      title="Privacy & Permissions"
      subtitle="Take full control of what information you share with others"
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
        {savedToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-4 h-4 text-emerald-400" />
            Privacy settings updated
          </div>
        )}

        {/* Profile Visibility */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Eye className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-zinc-900 text-base">Profile Visibility</h3>
          </div>

          <p className="text-xs text-zinc-500 font-medium">
            Choose who can discover your profile when browsing nearby community members.
          </p>

          <div className="space-y-2.5">
            {[
              { id: 'public', label: 'Public to Everyone', desc: 'Anyone in your city or neighborhood can see your public bio and badges.' },
              { id: 'verified_only', label: 'NIN Verified Neighbors Only', desc: 'Only users who have verified their identity can discover your profile.' },
              { id: 'private', label: 'Private (Activity participants only)', desc: 'Only visible to people participating in the same RALLYS with you.' },
            ].map((option) => (
              <label 
                key={option.id}
                onClick={() => handleUpdate('profileVisibility', option.id)}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
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
                  className="mt-1 text-zinc-900 focus:ring-zinc-900"
                />
                <div>
                  <p className="text-sm font-bold text-zinc-900">{option.label}</p>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Location Precision */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-zinc-900 text-base">Location Precision & Safety</h3>
          </div>

          <p className="text-xs text-zinc-500 font-medium">
            RALLY never shares your exact GPS coordinates publicly. Select your preferred distance resolution.
          </p>

          <div className="space-y-2.5">
            {[
              { id: 'approximate', label: 'Approximate Radius (~500m)', desc: 'Displays general neighborhood distance (e.g. "1.2 km away"). Recommended for safety.' },
              { id: 'city_only', label: 'City / District Only', desc: 'Only shows your city or local council area, no specific distance.' },
              { id: 'exact', label: 'Exact Spot (After Meetup Acceptance)', desc: 'Shares meeting point address only after both parties accept the RALLY.' },
            ].map((option) => (
              <label 
                key={option.id}
                onClick={() => handleUpdate('locationPrecision', option.id)}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
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
                  className="mt-1 text-zinc-900 focus:ring-zinc-900"
                />
                <div>
                  <p className="text-sm font-bold text-zinc-900">{option.label}</p>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Direct Messages & Activity Status */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-zinc-900 text-base">Direct Messages & Online Presence</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-zinc-900 text-sm">Show Online Activity Status</p>
                <p className="text-xs text-zinc-500 font-medium">Allow neighbors to see when you were recently active</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={privacy.showOnlineStatus} 
                  onChange={() => handleUpdate('showOnlineStatus', !privacy.showOnlineStatus)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-50">
              <div>
                <p className="font-bold text-zinc-900 text-sm">Send Read Receipts</p>
                <p className="text-xs text-zinc-500 font-medium">Let others know when you have viewed their chat message</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={privacy.showReadReceipts} 
                  onChange={() => handleUpdate('showReadReceipts', !privacy.showReadReceipts)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Blocked Users List */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-zinc-900 text-base">Blocked Accounts</h3>
            </div>
            <span className="text-xs font-bold text-zinc-400">
              {user.blockedUsers?.length || 0} blocked
            </span>
          </div>

          {user.blockedUsers && user.blockedUsers.length > 0 ? (
            <div className="space-y-3">
              {user.blockedUsers.map((blocked) => (
                <div key={blocked.id} className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <img src={blocked.avatar} alt={blocked.name} className="w-10 h-10 rounded-full object-cover bg-zinc-200" />
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">{blocked.name}</p>
                      <p className="text-xs text-zinc-400 font-medium">{blocked.username} • Blocked {blocked.blockedAt}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => unblockUser(blocked.id)}
                    className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 font-medium">You haven't blocked anyone yet.</p>
          )}
        </div>

        {/* Data Rights & Account Management */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <h3 className="font-bold text-zinc-900 text-base pb-3 border-b border-zinc-100">Your Data & Rights</h3>

          <div className="space-y-3">
            <button
              onClick={handleDownloadData}
              disabled={downloadSuccess}
              className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-colors font-bold text-zinc-800 text-sm"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-zinc-600" />
                <span>{downloadSuccess ? 'Preparing JSON Export...' : 'Download My Personal Data'}</span>
              </div>
              <span className="text-xs text-zinc-400 font-medium">JSON Archive</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl transition-colors font-bold text-sm"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>Delete Account & Erase All Records</span>
              </div>
              <span className="text-xs text-rose-400 font-medium">Permanent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-3xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-zinc-900">Delete Your Account?</h3>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              This action is permanent and cannot be undone. All your active RALLYS, chat history, earned badges, and verification status will be permanently erased.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm"
              >
                Keep Account
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-600/20"
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
