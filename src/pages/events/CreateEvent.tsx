import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import {
  processAndCompressImage,
  uploadToConvexStorage,
  logUploadStage,
} from '../../utils/imageUpload';
import { Calendar, Image as ImageIcon, Loader2, Save, Send, ChevronRight, ChevronLeft, Trophy, Shield, Settings, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CreateEvent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const createEventMutation = useMutation(api.events.createEvent);
  const generateUploadUrl = useMutation(api.users.generateCoverUploadUrl);
  const pageId = (searchParams.get('pageId') as string | null) || null;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Event Info
  const [name, setName] = useState('');
  const [game, setGame] = useState('Honor of Kings');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Step 2: Registration Settings
  const [registrationType, setRegistrationType] = useState<'team' | 'individual'>('team');
  const [registrationOpeningDate, setRegistrationOpeningDate] = useState('');
  const [registrationClosingDate, setRegistrationClosingDate] = useState('');
  const [maxTeams, setMaxTeams] = useState<number | ''>(16);
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState<number | ''>(5);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState<number | ''>(5);
  const [maxSubstitutes, setMaxSubstitutes] = useState<number | ''>(2);
  const [requireApproval, setRequireApproval] = useState(true);

  // Step 3: Details & Rules
  const [prizePool, setPrizePool] = useState('');
  const [rules, setRules] = useState('');
  const [entryRequirements, setEntryRequirements] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // Banner
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
      setCurrentStep(1);
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
        description: description || undefined,
        bannerStorageId,
        eventDate: eventDate || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location || undefined,
        isOnline,
        registrationType,
        registrationOpeningDate: registrationOpeningDate || undefined,
        registrationClosingDate: registrationClosingDate || undefined,
        maxTeams: maxTeams === '' ? undefined : Number(maxTeams),
        minPlayersPerTeam: minPlayersPerTeam === '' ? undefined : Number(minPlayersPerTeam),
        maxPlayersPerTeam: maxPlayersPerTeam === '' ? undefined : Number(maxPlayersPerTeam),
        maxSubstitutes: maxSubstitutes === '' ? undefined : Number(maxSubstitutes),
        requireApproval,
        prizePool: prizePool || undefined,
        rules: rules || undefined,
        entryRequirements: entryRequirements || undefined,
        contactInfo: contactInfo || undefined,
        publishImmediately,
      });

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: publishImmediately ? 'Event Published!' : 'Draft Saved',
            subtitle: publishImmediately ? 'Players can now view your event.' : 'Your event was saved as a draft.'
          }
        })
      );

      navigate(`/manage/events/${eventId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="Create Event">
      <div className="max-w-3xl mx-auto pb-20">
        <Link to="/manage" className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Organization Dashboard
        </Link>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <button
            onClick={() => setCurrentStep(1)}
            className={cn(
              "flex items-center gap-2 text-sm font-bold transition-colors",
              currentStep === 1 ? "text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black",
              currentStep === 1 ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500"
            )}>
              1
            </div>
            <span>Event Info</span>
          </button>

          <ChevronRight className="w-4 h-4 text-zinc-300" />

          <button
            onClick={() => setCurrentStep(2)}
            className={cn(
              "flex items-center gap-2 text-sm font-bold transition-colors",
              currentStep === 2 ? "text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black",
              currentStep === 2 ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500"
            )}>
              2
            </div>
            <span>Registration Settings</span>
          </button>

          <ChevronRight className="w-4 h-4 text-zinc-300" />

          <button
            onClick={() => setCurrentStep(3)}
            className={cn(
              "flex items-center gap-2 text-sm font-bold transition-colors",
              currentStep === 3 ? "text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black",
              currentStep === 3 ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500"
            )}>
              3
            </div>
            <span>Rules & Details</span>
          </button>
        </div>

        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}

            {/* STEP 1: EVENT INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-1">
                    Event Information
                  </h2>
                  <p className="text-sm text-zinc-500 font-medium">
                    Basic information about your tournament or esports event.
                  </p>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-2">
                    Event Cover / Banner
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
                        <span className="text-xs text-zinc-400 font-medium mt-1">16:9 aspect ratio recommended</span>
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

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Event Name *
                    </label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Honor of Kings Autumn Championship 2026"
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
                      <option value="League of Legends">League of Legends</option>
                      <option value="Free Fire">Free Fire</option>
                      <option value="Other Esports">Other Esports</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Event Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOnline(true)}
                        className={cn(
                          "py-3 rounded-xl text-xs font-bold border transition-colors",
                          isOnline ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white border-zinc-200 text-zinc-600"
                        )}
                      >
                        Online
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsOnline(false)}
                        className={cn(
                          "py-3 rounded-xl text-xs font-bold border transition-colors",
                          !isOnline ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white border-zinc-200 text-zinc-600"
                        )}
                      >
                        Offline / LAN
                      </button>
                    </div>
                  </div>

                  {!isOnline && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                        Venue / Location
                      </label>
                      <input
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Esports Arena, Lagos"
                        className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe the event, objectives, and overview..."
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: REGISTRATION SETTINGS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-1">
                    Registration Settings
                  </h2>
                  <p className="text-sm text-zinc-500 font-medium">
                    Configure team caps, player limits, and approval rules.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Registration Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegistrationType('team')}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-colors",
                          registrationType === 'team' ? "bg-indigo-50 border-indigo-600" : "bg-white border-zinc-200"
                        )}
                      >
                        <Trophy className={cn("w-5 h-5 mb-2", registrationType === 'team' ? "text-indigo-600" : "text-zinc-400")} />
                        <div className="font-bold text-sm text-zinc-900">Team Based</div>
                        <div className="text-xs text-zinc-500 font-medium mt-0.5">Players register as a team with roster limits</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegistrationType('individual')}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-colors",
                          registrationType === 'individual' ? "bg-indigo-50 border-indigo-600" : "bg-white border-zinc-200"
                        )}
                      >
                        <Settings className={cn("w-5 h-5 mb-2", registrationType === 'individual' ? "text-indigo-600" : "text-zinc-400")} />
                        <div className="font-bold text-sm text-zinc-900">Individual Solo</div>
                        <div className="text-xs text-zinc-500 font-medium mt-0.5">Players register individually</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Registration Opening Date
                    </label>
                    <input
                      type="date"
                      value={registrationOpeningDate}
                      onChange={e => setRegistrationOpeningDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Registration Deadline / Closing Date
                    </label>
                    <input
                      type="date"
                      value={registrationClosingDate}
                      onChange={e => setRegistrationClosingDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                    />
                  </div>

                  {registrationType === 'team' && (
                    <>
                      <div>
                        <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                          Maximum Teams Allowed
                        </label>
                        <input
                          type="number"
                          value={maxTeams}
                          onChange={e => setMaxTeams(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 16"
                          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                          Min Players Per Team
                        </label>
                        <input
                          type="number"
                          value={minPlayersPerTeam}
                          onChange={e => setMinPlayersPerTeam(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 5"
                          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                          Max Players Per Team
                        </label>
                        <input
                          type="number"
                          value={maxPlayersPerTeam}
                          onChange={e => setMaxPlayersPerTeam(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 5"
                          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                          Max Substitutes Allowed
                        </label>
                        <input
                          type="number"
                          value={maxSubstitutes}
                          onChange={e => setMaxSubstitutes(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 2"
                          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2 pt-2">
                    <label className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireApproval}
                        onChange={e => setRequireApproval(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-sm text-zinc-900">Require Manual Approval for Registrations</div>
                        <div className="text-xs text-zinc-500 font-medium">If unchecked, registrations are automatically approved immediately.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: RULES & DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-1">
                    Prize Pool, Rules & Details
                  </h2>
                  <p className="text-sm text-zinc-500 font-medium">
                    Add tournament details, rewards, and contact information.
                  </p>
                </div>

                <div className="grid gap-5">
                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Prize Pool
                    </label>
                    <input
                      value={prizePool}
                      onChange={e => setPrizePool(e.target.value)}
                      placeholder="e.g. $10,000 USD / 1,000,000 NGN + Trophies"
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Entry Requirements
                    </label>
                    <textarea
                      value={entryRequirements}
                      onChange={e => setEntryRequirements(e.target.value)}
                      rows={3}
                      placeholder="e.g. Must be Master rank or above in Honor of Kings. Region lock applies."
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Tournament Rules
                    </label>
                    <textarea
                      value={rules}
                      onChange={e => setRules(e.target.value)}
                      rows={4}
                      placeholder="Specify game settings, ban phase rules, pause policies, fair play rules..."
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                      Organizer Contact Information
                    </label>
                    <input
                      value={contactInfo}
                      onChange={e => setContactInfo(e.target.value)}
                      placeholder="e.g. Discord: discord.gg/hok-league, Email: support@hok.com"
                      className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="p-5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-3 shrink-0">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep - 1) as any)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Step
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep + 1) as any)}
                  className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm transition-colors inline-flex items-center gap-2"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors inline-flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Publish & Open
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
