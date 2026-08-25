import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import PageShell from '../components/PageShell';
import { mockConversations } from '../data/mock';
import { ShieldAlert, BadgeCheck, Star } from 'lucide-react';

export default function Messages() {
  const navigate = useNavigate();

  return (
    <PageShell title="Messages">
      {/* Feed-style Messages Container */}
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
        {mockConversations.map(conversation => {
          const otherUser = conversation.participants[0];
          return (
            <motion.div 
              key={conversation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/messages/${conversation.id}`)}
              className="p-5 sm:p-6 bg-white hover:bg-zinc-50/75 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                <img 
                  src={otherUser.avatar} 
                  alt={otherUser.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-200 object-cover border-2 border-white shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 truncate group-hover:text-black transition-colors">
                      {otherUser.name}
                    </h3>
                    {otherUser.isNINVerified && (
                      <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {otherUser.badges?.map(badge => (
                      <div title={badge} key={badge} className="flex items-center justify-center w-3.5 h-3.5 bg-amber-100 rounded-full text-amber-600 shrink-0">
                        <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 truncate">
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
        })}
      </div>
      
      {/* Safety Notice */}
      <div className="mt-8 mx-4 md:mx-0 p-4 sm:p-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl md:rounded-3xl flex items-start gap-3.5 text-xs text-zinc-600 leading-relaxed font-medium">
        <ShieldAlert className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-zinc-800 block mb-0.5">Trust & Safety Reminder</span>
          <p className="text-zinc-500">Keep communication inside RALLY. Do not share personal contact details like phone numbers or exact residential addresses until you have built trust.</p>
        </div>
      </div>
    </PageShell>
  );
}
