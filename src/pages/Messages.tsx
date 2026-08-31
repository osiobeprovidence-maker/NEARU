import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import PageShell from '../components/PageShell';
import { ShieldAlert, BadgeCheck, Star, Send, Users, MessageCircle, Inbox } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';

type InboxItem = {
  key: string;
  kind: 'conversation' | 'incoming_request' | 'outgoing_request';
  timestamp: number;
  title: string;
  subtitle: string;
  avatar?: string;
  avatarName: string;
  unread: number;
  isRally?: boolean;
  isNINVerified?: boolean;
  badges?: string[];
  // navigation
  navigateTo: () => void;
};

export default function Messages() {
  const navigate = useNavigate();
  const { convexUserId } = useAuth();

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

  const loading = conversations === undefined || incomingRequests === undefined || outgoingRequests === undefined;

  const pendingIncoming = (incomingRequests ?? []).filter((r: any) => r.status === 'PENDING');
  const pendingOutgoing = (outgoingRequests ?? []).filter((r: any) => r.status === 'PENDING');

  const buildItems = (): InboxItem[] => {
    const items: InboxItem[] = [];

    (conversations ?? []).forEach((conversation: any) => {
      const isRally = conversation.isDirect === false || conversation.type === 'rally';
      const title = isRally
        ? conversation.rallyTitle || 'RALLY chat'
        : conversation.otherParticipant?.name || 'Chat';
      const last = conversation.lastMessage;
      const isMe = last?.senderId === convexUserId;
      const sub = isMe
        ? `You: ${last?.text ?? ''}`
        : (last?.text ?? '');
      items.push({
        key: `c-${conversation._id}`,
        kind: 'conversation',
        timestamp: last?.timestamp ?? 0,
        title,
        subtitle: sub,
        avatar: isRally ? undefined : conversation.otherParticipant?.avatar,
        avatarName: isRally ? title : conversation.otherParticipant?.name || 'User',
        unread: conversation.myUnread ?? 0,
        isRally,
        isNINVerified: conversation.otherParticipant?.isNINVerified,
        badges: conversation.otherParticipant?.badges,
        navigateTo: () => navigate(`/messages/${conversation._id}`),
      });
    });

    pendingIncoming.forEach((req: any) => {
      const name = req.sender?.name || 'User';
      items.push({
        key: `ir-${req._id}`,
        kind: 'incoming_request',
        timestamp: req.createdAt,
        title: name,
        subtitle: req.message || '',
        avatar: req.sender?.avatar,
        avatarName: name,
        unread: 1,
        isNINVerified: req.sender?.isNINVerified,
        badges: req.sender?.badges,
        navigateTo: () => navigate(`/messages/request/${req._id}`),
      });
    });

    pendingOutgoing.forEach((req: any) => {
      const name = req.target?.name || 'User';
      items.push({
        key: `or-${req._id}`,
        kind: 'outgoing_request',
        timestamp: req.createdAt,
        title: name,
        subtitle: `Waiting for ${name.split(' ')[0] || 'them'} to reply`,
        avatar: req.target?.avatar,
        avatarName: name,
        unread: 0,
        isNINVerified: req.target?.isNINVerified,
        badges: req.target?.badges,
        navigateTo: () => navigate(`/user/${req.target?._id}`),
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  };

  const items = loading ? [] : buildItems();
  const hasRequests = pendingIncoming.length > 0 || pendingOutgoing.length > 0;

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderRow = (item: InboxItem, showSectionHeader: boolean) => (
    <React.Fragment key={item.key}>
      {showSectionHeader ? (
        <div className="px-4 sm:px-5 py-2 bg-zinc-100/80 flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          <Inbox className="w-3.5 h-3.5" /> Message requests
        </div>
      ) : null}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={item.navigateTo}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') item.navigateTo();
        }}
        className={`w-full flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 text-left transition-colors cursor-pointer border-b border-zinc-100 last:border-b-0 group ${
          item.unread > 0
            ? 'bg-indigo-50/40 hover:bg-indigo-50/60'
            : 'bg-white hover:bg-zinc-50/75'
        }`}
      >
        {/* Avatar / group icon */}
        {item.isRally ? (
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
        ) : (
          <div className="relative shrink-0">
            <Avatar
              src={item.avatar}
              name={item.avatarName}
              size="lg"
              className="border-2 border-white shadow-sm"
            />
            {item.unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
            )}
          </div>
        )}

        {/* Text block */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3
              className={`truncate ${
                item.unread > 0 ? 'text-[15px] sm:text-base font-black text-zinc-950' : 'text-base font-bold text-zinc-900'
              }`}
            >
              {item.title}
            </h3>
            {item.isRally && <MessageCircle className="w-4 h-4 text-indigo-500 shrink-0" />}
            {!item.isRally && item.isNINVerified && (
              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {!item.isRally && item.badges?.map((b: string) => (
              <div title={b} key={b} className="flex items-center justify-center w-3.5 h-3.5 bg-amber-100 rounded-full text-amber-600 shrink-0">
                <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p
              className={`truncate text-sm leading-relaxed ${
                item.unread > 0 ? 'text-zinc-800 font-semibold' : 'text-zinc-500 font-normal'
              }`}
            >
              {item.subtitle}
            </p>
            {item.kind === 'incoming_request' && (
              <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                Message request
              </span>
            )}
            {item.kind === 'outgoing_request' && (
              <span className="shrink-0 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                Awaiting reply
              </span>
            )}
          </div>
        </div>

        {/* Right column: time + unread */}
        <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5 gap-1.5">
          <span className="text-xs font-semibold text-zinc-400">
            {formatTime(item.timestamp)}
          </span>
          {item.kind === 'incoming_request' ? (
            <div className="px-2 py-0.5 min-w-[20px] h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
              New
            </div>
          ) : item.unread > 0 ? (
            <div className="px-2 py-0.5 min-w-[20px] h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
              {item.unread}
            </div>
          ) : null}
        </div>
      </motion.div>
    </React.Fragment>
  );

  return (
    <PageShell title="Messages">
      {loading ? (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="h-20 bg-zinc-50 animate-pulse" />
          <div className="h-20 bg-zinc-50 animate-pulse" />
          <div className="h-20 bg-zinc-50 animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
              <Send className="w-8 h-8 text-indigo-500" strokeWidth={1.75} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Your inbox is empty
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
              Messages from people you talk to and message requests will show up here. Start a
              direct chat with someone you mutually follow, or join a RALLY to chat with its
              participants.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden overflow-y-auto">
          {items.map((item, idx) => {
            const showSectionHeader =
              item.kind === 'incoming_request' || item.kind === 'outgoing_request'
                ? hasRequests && items[idx - 1]?.kind === 'conversation'
                : false;
            return renderRow(item, showSectionHeader);
          })}
        </div>
      )}

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
