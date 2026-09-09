import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Search, Link as LinkIcon, Share2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import Avatar from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';

// Basic interface for Contact
interface Contact {
  id: string;
  name: string;
  phone?: string;
  invited: boolean;
}

export default function InviteFriends() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  
  // Custom toast state
  const [toast, setToast] = useState<string | null>(null);

  const inviteUrl = `${window.location.origin}/invite/${user?.username || 'user'}`;
  const inviteMessage = `Join me on Lalao! Connect with me here: ${inviteUrl}`;

  useEffect(() => {
    // Check if contacts API is supported
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      setPermissionState('unsupported');
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast('Link copied');
    } catch (e) {
      showToast('Failed to copy');
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, '_blank');
  };

  const handleGenericShare = async (platform: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Lalao',
          text: inviteMessage,
        });
      } catch (e) {
        // user cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  const loadContacts = async () => {
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      // @ts-ignore - Web Contact API
      const selectedContacts = await navigator.contacts.select(props, opts);
      
      const loaded: Contact[] = selectedContacts.map((c: any, i: number) => ({
        id: `contact-${i}`,
        name: c.name?.[0] || 'Unknown',
        phone: c.tel?.[0],
        invited: false
      }));
      
      // Merge with localStorage persisted invite state
      const invitedIds = JSON.parse(localStorage.getItem('lalao_invited_contacts') || '[]');
      
      const finalContacts = loaded.map(c => ({
        ...c,
        invited: invitedIds.includes(c.id) || invitedIds.includes(c.phone)
      })).filter(c => c.name !== 'Unknown');

      setContacts(finalContacts);
      setPermissionState('granted');
    } catch (e: any) {
      console.error(e);
      setPermissionState('denied');
    }
  };

  const handleInviteContact = (contact: Contact) => {
    if (contact.invited) return;
    
    // In a real app, this would trigger an SMS intent or backend invite.
    // For now, we simulate success and save to localStorage.
    
    // If we have a phone number, try to open SMS intent
    if (contact.phone) {
      window.open(`sms:${contact.phone}?body=${encodeURIComponent(inviteMessage)}`, '_self');
    } else {
      handleGenericShare('SMS');
    }

    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, invited: true } : c));
    
    const invitedIds = JSON.parse(localStorage.getItem('lalao_invited_contacts') || '[]');
    invitedIds.push(contact.id);
    if (contact.phone) invitedIds.push(contact.phone);
    localStorage.setItem('lalao_invited_contacts', JSON.stringify(invitedIds));
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white relative max-w-2xl mx-auto w-full md:border-x md:border-zinc-100 shadow-sm md:shadow-none min-h-[100dvh]">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-in slide-in-from-top-4 fade-in duration-200">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 safe-area-top">
        <div className="flex items-center px-2 py-3 min-h-[56px] relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/messages/add-friends')}
            className="p-2 -ml-1 text-zinc-600 hover:text-zinc-900 transition-colors absolute left-2 z-10"
            aria-label="Back"
          >
            <ChevronLeft className="w-[26px] h-[26px]" strokeWidth={2.5} />
          </motion.button>
          
          <h1 className="flex-1 text-center text-lg font-extrabold text-zinc-900 tracking-tight">
            Invite friends
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* Search */}
        <div className="px-4 py-3 bg-white">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-100 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-white focus-within:shadow-sm">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find friends"
              className="flex-1 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 outline-none font-medium"
            />
          </div>
        </div>

        {/* Invite via Section */}
        <div className="px-4 py-2">
          <h2 className="text-sm font-extrabold text-zinc-900 mb-3">Invite via</h2>
          
          {/* Scrollable Row */}
          <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
            <button onClick={handleCopyLink} className="flex flex-col items-center gap-1.5 w-16 shrink-0 snap-start group">
              <div className="w-12 h-12 rounded-full bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center transition-colors">
                <LinkIcon className="w-5 h-5 text-zinc-700" />
              </div>
              <span className="text-xs font-semibold text-zinc-600">Copy Link</span>
            </button>
            
            <button onClick={handleWhatsApp} className="flex flex-col items-center gap-1.5 w-16 shrink-0 snap-start group">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/10 group-hover:bg-[#25D366]/20 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-zinc-600">WhatsApp</span>
            </button>

            <button onClick={() => handleGenericShare('Instagram')} className="flex flex-col items-center gap-1.5 w-16 shrink-0 snap-start group">
              <div className="w-12 h-12 rounded-full bg-[#E1306C]/10 group-hover:bg-[#E1306C]/20 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-zinc-600">Instagram</span>
            </button>

            <button onClick={() => handleGenericShare('Messenger')} className="flex flex-col items-center gap-1.5 w-16 shrink-0 snap-start group">
              <div className="w-12 h-12 rounded-full bg-[#00B2FF]/10 group-hover:bg-[#00B2FF]/20 flex items-center justify-center transition-colors">
                <Share2 className="w-5 h-5 text-[#00B2FF]" />
              </div>
              <span className="text-xs font-semibold text-zinc-600">Messenger</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-zinc-100 mx-4 my-2" />

        {/* Contacts Section */}
        <div className="px-4 py-2">
          <h2 className="text-sm font-extrabold text-zinc-900 mb-4">
            Invite from your contacts
          </h2>

          {permissionState === 'prompt' && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
              <h3 className="font-bold text-indigo-900 mb-2">Invite your contacts to join Lalao</h3>
              <p className="text-sm text-indigo-700/80 mb-4">
                Allow Lalao to access your contacts so you can invite people you know.
              </p>
              <button 
                onClick={loadContacts}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
              >
                Allow Contacts
              </button>
            </div>
          )}

          {permissionState === 'unsupported' && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-center flex flex-col items-center">
              <AlertCircle className="w-8 h-8 text-zinc-400 mb-2" />
              <h3 className="font-bold text-zinc-800 mb-1">Contact Sync Unavailable</h3>
              <p className="text-sm text-zinc-500">
                Your current browser doesn't support reading local contacts. Use the "Invite via" options above to share a link manually.
              </p>
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
              <h3 className="font-bold text-red-900 mb-2">Permission Denied</h3>
              <p className="text-sm text-red-700/80 mb-4">
                Contact access is required for this feature. Please enable it in your browser settings and try again.
              </p>
              <button 
                onClick={loadContacts}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {permissionState === 'granted' && (
            <div className="space-y-4">
              {filteredContacts.length === 0 ? (
                <p className="text-center text-zinc-500 py-4 font-medium text-sm">No contacts found.</p>
              ) : (
                filteredContacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-3">
                    <Avatar name={contact.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-900 text-sm truncate">{contact.name}</p>
                      <p className="text-xs text-zinc-500 font-medium truncate">
                        From your contacts
                      </p>
                    </div>
                    <button
                      onClick={() => handleInviteContact(contact)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border",
                        contact.invited
                          ? "bg-white text-zinc-400 border-zinc-200"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm"
                      )}
                    >
                      {contact.invited ? 'Invited' : 'Invite'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
