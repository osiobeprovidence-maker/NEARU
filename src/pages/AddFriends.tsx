import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import PageShell from '../components/PageShell';
import Avatar from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  ArrowLeft,
  UserPlus,
  Users,
  Check,
  Clock,
  BadgeCheck,
  Star,
  BookUser,
  Search,
  Share2,
  RefreshCw,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

interface ContactInput {
  name?: string;
  phone?: string;
  email?: string;
}

export default function AddFriends() {
  const navigate = useNavigate();
  const { convexUserId } = useAuth();

  // Mutations
  const acceptRequest = useMutation(api.chatRequests.accept);
  const declineRequest = useMutation(api.chatRequests.decline);
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);

  // Optimistic tracking states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());
  const [acceptedRequestIds, setAcceptedRequestIds] = useState<Set<string>>(new Set());
  const [declinedRequestIds, setDeclinedRequestIds] = useState<Set<string>>(new Set());

  // 1. Friend Requests Query
  const incomingRequests = useQuery(
    api.chatRequests.listByUser,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  // 2. Find Friends Query (Mutual connections)
  const recommendations = useQuery(
    api.friends.getFriendRecommendations,
    convexUserId ? { userId: convexUserId as any, limit: 20 } : 'skip'
  );

  // 3. All Contacts State & Query
  const [deviceContacts, setDeviceContacts] = useState<ContactInput[]>([]);
  const [contactsSynced, setContactsSynced] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState('');

  const matchedContacts = useQuery(
    api.friends.matchDeviceContacts,
    convexUserId && contactsSynced
      ? {
          viewerId: convexUserId as any,
          contacts: deviceContacts,
        }
      : 'skip'
  );

  // Filter pending incoming requests
  const pendingRequests = (incomingRequests ?? []).filter(
    (req: any) =>
      req.status === 'PENDING' &&
      !acceptedRequestIds.has(req._id) &&
      !declinedRequestIds.has(req._id)
  );

  // Handle Accept Request
  const handleAccept = async (requestId: string) => {
    if (!convexUserId || processingId) return;
    setProcessingId(requestId);
    try {
      setAcceptedRequestIds((prev) => new Set([...prev, requestId]));
      await acceptRequest({
        requestId: requestId as any,
        userId: convexUserId as any,
      });
    } catch (err: any) {
      setAcceptedRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      console.error('Failed to accept request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Decline Request
  const handleDecline = async (requestId: string) => {
    if (!convexUserId || processingId) return;
    setProcessingId(requestId);
    try {
      setDeclinedRequestIds((prev) => new Set([...prev, requestId]));
      await declineRequest({
        requestId: requestId as any,
        userId: convexUserId as any,
      });
    } catch (err: any) {
      setDeclinedRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      console.error('Failed to decline request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Send Friend Request
  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!convexUserId || processingId) return;
    setProcessingId(targetUserId);
    try {
      setSentRequestIds((prev) => new Set([...prev, targetUserId]));
      await sendFriendRequest({
        fromUserId: convexUserId as any,
        toUserId: targetUserId as any,
      });
    } catch (err: any) {
      setSentRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
      console.error('Failed to send friend request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Contact Picker API
  const handleImportContacts = async () => {
    setContactError(null);
    setSyncLoading(true);

    // Check if W3C Contact Picker API is available
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel', 'email'];
        const selected = await (navigator as any).contacts.select(props, {
          multiple: true,
        });

        if (selected && selected.length > 0) {
          const parsed: ContactInput[] = [];
          for (const item of selected) {
            const name = Array.isArray(item.name) ? item.name[0] : item.name;
            const phones: string[] = Array.isArray(item.tel) ? item.tel : item.tel ? [item.tel] : [];
            const emails: string[] = Array.isArray(item.email) ? item.email : item.email ? [item.email] : [];

            if (phones.length > 0) {
              for (const phone of phones) {
                parsed.push({ name, phone, email: emails[0] });
              }
            } else if (emails.length > 0) {
              for (const email of emails) {
                parsed.push({ name, email });
              }
            } else if (name) {
              parsed.push({ name });
            }
          }

          setDeviceContacts(parsed);
          setContactsSynced(true);
        } else {
          setSyncLoading(false);
        }
      } catch (err: any) {
        console.warn('Contact picker error:', err);
        setContactError(
          'Contact access was cancelled or not granted. You can search directly below.'
        );
      } finally {
        setSyncLoading(false);
      }
    } else {
      // Fallback for desktop browsers / unsupported environments
      setSyncLoading(false);
      setContactError(
        'Direct address book sync is supported on mobile devices. Use the quick lookup below to check a phone number or email.'
      );
    }
  };

  // Handle manual search fallback
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualQuery.trim();
    if (!query) return;

    const isEmail = query.includes('@');
    const newContact: ContactInput = isEmail
      ? { email: query, name: query.split('@')[0] }
      : { phone: query, name: query };

    setDeviceContacts((prev) => [...prev, newContact]);
    setContactsSynced(true);
    setManualQuery('');
  };

  // Share invitation link
  const handleShareInvite = () => {
    const inviteUrl = window.location.origin;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Laulau',
        text: 'Join me on Laulau to connect, chat, and participate in rallies!',
        url: inviteUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(inviteUrl);
      alert('Invite link copied to clipboard!');
    }
  };

  return (
    <PageShell title="Add Friends" subtitle="Discover and connect with friends on Laulau">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Top Navigation Bar */}
        <div className="flex items-center gap-3 px-4 md:px-0">
          <button
            onClick={() => navigate('/messages')}
            className="p-2.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-xs transition-all active:scale-95"
            title="Back to messages"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              Add Friends
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium">
              Manage requests, discover mutual connections, and match contacts
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 1: FRIEND REQUESTS */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                  Friend Requests
                  {pendingRequests.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-600 text-white">
                      {pendingRequests.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  People who want to connect with you
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {incomingRequests === undefined ? (
              <div className="p-6 space-y-4">
                <div className="h-16 bg-zinc-100/70 rounded-2xl animate-pulse" />
                <div className="h-16 bg-zinc-100/70 rounded-2xl animate-pulse" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-800 mb-1">
                  No new friend requests
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  When someone sends you a friend request, they will appear here for you to accept or decline.
                </p>
              </div>
            ) : (
              pendingRequests.map((req: any) => {
                const sender = req.sender;
                if (!sender) return null;
                const isAccepting = processingId === req._id;

                return (
                  <motion.div
                    key={req._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
                  >
                    <Link
                      to={`/user/${sender._id}`}
                      className="flex items-center gap-3.5 group min-w-0"
                    >
                      <Avatar
                        src={sender.avatar}
                        name={sender.name}
                        size="md"
                        className="border border-zinc-200 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">
                            {sender.name || 'Anonymous User'}
                          </span>
                          {sender.isNINVerified && (
                            <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {sender.badges?.map((b: string) => (
                            <div
                              key={b}
                              title={b}
                              className="w-3.5 h-3.5 bg-amber-100 rounded-full text-amber-600 flex items-center justify-center shrink-0"
                            >
                              <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium truncate">
                          @{sender.username || 'user'}
                        </p>
                        {req.message && req.message !== 'Friend request' && (
                          <p className="text-xs text-zinc-600 italic mt-0.5 truncate max-w-xs">
                            "{req.message}"
                          </p>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleAccept(req._id)}
                        disabled={isAccepting}
                        className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isAccepting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(req._id)}
                        disabled={isAccepting}
                        className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 transition-all disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 2: FIND FRIENDS (Social Graph & Mutuals) */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                  Find Friends
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  People you may know based on mutual connections
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {recommendations === undefined ? (
              <div className="p-6 space-y-4">
                <div className="h-16 bg-zinc-100/70 rounded-2xl animate-pulse" />
                <div className="h-16 bg-zinc-100/70 rounded-2xl animate-pulse" />
                <div className="h-16 bg-zinc-100/70 rounded-2xl animate-pulse" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-800 mb-1">
                  No new people to recommend yet.
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  As you connect with more people in your neighborhood and rallies, recommendations with mutual connections will appear here.
                </p>
              </div>
            ) : (
              recommendations.map((user: any) => {
                const isSent = sentRequestIds.has(user._id) || user.isPendingOutgoing;
                const isAcceptable = user.isPendingIncoming && !isSent && !user.isFriend;
                const isBusy = processingId === user._id;

                return (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 hover:bg-zinc-50/50 transition-colors"
                  >
                    <Link
                      to={`/user/${user._id}`}
                      className="flex items-center gap-3 sm:gap-3.5 group min-w-0"
                    >
                      <Avatar
                        src={user.avatar}
                        name={user.name}
                        size="md"
                        className="border border-zinc-200 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">
                            {user.name || 'User'}
                          </span>
                          {user.isNINVerified && (
                            <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {user.badges?.map((b: string) => (
                            <div
                              key={b}
                              title={b}
                              className="w-3.5 h-3.5 bg-amber-100 rounded-full text-amber-600 flex items-center justify-center shrink-0"
                            >
                              <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-500 font-medium truncate">
                            @{user.username || 'user'}
                          </span>
                          {user.mutualCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                              +{user.mutualCount} mutual{user.mutualCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-400 bg-zinc-100 shrink-0">
                              Suggested
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Action Button States */}
                    <div className="shrink-0">
                      {user.isFriend ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Friends
                        </span>
                      ) : isAcceptable ? (
                        <button
                          onClick={() => handleAccept(user.incomingRequestId)}
                          disabled={isBusy}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5"
                        >
                          {isBusy ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Accept
                        </button>
                      ) : isSent ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                          <Clock className="w-3.5 h-3.5" /> Request Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(user._id)}
                          disabled={isBusy}
                          className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isBusy ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          Add Friend
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 3: ALL CONTACTS (Phone & Address Book Matching) */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <BookUser className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                  All Contacts
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  People from your phone contacts who are on Laulau
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleImportContacts}
                disabled={syncLoading}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {syncLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BookUser className="w-3.5 h-3.5" />
                )}
                {contactsSynced ? 'Resync Contacts' : 'Sync Phone Contacts'}
              </button>
            </div>
          </div>

          {/* Privacy & info banner */}
          {!contactsSynced && (
            <div className="p-6 sm:p-8 text-center bg-zinc-50/50 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">
                Find Friends From Your Address Book
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed mb-4">
                Connect your device address book to see who is already on Laulau. We match phone numbers and emails securely and never store your private address book.
              </p>
              <button
                onClick={handleImportContacts}
                disabled={syncLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all"
              >
                <BookUser className="w-4 h-4" />
                Allow Contact Access
              </button>

              {/* Desktop / manual lookup helper */}
              <div className="mt-6 pt-6 border-t border-zinc-200/60 max-w-sm mx-auto text-left">
                <p className="text-xs font-semibold text-zinc-700 mb-2">
                  Or check if a contact is on Laulau:
                </p>
                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      placeholder="Phone or email address..."
                      className="w-full pl-3 pr-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualQuery.trim()}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-800 font-bold text-xs rounded-xl transition-all"
                  >
                    Check
                  </button>
                </form>
              </div>
            </div>
          )}

          {contactError && (
            <div className="mx-5 my-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1 leading-relaxed">
                <span>{contactError}</span>
              </div>
            </div>
          )}

          {/* Matched Contacts List */}
          {contactsSynced && (
            <div className="divide-y divide-zinc-100">
              {matchedContacts === undefined ? (
                <div className="p-6 space-y-4">
                  <div className="h-16 bg-zinc-100/70 rounded-2xl animate-pulse" />
                  <div className="h-16 bg-zinc-100/70 rounded-2xl animate-pulse" />
                </div>
              ) : matchedContacts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-800 mb-1">
                    No contacts on Laulau yet.
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                    None of your imported contacts have joined Laulau yet. Invite them to join and connect!
                  </p>
                  <button
                    onClick={handleShareInvite}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share Invite Link
                  </button>
                </div>
              ) : (
                matchedContacts.map((contact: any) => {
                  const isSent = sentRequestIds.has(contact._id) || contact.isPendingOutgoing;
                  const isAcceptable = contact.isPendingIncoming && !isSent && !contact.isFriend;
                  const isBusy = processingId === contact._id;

                  return (
                    <motion.div
                      key={contact._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 hover:bg-zinc-50/50 transition-colors"
                    >
                      <Link
                        to={`/user/${contact._id}`}
                        className="flex items-center gap-3 sm:gap-3.5 group min-w-0"
                      >
                        <Avatar
                          src={contact.avatar}
                          name={contact.name}
                          size="md"
                          className="border border-zinc-200 shadow-2xs group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">
                              {contact.name || 'User'}
                            </span>
                            {contact.isNINVerified && (
                              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {contact.badges?.map((b: string) => (
                              <div
                                key={b}
                                title={b}
                                className="w-3.5 h-3.5 bg-amber-100 rounded-full text-amber-600 flex items-center justify-center shrink-0"
                              >
                                <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-500 font-medium truncate">
                              @{contact.username || 'user'}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                              From your contacts
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {contact.isFriend ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> Friends
                          </span>
                        ) : isAcceptable ? (
                          <button
                            onClick={() => handleAccept(contact.incomingRequestId)}
                            disabled={isBusy}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5"
                          >
                            {isBusy ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Accept
                          </button>
                        ) : isSent ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                            <Clock className="w-3.5 h-3.5" /> Request Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(contact._id)}
                            disabled={isBusy}
                            className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isBusy ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            Add Friend
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
