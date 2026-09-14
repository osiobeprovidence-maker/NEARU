import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../contexts/AuthContext';
import {
  processAndCompressImage,
  uploadToConvexStorage,
  logUploadStage,
} from '../../utils/imageUpload';
import { Calendar, Image as ImageIcon, Loader2, Save, Send } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CreateEvent() {
  const { user, convexUserId } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const createEventMutation = useMutation(api.events.createEvent);
  const generateUploadUrl = useMutation(api.users.generateCoverUploadUrl);
  const pageId = (searchParams.get('pageId') as string | null) || null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [game, setGame] = useState('Honor of Kings');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [registrationType, setRegistrationType] = useState<'team' | 'individual'>('team');
  const [maxTeams, setMaxTeams] = useState<number | ''>(16);
  const [minPlayers, setMinPlayers] = useState<number | ''>(5);
  const [requireApproval, setRequireApproval] = useState(true);

  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSave = async (publishImmediately: boolean) => {
    if (!name || !game) {
      setError('Event Name and Game are required.');
      return;
    }

    if (!pageId) {
      setError('Please open this form from a page you manage.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      let bannerStorageId = undefined;

      if (banner) {
        logUploadStage('START', 'Uploading event banner');
        const compressedBlob = await processAndCompressImage(banner, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
        });
        bannerStorageId = await uploadToConvexStorage(compressedBlob, generateUploadUrl);
      }

      const eventId = await createEventMutation({
        pageId: pageId as any,
        name,
        game,
        description,
        bannerStorageId,
        eventDate,
        location,
        isOnline,
        registrationType,
        maxTeams: maxTeams === '' ? undefined : Number(maxTeams),
        minPlayersPerTeam: minPlayers === '' ? undefined : Number(minPlayers),
        requireApproval,
        publishImmediately,
      });

      navigate(`/manage/events/${eventId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="Create Event">
      <div className="max-w-2xl mx-auto pb-20">
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-8 space-y-8">
            
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-1">
                Event Basics
              </h2>
              <p className="text-sm text-zinc-500 font-medium">
                Set up the core details for your new event.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}

            {/* Banner Upload */}
            <div>
              <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-2">
                Event Banner
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative",
                  bannerPreview ? "border-transparent bg-zinc-900" : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100"
                )}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
                    <span className="text-sm font-bold text-zinc-500">Click to upload banner</span>
                    <span className="text-xs text-zinc-400 font-medium mt-1">16:9 recommended</span>
                  </>
                )}
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleBannerSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Basic Info */}
            <div className="grid gap-5">
              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                  Event Name *
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Summer Championship 2026"
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                  Game / Title *
                </label>
                <select
                  value={game}
                  onChange={e => setGame(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                >
                  <option value="Honor of Kings">Honor of Kings</option>
                  <option value="Mobile Legends">Mobile Legends</option>
                  <option value="PUBG Mobile">PUBG Mobile</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Tell players about this event..."
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                />
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Registration Settings */}
            <div>
              <h3 className="text-sm font-black text-zinc-900 tracking-tight mb-4">Registration Settings</h3>
              
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                    Registration Type
                  </label>
                  <select
                    value={registrationType}
                    onChange={e => setRegistrationType(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                  >
                    <option value="team">Team Based</option>
                    <option value="individual">Individual / Solo</option>
                  </select>
                </div>

                {registrationType === 'team' && (
                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Max Teams
                    </label>
                    <input
                      type="number"
                      value={maxTeams}
                      onChange={e => setMaxTeams(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 16"
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="p-5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold text-sm transition-colors inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors inline-flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish & Open
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
