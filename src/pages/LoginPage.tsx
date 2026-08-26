import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  KeyRound,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl tracking-tighter">R</span>
            </div>
            <span className="font-black text-2xl tracking-tighter text-zinc-900">RALLY</span>
          </div>

          <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500 mb-8">
            Log in to your account to continue.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
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

          <p className="mt-6 text-center text-xs text-zinc-400">
            Don't have an account?{' '}
            <a href="/" className="font-bold text-indigo-600 hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
