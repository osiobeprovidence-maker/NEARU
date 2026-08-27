import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import PageShell from '../components/PageShell';
import { ShieldAlert, BadgeCheck, Star, Inbox, Send, UserPlus } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';

export default function Messages() {
  const navigate = useNavigate();
  const { convexUserId } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'conversations'>('requests');

  const conversations = useQuery(
    api.messages.listConversationsWithParticipants,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

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

      {activeTab === 'requests' ? (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
          <div className="p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
              <UserPlus className="w-8 h-8 text-indigo-500" strokeWidth={1.75} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              No pending requests
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
              When someone wants to chat about your rally, their request will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
          {conversations === undefined ? (
            <>
              <div className="h-20 bg-zinc-50 animate-pulse" />
              <div className="h-20 bg-zinc-50 animate-pulse" />
            </>
          ) : conversations.length > 0 ? (
            conversations.map(conversation => {
              const otherUser = conversation.otherParticipant;
              if (!otherUser) return null;
              return (
                <motion.div
                  key={conversation._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/messages/${conversation._id}`)}
                  className="p-4 sm:p-5 bg-white hover:bg-zinc-50/75 transition-colors cursor-pointer flex items-center justify-between gap-3.5 sm:gap-4 group"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-200 object-cover border-2 border-white shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 truncate group-hover:text-black transition-colors">
                          {otherUser.name}
                        </h3>
                        {otherUser.isNINVerified && (
                          <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {otherUser.badges?.map((badge: string) => (
                          <div title={badge} key={badge} className="flex items-center justify-center w-3.5 h-3.5 bg-amber-100 rounded-full text-amber-600 shrink-0">
                            <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                          </div>
                        ))}
                      </div>
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 truncate">
                        {conversation.rallyTitle}
                      </div>
                      <p className="text-sm text-zinc-600 font-normal truncate leading-relaxed">
                        "{conversation.lastMessage.text}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                    <span className="text-xs font-semibold text-zinc-400">
                      {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {conversation.unreadCount > 0 ? (
                      <div className="px-2 py-0.5 min-w-[20px] h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                        {conversation.unreadCount}
                      </div>
                    ) : (
                      <div className="h-5" />
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
                <Send className="w-8 h-8 text-indigo-500" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                No conversations yet
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
                Start a conversation by responding to someone's rally.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Safety Notice */}
      <div className="mt-3 sm:mt-4 mx-4 md:mx-0 p-3.5 sm:p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl md:rounded-3xl flex items-start gap-3 text-xs text-zinc-600 leading-relaxed font-medium">
        <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-zinc-800 block mb-0.5">Trust & Safety Reminder</span>
          <p className="text-zinc-500">Keep communication inside RALLY. Do not share personal contact details like phone numbers or exact residential addresses until you have built trust.</p>
        </div>
      </div>
    </PageShell>
  );
}
