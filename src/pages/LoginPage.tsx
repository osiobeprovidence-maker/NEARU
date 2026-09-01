import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from '../components/BrandLogo';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Sub-screen type — drives which panel is rendered inside the page
// ---------------------------------------------------------------------------
type Screen =
  | 'choice'        // landing: Google | Email
  | 'email-entry'   // enter email (sign-in or create)
  | 'password'      // existing user: enter password
  | 'create'        // new user: choose password + create account
  | 'forgot'        // forgot password: enter email
  | 'forgot-sent';  // password-reset email sent confirmation

// ---------------------------------------------------------------------------
// Google SVG icon (inline, no external dependency)
// ---------------------------------------------------------------------------
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------
function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-zinc-200" />
      <span className="text-xs font-semibold text-zinc-400">OR</span>
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, register, sendMagicLink, loginWithMagicLink, resetPassword } = useAuth();

  // Where to redirect after successful auth (support `?next=/some/path`)
  const params = new URLSearchParams(location.search);
  const nextPath = params.get('next') || '/';

  const [screen, setScreen] = useState<Screen>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Magic-link auto-complete on return ──────────────────────────────────
  const [magicProcessing, setMagicProcessing] = useState(false);
  useEffect(() => {
    if (!window.location.href.includes('apiKey=')) return;
    setMagicProcessing(true);
    loginWithMagicLink()
      .then((ok) => { if (ok) navigate(nextPath, { replace: true }); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Link expired or invalid.'))
      .finally(() => setMagicProcessing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (magicProcessing) {
    return (
      <FullScreenLoader label="Signing you in…" />
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // After user enters their email we determine sign-in vs create-account
  // by attempting sign-in: Firebase will tell us if the account doesn't exist.
  // We navigate to the password screen for existing accounts, or the create
  // screen for new ones (detected by the error code).
  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    // Just advance to password — Firebase doesn't have a public "check email
    // exists" API on the client. We detect new vs existing at sign-in time.
    setScreen('password');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(nextPath, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      // If Firebase says there's no account, offer to create one
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no account')) {
        setScreen('create');
        setError('');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register(email, password);
      // register() fires Firebase createUserWithEmailAndPassword + sends
      // verification email. AuthContext's onAuthStateChanged will pick up
      // the new Firebase user. App.tsx will redirect to /onboarding because
      // hasConvexProfile is false until onboarding completes.
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await resetPassword(email);
      setScreen('forgot-sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared back navigation ───────────────────────────────────────────────
  const goBack = () => {
    setError('');
    setPassword('');
    if (screen === 'password' || screen === 'create' || screen === 'forgot') {
      setScreen('email-entry');
    } else {
      setScreen('choice');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <BrandLogo
              boxClassName="w-12 h-12"
              rounded="rounded-2xl"
              nameClassName="text-2xl"
              fallbackLetter="L"
            />
          </div>

          {/* ── CHOICE ── */}
          {screen === 'choice' && (
            <ChoiceScreen
              onGoogle={handleGoogle}
              onEmail={() => { setError(''); setScreen('email-entry'); }}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* ── EMAIL ENTRY ── */}
          {screen === 'email-entry' && (
            <EmailEntryScreen
              email={email}
              onChange={(v) => { setEmail(v); setError(''); }}
              onSubmit={handleEmailContinue}
              onBack={goBack}
              error={error}
              isLoading={isLoading}
              onForgot={() => { setError(''); setScreen('forgot'); }}
            />
          )}

          {/* ── PASSWORD (sign in) ── */}
          {screen === 'password' && (
            <PasswordScreen
              email={email}
              password={password}
              showPassword={showPassword}
              onChange={(v) => { setPassword(v); setError(''); }}
              onToggleShow={() => setShowPassword((p) => !p)}
              onSubmit={handleSignIn}
              onBack={goBack}
              onForgot={() => { setError(''); setScreen('forgot'); }}
              onCreateInstead={() => { setError(''); setScreen('create'); }}
              error={error}
              isLoading={isLoading}
            />
          )}

          {/* ── CREATE ACCOUNT ── */}
          {screen === 'create' && (
            <CreateScreen
              email={email}
              password={password}
              showPassword={showPassword}
              onChange={(v) => { setPassword(v); setError(''); }}
              onToggleShow={() => setShowPassword((p) => !p)}
              onSubmit={handleCreateAccount}
              onBack={goBack}
              onSignInInstead={() => { setError(''); setScreen('password'); }}
              error={error}
              isLoading={isLoading}
            />
          )}

          {/* ── FORGOT PASSWORD ── */}
          {screen === 'forgot' && (
            <ForgotScreen
              email={email}
              onChange={(v) => { setEmail(v); setError(''); }}
              onSubmit={handleForgotPassword}
              onBack={goBack}
              error={error}
              isLoading={isLoading}
            />
          )}

          {/* ── FORGOT SENT ── */}
          {screen === 'forgot-sent' && (
            <ForgotSentScreen
              email={email}
              onBack={() => { setScreen('email-entry'); setError(''); }}
            />
          )}

        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-screens
// ============================================================================

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-sm text-zinc-600 font-medium">{label}</p>
    </div>
  );
}

// ── Choice ──────────────────────────────────────────────────────────────────
function ChoiceScreen({
  onGoogle,
  onEmail,
  isLoading,
  error,
}: {
  onGoogle: () => void;
  onEmail: () => void;
  isLoading: boolean;
  error: string;
}) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-1">Welcome back</h1>
      <p className="text-sm text-zinc-500 mb-8">Sign in to continue to lalao.</p>

      <div className="space-y-3">
        {/* Google */}
        <button
          type="button"
          onClick={onGoogle}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xs"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          ) : (
            <GoogleIcon className="w-5 h-5 shrink-0" />
          )}
          Continue with Google
        </button>

        <OrDivider />

        {/* Email */}
        <button
          type="button"
          onClick={onEmail}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Mail className="w-4.5 h-4.5 shrink-0" />
          Continue with Email
        </button>
      </div>

      {error && <ErrorMsg msg={error} />}

      <p className="mt-6 text-xs text-zinc-400">
        Don't have an account?{' '}
        <a href="/onboarding" className="font-bold text-indigo-600 hover:underline">
          Sign up
        </a>
      </p>
    </div>
  );
}

// ── Email entry ──────────────────────────────────────────────────────────────
function EmailEntryScreen({
  email,
  onChange,
  onSubmit,
  onBack,
  error,
  isLoading,
  onForgot,
}: {
  email: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  error: string;
  isLoading: boolean;
  onForgot: () => void;
}) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-1 mt-8">
        Enter your email
      </h2>
      <p className="text-sm text-zinc-500 mb-6">
        We'll check if you have an account or help you create one.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <EmailInput value={email} onChange={onChange} autoFocus />
        {error && <ErrorMsg msg={error} />}
        <SubmitButton label="Continue" isLoading={isLoading} disabled={!email.includes('@')} />
      </form>

      <button
        type="button"
        onClick={onForgot}
        className="mt-4 text-xs text-zinc-400 hover:text-indigo-600 font-semibold w-full text-center transition-colors"
      >
        Forgot your password?
      </button>

      <p className="mt-5 text-center text-xs text-zinc-400">
        New to lalao?{' '}
        <a href="/onboarding" className="font-bold text-indigo-600 hover:underline">
          Create an account
        </a>
      </p>
    </div>
  );
}

// ── Password (sign in) ───────────────────────────────────────────────────────
function PasswordScreen({
  email,
  password,
  showPassword,
  onChange,
  onToggleShow,
  onSubmit,
  onBack,
  onForgot,
  onCreateInstead,
  error,
  isLoading,
}: {
  email: string;
  password: string;
  showPassword: boolean;
  onChange: (v: string) => void;
  onToggleShow: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onForgot: () => void;
  onCreateInstead: () => void;
  error: string;
  isLoading: boolean;
}) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-0.5 mt-8">
        Welcome back
      </h2>
      <p className="text-sm text-zinc-500 mb-6 truncate">
        Signing in as <span className="font-semibold text-zinc-700">{email}</span>
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <PasswordInput
          value={password}
          onChange={onChange}
          show={showPassword}
          onToggleShow={onToggleShow}
          placeholder="Password"
          autoFocus
        />
        {error && <ErrorMsg msg={error} />}
        <SubmitButton label="Sign In" isLoading={isLoading} disabled={!password} />
      </form>

      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={onForgot}
          className="text-xs text-zinc-400 hover:text-indigo-600 font-semibold transition-colors"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={onCreateInstead}
          className="text-xs text-zinc-400 hover:text-zinc-700 font-semibold transition-colors"
        >
          Create account instead
        </button>
      </div>
    </div>
  );
}

// ── Create account ───────────────────────────────────────────────────────────
function CreateScreen({
  email,
  password,
  showPassword,
  onChange,
  onToggleShow,
  onSubmit,
  onBack,
  onSignInInstead,
  error,
  isLoading,
}: {
  email: string;
  password: string;
  showPassword: boolean;
  onChange: (v: string) => void;
  onToggleShow: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSignInInstead: () => void;
  error: string;
  isLoading: boolean;
}) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-0.5 mt-8">
        Create your account
      </h2>
      <p className="text-sm text-zinc-500 mb-6 truncate">
        Signing up as <span className="font-semibold text-zinc-700">{email}</span>
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <PasswordInput
          value={password}
          onChange={onChange}
          show={showPassword}
          onToggleShow={onToggleShow}
          placeholder="Create a password (min. 6 chars)"
          autoFocus
        />
        {error && <ErrorMsg msg={error} />}
        <SubmitButton
          label="Create Account"
          isLoading={isLoading}
          disabled={password.length < 6}
        />
      </form>

      <p className="mt-4 text-center text-xs text-zinc-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSignInInstead}
          className="font-bold text-indigo-600 hover:underline"
        >
          Sign in
        </button>
      </p>

      <p className="mt-3 text-[11px] text-zinc-400 text-center leading-relaxed">
        By creating an account you agree to our{' '}
        <a href="/terms" className="underline hover:text-zinc-600">Terms</a> and{' '}
        <a href="/privacy" className="underline hover:text-zinc-600">Privacy Policy</a>.
      </p>
    </div>
  );
}

