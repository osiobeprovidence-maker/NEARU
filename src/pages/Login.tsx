import React, { useState } from 'react';
import { ShieldCheck, MapPin, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Step = 'landing' | 'phone' | 'otp' | 'email' | 'info';

export default function Login() {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('landing');
  
  // Form State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleNext = (e: React.FormEvent, nextStep: Step) => {
    e.preventDefault();
    setStep(nextStep);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    login();
  };

  const renderLanding = () => (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl tracking-tighter">R</span>
          </div>
          <span className="font-black text-3xl tracking-tighter">RALLY</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
          Welcome to your community
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600 max-w-sm mx-auto">
          Connect with verified people nearby to ASK, HELP, or JOIN activities safely.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-zinc-200 sm:rounded-2xl sm:px-10">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Verified & Safe</h3>
                <p className="text-sm text-zinc-500">Every member is verified with NIN or a valid ID before they can interact.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mt-1">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Hyper-Local</h3>
                <p className="text-sm text-zinc-500">See what's happening around you up to 5km away.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mt-1">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Ask, Help, Join</h3>
                <p className="text-sm text-zinc-500">Need a jumpstart? Looking for a running partner? Rally your community.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => setStep('phone')}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
            >
              Continue with Phone Number
            </button>

            <button
              onClick={() => {
                login();
                window.location.href = '/admin';
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Quick Login as Super Admin
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-center text-zinc-500">
              By continuing, you agree to RALLY's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderPhone = () => (
    <div className="w-full max-w-md mx-auto">
      <button onClick={() => setStep('landing')} className="mb-6 p-2 -ml-2 rounded-full hover:bg-zinc-200 transition-colors">
        <ArrowLeft className="w-6 h-6 text-zinc-900" />
      </button>
      <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
        What's your number?
      </h2>
      <p className="mt-2 text-sm text-zinc-600 mb-8">
        We'll send you a code to verify it's you.
      </p>

      <form onSubmit={(e) => handleNext(e, 'otp')} className="space-y-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">Phone Number</label>
          <div className="mt-1 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 flex items-center">
              <select className="h-full py-0 pl-3 pr-7 border-transparent bg-transparent text-zinc-500 sm:text-sm rounded-xl focus:ring-black focus:border-black font-medium">
                <option>NG (+234)</option>
                <option>US (+1)</option>
                <option>UK (+44)</option>
              </select>
            </div>
            <input
              type="tel"
              name="phone"
              id="phone"
              autoFocus
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="focus:ring-black focus:border-black block w-full pl-[105px] py-4 sm:text-lg border-zinc-300 rounded-xl font-medium bg-white"
              placeholder="0801 234 5678"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={phone.length < 10}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-black hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Send Code
          <ChevronRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );

  const renderOtp = () => (
    <div className="w-full max-w-md mx-auto">
      <button onClick={() => setStep('phone')} className="mb-6 p-2 -ml-2 rounded-full hover:bg-zinc-200 transition-colors">
        <ArrowLeft className="w-6 h-6 text-zinc-900" />
      </button>
      <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
        Enter code
      </h2>
      <p className="mt-2 text-sm text-zinc-600 mb-8">
        We sent a 4-digit code to <span className="font-bold text-zinc-900">{phone}</span>
      </p>

      <form onSubmit={(e) => handleNext(e, 'email')} className="space-y-6">
        <div>
          <input
            type="text"
            maxLength={4}
            autoFocus
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="focus:ring-black text-center tracking-[1em] focus:border-black block w-full py-4 sm:text-2xl border-zinc-300 rounded-xl font-bold bg-white"
            placeholder="0000"
          />
        </div>

        <button
          type="submit"
          disabled={otp.length < 4}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-black hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Verify
          <ChevronRight className="w-5 h-5" />
        </button>
      </form>
      <div className="mt-6 text-center">
        <button className="text-sm font-bold text-zinc-500 hover:text-black transition-colors">
          Didn't receive it? Resend
        </button>
      </div>
    </div>
  );

  const renderEmail = () => (
    <div className="w-full max-w-md mx-auto">
      <button onClick={() => setStep('otp')} className="mb-6 p-2 -ml-2 rounded-full hover:bg-zinc-200 transition-colors">
        <ArrowLeft className="w-6 h-6 text-zinc-900" />
      </button>
      <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
        What's your email?
      </h2>
      <p className="mt-2 text-sm text-zinc-600 mb-8">
        We use this to recover your account if you lose access to your phone.
      </p>

      <form onSubmit={(e) => handleNext(e, 'info')} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            id="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus:ring-black focus:border-black block w-full px-4 py-4 sm:text-lg border-zinc-300 rounded-xl font-medium bg-white"
            placeholder="name@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={!email.includes('@')}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-black hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );

  const renderInfo = () => (
    <div className="w-full max-w-md mx-auto">
      <button onClick={() => setStep('email')} className="mb-6 p-2 -ml-2 rounded-full hover:bg-zinc-200 transition-colors">
        <ArrowLeft className="w-6 h-6 text-zinc-900" />
      </button>
      <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
        Tell us about you
      </h2>
      <p className="mt-2 text-sm text-zinc-600 mb-8">
        This is how other members will see you on RALLY.
      </p>

      <form onSubmit={handleFinish} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              autoFocus
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="focus:ring-black focus:border-black block w-full px-4 py-3 border-zinc-300 rounded-xl font-medium bg-white"
              placeholder="Jane"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="focus:ring-black focus:border-black block w-full px-4 py-3 border-zinc-300 rounded-xl font-medium bg-white"
              placeholder="Doe"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!firstName || !lastName}
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-black hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Complete Sign Up
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {step === 'landing' && renderLanding()}
      {step === 'phone' && renderPhone()}
      {step === 'otp' && renderOtp()}
      {step === 'email' && renderEmail()}
      {step === 'info' && renderInfo()}
    </div>
  );
}
