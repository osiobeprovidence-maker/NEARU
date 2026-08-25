import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Check, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  ArrowLeft,
  X,
  Plus
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=faces',
];

const AVAILABLE_INTERESTS = [
  'Outdoor & Sports',
  'Social Hangouts',
  'Music & Concerts',
  'Tech & Gaming',
  'Food & Dining',
  'Fitness & Running',
  'Art & Photography',
  'Books & Study',
  'Carpool & Travel',
  'Volunteering',
  'Board Games',
  'Nightlife & Raves',
];

const NIGERIAN_CITIES = [
  'Lagos, Nigeria',
  'Abuja (FCT), Nigeria',
  'Port Harcourt, Rivers',
  'Ibadan, Oyo',
  'Benin City, Edo',
  'Enugu, Nigeria',
  'Calabar, Cross River',
  'Abeokuta, Ogun',
  'Kaduna, Nigeria',
  'Kano, Nigeria',
  'Asaba, Delta',
];

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [location, setLocation] = useState(user.location || 'Lagos, Nigeria');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [gender, setGender] = useState(user.gender || 'Prefer not to say');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [interests, setInterests] = useState<string[]>(user.interests || ['Outdoor & Sports', 'Social Hangouts']);
  
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [newCustomInterest, setNewCustomInterest] = useState('');
  const [showAddInterest, setShowAddInterest] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      username: username.startsWith('@') ? username : `@${username}`,
      bio,
      email,
      phone,
      location,
      avatar,
      gender,
      birthday,
      interests,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      navigate('/profile');
    }, 1200);
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleAddCustomInterest = () => {
    if (newCustomInterest.trim() && !interests.includes(newCustomInterest.trim())) {
      setInterests([...interests, newCustomInterest.trim()]);
      setNewCustomInterest('');
      setShowAddInterest(false);
    }
  };

  return (
    <PageShell 
      title="Personal Information" 
      subtitle="Update your profile details and preferences"
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
      <form onSubmit={handleSave} className="space-y-6 max-w-2xl mx-auto pb-12">
        {/* Saved Success Toast Notification */}
        {isSaved && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-5 h-5" />
            Profile updated successfully!
          </div>
        )}

        {/* Avatar Section */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-8 text-center">
          <div className="relative inline-block mb-4">
            <img 
              src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'} 
              alt={name} 
              className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-white shadow-md bg-zinc-100 ring-1 ring-zinc-200"
            />
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute bottom-0 right-0 p-2.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-transform active:scale-95 shadow-md"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {showAvatarPicker ? 'Hide Photo Options' : 'Choose New Photo'}
            </button>
          </div>

          {/* Avatar Picker Palette */}
          {showAvatarPicker && (
            <div className="mt-6 pt-6 border-t border-zinc-100 animate-in fade-in duration-200">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Select Preset Avatar</p>
              <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
                {PRESET_AVATARS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(presetUrl);
                      setShowAvatarPicker(false);
                    }}
                    className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all hover:scale-105 ${
                      avatar === presetUrl ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={presetUrl} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                    {avatar === presetUrl && (
                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white font-bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-zinc-900 text-base">Public Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@alexj"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
              Bio / About You
            </label>
            <textarea 
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your neighbors what you enjoy doing, what you can help with, or what you are looking for..."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-medium text-zinc-900 text-sm resize-none transition-colors"
            />
            <p className="text-[11px] text-zinc-400 text-right mt-1">{bio.length}/160 characters</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
              City & Region
            </label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm appearance-none pr-10 transition-colors"
              >
                {NIGERIAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Private Contact & Identity Details */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-zinc-900 text-base">Contact & Identity</h3>
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">Private</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.johnson@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 812 345 6789"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                />
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <input 
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Interests & Activities */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900 text-base">Your Interests & Vibes</h3>
            <span className="text-xs font-bold text-zinc-400">{interests.length} selected</span>
          </div>

          <p className="text-xs text-zinc-500 font-medium">
            Select the categories and activities you are interested in seeing first in your local feed.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                    isSelected 
                      ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900' 
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 ring-1 ring-zinc-200/60'
                  }`}
                >
                  {interest}
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}

            {/* Custom added interests */}
            {interests.filter(i => !AVAILABLE_INTERESTS.includes(i)).map(custom => (
              <button
                key={custom}
                type="button"
                onClick={() => toggleInterest(custom)}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                {custom}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>

          {/* Add custom interest button */}
          {showAddInterest ? (
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="text"
                placeholder="e.g. Chess Club, Pottery, Hiking"
                value={newCustomInterest}
                onChange={(e) => setNewCustomInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomInterest();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="px-3 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddInterest(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddInterest(true)}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add custom interest
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 px-4 md:px-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl font-bold text-sm transition-colors text-center active:scale-98"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-2 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-sm shadow-md shadow-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Profile Changes
          </button>
        </div>
      </form>
    </PageShell>
  );
}
