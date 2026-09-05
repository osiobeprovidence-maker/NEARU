import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertCircle,
  HandMetal,
  HandHeart,
  Handshake,
  Users,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  Hash,
  ImagePlus,
  MessageSquarePlus,
  Tag,
  Link2,
  ChevronDown,
  Check,
} from 'lucide-react';
import Avatar from './Avatar';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { createMuxUpload, putFileToMux, waitForPlayback } from '../lib/mux';
import { uploadToConvexStorage } from '../lib/storageUpload';
import { ActivityType } from '../types';
import { RallyPricing } from '../lib/rallyPricing';
import { cn } from '../lib/utils';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';

interface CreateRallyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  /**
   * When set and the modal opens, skip the type-picker (step 1) and go
   * straight into creation for that content type. Used by the create sheet:
   * selecting "Post" opens with type "POST" pre-selected.
   */
  initialType?: ActivityType;
  /** Optional page ID to default posting as that page */
  defaultPageId?: string;
}

const RALLY_TYPES: ActivityType[] = ['ASK', 'HELP', 'JOIN'];

// POST type is always free and doesn't need paid/capacity fields
const POST_ONLY_TYPES: ActivityType[] = ['POST'];
// These types show event-specific fields (date, time, capacity, paid/free)
const EVENT_TYPES: ActivityType[] = ['ASK', 'HELP', 'JOIN', 'EVENT'];

// Interests a Post can be tagged with — must match the labels stored on
// user profiles (see Onboarding) so Interest-Post matching works.
const INTEREST_OPTIONS = [
  'Outdoor & Sports',
  'Music & Events',
  'Tech & Gaming',
  'Social Hangouts',
  'Work & Business',
  'Learning & Skills',
  'Art & Creativity',
  'Photography',
  'Travel & Explore',
  'Fitness & Health',
];

