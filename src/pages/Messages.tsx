import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import PageShell from '../components/PageShell';
import { ShieldAlert, BadgeCheck, Star, Inbox, Send, UserPlus, Check, X, Users, MessageCircle } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { convexUserId } = useAuth();
  const initialTab = (location.state as any)?.tab === 'conversations' ? 'conversations' : 'requests';
  const [activeTab, setActiveTab] = useState<'requests' | 'conversations'>(initialTab);

  const conversations = useQuery(
    api.messages.listConversationsWithParticipants,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const incomingRequests = useQuery(
    api.chatRequests.listByUser,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const outgoingRequests = useQuery(
    api.chatRequests.listSentByUser,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const acceptMut = useMutation(api.chatRequests.accept);
  const declineMut = useMutation(api.chatRequests.decline);
  const cancelMut = useMutation(api.chatRequests.cancel);

  const showToast = (title: string, subtitle: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));

  const handleAccept = async (requestId: string) => {
    if (!convexUserId) return;
    try {
      const res = await acceptMut({ requestId: requestId as any, userId: convexUserId as any });
      showToast('Request accepted', 'You can now chat.');
      navigate(`/messages/${res.conversationId}`);
    } catch (e: any) {
      showToast('Error', e.message || 'Could not accept request.');
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!convexUserId) return;
    try {
      await declineMut({ requestId: requestId as any, userId: convexUserId as any });
      showToast('Request declined', '');
    } catch {
      showToast('Error', 'Could not decline request.');
    }
  };

  const renderRequests = () => {
    const pendingIncoming = (incomingRequests ?? []).filter((r: any) => r.status === 'PENDING');
    const pendingOutgoing = (outgoingRequests ?? []).filter((r: any) => r.status === 'PENDING');
    const hasAny = pendingIncoming.length > 0 || pendingOutgoing.length > 0;

    if (incomingRequests === undefined || outgoingRequests === undefined) {
      return (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="h-20 bg-zinc-50 animate-pulse" />
          <div className="h-20 bg-zinc-50 animate-pulse" />
        </div>
      );
    }

    if (!hasAny) {
      return (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
              <UserPlus className="w-8 h-8 text-indigo-500" strokeWidth={1.75} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              No pending requests
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
              Message requests let you chat with people you don't yet follow each other. You can have up to 3 pending outgoing requests.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
        {pendingIncoming.map((req: any) => (
          <motion.div key={req._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3.5 gap-4">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <Avatar src={req.sender?.avatar} name={req.sender?.name || 'User'} size="lg" className="border-2 border-white shadow-sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-base font-bold text-zinc-900 truncate">{req.sender?.name || 'User'}</h3>
                    {req.sender?.isNINVerified && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {req.sender?.badges?.map((b: string) => (
                      <div title={b} key={b} className="flex items-center justify-center w-3.5 h-3.5 bg-amber-100 rounded-full text-amber-600 shrink-0">
                        <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                      </div>
                    ))}
                    <span className="ml-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">Incoming</span>
                  </div>
                  <p className="text-sm text-zinc-700 font-medium leading-relaxed line-clamp-2">"{req.message}"</p>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(req._id)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => handleDecline(req._id)}
                  className="px-4 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-zinc-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {pendingIncoming.length > 0 && pendingOutgoing.length > 0 && (
          <div className="px-4 sm:px-5 py-2 bg-zinc-50 flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Send className="w-3.5 h-3.5" /> Sent by you
          </div>
        )}

        {pendingOutgoing.map((req: any) => (
          <motion.div key={req._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <Avatar src={req.target?.avatar} name={req.target?.name || 'User'} size="lg" className="border-2 border-white shadow-sm opacity-70" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-zinc-800 truncate">{req.target?.name || 'User'}</h3>
                    {req.target?.isNINVerified && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">Awaiting reply</span>
                  </div>
                  <p className="text-sm text-zinc-600 font-medium leading-relaxed line-clamp-2">"{req.message}"</p>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!convexUserId) return;
                  try {
                    await cancelMut({ requestId: req._id, userId: convexUserId as any });
                    showToast('Request cancelled', 'You can send a new request now.');
                  } catch {
                    showToast('Error', 'Could not cancel request.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-bold inline-flex items-center gap-1.5 transition-colors active:scale-95 shrink-0"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderConversations = () => {
    if (conversations === undefined) {
      return (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="h-20 bg-zinc-50 animate-pulse" />
          <div className="h-20 bg-zinc-50 animate-pulse" />
        </div>
      );
    }

    if (conversations.length === 0) {
      return (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
              <Send className="w-8 h-8 text-indigo-500" strokeWidth={1.75} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">No conversations yet</h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
              Start a direct chat with someone you mutually follow, or join a RALLY to chat with its participants.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
        {conversations.map((conversation: any) => {
          const isRally = conversation.isDirect === false || conversation.type === 'rally';
          const title = isRally ? (conversation.rallyTitle || 'RALLY chat') : (conversation.otherParticipant?.name || 'Chat');
          const sub = conversation.lastMessage?.senderId === convexUserId
            ? `You: ${conversation.lastMessage.text}`
            : conversation.lastMessage.text;
          const myUnread = conversation.myUnread ?? 0;
          return (
            <motion.div
              key={conversation._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/messages/${conversation._id}`)}
              className="p-4 sm:p-5 bg-white hover:bg-zinc-50/75 transition-colors cursor-pointer flex items-center justify-between gap-3.5 sm:gap-4 group"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                {isRally ? (
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                ) : (
                  <Avatar
                    src={conversation.otherParticipant?.avatar}
                    name={conversation.otherParticipant?.name || 'User'}
                    size="lg"
                    className="border-2 border-white shadow-sm"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {isRally && (
                      <MessageCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    )}
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 truncate group-hover:text-black transition-colors">
                      {title}
                    </h3>
                    {!isRally && conversation.otherParticipant?.isNINVerified && (
                      <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {!isRally && conversation.otherParticipant?.badges?.map((badge: string) => (
                      <div title={badge} key={badge} className="flex items-center justify-center w-3.5 h-3.5 bg-amber-100 rounded-full text-amber-600 shrink-0">
                        <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                      </div>
                    ))}
                  </div>
                  {isRally && (
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 truncate">
                      {conversation.participantIds.length} participants
                    </div>
                  )}
                  <p className="text-sm text-zinc-600 font-normal truncate leading-relaxed">"{sub}"</p>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                <span className="text-xs font-semibold text-zinc-400">
                  {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {myUnread > 0 ? (
                  <div className="px-2 py-0.5 min-w-[20px] h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {myUnread}
                  </div>
                ) : (
                  <div className="h-5" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <PageShell title="Messages">
      <div className="px-4 md:px-6 mb-4">
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'requests'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Inbox className="w-4 h-4" />
              Chat Requests
            </span>
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'conversations'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Send className="w-4 h-4" />
              Conversations
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'requests' ? renderRequests() : renderConversations()}

      {/* Safety Notice */}
      <div className="mt-3 sm:mt-4 mx-4 md:mx-0 p-3.5 sm:p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl md:rounded-3xl flex items-start gap-3 text-xs text-zinc-600 leading-relaxed font-medium">
        <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-zinc-800 block mb-0.5">Trust & Safety Reminder</span>
          <p className="text-zinc-500">Keep communication inside lalao. Do not share personal contact details like phone numbers or exact residential addresses until you have built trust.</p>
        </div>
      </div>
    </PageShell>
  );
}
