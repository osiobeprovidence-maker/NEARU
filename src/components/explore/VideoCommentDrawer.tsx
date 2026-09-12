import React, { useState } from 'react';
import { X, Send, Heart, MessageCircle, Trash2, Loader2 } from 'lucide-react';
import Avatar from '../Avatar';
import { ProfileVerificationCheck } from '../VerificationBadge';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/AuthContext';

interface VideoCommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle?: string;
  commentsCount?: number;
}

export default function VideoCommentDrawer({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  commentsCount = 0,
}: VideoCommentDrawerProps) {
  const { convexUserId } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if videoId is a valid Convex ID (starts with ID format, not temp string)
  const isValidConvexId = videoId && !videoId.startsWith('v-') && !videoId.startsWith('opt-');

  // Real Convex query for comments
  const serverComments = useQuery(
    api.rallies.getComments,
    isOpen && isValidConvexId ? { rallyId: videoId as any } : 'skip'
  );

  const addCommentMut = useMutation(api.rallies.addComment);
  const deleteCommentMut = useMutation(api.rallies.deleteComment);

  if (!isOpen) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isValidConvexId && convexUserId) {
        await addCommentMut({
          rallyId: videoId as any,
          text: trimmed,
        });
      }
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!convexUserId) return;
    try {
      await deleteCommentMut({
        commentId: commentId as any,
        userId: convexUserId as any,
      });
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const totalComments = serverComments ? serverComments.length : commentsCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-zinc-900 text-white rounded-t-3xl sm:rounded-l-3xl sm:rounded-t-none border-t sm:border-l border-white/10 flex flex-col h-[70vh] sm:h-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">
              Comments ({totalComments})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {serverComments === undefined && isValidConvexId ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
              <span className="text-xs font-medium">Loading real comments...</span>
            </div>
          ) : serverComments && serverComments.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-medium">
              No comments yet. Be the first to comment on this video!
            </div>
          ) : (
            (serverComments || []).map((c: any) => {
              const commenter = c.user || c.creator || {};
              const isMyComment = convexUserId && c.userId === convexUserId;

              return (
                <div key={c._id} className="flex gap-3 items-start group relative">
                  <Avatar
                    src={commenter.avatar}
                    name={commenter.name || 'User'}
                    size="xs"
                    className="mt-0.5 shrink-0 ring-1 ring-white/20"
                  />
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white/90 truncate">
                        {commenter.name || 'User'}
                      </span>
                      {commenter.isVerified && <ProfileVerificationCheck size="xs" />}
                      <span className="text-[10px] text-white/40 font-medium">
                        • {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-0.5 leading-relaxed break-words">
                      {c.text}
                    </p>
                  </div>

                  {isMyComment && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c._id)}
                      className="absolute right-0 top-0 p-1 text-white/40 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSendComment} className="p-3 bg-zinc-950 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 bg-white/10 text-white placeholder-white/40 text-xs rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 border border-white/10"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin ml-0.5" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
