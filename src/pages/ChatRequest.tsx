import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BadgeCheck, Check, X, Star, ShieldAlert, UserPlus } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import PageShell from '../components/PageShell';

export default function ChatRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { convexUserId } = useAuth();
  const [busy, setBusy] = useState<null | 'accept' | 'decline'>(null);

  const request = useQuery(
    api.chatRequests.get,
    id ? { requestId: id as any } : 'skip'
  );

  const acceptMut = useMutation(api.chatRequests.accept);
  const declineMut = useMutation(api.chatRequests.decline);

  const sender = request?.sender;

  const showToast = (title: string, subtitle: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));

  // If the request was just accepted (status flipped to ACCEPTED by another tab
  // or by this page), route into the resulting conversation passed via state.
  useEffect(() => {
    if (request?.status !== 'PENDING' && request?.status !== undefined) {
      // Non-pending request -> fall back to the inbox.
      navigate('/messages', { replace: true });
    }
  }, [request?.status, navigate]);

  const handleAccept = async () => {
    if (!convexUserId || !id || busy) return;
    setBusy('accept');
    try {
      const res = await acceptMut({ requestId: id as any, userId: convexUserId as any });
      showToast('Request accepted', 'You can now chat.');
      navigate(`/messages/${res.conversationId}`);
    } catch (e: any) {
      showToast('Error', e.message || 'Could not accept request.');
      setBusy(null);
    }
  };

  const handleDecline = async () => {
    if (!convexUserId || !id || busy) return;
    setBusy('decline');
    try {
      await declineMut({ requestId: id as any, userId: convexUserId as any });
      showToast('Request declined', '');
      navigate('/messages', { replace: true });
    } catch (e: any) {
      showToast('Error', e.message || 'Could not decline request.');
      setBusy(null);
    }
  };

  const isPending = request?.status === 'PENDING';
  const timestamp = request?.createdAt;

  return (
    <PageShell title="Message request">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-900" />
          </button>
          <h2 className="font-bold text-zinc-900 leading-tight truncate">Message request</h2>
        </div>
      </div>

      {request === undefined ? (
        <div className="flex h-full items-center justify-center py-16">
          <div className="text-zinc-400 text-sm">Loading request...</div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto w-full p-4 sm:p-6"
        >
          <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar src={sender?.avatar} name={sender?.name || 'User'} size="xl" className="border-4 border-white shadow-md" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm border-2 border-white">
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                  {sender?.name || 'Someone'}
                </h3>
                {sender?.isNINVerified && <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
                {sender?.badges?.map((b: string) => (
                  <div title={b} key={b} className="flex items-center justify-center w-5 h-5 bg-amber-100 rounded-full text-amber-600 shrink-0">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  </div>
                ))}
              </div>
              {sender?.username && (
                <p className="text-xs font-semibold text-zinc-400 mb-1">@{sender.username.replace(/^@+/, '')}</p>
              )}
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full mb-5">
                Message request
              </span>

              <div className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-5 mb-5">
                <p className="text-sm text-zinc-700 font-medium leading-relaxed">
                  "{request?.message}"
                </p>
                {timestamp && (
                  <p className="text-[11px] text-zinc-400 font-medium mt-3">
                    {new Date(timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <button
                  onClick={handleAccept}
                  disabled={!isPending || busy === 'decline'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-indigo-200"
                >
                  <Check className="w-4 h-4" />
                  {busy === 'accept' ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={!isPending || busy === 'accept'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-zinc-700 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <X className="w-4 h-4" />
                  {busy === 'decline' ? 'Declining...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-start gap-3 text-xs text-zinc-600 leading-relaxed font-medium">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-zinc-500">
              Accepting lets <span className="font-bold text-zinc-700">{sender?.name || 'this person'}</span> send you
              direct messages. Declining will hide this request.
            </p>
          </div>
        </motion.div>
      )}
    </PageShell>
  );
}
