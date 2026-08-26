import React, { useState, useRef } from 'react';
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
  Plus,
  Heart,
  Upload,
  ImageIcon
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [location, setLocation] = useState(user.location || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [gender, setGender] = useState(user.gender || 'Prefer not to say');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [interests, setInterests] = useState<string[]>(user.interests || ['Outdoor & Sports', 'Social Hangouts']);
  
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [newCustomInterest, setNewCustomInterest] = useState('');
  const [showAddInterest, setShowAddInterest] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatar(dataUrl);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
      title="Personal Info" 
      subtitle="Update your profile details and preferences"
    >
      <form onSubmit={handleSave} className="space-y-4 max-w-2xl mx-auto pb-12">
        {/* Saved Success Toast Notification */}
        {isSaved && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full font-bold shadow-xl flex items-center gap-2 text-xs sm:text-sm animate-in fade-in slide-in-from-top-3 duration-200">
            <Check className="w-4 h-4" />
            Profile updated successfully!
          </div>
        )}

        {/* Unified Continuous Edit Container */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
          
          {/* 1. Profile Photo Section (Compact & Integrated) */}
          <div className="py-4 sm:py-5 px-4 sm:px-6 text-center">
            <div className="relative inline-block mb-1.5">
              <img 
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'} 
                alt={name} 
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full mx-auto object-cover border-2 border-white shadow-sm bg-zinc-100 ring-1 ring-zinc-200"
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 p-1.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                title="Change Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors py-0.5"
              >
                {showAvatarPicker ? 'Hide Photo Options' : 'Change Photo'}
              </button>
            </div>

            {/* Avatar Picker Palette (Compact Accordion) */}
            {showAvatarPicker && (
              <div className="mt-3 pt-3 border-t border-zinc-100 animate-in fade-in duration-200">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mb-3 py-3 border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Upload your own photo
                </button>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">Or choose a preset</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 max-w-sm mx-auto">
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
                          <Check className="w-3.5 h-3.5 text-white font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Public Details Section */}
          <div className="p-4 sm:p-6 space-y-3.5">
            <div className="flex items-center gap-2 pb-1">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-zinc-900 text-sm sm:text-base">Public Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@alexj"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                Bio / About You
              </label>
              <textarea 
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your neighbors what you enjoy doing, what you can help with, or what you are looking for..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-medium text-zinc-900 text-sm resize-none transition-colors"
              />
              <p className="text-[10px] font-medium text-zinc-400 text-right mt-0.5">{bio.length}/160 characters</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                City & Region
              </label>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm appearance-none pr-10 transition-colors"
                >
                  {NIGERIAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 3. Interests & Vibes Section */}
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-zinc-900 text-sm sm:text-base">Interests & Vibes</h3>
              </div>
              <span className="text-[11px] font-bold text-zinc-400">{interests.length} selected</span>
            </div>

            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Select what you are interested in doing with neighbors in your local feed.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                      isSelected 
                        ? 'bg-zinc-900 text-white shadow-xs ring-1 ring-zinc-900' 
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {interest}
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}

              {/* Custom added interests */}
              {interests.filter(i => !AVAILABLE_INTERESTS.includes(i)).map(custom => (
                <button
                  key={custom}
                  type="button"
                  onClick={() => toggleInterest(custom)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  {custom}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>

            {/* Add custom interest button */}
            {showAddInterest ? (
              <div className="flex items-center gap-2 pt-1">
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
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddInterest(true)}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 pt-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add custom interest
              </button>
            )}
          </div>

          {/* 4. Contact & Identity Details (Private) */}
          <div className="p-4 sm:p-6 space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-zinc-900 text-sm sm:text-base">Contact & Identity</h3>
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">Private</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.johnson@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 812 345 6789"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                  />
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <input 
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-semibold text-zinc-900 text-sm transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 px-3 sm:px-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold text-xs sm:text-sm transition-colors text-center active:scale-98"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save Profile Changes
          </button>
        </div>
      </form>
    </PageShell>
  );
}
