import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Star, 
  Image as ImageIcon, 
  AlertCircle, 
  Smile, 
  Camera, 
  Mic, 
  Users, 
  Check, 
  CheckCheck, 
  Loader2,
  Plus,
  FileText,
  MessageCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import { App as CapApp } from '@capacitor/app';
import { ProfileVerificationCheck } from '../components/VerificationBadge';
import { cn } from '../lib/utils';
import { usePermissions } from '../contexts/PermissionContext';
import type { ChatMessage, ChatParticipant } from '../types/chat';

const EMOJIS = ['😀', '😂', '😍', '🙏', '👍', '🔥', '✨', '🎉', '💔', '💯', '🙌', '👀', '❤️', '😭', '😎', '🥳', '🚀', '👏'];

const CONVERSATION_STARTERS = [
  '👋 Say hello',
  'Hey! How is your day going?',
  'Nice to connect on LaLa!',
  'Ready for the next rally? 🚀'
];

function formatDuration(sec: number) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { convexUserId, user: authUser } = useAuth();
  
  // Input & Composer state
  const [message, setMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedEmojiTab, setSelectedEmojiTab] = useState<string>('default');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleViewport = () => {
      const diff = window.innerHeight - vv.height;
      setIsKeyboardOpen(diff > 140);
    };
    vv.addEventListener('resize', handleViewport);
    vv.addEventListener('scroll', handleViewport);
    return () => {
      vv.removeEventListener('resize', handleViewport);
      vv.removeEventListener('scroll', handleViewport);
    };
  }, []);

  // Hardware and software Back Button Handling (Requirement 5)
  // If keyboard/overlays are open -> close them first.
  // Otherwise -> cleanly return to /messages (restores bottom nav without app exit).
  useEffect(() => {
    let removeListener: (() => void) | null = null;
    try {
      CapApp.addListener('backButton', () => {
        // 1. Dismiss attachment options if open
        if (showAttachmentMenu) {
          setShowAttachmentMenu(false);
          return;
        }
        // 2. Dismiss emoji tray if open
        if (showEmojis) {
          setShowEmojis(false);
          return;
        }
        // 3. Dismiss header menu if open
        if (isMenuOpen) {
          setIsMenuOpen(false);
          return;
        }
        // 4. Dismiss keyboard / blur input if focused
        if (document.activeElement instanceof HTMLElement && (document.activeElement.tagName === 'INPUT' || isKeyboardOpen)) {
          document.activeElement.blur();
          return;
        }
        // 5. Cleanly leave the conversation screen
        navigate('/messages');
      }).then((handle) => {
        removeListener = () => handle.remove();
      }).catch(() => {});
    } catch (err) {
      console.warn('CapApp backButton error:', err);
    }

    return () => {
      removeListener?.();
    };
  }, [showAttachmentMenu, showEmojis, isMenuOpen, isKeyboardOpen, navigate]);
  
  // Optimistic messages for instant responsive UI (0ms latency)
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);

  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { requestWithRationale } = usePermissions();
  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);
  const generateAudioUploadUrl = useMutation(api.messages.generateUploadUrl);

  // Voice note recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number>(0);

  // Data fetching: Structured around conversationId and currentUserId
  const conversation = useQuery(
    api.messages.getConversation,
    id && convexUserId ? { conversationId: id as any, userId: convexUserId as any } : 'skip'
  );

  const rawMessages = useQuery(
    api.messages.listByConversation,
    id ? { conversationId: id as any } : 'skip'
  );

  const activeEmojiPacks = useQuery(api.media.listActiveEmojiPacks);

  // Normalized conversation details
  const otherUser = conversation?.otherParticipant as ChatParticipant | undefined;
  const isRally = conversation?.type === 'rally';
  const recipientId = otherUser?._id;
  const currentUserId = (convexUserId as string) || authUser?.id || '';

  // Merge server messages with pending optimistic messages
  const allMessages = useMemo(() => {
    if (!rawMessages) return undefined;
    const serverMap = new Set(rawMessages.map((m: any) => m._id));
    // Filter out optimistic messages that are now confirmed on server
    const pendingOptimistic = optimisticMessages.filter(
      (opt) => !serverMap.has(opt.id) && opt.conversationId === id
    );

    const mappedServer: ChatMessage[] = rawMessages.map((m: any) => {
      const isMe = m.senderId === currentUserId;
      const read = (m.readByIds ?? []).some((r: any) => r !== m.senderId && r !== currentUserId);
      return {
        id: m._id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        recipientId,
        text: m.text,
        timestamp: m.timestamp,
        status: isMe ? (read ? 'read' : 'sent') : 'delivered',
        readByIds: m.readByIds,
        audioUrl: m.audioUrl,
        audioDuration: m.audioDuration,
      };
    });

    return [...mappedServer, ...pendingOptimistic];
  }, [rawMessages, optimisticMessages, id, currentUserId, recipientId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages?.length]);

  // Mark conversation as read
  useEffect(() => {
    if (id && convexUserId && conversation) {
      markRead({ conversationId: id as any, userId: convexUserId as any }).catch(() => {});
    }
  }, [id, convexUserId, conversation?._id, rawMessages?.length]);

  // Voice recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Auto-stop after 3 minutes
  useEffect(() => {
    if (!isRecording) return;
    const timer = setTimeout(() => stopRecordingAndSend(), 3 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isRecording]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      const r = mediaRecorderRef.current;
      if (r && r.state !== 'inactive') {
        r.ondataavailable = null;
        r.onstop = null;
        try {
          r.stop();
        } catch {}
      }
      mediaRecorderRef.current = null;
    };
  }, []);

  const showToast = (title: string, subtitle: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));
  };

  // Optimistic message send handler
  const submitTextMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || !id || !convexUserId) return;

    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newOptimisticMsg: ChatMessage = {
      id: optimisticId,
      conversationId: id,
      senderId: currentUserId,
      recipientId,
      text: trimmed,
      timestamp: Date.now(),
      status: 'sending',
      isOptimistic: true,
    };

    // 1. Immediately update UI
    setOptimisticMessages((prev) => [...prev, newOptimisticMsg]);
    setMessage('');
    setShowEmojis(false);
    setShowAttachmentMenu(false);

    // 2. Scroll immediately
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 10);

    // 3. Dispatch to backend (Convex / Firestore ready)
    try {
      await sendMessage({
        conversationId: id as any,
        senderId: convexUserId as any,
        text: trimmed,
      });
      // Mark as sent in optimistic state
      setOptimisticMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, status: 'sent' } : m))
      );
    } catch (err: any) {
      setOptimisticMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, status: 'error' } : m))
      );
      showToast('Message failed', err?.message || 'Please check connection and retry');
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    submitTextMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitTextMessage(message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'camera' | 'file') => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('Attachment selected', `${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
      setShowAttachmentMenu(false);
    }
    e.target.value = '';
  };

  // Voice note recording
  const sendVoiceNote = async (chunks: Blob[], duration: number) => {
    if (!chunks.length || !id || !convexUserId) return;
    setIsSendingAudio(true);
    try {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const uploadUrl = await generateAudioUploadUrl();
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { storageId } = await res.json();
      if (!storageId) throw new Error('No storage ID returned');
      await sendMessage({
        conversationId: id as any,
        senderId: convexUserId as any,
        text: '',
        audioStorageId: storageId,
        audioDuration: duration,
      });
    } catch (err: any) {
      showToast('Could not send voice note', err?.message || 'Please try again.');
    } finally {
      setIsSendingAudio(false);
      setShowEmojis(false);
    }
  };

  const startRecording = async () => {
    if (isSendingAudio) return;
    try {
      const permRes = await requestWithRationale('microphone');
      if (!permRes.granted) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      recordStartRef.current = Date.now();
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const duration = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        sendVoiceNote(audioChunksRef.current, duration);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
    } catch {
      showToast('Microphone unavailable', 'Allow microphone access to send a voice note.');
    }
  };

  const stopRecordingAndSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-full w-full bg-white items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <div className="text-zinc-600 font-medium text-sm">Opening conversation...</div>
      </div>
    );
  }

  const headerTitle = isRally ? (conversation.rallyTitle || 'RALLY chat') : otherUser?.name || 'Chat';
  const headerSubtitle = isRally
    ? `${conversation.participantIds?.length ?? 0} participants`
    : (conversation.rallyTitle || 'Direct message');

  return (
    <div 
      className="flex flex-col h-full w-full bg-white relative overflow-hidden"
      style={{ height: '100%' }}
    >
      {/* Hidden File Pickers */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={(e) => handleFileChange(e, 'photo')}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleFileChange(e, 'camera')}
        className="hidden"
        accept="image/*"
        capture="environment"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, 'file')}
        className="hidden"
        accept="*/*"
      />

      {/* 1. Header (Requirement 2 & 9: Back, Avatar, Name, Status, Three-dot, Safe-area) */}
      <header className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-zinc-100 shrink-0 sticky top-0 bg-white/95 backdrop-blur-md z-20 shadow-xs safe-area-top">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate('/messages')}
            className="p-1.5 -ml-1 rounded-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors active:scale-95 shrink-0"
            title="Back to Messages"
            aria-label="Back to Messages"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div 
            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            onClick={() => {
              if (!isRally && otherUser?._id) {
                navigate(`/user/${otherUser._id}`);
              }
            }}
          >
            {isRally ? (
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            ) : (
              <Avatar
                src={otherUser?.avatar}
                name={otherUser?.name || 'User'}
                size="md"
                className="shrink-0 ring-1 ring-zinc-200"
              />
            )}
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="font-bold text-zinc-900 text-sm sm:text-base leading-tight truncate">
                  {headerTitle}
                </h2>
                {!isRally && <ProfileVerificationCheck user={otherUser} size="sm" />}
                {!isRally && otherUser?.badges?.map((badge: string) => (
                  <div title={badge} key={badge} className="flex items-center justify-center w-4 h-4 bg-amber-100 rounded-full text-amber-600 shrink-0">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-zinc-500 truncate">
                {headerSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Action Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -mr-1 rounded-full text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors active:scale-95"
            title="Chat Options"
            aria-label="Chat Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && !isRally && otherUser && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/5"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute top-full right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-zinc-100 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(`/review/${otherUser._id}`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors"
                >
                  <Star className="w-4 h-4 text-amber-500" /> Leave a Review
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(`/report/${otherUser._id}`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors border-t border-zinc-100"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500" /> Report User
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 bg-white"
        onClick={() => {
          setShowEmojis(false);
          setShowAttachmentMenu(false);
        }}
      >
        {allMessages === undefined ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading messages...</span>
          </div>
        ) : allMessages.length === 0 ? (
          /* Empty State (Requirement 9) */
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-sm mx-auto h-full animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
              <MessageCircle className="w-8 h-8" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">
              Start a conversation
            </h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              Send a message to begin chatting{otherUser?.name ? ` with ${otherUser.name}` : ''}.
            </p>

            <div className="flex flex-col gap-2 w-full">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-left pl-1">
                Suggested Starters
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CONVERSATION_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => submitTextMessage(starter)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 text-zinc-700 text-xs font-medium rounded-full transition-all border border-zinc-200/50 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>{starter}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center my-2">
              <span className="px-3 py-0.5 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Today
              </span>
            </div>

            {allMessages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const isSending = msg.status === 'sending';
              const isRead = msg.status === 'read';
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}>
                  <div
                    className={cn(
                      "max-w-[78%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-xs",
                      isMe
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs"
                        : "bg-zinc-100 text-zinc-900 rounded-bl-xs font-medium"
                    )}
                  >
                    {/* Message Text */}
                    {msg.text && (
                      msg.text.startsWith('http') && (msg.text.includes('/api/storage/') || msg.text.match(/\.(png|jpe?g|webp|gif|svg)($|\?)/i)) ? (
                        <div className="my-1 max-w-xs rounded-xl overflow-hidden">
                          <img src={msg.text} alt="Sticker" className="max-h-44 max-w-full rounded-xl object-contain bg-white/10 p-1" />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      )
                    )}

                    {/* Audio Note */}
                    {msg.audioUrl && (
                      <div className="flex flex-col gap-1 min-w-[200px] my-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                          <Mic className="w-3 h-3" /> Voice note
                          {msg.audioDuration ? ` · ${formatDuration(msg.audioDuration)}` : ''}
                        </span>
                        <audio src={msg.audioUrl} controls preload="metadata" className="w-full h-9 rounded-lg" />
                      </div>
                    )}

                    {/* Timestamp & Status Delivery Indicator */}
                    <div
                      className={cn(
                        "text-[10px] mt-1 flex items-center justify-end gap-1 font-medium select-none",
                        isMe ? "text-indigo-100/80" : "text-zinc-400"
                      )}
                    >
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        isSending ? (
                          <Clock className="w-3 h-3 opacity-80 animate-spin" />
                        ) : isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300 font-bold" />
                        ) : (
                          <Check className="w-3.5 h-3.5 opacity-80" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={endRef} />
      </div>

      {/* 3. Fixed Message Composer anchored to bottom of conversation */}
      <div className={cn("shrink-0 bg-white/95 backdrop-blur-md border-t border-zinc-100 relative z-30 shadow-xs", isKeyboardOpen ? "p-2" : "p-2.5 sm:p-3 safe-area-bottom")}>
        {/* Emoji Selector Popup */}
        {showEmojis && (
          <div className="absolute bottom-full left-2 mb-2 bg-white rounded-2xl shadow-xl border border-zinc-200 p-3 z-50 w-72 sm:w-80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-1.5 border-b border-zinc-100 pb-2 mb-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedEmojiTab('default')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0',
                  selectedEmojiTab === 'default'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                )}
              >
                😀 Default
              </button>
              {activeEmojiPacks?.map((pack: any) => (
                <button
                  key={pack._id}
                  type="button"
                  onClick={() => setSelectedEmojiTab(pack._id)}
                  className={cn(
                    'px-2 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer',
                    selectedEmojiTab === pack._id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                >
                  {pack.iconUrl && (
                    <img src={pack.iconUrl} alt={pack.name} className="w-3.5 h-3.5 rounded object-cover" />
                  )}
                  <span>{pack.name}</span>
                </button>
              ))}
            </div>

            {selectedEmojiTab === 'default' ? (
              <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setMessage((prev) => prev + e);
                      textInputRef.current?.focus();
                    }}
                    className="p-1.5 hover:bg-zinc-100 rounded-lg text-xl transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {activeEmojiPacks
                  ?.find((p: any) => p._id === selectedEmojiTab)
                  ?.items?.map((item: any) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={async () => {
                        if (item.mediaUrl) {
                          await submitTextMessage(item.mediaUrl);
                        }
                      }}
                      className="p-1 hover:bg-zinc-100 rounded-xl transition-all hover:scale-105 flex items-center justify-center cursor-pointer"
                      title={item.name}
                    >
                      <img
                        src={item.mediaUrl}
                        alt={item.name}
                        className="w-10 h-10 object-contain"
                      />
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Attachment Action Sheet (Requirement 8) */}
        {showAttachmentMenu && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
              onClick={() => setShowAttachmentMenu(false)} 
            />
            <div className="absolute bottom-full left-3 mb-2 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-2 flex flex-col gap-1 z-50 min-w-[170px] animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  photoInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-3 p-2 hover:bg-zinc-100 active:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cameraInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-3 p-2 hover:bg-zinc-100 active:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-3 p-2 hover:bg-zinc-100 active:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span>File</span>
              </button>
            </div>
          </>
        )}

        {/* Composer Row */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {isRecording ? (
            /* Voice Recording Bar */
            <div className="flex-1 bg-white rounded-full flex items-center justify-between px-4 py-2 shadow-xs border border-rose-200 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                <Mic className="w-4 h-4" />
                <span className="text-xs font-bold">Recording {formatDuration(recordingDuration)}</span>
              </div>
              <button
                type="button"
                onClick={cancelRecording}
                className="text-zinc-400 hover:text-zinc-700 text-xs font-bold px-2 py-1 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* Attachment / "+" Button on Left (Requirement 3 & 8) */}
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu((prev) => !prev);
                  setShowEmojis(false);
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95",
                  showAttachmentMenu
                    ? "bg-zinc-900 text-white rotate-45"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                )}
                title="Add attachment"
                aria-label="Add attachment"
              >
                <Plus className="w-5 h-5 transition-transform" />
              </button>

              {/* Rounded Message Input in Center (Requirement 3, 5, 7) */}
              <div className="flex-1 bg-zinc-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-zinc-200/60 rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojis((prev) => !prev);
                    setShowAttachmentMenu(false);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full transition-colors shrink-0"
                  title="Insert emoji"
                  aria-label="Insert emoji"
                >
                  <Smile className="w-4.5 h-4.5" strokeWidth={1.75} />
                </button>

                <input
                  ref={textInputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message..."
                  enterKeyHint="send"
                  autoComplete="off"
                  className="flex-1 bg-transparent border-0 focus:outline-hidden focus:ring-0 px-1 py-1 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </>
          )}

          {/* Send / Mic Button on Right (Requirement 3, 6) */}
          <button
            type={isSendingAudio ? "button" : message.trim() ? "submit" : "button"}
            onClick={isSendingAudio ? undefined : !message.trim() ? handleMicClick : undefined}
            disabled={isSendingAudio}
            className={cn(
              "w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-xs",
              isRecording
                ? "bg-rose-600 hover:bg-rose-700 animate-pulse"
                : isSendingAudio
                ? "bg-zinc-400 cursor-not-allowed"
                : message.trim()
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/20"
                : "bg-zinc-900 hover:bg-zinc-800 text-white"
            )}
            title={message.trim() ? "Send message" : isRecording ? "Stop and send" : "Record voice note"}
            aria-label={message.trim() ? "Send message" : isRecording ? "Stop and send" : "Record voice note"}
          >
            {isSendingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : message.trim() ? (
              <Send className="w-4 h-4 ml-0.5" />
            ) : isRecording ? (
              <Check className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
