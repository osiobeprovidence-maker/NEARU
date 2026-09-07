import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Dumbbell,
  Music,
  Gamepad2,
  Coffee,
  Briefcase,
  GraduationCap,
  Palette,
  Camera,
  Compass,
  Heart,
  Loader2,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERESTS = [
  { id: 'sports',      label: 'Outdoor & Sports',  icon: Dumbbell,      color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'music',       label: 'Music & Events',     icon: Music,         color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { id: 'gaming',      label: 'Tech & Gaming',      icon: Gamepad2,      color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { id: 'social',      label: 'Social Hangouts',    icon: Coffee,        color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'work',        label: 'Work & Business',    icon: Briefcase,     color: 'bg-zinc-100 border-zinc-200 text-zinc-700' },
  { id: 'education',   label: 'Learning & Skills',  icon: GraduationCap, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'creative',    label: 'Art & Creativity',   icon: Palette,       color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'photography', label: 'Photography',         icon: Camera,        color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { id: 'travel',      label: 'Travel & Explore',   icon: Compass,       color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { id: 'fitness',     label: 'Fitness & Health',   icon: Heart,         color: 'bg-pink-50 border-pink-200 text-pink-700' },
];

const PRONOUN_OPTIONS = [
  'He/Him',
  'She/Her',
  'They/Them',
  'He/They',
  'She/They',
  'Ze/Zir',
  'Prefer not to say',
];

type Step =
  | 'welcome'
  | 'email'
  | 'password'
  | 'verify-email'
  | 'username'
  | 'profile'
  | 'pronouns'
  | 'interests'
  | 'location'
  | 'done';

const EMAIL_STEPS: Step[] = ['welcome', 'email', 'password', 'verify-email', 'username', 'profile', 'pronouns', 'interests', 'location', 'done'];
const GOOGLE_STEPS: Step[] = ['username', 'profile', 'pronouns', 'interests', 'location', 'done'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Onboarding() {
  const navigate = useNavigate();
  const {
    firebaseUser,
    convexUserId,
    loginWithGoogle,
    register,
    updateUser,
    waitForEmailVerification,
    resendVerificationEmail,
    saveUserToConvex,
    persistProfile,
    completeOnboarding,
  } = useAuth();

  // Detect whether this is a Google/OAuth user (provider is not password)
  const isOAuthUser = !!(
    firebaseUser &&
    firebaseUser.providerData?.[0]?.providerId !== 'password'
  );

  const steps = isOAuthUser ? GOOGLE_STEPS : EMAIL_STEPS;

  // Determine starting step
  const getInitialStep = (): Step => {
    if (isOAuthUser) return 'username';
    if (firebaseUser) {
      if (firebaseUser.emailVerified === false) {
        return 'verify-email';
      }
      return 'username';
    }
    return 'welcome';
  };

  const [step, setStep] = useState<Step>(getInitialStep());
  const [direction, setDirection] = useState(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPronoun, setSelectedPronoun] = useState('');
  const [customPronoun, setCustomPronoun] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showPronouns, setShowPronouns] = useState(false);
  const [geoPosition, setGeoPosition] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Debounced username checking for live availability
  const [debouncedUsername, setDebouncedUsername] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUsername(username.trim().toLowerCase().replace(/^@+/, ''));
    }, 300);
    return () => clearTimeout(handler);
  }, [username]);

  const usernameCheck = useQuery(
    api.users.checkUsernameAvailable,
    debouncedUsername && debouncedUsername.length >= 3
      ? { username: debouncedUsername, currentUserId: (convexUserId as any) || undefined }
      : 'skip'
  );

  const isCheckingUsername =
    username.length >= 3 &&
    (username !== debouncedUsername || usernameCheck === undefined);

  const isUsernameAvailable =
    username.length >= 3 &&
    !isCheckingUsername &&
    usernameCheck?.available === true;

  const usernameError =
    username.length > 0 && username.length < 3
      ? 'Username must be at least 3 characters'
      : usernameCheck && !usernameCheck.available
      ? usernameCheck.reason || 'Username is already taken'
      : '';

  // Pre-fill from Firebase for Google users
  useEffect(() => {
    if (firebaseUser) {
      setEmail(firebaseUser.email || '');
      if (firebaseUser.displayName) {
        const parts = firebaseUser.displayName.trim().split(/\s+/);
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      if (!username) {
        const suggested = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '')
          .toLowerCase()
          .replace(/[^a-z0-9_.]/g, '')
          .slice(0, 20);
        if (suggested.length >= 3) {
          setUsername(suggested);
        }
      }
    }
  }, [firebaseUser]);

  const navigateTo = (s: Step) => {
    const cur = steps.indexOf(step);
    const next = steps.indexOf(s);
    setDirection(next >= cur ? 1 : -1);
    setStep(s);
  };

  const goBack = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) navigateTo(steps[idx - 1]);
  };

  const goNext = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) navigateTo(steps[idx + 1]);
  };

  // ── Email step ────────────────────────────────────────────────────────────
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goNext();
  };

  // ── Password / create account step ───────────────────────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setIsLoading(true);
    try {
      await register(email, password);
      navigateTo('verify-email');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create account';
      setError(msg.includes('already') ? 'An account with this email already exists.' : msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verify email ──────────────────────────────────────────────────────────
  const handleCheckVerified = async () => {
    setIsLoading(true);
    setError('');
    try {
      const verified = await waitForEmailVerification();
      if (verified) {
        navigateTo('username');
      } else {
        setError('Not verified yet. Check your inbox (and spam folder), then tap the link.');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await resendVerificationEmail();
      setResendCooldown(30);
      const iv = setInterval(() => {
        setResendCooldown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; });
      }, 1000);
    } catch { setError('Failed to resend. Try again.'); }
    finally { setIsLoading(false); }
  };

  // Auto-poll for verification every 5s while on the verify screen
  useEffect(() => {
    if (step !== 'verify-email') return;
    const iv = setInterval(async () => {
      try {
        const ok = await waitForEmailVerification();
        if (ok) navigateTo('username');
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [step]);

  // ── Finish onboarding ─────────────────────────────────────────────────────
  const handleFinish = async () => {
    setIsLoading(true);
    setError('');
    try {
      const effectiveEmail = firebaseUser?.email || email;
      const effectiveName = `${firstName} ${lastName}`.trim() || firebaseUser?.displayName || 'User';
      const effectiveUsername = username || effectiveEmail.split('@')[0].toLowerCase();
      const avatar =
        firebaseUser?.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(effectiveName)}&background=6366f1&color=fff&bold=true&size=200`;

      const interestLabels = selectedInterests
        .map(id => INTERESTS.find(i => i.id === id)?.label)
        .filter(Boolean) as string[];

      const finalPronoun = showCustom ? customPronoun.trim() : selectedPronoun;

      // If there's no Convex record yet (email user who just registered),
      // create it now. Google users already have a record from syncNewUser.
      let userId = convexUserId;
      if (!userId) {
        userId = await saveUserToConvex({
          name: effectiveName,
          username: effectiveUsername,
          email: effectiveEmail,
          passwordHash: '',
          isEmailVerified: firebaseUser?.emailVerified ?? false,
        });
        if (userId) localStorage.setItem('rally_convex_user_id', userId);
      }

      // Single atomic write: set all onboarding fields + mark complete.
      if (userId) {
        await completeOnboarding({
          userId,
          name: effectiveName,
          username: effectiveUsername,
          avatar,
          interests: interestLabels,
          pronouns: finalPronoun || undefined,
          showPronouns,
        });
      }

      updateUser({
        name: effectiveName,
        username: effectiveUsername,
        avatar,
        interests: interestLabels,
        pronouns: finalPronoun || undefined,
        showPronouns,
        onboardingCompleted: true,
      });

      // geoPosition is stored for location sync but doesn't block completion
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Onboarding finish failed:', err);
      setError('Something went wrong saving your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Animation ─────────────────────────────────────────────────────────────
  const slideVariants = {
    enter:  (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const progress = ((steps.indexOf(step)) / (steps.length - 1)) * 100;

  const ProgressBar = () => (
    <div className="h-1 bg-zinc-100 rounded-full mx-5 mt-4 overflow-hidden">
      <div
        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  const BackBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="absolute top-5 left-5 p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors z-10"
    >
      <ArrowLeft className="w-5 h-5 text-zinc-700" />
    </button>
  );

  // ── Screens ───────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {

      // ── Welcome ────────────────────────────────────────────────────────────
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-center text-center px-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-600/20">
              <span className="text-white font-black text-4xl tracking-tighter">L</span>
            </motion.div>
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
              className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
              Welcome to lalao
            </motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-3 text-sm text-zinc-500 max-w-xs leading-relaxed">
              Connect with verified people nearby to ASK for help, HELP others, or JOIN activities together.
            </motion.p>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-8 w-full max-w-xs space-y-3">
              <button
                type="button"
                onClick={async () => {
                  setError('');
                  setIsLoading(true);
                  try {
                    await loginWithGoogle();
                    setStep('username');
                  } catch (err: any) {
                    setError(err?.message || 'Google sign-in failed.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-400" /> : <GoogleIcon className="w-5 h-5 shrink-0" />}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-xs font-semibold text-zinc-400">OR</span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>

              <button
                type="button"
                onClick={() => navigateTo('email')}
                className="w-full py-3.5 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Continue with Email <ArrowRight className="w-4 h-4" />
              </button>

              <p className="pt-2 text-center text-xs text-zinc-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login?mode=signin')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Sign in
                </button>
              </p>
              {error && <p className="text-sm text-rose-600 font-medium text-center">{error}</p>}
            </motion.div>
          </div>
        );

      // ── Email ──────────────────────────────────────────────────────────────
      case 'email':
        return (
          <div className="px-6 w-full max-w-md mx-auto">
            <BackBtn onClick={goBack} />
            <div className="pt-16">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">What's your email?</h2>
              <p className="mt-2 text-sm text-zinc-500 mb-8">We'll send you a verification link.</p>
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <InputField icon={<svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
                  <input type="email" autoFocus required value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="block w-full pl-12 pr-4 py-4 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                    placeholder="you@example.com" />
                </InputField>
                {error && <p className="text-sm text-rose-600 font-medium text-center">{error}</p>}
                <button type="submit" disabled={!email.includes('@')}
                  className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        );

      // ── Password ───────────────────────────────────────────────────────────
      case 'password':
        return (
          <div className="px-6 w-full max-w-md mx-auto">
            <BackBtn onClick={goBack} />
            <div className="pt-16">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Create a password</h2>
              <p className="mt-2 text-sm text-zinc-500 mb-8">Minimum 6 characters.</p>
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <InputField icon={<svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}>
                  <input type="password" autoFocus required value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="block w-full pl-12 pr-4 py-4 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                    placeholder="Password (min. 6 chars)" />
                </InputField>
                {error && <p className="text-sm text-rose-600 font-medium text-center">{error}</p>}
                <button type="submit" disabled={password.length < 6 || isLoading}
                  className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          </div>
        );

      // ── Verify email ───────────────────────────────────────────────────────
      case 'verify-email':
        return (
          <div className="px-6 w-full max-w-md mx-auto text-center">
            <div className="pt-10">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-zinc-900 mb-2">Check your email</h2>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-8">
                We sent a verification link to <strong className="text-zinc-700">{email}</strong>. Click it, then come back here.
              </p>
              {error && <p className="text-sm text-rose-600 font-medium mb-4">{error}</p>}
              <div className="space-y-3">
                <button onClick={handleCheckVerified} disabled={isLoading}
                  className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>I've Verified My Email <ArrowRight className="w-4 h-4" /></>}
                </button>
                <button onClick={handleResend} disabled={resendCooldown > 0 || isLoading}
                  className="w-full py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-900 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend email'}
                </button>
              </div>
            </div>
          </div>
        );

      // ── Username ───────────────────────────────────────────────────────────
      case 'username':
        return (
          <div className="px-6 w-full max-w-md mx-auto">
            {!firebaseUser && steps.indexOf('username') > 0 && <BackBtn onClick={goBack} />}
            <div className="pt-16">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Pick a username</h2>
              <p className="mt-2 text-sm text-zinc-500 mb-6">This is your unique @handle on lalao.</p>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (isUsernameAvailable) goNext();
                }}
                className="space-y-4"
              >
                <div>
                  <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-sm font-bold text-zinc-400">
                      @
                    </div>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
                        setError('');
                      }}
                      className="block w-full pl-9 pr-10 py-4 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                      placeholder="yourusername"
                      minLength={3}
                      maxLength={30}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      {isCheckingUsername && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                      {!isCheckingUsername && isUsernameAvailable && <Check className="w-4 h-4 text-emerald-500 font-bold" />}
                    </div>
                  </div>
                  {/* Status label */}
                  <div className="min-h-[22px] mt-1.5 px-2">
                    {isCheckingUsername ? (
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5">Checking availability...</p>
                    ) : isUsernameAvailable ? (
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        @{debouncedUsername} is available!
                      </p>
                    ) : usernameError ? (
                      <p className="text-xs text-rose-500 font-medium">{usernameError}</p>
                    ) : (
                      <p className="text-xs text-zinc-400">3-30 characters, letters, numbers, underscores, and periods</p>
                    )}
                  </div>
                </div>
                {error && <p className="text-sm text-rose-600 font-medium text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={!isUsernameAvailable || isCheckingUsername}
                  className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        );

      // ── Profile (name) ─────────────────────────────────────────────────────
      case 'profile':
        return (
          <div className="px-6 w-full max-w-md mx-auto">
            <BackBtn onClick={goBack} />
            <div className="pt-16">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">What's your name?</h2>
              <p className="mt-2 text-sm text-zinc-500 mb-8">This is how you'll appear on lalao.</p>
              <form onSubmit={e => { e.preventDefault(); if (!firstName.trim()) return; goNext(); }} className="space-y-4">
                <InputField icon={<UserIcon className="w-5 h-5 text-zinc-400" />}>
                  <input type="text" autoFocus required value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                    placeholder="First name" />
                </InputField>
                <InputField icon={<UserIcon className="w-5 h-5 text-zinc-400" />}>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                    placeholder="Last name (optional)" />
                </InputField>
                <button type="submit" disabled={!firstName.trim()}
                  className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        );

      // ── Pronouns ───────────────────────────────────────────────────────────
      case 'pronouns':
        return (
          <div className="px-6 w-full max-w-md mx-auto">
            <BackBtn onClick={goBack} />
            <div className="pt-16">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">What's your pronoun?</h2>
              <p className="mt-2 text-sm text-zinc-500 mb-1">Optional — you can change this later or keep it private.</p>
              <p className="text-xs text-zinc-400 mb-6">
                Your pronoun is personal information only. It has no effect on your interests or content.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {PRONOUN_OPTIONS.map(p => (
                  <button key={p} type="button"
                    onClick={() => { setSelectedPronoun(p); setShowCustom(false); setError(''); }}
                    className={`py-3 px-4 rounded-2xl text-sm font-semibold border-2 transition-all text-left ${
                      selectedPronoun === p && !showCustom
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                    }`}>
                    {selectedPronoun === p && !showCustom && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-indigo-500" />}
                    {p}
                  </button>
                ))}
                <button type="button"
                  onClick={() => { setShowCustom(true); setSelectedPronoun(''); }}
                  className={`py-3 px-4 rounded-2xl text-sm font-semibold border-2 transition-all text-left ${
                    showCustom ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                  }`}>
                  Custom…
                </button>
              </div>

              {showCustom && (
                <input autoFocus type="text" value={customPronoun} onChange={e => setCustomPronoun(e.target.value)}
                  className="w-full px-4 py-3.5 text-sm border-2 border-indigo-300 rounded-2xl font-medium bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none mb-4"
                  placeholder="e.g. Xe/Xem" maxLength={40} />
              )}

              {/* Visibility toggle */}
              {(selectedPronoun || (showCustom && customPronoun)) && (
                <label className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-zinc-50 border border-zinc-200 cursor-pointer mb-4">
                  <input type="checkbox" checked={showPronouns} onChange={e => setShowPronouns(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
                  <span className="text-sm font-medium text-zinc-700">Show pronoun publicly on my profile</span>
                </label>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={goNext}
                  className="flex-1 py-4 border-2 border-zinc-200 text-zinc-500 font-bold text-sm rounded-2xl hover:bg-zinc-50 active:scale-[0.98] transition-all">
                  Skip
                </button>
                <button type="button" onClick={goNext}
                  className="flex-1 py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );

      // ── Interests ──────────────────────────────────────────────────────────
      case 'interests':
        return (
          <div className="px-6 w-full max-w-md mx-auto">
            <BackBtn onClick={goBack} />
            <div className="pt-16">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">What are you into?</h2>
              <p className="mt-2 text-sm text-zinc-500 mb-1">Select interests to personalise your feed.</p>
              <p className="text-xs text-zinc-400 mb-6">Up to 3 will appear publicly on your profile. The rest stay private.</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {INTERESTS.map(({ id, label, icon: Icon, color }) => {
                  const selected = selectedInterests.includes(id);
                  return (
                    <button key={id} type="button"
                      onClick={() => setSelectedInterests(prev =>
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                      )}
                      className={`flex items-center gap-2.5 py-3 px-3.5 rounded-2xl text-xs font-semibold border-2 transition-all ${
                        selected ? `${color} border-current` : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={goNext}
                className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                {selectedInterests.length > 0 ? 'Continue' : 'Skip for now'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      // ── Location ───────────────────────────────────────────────────────────
      case 'location':
        return (
          <div className="px-6 w-full max-w-md mx-auto text-center">
            <BackBtn onClick={goBack} />
            <div className="pt-16">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 mb-2">Allow location</h2>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-8">
                lalao uses your location to show you nearby rallies and people. You can change this later in settings.
              </p>
              <div className="space-y-3">
                <button type="button" onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    pos => { setGeoPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); goNext(); },
                    () => goNext()
                  ) ?? goNext();
                }}
                  className="w-full py-4 bg-indigo-600 text-white font-bold text-sm rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Allow Location
                </button>
                <button type="button" onClick={goNext}
                  className="w-full py-3 text-sm font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
                  Not now
                </button>
              </div>
            </div>
          </div>
        );

      // ── Done ───────────────────────────────────────────────────────────────
      case 'done':
        return (
          <div className="flex flex-col items-center justify-center text-center px-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
              className="text-3xl font-black text-zinc-900 tracking-tight">
              You're all set!
            </motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-3 text-sm text-zinc-500 max-w-xs leading-relaxed">
              Your lalao profile is ready. Time to find people and rallies near you.
            </motion.p>
            {error && <p className="mt-4 text-sm text-rose-600 font-medium">{error}</p>}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-10 w-full max-w-xs">
              <button onClick={handleFinish} disabled={isLoading}
                className="w-full py-4 bg-indigo-600 text-white font-bold text-sm rounded-2xl hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Let's go! <ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProgressBar />
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md relative min-h-[480px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center w-full">
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------
function InputField({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
        {icon}
      </div>
      {children}
    </div>
  );
}
