import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  MapPin, 
  EyeOff, 
  Flag, 
  Ban, 
  PhoneCall, 
  UserPlus, 
  Trash2, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Building2, 
  ShieldCheck,
  Send
} from 'lucide-react';

const EMERGENCY_HOTLINES = [
  { name: 'National Emergency Toll-Free', number: '112', desc: 'Police, Ambulance & Fire Services (Nationwide)' },
  { name: 'Lagos State Emergency Command', number: '767', desc: 'Lagos Emergency Management Agency (LASEMA)' },
  { name: 'Federal Road Safety Corps (FRSC)', number: '122', desc: 'Accident & Highway Emergency' },
];

const SAFE_MEETUP_SPOTS = [
  { name: 'Major Shopping Malls & Plazas', desc: 'Palms Mall, Ikeja City Mall, Jabi Lake Mall (High CCTV & security)' },
  { name: 'Verified Bank Customer Service Lobbies', desc: 'Well-lit with on-site security personnel' },
  { name: 'Well-known Supermarkets & Cafes', desc: 'Daytime cafes, restaurants with outdoor seating' },
  { name: 'Police Divisional Headquarters', desc: 'Safe exchange zones for high-value peer transactions' },
];

export default function Safety() {
  const { user, addTrustedContact, removeTrustedContact } = useAuth();
  
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Family');
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName.trim() && contactPhone.trim()) {
      addTrustedContact({
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relationship: contactRelation,
      });
      setContactName('');
      setContactPhone('');
      setShowAddContact(false);
    }
  };

  const handleSimulateShareLocation = (contactName: string) => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  return (
    <PageShell 
      title="Safety Center"
      subtitle="Resources, tools, and emergency safeguards to keep every RALLY safe"
    >
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        {/* Urgent Emergency SOS Banner */}
        <div className="bg-rose-600 text-white p-6 sm:p-8 md:rounded-[2rem] border-y md:border border-rose-700 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Emergency Hotline
              </div>
              <h3 className="text-2xl font-black tracking-tight">Need immediate help?</h3>
              <p className="text-rose-100 text-xs sm:text-sm font-medium mt-1">
                If you ever feel in immediate danger during any meetup, call national emergency services right away.
              </p>
            </div>
            <a 
              href="tel:112"
              className="px-6 py-3.5 bg-white text-rose-600 hover:bg-rose-50 rounded-2xl font-bold text-sm transition-transform active:scale-95 text-center flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <PhoneCall className="w-4 h-4" />
              Call 112
            </a>
          </div>
        </div>

        {shareSuccess && (
          <div className="bg-emerald-600 text-white p-4 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm animate-in fade-in">
            <Check className="w-4 h-4" />
            Live RALLY safety link sent to your trusted contact via SMS
          </div>
        )}

        {/* Trusted Emergency Contacts Toolkit */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-base">Trusted Emergency Contacts</h4>
                <p className="text-xs text-zinc-500 font-medium">Share your active meetup details with 1 tap</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddContact(!showAddContact)}
              className="px-3.5 py-2 bg-zinc-900 text-white rounded-2xl text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Contact
            </button>
          </div>

          {/* Add Contact Form */}
          {showAddContact && (
            <form onSubmit={handleAddContactSubmit} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3 animate-in fade-in duration-200">
              <h5 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">New Trusted Contact</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="text"
                  required
                  placeholder="Full Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <input 
                  type="tel"
                  required
                  placeholder="Phone (e.g. +234...)"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <select
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="Family">Family</option>
                  <option value="Friend">Friend</option>
                  <option value="Partner">Partner</option>
                  <option value="Colleague">Colleague</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-3.5 py-2 bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl"
                >
                  Save Contact
                </button>
              </div>
            </form>
          )}

          {/* Contact List */}
          <div className="space-y-2.5">
            {user.trustedContacts && user.trustedContacts.length > 0 ? (
              user.trustedContacts.map((contact) => (
                <div key={contact.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 text-sm">{contact.name}</span>
                      <span className="text-[10px] font-bold uppercase text-zinc-700 bg-zinc-200/70 px-2 py-0.5 rounded-full">
                        {contact.relationship}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{contact.phone}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleSimulateShareLocation(contact.name)}
                      className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Safety Link
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrustedContact(contact.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 font-medium">No trusted contacts added yet. Add a family member or friend to keep them in the loop.</p>
            )}
          </div>
        </div>

        {/* 4 Golden Rules for Safe Meetups */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Safety Principles</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 space-y-2">
              <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-sm">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>1. Choose Public Venues</span>
              </div>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Always organize first-time meetups in well-lit, populated places like shopping malls, busy cafes, or sports complexes.
              </p>
            </div>

            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 space-y-2">
              <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-sm">
                <EyeOff className="w-5 h-5 text-indigo-600" />
                <span>2. Keep Sensitive Info Private</span>
              </div>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Never share banking OTPs, BVN, debit card CVVs, or exact residential addresses in open chat threads.
              </p>
            </div>

            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 space-y-2">
              <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>3. Check NIN Badges</span>
              </div>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Prioritize connecting with NIN Verified neighbors and look for positive ratings and earned community badges.
              </p>
            </div>

            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 space-y-2">
              <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-sm">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <span>4. Share Your Plan</span>
              </div>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Always inform a trusted friend where you are meeting, who you are meeting with, and when you expect to finish.
              </p>
            </div>
          </div>
        </div>

        {/* Safe Meetup Spot Ideas */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-3">
          <h4 className="font-bold text-zinc-900 text-base pb-2 border-b border-zinc-100">Recommended Safe Meeting Locations</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {SAFE_MEETUP_SPOTS.map((spot) => (
              <div key={spot.name} className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs">
                <p className="font-bold text-zinc-900 mb-0.5">{spot.name}</p>
                <p className="text-zinc-500 font-medium">{spot.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Hotlines Directory */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 space-y-3">
          <h4 className="font-bold text-zinc-900 text-base pb-2 border-b border-zinc-100">Emergency Hotlines Directory</h4>
          <div className="space-y-2">
            {EMERGENCY_HOTLINES.map((hotline) => (
              <div key={hotline.number} className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div>
                  <p className="font-bold text-zinc-900 text-xs">{hotline.name}</p>
                  <p className="text-[11px] text-zinc-500 font-medium">{hotline.desc}</p>
                </div>
                <a 
                  href={`tel:${hotline.number}`}
                  className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold font-mono hover:bg-zinc-800 transition-colors shrink-0 ml-3"
                >
                  {hotline.number}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Safety Actions */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 px-6 md:px-2">Report & Block</h3>
          
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            <Link 
              to="/report/general" 
              className="w-full flex items-center justify-between p-5 hover:bg-rose-50/50 text-rose-700 transition-colors font-bold text-sm"
            >
              <div className="flex items-center gap-3">
                <Flag className="w-5 h-5 text-rose-600" />
                Report a Suspicious RALLY or Scam
              </div>
              <span className="text-rose-400">&rarr;</span>
            </Link>

            <Link 
              to="/settings/privacy" 
              className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 text-zinc-800 transition-colors font-bold text-sm"
            >
              <div className="flex items-center gap-3">
                <Ban className="w-5 h-5 text-zinc-600" />
                Manage Blocked Users in Privacy Settings
              </div>
              <span className="text-zinc-400">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
