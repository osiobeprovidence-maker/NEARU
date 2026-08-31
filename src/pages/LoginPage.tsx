import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from '../components/BrandLogo';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Loader2,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const { login, sendMagicLink, loginWithMagicLink } = useAuth();
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkProcessing, setMagicLinkProcessing] = useState(false);

  useEffect(() => {
    const completeSignIn = async () => {
      if (window.location.href.includes('apiKey=')) {
        setMagicLinkProcessing(true);
        try {
          const result = await loginWithMagicLink();
          if (result) {
            window.location.href = '/';
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Link expired or invalid';
          setError(msg);
        } finally {
          setMagicLinkProcessing(false);
        }
      }
    };
    completeSignIn();
  }, [loginWithMagicLink]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(emailOrUsername, password);
      window.location.href = '/';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('user-not-found')) {
        setError('No account found with this email or username.');
      } else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Incorrect password. Please try again.');
      } else if (msg.includes('Username not found')) {
        setError('No account found with this username.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await sendMagicLink(magicEmail);
      setMagicLinkSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send link';
      if (msg.includes('user-not-found')) {
        setError('No account found with this email.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkProcessing) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm text-zinc-600 font-medium">Signing you in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </a>

          <div className="flex items-center gap-2 mb-6">
            <BrandLogo boxClassName="w-10 h-10" rounded="rounded-xl" nameClassName="text-2xl" fallbackLetter="l" />
          </div>

          <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            Log in to your account to continue.
          </p>

          {/* Mode Toggle */}
          <div className="flex bg-zinc-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('password'); setError(''); }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                mode === 'password'
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Lock className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
              Password
            </button>
            <button
              onClick={() => { setMode('magic'); setError(''); }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                mode === 'magic'
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Zap className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
              Magic Link
            </button>
          </div>

          {/* Password Login */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={emailOrUsername}
                  onChange={(e) => { setEmailOrUsername(e.target.value); setError(''); }}
                  className="block w-full pl-12 pr-4 py-4 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                  placeholder="Email or username"
                />
              </div>

              <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="block w-full pl-12 pr-4 py-4 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                  placeholder="Password"
                />
              </div>

              {error && (
                <p className="text-sm text-rose-600 font-medium text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={!emailOrUsername || !password || isLoading}
                className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Log In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* Magic Link Login */}
          {mode === 'magic' && (
            <>
              {magicLinkSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Check your email</h3>
                  <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-6">
                    We sent a sign-in link to <strong className="text-zinc-700">{magicEmail}</strong>. Click the link to log in.
                  </p>
                  <button
                    onClick={() => { setMagicLinkSent(false); setMagicEmail(''); }}
                    className="text-sm font-bold text-indigo-600 hover:underline"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <p className="text-xs text-zinc-500 mb-2">
                    Enter your email and we'll send you a link to log in instantly — no password needed.
                  </p>

                  <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                      <Mail className="w-5 h-5 text-zinc-400" />
                    </div>
                    <input
                      type="email"
                      autoFocus
                      required
                      value={magicEmail}
                      onChange={(e) => { setMagicEmail(e.target.value); setError(''); }}
                      className="block w-full pl-12 pr-4 py-4 text-sm border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                      placeholder="you@example.com"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-rose-600 font-medium text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={!magicEmail || isLoading}
                    className="w-full py-4 bg-indigo-600 text-white font-bold text-sm rounded-2xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Send Magic Link <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <p className="mt-6 text-center text-xs text-zinc-400">
            Don't have an account?{' '}
            <a href="/onboarding" className="font-bold text-indigo-600 hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