export default function CreateRallyModal({
  isOpen,
  onClose,
  onCreated,
  initialType,
  defaultPageId,
}: CreateRallyModalProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState('');
  const [pricing, setPricing] = useState<RallyPricing | null>(null);
  const [price, setPrice] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [peopleNeeded, setPeopleNeeded] = useState(1);
  // Interest tag — only used (and only meaningful) for POST type
  const [interest, setInterest] = useState<string>('');
  // Media state
  const [localPreview, setLocalPreview] = useState<string>('');   // blob: URL for immediate preview
  const [mediaStorageId, setMediaStorageId] = useState<string>('');
  const [muxUploadId, setMuxUploadId] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0..1 for the upload progress bar
  const [uploadError, setUploadError] = useState<string>('');
  const [isProcessingVideo, setIsProcessingVideo] = useState(false); // Mux transcoding
  // Hashtags
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  // Event Hub: interests for RALLY types + linked RALLY for POST type
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [linkedRally, setLinkedRally] = useState<string>('');

  const uploadedRef = useRef(false); // prevent double-upload on re-render
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { city, position, geoState } = useLocation();
  const { firebaseUser, convexUserId, user } = useAuth();

  // Pages managed by the authenticated user
  const managedPages = useQuery(
    api.pages.listUserManagedPages,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const [showIdentityDropdown, setShowIdentityDropdown] = useState(false);
  const [postingIdentity, setPostingIdentity] = useState<{
    type: 'user' | 'page';
    pageId?: string;
    name: string;
    handle: string;
    avatar?: string;
  }>({
    type: 'user',
    name: user?.name || 'Personal Profile',
    handle: user?.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '',
    avatar: user?.avatar,
  });

  // Sync posting identity when modal opens or managedPages / defaultPageId changes
  useEffect(() => {
    if (isOpen) {
      if (defaultPageId && managedPages) {
        const found = managedPages.find((p: any) => p._id === defaultPageId);
        if (found) {
          setPostingIdentity({
            type: 'page',
            pageId: found._id,
            name: found.name,
            handle: `@${found.slug}`,
            avatar: found.avatar,
          });
          return;
        }
      }
      setPostingIdentity({
        type: 'user',
        name: user?.name || 'Personal Profile',
        handle: user?.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '',
        avatar: user?.avatar,
      });
    }
  }, [isOpen, defaultPageId, managedPages, user]);

  const createRally = useMutation(api.rallies.create);
  const saveMuxResult = useMutation(api.rallies.saveMuxResult);
  const getOrCreateUser = useMutation(api.users.getOrCreateByEmail);
  const generateUploadUrl = useMutation(api.rallies.generateUploadUrl);
  // The user's RALLYs, for attaching a POST to a RALLY in the Event Hub.
  const myRallies = useQuery(
    api.rallies.listByCreator,
    convexUserId ? { creatorId: convexUserId as any } : 'skip'
  );
  const linkableRallies = (myRallies ?? []).filter(
    (r: any) => r.type !== 'POST'
  );
  const selectedRally = linkableRallies.find((r: any) => r._id === linkedRally);

  const rallyLocation = city || 'Unknown location';
  const hasLocation =
    geoState === 'active' || geoState === 'manual' || geoState === 'updating';

  // POST type never takes an admission model — clear any stale pricing choice
  // when the type changes so POST can't accidentally be marked Paid.
  useEffect(() => {
    if (type && POST_ONLY_TYPES.includes(type)) {
      setPricing(null);
    }
  }, [type]);

  // When opened with an initialType (e.g. "Post" chosen in the create sheet),
  // skip the type-picker and start directly in that type's detail step.
  useEffect(() => {
    if (isOpen && initialType) {
      setType(initialType);
      setStep(2);
    }
  }, [isOpen, initialType]);

  const resetAndClose = () => {
    setStep(1);
    setType(null);
    setDescription('');
    setPricing(null);
    setPrice('');
    setEventDate('');
    setEventTime('');
    setPeopleNeeded(1);
    setInterest('');
    setLocalPreview('');
    setMediaStorageId('');
    setMuxUploadId('');
    setMediaType(null);
    setIsUploading(false);
    setIsProcessingVideo(false);
    setUploadError('');
    setHashtags([]);
    setHashtagInput('');
    setSelectedInterests([]);
    setLinkedRally('');
    uploadedRef.current = false;
    onClose();
  };

  // -------------------------------------------------------------------------
  // Media upload — images go to Convex storage, videos go to Mux
  // -------------------------------------------------------------------------
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear input so the same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) return;

    // 1. Show a local preview immediately (blob URL)
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setMediaType(isImage ? 'image' : 'video');
    setMediaStorageId('');
    setMuxUploadId('');
    setUploadError('');
    setUploadProgress(0);
    uploadedRef.current = false;

    // 2. Upload in background
    setIsUploading(true);
    try {
      if (isVideo) {
        // Direct permanent storage upload so the video is immediately and permanently saved with the post
        const uploadUrl = await generateUploadUrl();
        setUploadProgress(0);
        const storageId = await uploadToConvexStorage(uploadUrl, file, (fraction) => {
          setUploadProgress(fraction);
        });
        setUploadProgress(1);
        setMediaStorageId(storageId);
        uploadedRef.current = true;

        // Optionally kick off Mux direct upload in background for transcoded HLS playback if available
        try {
          const { uploadId, url } = await createMuxUpload();
          putFileToMux(url, file).catch(() => {});
          setMuxUploadId(uploadId);
        } catch (muxErr) {
          console.warn('[CreateRallyModal] Mux upload optional enhancement skipped:', muxErr);
        }
      } else {
        // Image → Convex storage
        const uploadUrl = await generateUploadUrl();
        setUploadProgress(0);
        const storageId = await uploadToConvexStorage(uploadUrl, file, (fraction) => {
          setUploadProgress(fraction);
        });
        setUploadProgress(1);
        setMediaStorageId(storageId);
        uploadedRef.current = true;
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
      setMediaStorageId('');
      setMuxUploadId('');
      uploadedRef.current = false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview('');
    setMediaStorageId('');
    setMuxUploadId('');
    setMediaType(null);
    setUploadError('');
    setUploadProgress(0);
    uploadedRef.current = false;
  };

  // -------------------------------------------------------------------------
  // Hashtags
  // -------------------------------------------------------------------------
  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !hashtags.includes(tag) && hashtags.length < 5) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const ensureConvexUser = useCallback(async (): Promise<string> => {
    if (convexUserId) return convexUserId;
    if (!firebaseUser?.email) throw new Error('Please complete onboarding first');
    return await getOrCreateUser({
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
    });
  }, [convexUserId, firebaseUser, getOrCreateUser]);

  const handlePost = async () => {
    if (!type || !description.trim()) return;
    // For non-POST types, the admission model must be chosen
    if (!POST_ONLY_TYPES.includes(type) && pricing === null) return;

    // Guard: if media was chosen, ensure it has successfully uploaded before posting
    if (localPreview && !mediaStorageId) {
      if (isUploading) {
        window.dispatchEvent(
          new CustomEvent('show-toast', {
            detail: {
              title: 'Upload in progress',
              subtitle: 'Please wait for your media to finish uploading before publishing.',
            },
          })
        );
        return;
      }
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Media upload required',
            subtitle: 'Media upload was not completed. Please re-select your file or remove it.',
          },
        })
      );
      return;
    }

    setIsPosting(true);
    try {
      const userId = await ensureConvexUser();
      const title = description.split('\n')[0].slice(0, 80) || `${type} RALLY`;
      // POST never carries an admission model; RALLY types publish the explicit
      // three-way pricing choice (free / paid / no admission fee).
      const effectivePricing: RallyPricing = POST_ONLY_TYPES.includes(type)
        ? 'none'
        : (pricing ?? 'none');
      const effectiveIsPaid = effectivePricing === 'paid';

      const rallyId = await createRally({
        type,
        title,
        description,
        distance: 0,
        time: eventTime || 'Soon',
        peopleNeeded,
        capacity:
          type === 'EVENT' && peopleNeeded > 0 ? peopleNeeded : undefined,
        isPaid: effectiveIsPaid,
        price:
          effectiveIsPaid && price ? parseInt(price, 10) : undefined,
        pricing: effectivePricing,
        creatorId: userId as any,
        authorType: postingIdentity.type,
        pageId: postingIdentity.type === 'page' ? (postingIdentity.pageId as any) : undefined,
        city: city || undefined,
        locationLabel: rallyLocation,
        rallyLatitude: position?.latitude,
        rallyLongitude: position?.longitude,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        eventDate: eventDate || undefined,
        endTime: eventTime || undefined,
        // Interest Post: only POST type may carry an interest tag.
        interest:
          type === 'POST' && interest.trim() ? interest.trim() : undefined,
        // Only send storageId if upload completed successfully (images)
        mediaStorageId: mediaStorageId || undefined,
        // Don't persist blob: URLs — they're session-only
        mediaUrl: undefined,
        mediaType: mediaType || undefined,
        // Videos: reference the Mux direct upload; the playback id is attached
        // below (fire-and-forget) once Mux finishes transcoding.
        muxUploadId: muxUploadId || undefined,
        // Event Hub: interests for RALLY types (interest discovery + follower match)
        interests:
          !isPost && selectedInterests.length > 0 ? selectedInterests : undefined,
        // Event Hub: attach a POST to a RALLY
        rallyLinkId:
          type === 'POST' && linkedRally ? (linkedRally as any) : undefined,
      });

      // Fire-and-forget: attach the Mux playback id when transcoding finishes.
      if (muxUploadId) {
        attachMuxResult(rallyId, userId, muxUploadId);
      }

      onCreated();
      // Small delay so the user sees the success before modal closes
      setTimeout(() => resetAndClose(), 400);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to post. Please try again.';
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Could not post RALLY', subtitle: msg },
        })
      );
    } finally {
      setIsPosting(false);
    }
  };

  // Poll Mux until the video is ready, then store the playback id on the rally.
  // Runs in the background so the user isn't blocked while Mux transcodes.
  const attachMuxResult = async (
    rallyId: string,
    userId: string,
    uploadId: string
  ) => {
    setIsProcessingVideo(true);
    try {
      const { assetId, playbackId } = await waitForPlayback(uploadId);
      if (!assetId || !playbackId) return;
      await saveMuxResult({
        rallyId: rallyId as any,
        requestingUserId: userId as any,
        assetId,
        playbackId,
      });
    } catch {
      // Non-fatal: the post is already live; video just won't play until Mux
      // resolves. The user can be retried later.
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  const isPost = type && POST_ONLY_TYPES.includes(type);
  const needsPricingChoice = type && !isPost;
  const canReview =
    !!description.trim() &&
    !isUploading &&
    (!localPreview || !!mediaStorageId) &&
    (isPost || (pricing !== null && (pricing !== 'paid' || !!price)));

  // -------------------------------------------------------------------------
  // Visual config
  // -------------------------------------------------------------------------
  const typeConfig: Record<
    ActivityType,
    { icon: React.ElementType; color: string; bg: string; label: string; subtitle: string }
  > = {
    POST: {
      icon: MessageSquarePlus,
      color: 'text-zinc-600',
      bg: 'bg-zinc-100',
      label: 'Post',
      subtitle: 'Share something with the community.',
    },
    EVENT: {
      icon: Calendar,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
      label: 'Event',
      subtitle: 'Host or share a local event.',
    },
    ASK: {
      icon: HandMetal,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      label: 'Ask',
      subtitle: 'I need something.',
    },
    HELP: {
      icon: HandHeart,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      label: 'Help',
      subtitle: 'I can help someone.',
    },
    JOIN: {
      icon: Handshake,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      label: 'Join',
      subtitle: 'I want people to join me.',
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60]"
            onClick={resetAndClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[500px] max-h-[90vh] bg-white rounded-t-[2rem] md:rounded-3xl shadow-2xl z-[70] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
              <h2 className="text-xl font-black text-zinc-900">
                {step === 1
                  ? 'Create a RALLY'
                  : step === 2
                  ? 'Details'
                  : 'Review & Post'}
              </h2>
              <button
                onClick={resetAndClose}
                className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex gap-1.5 px-6 pt-3 shrink-0">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all',
                    s <= step ? 'bg-zinc-900' : 'bg-zinc-200'
                  )}
                />
              ))}
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {/* STEP 1 — Type picker */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-zinc-900">
                    What do you want to do?
                  </h3>
                  <div className="space-y-3">
                    {RALLY_TYPES.map((t) => {
                      const cfg = typeConfig[t];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={t}
                          onClick={() => {
                            setType(t);
                            setStep(2);
                          }}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 hover:border-zinc-200 text-left transition-all active:scale-[0.98]"
                        >
                          <div
                            className={cn(
                              'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                              cfg.bg,
                              cfg.color
                            )}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900">
                              {cfg.label}
                            </div>
                            <div className="text-sm text-zinc-500 font-medium mt-0.5">
                              {cfg.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2 — Details */}
              {step === 2 && type && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Identity Selector */}
                  <div className="relative">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Posting as
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowIdentityDropdown((v) => !v)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50/70 hover:bg-zinc-100/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={postingIdentity.avatar}
                            name={postingIdentity.name}
                            size="sm"
                            className="shadow-sm ring-1 ring-zinc-200"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-zinc-900 truncate">
                                {postingIdentity.name}
                              </span>
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider',
                                  postingIdentity.type === 'page'
                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                    : 'bg-zinc-200 text-zinc-700'
                                )}
                              >
                                {postingIdentity.type === 'page' ? 'Page' : 'Personal Profile'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 truncate">
                              {postingIdentity.handle}
                            </p>
                          </div>
                        </div>
                        {managedPages && managedPages.length > 0 && (
                          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                        )}
                      </button>

                      {showIdentityDropdown && managedPages && managedPages.length > 0 && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowIdentityDropdown(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 space-y-1">
                            <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                              Personal Profile
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPostingIdentity({
                                  type: 'user',
                                  name: user?.name || 'Personal Profile',
                                  handle: user?.username
                                    ? user.username.startsWith('@')
                                      ? user.username
                                      : `@${user.username}`
                                    : '',
                                  avatar: user?.avatar,
                                });
                                setShowIdentityDropdown(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors',
                                postingIdentity.type === 'user'
                                  ? 'bg-indigo-50/70 text-indigo-900 font-semibold'
                                  : 'hover:bg-zinc-50 text-zinc-700'
                              )}
                            >
                              <Avatar src={user?.avatar} name={user?.name || 'Me'} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate">{user?.name}</div>
                                <div className="text-xs text-zinc-500 truncate">Personal Profile</div>
                              </div>
                              {postingIdentity.type === 'user' && (
                                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                              )}
                            </button>

                            <div className="px-3 pt-2 pb-1 text-[11px] font-black uppercase tracking-wider text-zinc-400 border-t border-zinc-100">
                              Pages you manage
                            </div>
                            {managedPages.map((page: any) => (
                              <button
                                key={page._id}
                                type="button"
                                onClick={() => {
                                  setPostingIdentity({
                                    type: 'page',
                                    pageId: page._id,
                                    name: page.name,
                                    handle: `@${page.slug}`,
                                    avatar: page.avatar,
                                  });
                                  setShowIdentityDropdown(false);
                                }}
                                className={cn(
                                  'w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors',
                                  postingIdentity.type === 'page' &&
                                    postingIdentity.pageId === page._id
                                    ? 'bg-indigo-50/70 text-indigo-900 font-semibold'
                                    : 'hover:bg-zinc-50 text-zinc-700'
                                )}
                              >
                                <Avatar src={page.avatar} name={page.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold truncate">{page.name}</div>
                                  <div className="text-xs text-zinc-500 truncate">
                                    @{page.slug} · {page.category}
                                  </div>
                                </div>
                                {postingIdentity.type === 'page' &&
                                  postingIdentity.pageId === page._id && (
                                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                                  )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-zinc-900">
                      What's happening?
                    </h3>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={
                        type === 'ASK'
                          ? 'Tell people what you need...'
                          : type === 'HELP'
                          ? 'Tell people how you can help...'
                          : type === 'EVENT'
                          ? 'Describe your event...'
                          : 'What do you want to share?'
                      }
                      className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>

                  {/* Photo / Video upload */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900">
                      Photo or Video (optional)
                    </h3>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {localPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100">
                        {mediaType === 'video' ? (
                          <video
                            src={localPreview}
                            controls
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={localPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {/* Upload status overlay */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                            {mediaType === 'video' && uploadProgress > 0 ? (
                              <div className="w-3/4 max-w-[220px]">
                                <div className="flex justify-between text-white text-[10px] font-bold mb-1">
                                  <span>Uploading video…</span>
                                  <span>{Math.round(uploadProgress * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/25 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-white rounded-full transition-all duration-150"
                                    style={{ width: `${Math.round(uploadProgress * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <Loader2 className="w-7 h-7 text-white animate-spin" />
                                <span className="text-white text-xs font-bold">
                                  Uploading…
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        {uploadError && !isUploading && (
                          <div className="absolute inset-0 bg-rose-900/60 flex flex-col items-center justify-center gap-2 p-4">
                            <AlertCircle className="w-7 h-7 text-white" />
                            <span className="text-white text-xs font-bold text-center">
                              {uploadError}
                            </span>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 bg-white text-rose-700 text-xs font-bold rounded-full mt-1"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                        {!isUploading && !uploadError &&
                          (mediaStorageId || muxUploadId) && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                            ✓ Uploaded
                          </div>
                        )}
                        <button
                          onClick={handleRemoveMedia}
                          className="absolute top-2 right-2 p-1.5 bg-zinc-900/60 rounded-full text-white hover:bg-zinc-900/80"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-50 border-2 border-dashed border-zinc-200 hover:border-zinc-300 rounded-2xl transition-colors text-zinc-600 font-semibold text-sm"
                      >
                        <ImagePlus className="w-5 h-5 text-zinc-400" />
                        Tap to add a photo or video
                      </button>
                    )}
                  </div>

                  {/* Interest (POST only) — turns a Post into an Interest Post */}
                  {isPost && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-900">
                          Interest (optional)
                        </h3>
                        {interest && (
                          <button
                            onClick={() => setInterest('')}
                            className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((opt) => {
                          const selected = interest === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setInterest(selected ? '' : opt)}
                              className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95',
                                selected
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:border-indigo-200 hover:text-indigo-600'
                              )}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Pick an interest to reach people who share it anywhere.
                        Leave blank for a normal location-based post.
                      </p>
                    </div>
                  )}

                  {/* Event Hub: interests for RALLY types */}
                  {!isPost && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-violet-500" /> Event interests (optional)
                        </h3>
                        {selectedInterests.length > 0 && (
                          <button
                            onClick={() => setSelectedInterests([])}
                            className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((opt) => {
                          const selected = selectedInterests.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setSelectedInterests((prev) =>
                                  selected
                                    ? prev.filter((i) => i !== opt)
                                    : [...prev, opt]
                                )
                              }
                              className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95',
                                selected
                                  ? 'bg-violet-600 text-white shadow-sm'
                                  : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:border-violet-200 hover:text-violet-600'
                              )}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Tag your RALLY with interests so the right people discover it.
                      </p>
                    </div>
                  )}

                  {/* Event Hub: attach a POST to a RALLY */}
                  {isPost && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                        <Link2 className="w-4 h-4 text-violet-500" /> Attach to a RALLY (optional)
                      </h3>
                      {linkableRallies.length === 0 ? (
                        <p className="text-xs text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                          You don't have any RALLYs yet. Create a RALLY first, then
                          link posts to it from its Event Hub.
                        </p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {linkableRallies.map((r: any) => {
                              const selected = linkedRally === r._id;
                              return (
                                <button
                                  key={r._id}
                                  type="button"
                                  onClick={() => setLinkedRally(selected ? '' : r._id)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-full text-xs font-semibold truncate max-w-full transition-all active:scale-95',
                                    selected
                                      ? 'bg-violet-600 text-white shadow-sm'
                                      : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:border-violet-200 hover:text-violet-600'
                                  )}
                                >
                                  {r.title}
                                </button>
                              );
                            })}
                          </div>
                          {selectedRally && (
                            <p className="text-[11px] text-violet-600 font-semibold">
                              This post will appear in the feed of “{selectedRally.title}”
                              and its followers.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Hashtags */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900">
                      Hashtags (optional)
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                        <Hash className="w-4 h-4 text-zinc-400 shrink-0" />
                        <input
                          type="text"
                          value={hashtagInput}
                          onChange={(e) => setHashtagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddHashtag();
                            }
                          }}
                          placeholder="Add hashtag"
                          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-400"
                          maxLength={20}
                        />
                      </div>
                      <button
                        onClick={handleAddHashtag}
                        disabled={!hashtagInput.trim() || hashtags.length >= 5}
                        className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-700 disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100"
                          >
                            #{tag}
                            <button
                              onClick={() => handleRemoveHashtag(tag)}
                              className="hover:text-indigo-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-400">
                      Up to 5 hashtags, e.g. #football, #meetup, #udu
                    </p>
                  </div>

                  {/* Event-specific fields (not for POST type) */}
                  {!isPost && (
                    <>
                      {/* Date + Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-zinc-900">
                            Date
                          </h3>
                          <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full p-3 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl transition-colors text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-zinc-900">
                            Time
                          </h3>
                          <input
                            type="time"
                            value={eventTime}
                            onChange={(e) => setEventTime(e.target.value)}
                            className="w-full p-3 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl transition-colors text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>

                      {/* People / Capacity */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-zinc-900">
                          {type === 'EVENT' ? 'Max capacity' : 'People needed'}
                        </h3>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              setPeopleNeeded(Math.max(1, peopleNeeded - 1))
                            }
                            className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-600 hover:bg-zinc-200 active:scale-95 transition-all"
                          >
                            −
                          </button>
                          <span className="w-12 text-center text-lg font-bold text-zinc-900">
                            {peopleNeeded}
                          </span>
                          <button
                            onClick={() =>
                              setPeopleNeeded(Math.min(500, peopleNeeded + 1))
                            }
                            className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-600 hover:bg-zinc-200 active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Admission model: Free / Paid / No admission fee */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-zinc-900">
                          Admission
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setPricing('free')}
                            className={cn(
                              'py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all border-2',
                              pricing === 'free'
                                ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                            )}
                          >
                            FREE
                          </button>
                          <button
                            onClick={() => setPricing('paid')}
                            className={cn(
                              'py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all border-2',
                              pricing === 'paid'
                                ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs'
                                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                            )}
                          >
                            PAID
                          </button>
                          <button
                            onClick={() => setPricing('none')}
                            className={cn(
                              'py-3 px-2 rounded-xl font-bold text-xs sm:text-sm leading-tight transition-all border-2',
                              pricing === 'none'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-xs'
                                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                            )}
                          >
                            No admission fee
                          </button>
                        </div>
                        {pricing === 'paid' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-2"
                          >
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-zinc-500 font-semibold">
                                  ₦
                                </span>
                              </div>
                              <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="Amount"
                                className="w-full pl-8 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Location (informational only) */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900">
                      Location
                    </h3>
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                      <MapPin
                        className={cn(
                          'w-5 h-5 shrink-0',
                          hasLocation ? 'text-indigo-600' : 'text-zinc-400'
                        )}
                      />
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {hasLocation
                            ? rallyLocation
                            : 'Location not available'}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {hasLocation
                            ? '📍 Posted at your current location'
                            : 'Enable location to attach your position'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — Review */}
              {step === 3 && type && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                    {/* Publishing Identity Summary */}
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-200/80">
                      <Avatar
                        src={postingIdentity.avatar}
                        name={postingIdentity.name}
                        size="sm"
                        className="shadow-sm ring-1 ring-zinc-200"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                          Publishing as
                        </div>
                        <div className="text-sm font-bold text-zinc-900 truncate flex items-center gap-1.5">
                          <span>{postingIdentity.name}</span>
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider',
                              postingIdentity.type === 'page'
                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                : 'bg-zinc-200 text-zinc-700'
                            )}
                          >
                            {postingIdentity.type === 'page' ? 'Page' : 'Personal Profile'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Type badge + paid badge */}
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cfg = typeConfig[type];
                        const Icon = cfg.icon;
                        return (
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              cfg.bg,
                              cfg.color
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                        );
                      })()}
                      <div>
                        <div className="font-bold text-zinc-900 text-sm">
                          {typeConfig[type].label}
                        </div>
                        {hashtags.length > 0 && (
                          <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                            {hashtags.map((t) => `#${t}`).join(' ')}
                          </div>
                        )}
                      </div>
                      {!isPost && pricing !== null && (
                        <div
                          className={cn(
                            'ml-auto px-2.5 py-1 rounded-full text-xs font-bold',
                            pricing === 'paid'
                              ? 'bg-amber-100 text-amber-700'
                              : pricing === 'none'
                              ? 'bg-zinc-100 text-zinc-600'
                              : 'bg-emerald-100 text-emerald-700'
                          )}
                        >
                          {pricing === 'paid'
                            ? `₦${price || '?'}`
                            : pricing === 'free'
                            ? 'FREE'
                            : 'No admission fee'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-sm text-zinc-700 leading-relaxed">
                      {description}
                    </p>

                    {/* Media preview */}
                    {(localPreview && mediaType === 'image') ||
                      (localPreview && mediaType === 'video') ? (
                      <div className="rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 relative">
                        {mediaType === 'video' ? (
                          <video
                            src={localPreview}
                            controls
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={localPreview}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        {!mediaStorageId && (
                          <div className="absolute inset-0 bg-amber-900/40 flex items-center justify-center">
                            <span className="text-white text-xs font-bold bg-amber-700 px-3 py-1 rounded-full">
                              Upload incomplete — please wait or re-select
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                      {eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {eventDate}
                        </span>
                      )}
                      {eventTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {eventTime}
                        </span>
                      )}
                      {!isPost && peopleNeeded > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {type === 'EVENT'
                            ? `${peopleNeeded} spots max`
                            : `${peopleNeeded} needed`}
                        </span>
                      )}
                      {hasLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {rallyLocation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-100 bg-white shrink-0">
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={!canReview}
                  className="w-full py-4 bg-zinc-900 disabled:bg-zinc-300 disabled:text-zinc-500 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all"
                >
                  {isUploading ? 'Uploading media…' : 'Review'}
                </button>
              )}
              {step === 3 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-4 bg-zinc-100 text-zinc-700 rounded-2xl font-bold text-sm hover:bg-zinc-200 active:scale-[0.98] transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={
                      isPosting ||
                      isUploading ||
                      isProcessingVideo ||
                      (Boolean(localPreview) && !mediaStorageId)
                    }
                    className="flex-1 py-4 bg-zinc-900 disabled:bg-zinc-300 disabled:text-zinc-500 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Posting…
                      </>
                    ) : (
                      'POST RALLY'
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
