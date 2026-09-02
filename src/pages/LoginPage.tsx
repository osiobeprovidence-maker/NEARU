import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { ArrowLeft, ArrowRight, Mail, Lock, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

// ---------------------------------------------------------------------------
// Screen state machine
// ---------------------------------------------------------------------------
type Screen =
  | 'choice'        // landing — choose Google or Email, with sign-in / sign-up tabs
  | 'email-signin'  // email + password → sign in
  | 'email-signup'  // email + password → create account
  | 'forgot'        // enter email → send reset link
  | 'forgot-sent';  // confirmation after reset email sent

// ---------------------------------------------------------------------------
// Google SVG icon
// ---------------------------------------------------------------------------
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

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-zinc-200" />
      <span className="text-xs font-semibold text-zinc-400">OR</span>
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, register, sendMagicLink, loginWithMagicLink, resetPassword } = useAuth();

  const params = new URLSearchParams(location.search);
  const nextPath = params.get('next') || '/';
  // If ?mode=signup is passed (e.g. from "Sign Up" CTA on landing), default
  // to the sign-up tab so the user doesn't have to click twice.
  const defaultMode = params.get('mode') === 'signup' ? 'signup' : 'signin';

  const [tab, setTab] = useState<'signin' | 'signup'>(defaultMode);
  const [screen, setScreen] = useState<Screen>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Magic-link auto-complete
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

  if (magicProcessing) return <FullScreenLoader label="Signing you in…" />;

  // ── helpers ───────────────────────────────────────────────────────────────

  const reset = () => { setError(''); setPassword(''); setShowPw(false); };

  const handleGoogleAuth = async () => {
    reset();
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // AuthContext + App.tsx routing takes over:
      // - existing user  → home
      // - new user       → /onboarding (onboardingCompleted is false)
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try {
      await register(email, password);
      // App.tsx will redirect to /onboarding automatically because
      // the new user has onboardingCompleted = false.
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
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

  const goBack = () => { reset(); setScreen('choice'); };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <BrandLogo boxClassName="w-12 h-12" rounded="rounded-2xl" nameClassName="text-2xl" fallbackLetter="L" />
          </div>

          {/* ── CHOICE SCREEN ── */}
          {screen === 'choice' && (
            <>
              {/* Sign In / Sign Up tabs */}
              <div className="flex bg-zinc-100 rounded-2xl p-1 mb-6">
                <TabBtn active={tab === 'signin'} onClick={() => { setTab('signin'); reset(); }}>
                  Sign In
                </TabBtn>
                <TabBtn active={tab === 'signup'} onClick={() => { setTab('signup'); reset(); }}>
                  Create Account
                </TabBtn>
              </div>

              <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">
                {tab === 'signin' ? 'Welcome back' : 'Join lalao'}
              </h1>
              <p className="text-sm text-zinc-500 mb-6">
                {tab === 'signin'
                  ? 'Sign in to continue.'
                  : 'Create your account to get started.'}
              </p>

              <div className="space-y-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                >
                  {isLoading
                    ? <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    : <GoogleIcon className="w-5 h-5 shrink-0" />
                  }
                  {tab === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
                </button>

                <OrDivider />

                {/* Email */}
                <button
                  type="button"
                  onClick={() => { reset(); setScreen(tab === 'signin' ? 'email-signin' : 'email-signup'); }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  {tab === 'signin' ? 'Continue with Email' : 'Sign up with Email'}
                </button>
              </div>

              {error && <ErrorMsg msg={error} />}

              <p className="mt-5 text-center text-xs text-zinc-400">
                {tab === 'signin' ? (
                  <>No account?{' '}
                    <button type="button" onClick={() => { setTab('signup'); reset(); }} className="font-bold text-indigo-600 hover:underline">Create one</button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button type="button" onClick={() => { setTab('signin'); reset(); }} className="font-bold text-indigo-600 hover:underline">Sign in</button>
                  </>
                )}
              </p>
            </>
          )}

          {/* ── EMAIL SIGN IN ── */}
          {screen === 'email-signin' && (
            <>
              <BackButton onClick={goBack} />
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight mt-6 mb-1">Sign in</h2>
              <p className="text-sm text-zinc-500 mb-5">Enter your email and password.</p>
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <EmailInput value={email} onChange={v => { setEmail(v); setError(''); }} autoFocus />
                <PasswordInput value={password} onChange={v => { setPassword(v); setError(''); }} show={showPw} onToggle={() => setShowPw(p => !p)} placeholder="Password" />
                {error && <ErrorMsg msg={error} />}
                <SubmitBtn label="Sign In" loading={isLoading} disabled={!email || !password} />
              </form>
              <div className="flex justify-between mt-3">
                <button type="button" onClick={() => { reset(); setScreen('forgot'); }} className="text-xs font-semibold text-zinc-400 hover:text-indigo-600 transition-colors">
                  Forgot password?
                </button>
                <button type="button" onClick={() => { reset(); setTab('signup'); setScreen('email-signup'); }} className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
                  Create account instead
                </button>
              </div>
            </>
          )}

          {/* ── EMAIL SIGN UP ── */}
          {screen === 'email-signup' && (
            <>
              <BackButton onClick={goBack} />
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight mt-6 mb-1">Create account</h2>
              <p className="text-sm text-zinc-500 mb-5">Use your email to get started.</p>
              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <EmailInput value={email} onChange={v => { setEmail(v); setError(''); }} autoFocus />
                <PasswordInput value={password} onChange={v => { setPassword(v); setError(''); }} show={showPw} onToggle={() => setShowPw(p => !p)} placeholder="Create a password (min. 6 chars)" />
                {error && <ErrorMsg msg={error} />}
                <SubmitBtn label="Create Account" loading={isLoading} disabled={!email || password.length < 6} />
              </form>
              <p className="mt-3 text-center text-xs text-zinc-400">
                Already have an account?{' '}
                <button type="button" onClick={() => { reset(); setTab('signin'); setScreen('email-signin'); }} className="font-bold text-indigo-600 hover:underline">Sign in</button>
              </p>
              <p className="mt-2 text-[11px] text-zinc-400 text-center leading-relaxed">
                By creating an account you agree to our{' '}
                <a href="/terms" className="underline hover:text-zinc-600">Terms</a> and{' '}
                <a href="/privacy" className="underline hover:text-zinc-600">Privacy Policy</a>.
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {screen === 'forgot' && (
            <>
              <BackButton onClick={goBack} />
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight mt-6 mb-1">Reset password</h2>
              <p className="text-sm text-zinc-500 mb-5">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleForgot} className="space-y-3">
                <EmailInput value={email} onChange={v => { setEmail(v); setError(''); }} autoFocus />
                {error && <ErrorMsg msg={error} />}
                <SubmitBtn label="Send Reset Link" loading={isLoading} disabled={!email.includes('@')} />
              </form>
            </>
          )}

          {/* ── FORGOT SENT ── */}
          {screen === 'forgot-sent' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Check your inbox</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-6 leading-relaxed">
                If an account exists for <strong className="text-zinc-700">{email}</strong>, we've sent a reset link.
              </p>
              <button type="button" onClick={goBack} className="text-sm font-bold text-indigo-600 hover:underline">
                Back to sign in
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Shared atoms ─────────────────────────────────────────────────────────────

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-sm text-zinc-600 font-medium">{label}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}

function EmailInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Mail className="w-4 h-4 text-zinc-400" />
      </div>
      <input type="email" autoFocus={autoFocus} required value={value} onChange={e => onChange(e.target.value)}
        className="block w-full pl-11 pr-4 py-3.5 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
        placeholder="you@example.com" autoComplete="email" />
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder, autoFocus }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string; autoFocus?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Lock className="w-4 h-4 text-zinc-400" />
      </div>
      <input type={show ? 'text' : 'password'} autoFocus={autoFocus} required value={value} onChange={e => onChange(e.target.value)}
        className="block w-full pl-11 pr-11 py-3.5 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
        placeholder={placeholder} autoComplete="current-password" />
      <button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-zinc-600 transition-colors" aria-label={show ? 'Hide' : 'Show'}>
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SubmitBtn({ label, loading, disabled }: { label: string; loading: boolean; disabled?: boolean }) {
  return (
    <button type="submit" disabled={disabled || loading}
      className="w-full py-3.5 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2">
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{label} <ArrowRight className="w-4 h-4" /></>}
    </button>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return <p role="alert" className="text-sm text-rose-600 font-medium text-center px-1">{msg}</p>;
}
