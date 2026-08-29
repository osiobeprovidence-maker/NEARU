import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MapPin, MoreVertical, BadgeCheck, Star, Image as ImageIcon, AlertCircle, Smile, Paperclip, Camera, Mic, Play, Users, Check, CheckCheck } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';

const EMOJIS = ['😀', '😂', '😍', '🙏', '👍', '🔥', '✨', '🎉', '💔', '💯', '🙌', '👀'];

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { convexUserId } = useAuth();
  const [message, setMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);

  const conversation = useQuery(
    api.messages.getConversation,
    id && convexUserId ? { conversationId: id as any, userId: convexUserId as any } : 'skip'
  );

  const messages = useQuery(
    api.messages.listByConversation,
    id ? { conversationId: id as any } : 'skip'
  );

  const otherUser = conversation?.otherParticipant;
  const isRally = conversation?.type === 'rally';

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read whenever we open it / receive new messages.
  useEffect(() => {
    if (id && convexUserId && conversation) {
      markRead({ conversationId: id as any, userId: convexUserId as any }).catch(() => {});
    }
  }, [id, convexUserId, conversation?._id, messages?.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !id || !convexUserId) return;

    await sendMessage({
      conversationId: id as any,
      senderId: convexUserId as any,
      text: message.trim(),
    });
    setMessage('');
    setShowEmojis(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // File upload not yet implemented with Convex storage
      console.log('File selected:', url);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  const handleAction = (title: string, subtitle: string) => {
    setIsMenuOpen(false);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title, subtitle }
    }));
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen w-full bg-white items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading conversation...</div>
      </div>
    );
  }

  const headerTitle = isRally ? (conversation.rallyTitle || 'RALLY chat') : otherUser?.name || 'Chat';
  const headerSubtitle = isRally
    ? `${conversation.participantIds?.length ?? 0} participants`
    : (conversation.rallyTitle || 'Direct message');

  // Determine whether a sent message has been read: any OTHER participant has
  // read the message (readByIds includes someone other than the sender).
  const isMessageRead = (msg: any) =>
    (msg.readByIds ?? []).some((r: any) => r !== msg.senderId && r !== convexUserId);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen w-full bg-white relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,video/*"
      />
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 shrink-0 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-900" />
          </button>
          <div className="flex items-center gap-3">
            {isRally ? (
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            ) : (
              <Avatar
                src={otherUser?.avatar}
                name={otherUser?.name || 'User'}
                size="md"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="font-bold text-zinc-900 leading-tight truncate">{headerTitle}</h2>
                {!isRally && otherUser?.isNINVerified && (
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {!isRally && otherUser?.badges?.map((badge: string) => (
                  <div title={badge} key={badge} className="flex items-center justify-center w-4 h-4 bg-amber-100 rounded-full text-amber-600 shrink-0">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-zinc-500">{headerSubtitle}</p>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -mr-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-zinc-900" />
          </button>
          
          {isMenuOpen && !isRally && otherUser && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50">
              <button 
                onClick={() => navigate(`/review/${otherUser._id}`)}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
              >
                <Star className="w-4 h-4" /> Leave a Review
              </button>
              <button 
                onClick={() => navigate(`/report/${otherUser._id}`)}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-zinc-100"
              >
                <AlertCircle className="w-4 h-4" /> Report User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => { setShowEmojis(false); setShowAttachmentMenu(false); }}>
        <div className="flex justify-center mb-6">
          <div className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Today
          </div>
        </div>
        
        {messages === undefined ? (
          <div className="text-center text-zinc-400 text-sm py-8">Loading messages...</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === convexUserId;
            const read = isMessageRead(msg);
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-black text-white rounded-br-sm' 
                      : 'bg-zinc-100 text-zinc-900 rounded-bl-sm font-medium'
                  }`}
                >
                  {msg.text && <div>{msg.text}</div>}
                  
                  <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && (
                      read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-zinc-400" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 border-t border-zinc-100 bg-zinc-50 shrink-0 relative">
        {showEmojis && (
          <div className="absolute bottom-full left-2 mb-2 bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 grid grid-cols-6 gap-1 z-50">
            {EMOJIS.map(e => (
              <button 
                key={e}
                type="button" 
                onClick={() => { setMessage(prev => prev + e); setShowEmojis(false); }} 
                className="p-2 hover:bg-zinc-100 rounded-lg text-xl"
              >
                {e}
              </button>
            ))}
          </div>
        )}
        
        {showAttachmentMenu && (
          <div className="absolute bottom-full right-16 mb-2 bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 flex flex-col gap-1 z-50 min-w-[160px]">
            <button 
              type="button" 
              onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }} 
              className="flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-xl text-sm font-semibold text-zinc-700"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              Gallery
            </button>
            <button 
              type="button" 
              onClick={() => setShowAttachmentMenu(false)} 
              className="flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-xl text-sm font-semibold text-zinc-700"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              Location
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-1.5">
          {isRecording ? (
            <div className="flex-1 bg-white rounded-3xl flex items-center justify-between px-4 py-2.5 shadow-sm border border-rose-200">
               <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                  <Mic className="w-5 h-5" />
                  <span className="text-sm font-semibold">Recording... 0:{recordingDuration.toString().padStart(2, '0')}</span>
               </div>
               <button 
                  type="button" 
                  onClick={() => setIsRecording(false)} 
                  className="text-zinc-400 text-sm font-bold hover:text-zinc-600"
               >
                 Cancel
               </button>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-3xl flex items-center px-0.5 py-0.5 shadow-sm border border-zinc-200">
              <button 
                type="button"
                onClick={() => { setShowEmojis(!showEmojis); setShowAttachmentMenu(false); }}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full transition-colors shrink-0"
              >
                <Smile className="w-5 h-5" strokeWidth={1.5} />
              </button>
              
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message"
                className="flex-1 bg-transparent border-transparent focus:ring-0 px-1 py-1.5 text-sm"
              />
              
              <button 
                type="button"
                onClick={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowEmojis(false); }}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full transition-colors shrink-0"
              >
                <Paperclip className="w-4 h-4" strokeWidth={1.5} />
              </button>
              
              {!message.trim() && (
                <button 
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full transition-colors shrink-0 mr-1"
                >
                  <Camera className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}
          
          <button 
            type={message.trim() ? "submit" : "button"}
            onClick={!message.trim() ? handleMicClick : undefined}
            className={`w-10 h-10 mb-0.5 rounded-full text-white flex items-center justify-center shrink-0 transition-all shadow-sm ${
              isRecording 
                ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' 
                : message.trim() 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {message.trim() ? (
              <Send className="w-4 h-4 ml-0.5" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