// ── Forgot password ──────────────────────────────────────────────────────────
function ForgotScreen({
  email,
  onChange,
  onSubmit,
  onBack,
  error,
  isLoading,
}: {
  email: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  error: string;
  isLoading: boolean;
}) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-1 mt-8">
        Reset your password
      </h2>
      <p className="text-sm text-zinc-500 mb-6">
        Enter your email and we'll send a password-reset link.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <EmailInput value={email} onChange={onChange} autoFocus />
        {error && <ErrorMsg msg={error} />}
        <SubmitButton
          label="Send Reset Link"
          isLoading={isLoading}
          disabled={!email.includes('@')}
        />
      </form>
    </div>
  );
}

// ── Forgot sent ──────────────────────────────────────────────────────────────
function ForgotSentScreen({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 mb-2">Check your inbox</h3>
      <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-6 leading-relaxed">
        If an account exists for{' '}
        <strong className="text-zinc-700">{email}</strong>, we've sent a
        password-reset link. It may take a minute to arrive.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-bold text-indigo-600 hover:underline"
      >
        Back to sign in
      </button>
    </div>
  );
}

// ============================================================================
// Shared UI atoms
// ============================================================================

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}

function EmailInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Mail className="w-4.5 h-4.5 text-zinc-400" />
      </div>
      <input
        type="email"
        autoFocus={autoFocus}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-11 pr-4 py-3.5 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
        placeholder="you@example.com"
        autoComplete="email"
      />
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Lock className="w-4.5 h-4.5 text-zinc-400" />
      </div>
      <input
        type={show ? 'text' : 'password'}
        autoFocus={autoFocus}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-11 pr-11 py-3.5 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
        placeholder={placeholder}
        autoComplete="current-password"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SubmitButton({
  label,
  isLoading,
  disabled,
}: {
  label: string;
  isLoading: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className="w-full py-3.5 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p role="alert" className="text-sm text-rose-600 font-medium text-center px-1">
      {msg}
    </p>
  );
}
