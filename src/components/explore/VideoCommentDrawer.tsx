import React, { useState } from 'react';
import { X, Send, Heart, MessageCircle } from 'lucide-react';
import Avatar from '../Avatar';
import { ProfileVerificationCheck } from '../VerificationBadge';

interface Comment {
  id: string;
  user: {
    name: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
  };
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
}

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
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c1',
      user: {
        name: 'Tunde Bakare',
        username: 'tundebakare',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
      },
      text: 'This video is incredible! Love the vibe 🎉',
      createdAt: '2h ago',
      likesCount: 14,
      isLiked: false,
    },
    {
      id: 'c2',
      user: {
        name: 'Amara Okafor',
        username: 'amara_c',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      },
      text: 'Count me in for the next event! 🚀',
      createdAt: '45m ago',
      likesCount: 5,
      isLiked: true,
    },
  ]);

  if (!isOpen) return null;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      user: {
        name: 'You',
        username: 'currentUser',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      },
      text: commentText.trim(),
      createdAt: 'Just now',
      likesCount: 0,
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const toggleCommentLike = (commentId: string) => {
    setComments(
      comments.map((c) => {
        if (c.id === commentId) {
          const next = !c.isLiked;
          return {
            ...c,
            isLiked: next,
            likesCount: next ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
          };
        }
        return c;
      })
    );
  };

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
              Comments ({comments.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start group">
              <Avatar src={c.user.avatar} name={c.user.name} size="xs" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white/90 truncate">
                    {c.user.name}
                  </span>
                  {c.user.isVerified && <ProfileVerificationCheck size="xs" />}
                  <span className="text-[11px] text-white/40 font-medium">
                    • {c.createdAt}
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5 leading-relaxed break-words">
                  {c.text}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleCommentLike(c.id)}
                className="flex flex-col items-center gap-0.5 text-white/40 hover:text-rose-400 transition-colors p-1"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    c.isLiked ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
                {c.likesCount > 0 && (
                  <span className="text-[10px] font-bold">{c.likesCount}</span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSendComment} className="p-3 bg-zinc-950 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-white/10 text-white placeholder-white/40 text-xs rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 border border-white/10"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
