import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Star, Send, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';

export default function ReviewUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { convexUserId } = useAuth();

  const user = useQuery(api.users.get, id ? { userId: id as any } : 'skip');
  const submitRatingMut = useMutation(api.rallies.submitRating);

  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0 || !convexUserId || !id) return;

    setIsSubmitting(true);
    try {
      await submitRatingMut({
        raterId: convexUserId as any,
        ratedUserId: id as any,
        score,
        review: review.trim() || undefined,
      });
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: 'Review submitted',
          subtitle: `Thanks for rating ${user?.name || 'this user'}.`,
        },
      }));
      navigate(-1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review.';
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'Error', subtitle: msg },
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user === undefined) {
    return (
      <PageShell title="Review User">
        <div className="p-8 text-center text-zinc-400 text-sm">Loading…</div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell title="Review User">
        <div className="p-8 text-center text-zinc-500 text-sm">User not found.</div>
      </PageShell>
    );
  }

  return (
    <PageShell title={`Review ${user.name}`}>
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-7 max-w-md mx-auto mt-6">
        <div className="text-center mb-6">
          <Avatar
            src={user.avatar}
            name={user.name}
            size="xl"
            className="mx-auto mb-4 shadow-sm"
          />
          <h2 className="text-xl font-bold text-zinc-900">How was your experience?</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1">
            Rate your RALLY with {user.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star rating */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setScore(star)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={cn(
                    'w-10 h-10 transition-colors',
                    (hovered || score) >= star
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-zinc-200'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Review text */}
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-2">
              Write a review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you like about this RALLY?"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none resize-none h-32 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={score === 0 || isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="w-4 h-4" /> Submit Review</>
            )}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
