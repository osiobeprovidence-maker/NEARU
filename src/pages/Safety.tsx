import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  PhoneCall, 
  UserPlus, 
  Trash2, 
  Check, 
  Send,
  ShieldCheck,
  Flag,
  Share2,
  BellRing
} from 'lucide-react';

const EMERGENCY_HOTLINES = [
  { name: 'National Emergency Toll-Free', number: '112', desc: 'Police, Ambulance & Fire Services (Nationwide)' },
  { name: 'Lagos State Emergency Command', number: '767', desc: 'Lagos Emergency Management Agency (LASEMA)' },
  { name: 'Federal Road Safety Corps (FRSC)', number: '122', desc: 'Accident & Highway Emergency' },
];

export default function Safety() {
  const { user, addTrustedContact, removeTrustedContact } = useAuth();
  
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Family');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Sharing preferences state
  const [autoShare, setAutoShare] = useState(true);
  const [sosAlert, setSosAlert] = useState(true);

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

  const handleSimulateShareLocation = (name: string) => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const contacts = user.trustedContacts || [];
  const primaryContact = contacts[0];
  const secondaryContact = contacts[1];

  return (
    <PageShell 
      title="Emergency Contacts & Safety"
      subtitle="Set up trusted contacts and emergency sharing safeguards"
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {shareSuccess && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Safety link sent via SMS
          </div>
        )}

        {/* Unified Continuous Container */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
          
          {/* Section 1: Trusted Contacts Setup */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Trusted Contacts
                </h3>
              </div>

              {contacts.length < 2 && !showAddContact && (
                <button
                  type="button"
                  onClick={() => setShowAddContact(true)}
                  className="px-2.5 py-1 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              )}
            </div>

            {/* Inline Quick Add Form */}
            {showAddContact && (
              <form onSubmit={handleAddContactSubmit} className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-900">
                    {contacts.length === 0 ? 'Primary Contact' : 'Secondary Contact'}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setShowAddContact(false)}
                    className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input 
                    type="text"
                    required
                    placeholder="Full Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <input 
                    type="tel"
                    required
                    placeholder="Phone (+234...)"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <select
                    value={contactRelation}
                    onChange={(e) => setContactRelation(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Partner">Partner</option>
                    <option value="Colleague">Colleague</option>
                  </select>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            )}

            {/* Contact Items */}
            <div className="space-y-2 pt-1">
              {/* Primary Contact */}
              <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200/80 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      Primary Contact
                    </span>
                    {primaryContact && (
                      <span className="text-xs font-bold text-zinc-900 truncate">{primaryContact.name}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
                    {primaryContact ? `${primaryContact.phone} · ${primaryContact.relationship}` : 'No primary contact configured'}
                  </p>
                </div>

                {primaryContact ? (
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateShareLocation(primaryContact.name)}
                      className="px-2.5 py-1 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Test SOS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrustedContact(primaryContact.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddContact(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add
                  </button>
                )}
              </div>

              {/* Secondary Contact */}
              <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200/80 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-zinc-600 bg-zinc-200/70 px-1.5 py-0.5 rounded">
                      Secondary Contact
                    </span>
                    {secondaryContact && (
                      <span className="text-xs font-bold text-zinc-900 truncate">{secondaryContact.name}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
                    {secondaryContact ? `${secondaryContact.phone} · ${secondaryContact.relationship}` : 'Optional backup emergency contact'}
                  </p>
                </div>

                {secondaryContact ? (
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateShareLocation(secondaryContact.name)}
                      className="px-2.5 py-1 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Test SOS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrustedContact(secondaryContact.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddContact(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Sharing Preferences */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Emergency Sharing Preferences
              </h3>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">Auto-Share Meetup Check-In</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Send SMS with meetup venue and host name when you arrive</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={autoShare} 
                    onChange={() => setAutoShare(!autoShare)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">One-Tap Emergency SOS Alert</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Instantly transmit live GPS coordinates to contacts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={sosAlert} 
                    onChange={() => setSosAlert(!sosAlert)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Hotlines */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                National Emergency Hotlines
              </h3>
            </div>

            <div className="space-y-2 pt-1">
              {EMERGENCY_HOTLINES.map((hotline) => (
                <div key={hotline.number} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 text-xs truncate">{hotline.name}</p>
                    <p className="text-[10px] text-zinc-500 font-medium truncate">{hotline.desc}</p>
                  </div>
                  <a 
                    href={`tel:${hotline.number}`}
                    className="px-2.5 py-1 bg-zinc-900 text-white rounded-lg text-xs font-mono font-bold hover:bg-zinc-800 transition-colors shrink-0 ml-2 flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{hotline.number}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Incident Reporting */}
          <div className="p-4 sm:p-5">
            <Link 
              to="/report/general" 
              className="w-full flex items-center justify-between p-3 bg-rose-50/70 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors font-bold text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-600" />
                <span>Report a suspicious activity or member</span>
              </div>
              <span className="text-rose-400">&rarr;</span>
            </Link>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
