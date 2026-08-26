import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  ShieldCheck,
  Zap,
  Users,
  Heart,
  Music,
  Gamepad2,
  Dumbbell,
  Coffee,
  Briefcase,
  GraduationCap,
  Palette,
  Camera,
  Compass,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Step =
  | 'welcome'
  | 'phone'
  | 'otp'
  | 'profile'
  | 'interests'
  | 'location'
  | 'done';

const INTERESTS = [
  { id: 'sports', label: 'Outdoor & Sports', icon: Dumbbell, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'music', label: 'Music & Events', icon: Music, color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { id: 'gaming', label: 'Tech & Gaming', icon: Gamepad2, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { id: 'social', label: 'Social Hangouts', icon: Coffee, color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'work', label: 'Work & Business', icon: Briefcase, color: 'bg-zinc-100 border-zinc-200 text-zinc-700' },
  { id: 'education', label: 'Learning & Skills', icon: GraduationCap, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'creative', label: 'Art & Creativity', icon: Palette, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'photography', label: 'Photography', icon: Camera, color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { id: 'travel', label: 'Travel & Explore', icon: Compass, color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { id: 'fitness', label: 'Fitness & Health', icon: Heart, color: 'bg-pink-50 border-pink-200 text-pink-700' },
];

const TOTAL_STEPS = 7;

export default function Onboarding() {
  const { sendOTP, updateUser } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Form state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [locationGranted, setLocationGranted] = useState(false);

  const [otpError, setOtpError] = useState('');
  const [otpConfirmation, setOtpConfirmation] = useState<{ confirm: (code: string) => Promise<void> } | null>(null);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const goNext = () => {
    setDirection(1);
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const navigateTo = (s: Step, idx: number) => {
    setDirection(idx > stepIndex ? 1 : -1);
    setStepIndex(idx);
    setStep(s);
  };

  // --- Step handlers ---

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setIsSendingOTP(true);
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;
      const confirmation = await sendOTP(fullPhone);
      setOtpConfirmation(confirmation);
      navigateTo('otp', 2);
    } catch (err) {
      setOtpError('Failed to send code. Please try again.');
      console.error('OTP error:', err);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setIsVerifying(true);
    try {
      await otpConfirmation?.confirm(otp);
      navigateTo('profile', 3);
    } catch {
      setOtpError('Invalid code. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name: `${firstName} ${lastName}`.trim() });
    navigateTo('interests', 4);
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleInterestsNext = () => {
    const labels = selectedInterests
      .map((id) => INTERESTS.find((i) => i.id === id)?.label)
      .filter(Boolean) as string[];
    updateUser({ interests: labels });
    navigateTo('location', 5);
  };

  const handleLocationAllow = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationGranted(true);
          setTimeout(() => navigateTo('done', 6), 600);
        },
        () => {
          setLocationGranted(true);
          setTimeout(() => navigateTo('done', 6), 600);
        }
      );
    } else {
      setLocationGranted(true);
      setTimeout(() => navigateTo('done', 6), 600);
    }
  };

  const handleFinish = () => {
    window.location.href = '/';
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  // --- Render helpers ---

  const ProgressBar = () => (
    <div className="flex items-center gap-1.5 px-5 pt-5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i <= stepIndex ? 'bg-indigo-600' : 'bg-zinc-200'
          }`}
        />
      ))}
    </div>
  );

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="absolute top-5 left-5 p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors z-10"
    >
      <ArrowLeft className="w-5 h-5 text-zinc-700" />
    </button>
  );

  // --- Step renders ---

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-600/20"
      >
        <span className="text-white font-black text-4xl tracking-tighter">R</span>
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight"
      >
        Welcome to RALLY
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-3 text-sm text-zinc-500 max-w-xs leading-relaxed"
      >
        Connect with verified people nearby to ASK for help, HELP others, or JOIN activities together.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-10 w-full max-w-xs space-y-3"
      >
        <button
          onClick={() => navigateTo('phone', 1)}
          className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-zinc-400 font-medium">
          Takes about 60 seconds
        </p>
      </motion.div>
    </div>
  );

  const renderPhone = () => (
    <div className="px-6 w-full max-w-md mx-auto">
      <BackButton onClick={() => navigateTo('welcome', 0)} />
      <div className="pt-16">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          What's your number?
        </h2>
        <p className="mt-2 text-sm text-zinc-500 mb-8">
          We'll send you a verification code via SMS.
        </p>
        <form onSubmit={handleSendOTP} className="space-y-5">
          <div>
            <div className="relative rounded-2xl border border-zinc-200 bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="text-sm font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg">
                  NG +234
                </span>
              </div>
              <input
                type="tel"
                autoFocus
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full pl-28 pr-4 py-4 sm:text-lg border-0 rounded-2xl font-medium bg-transparent focus:ring-0 focus:outline-none"
                placeholder="801 234 5678"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={phone.length < 10 || isSendingOTP}
            className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSendingOTP ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Send Code <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          {otpError && (
            <p className="text-sm text-rose-600 font-medium text-center">{otpError}</p>
          )}
        </form>
      </div>
    </div>
  );

  const renderOTP = () => (
    <div className="px-6 w-full max-w-md mx-auto">
      <BackButton onClick={() => navigateTo('phone', 1)} />
      <div className="pt-16">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Enter the code
        </h2>
        <p className="mt-2 text-sm text-zinc-500 mb-8">
          Sent to <span className="font-bold text-zinc-900">+234 {phone}</span>
        </p>
        <form onSubmit={handleVerifyOTP} className="space-y-5">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="block w-full text-center tracking-[0.5em] text-2xl font-bold py-4 border-0 bg-zinc-100 rounded-2xl focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
            placeholder="------"
          />
          <button
            type="submit"
            disabled={otp.length < 6 || isVerifying}
            className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Verify <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          {otpError && (
            <p className="text-sm text-rose-600 font-medium text-center">{otpError}</p>
          )}
        </form>
        <button
          onClick={() => handleSendOTP(new Event('submit') as unknown as React.FormEvent)}
          className="mt-4 w-full text-center text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors py-2"
        >
          Resend code
        </button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="px-6 w-full max-w-md mx-auto">
      <BackButton onClick={() => navigateTo('otp', 2)} />
      <div className="pt-16">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Tell us your name
        </h2>
        <p className="mt-2 text-sm text-zinc-500 mb-8">
          This is how other members will see you on RALLY.
        </p>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <input
            type="text"
            autoFocus
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="block w-full px-4 py-4 border border-zinc-200 bg-white rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:outline-none transition-all"
            placeholder="First name"
          />
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="block w-full px-4 py-4 border border-zinc-200 bg-white rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:outline-none transition-all"
            placeholder="Last name"
          />
          <button
            type="submit"
            disabled={!firstName || !lastName}
            className="w-full mt-2 py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="px-6 w-full max-w-md mx-auto">
      <BackButton onClick={() => navigateTo('profile', 3)} />
      <div className="pt-16">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Pick your interests
        </h2>
        <p className="mt-2 text-sm text-zinc-500 mb-6">
          Choose at least 3 so we can show you relevant RALLYS.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {INTERESTS.map((interest) => {
            const selected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                    : `border-zinc-100 bg-white hover:border-zinc-200`
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selected ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500'
                } transition-colors`}>
                  <interest.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold leading-tight ${
                  selected ? 'text-indigo-700' : 'text-zinc-700'
                }`}>
                  {interest.label}
                </span>
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={handleInterestsNext}
          disabled={selectedInterests.length < 3}
          className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {selectedInterests.length < 3
            ? `Pick ${3 - selectedInterests.length} more`
            : <>Continue <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </div>
    </div>
  );

  const renderLocation = () => (
    <div className="px-6 w-full max-w-md mx-auto flex flex-col items-center text-center">
      <div className="pt-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6"
        >
          <MapPin className="w-9 h-9 text-indigo-600" />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Enable location
        </h2>
        <p className="mt-3 text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
          So we can show you RALLYS happening near you. Your exact location is never shared publicly.
        </p>
        <div className="mt-8 space-y-3 w-full max-w-xs mx-auto">
          <button
            onClick={handleLocationAllow}
            className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
          >
            {locationGranted ? (
              <><Check className="w-4 h-4" /> Location enabled</>
            ) : (
              <><MapPin className="w-4 h-4" /> Allow Location</>
            )}
          </button>
          <button
            onClick={() => navigateTo('done', 6)}
            className="w-full py-3.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );

  const renderDone = () => (
    <div className="px-6 w-full max-w-md mx-auto flex flex-col items-center text-center">
      <div className="pt-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20"
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight"
        >
          You're all set!
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-sm text-zinc-500 max-w-xs mx-auto"
        >
          Welcome to the community, {firstName || 'there'}. Start by creating your first RALLY or exploring what's near you.
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 w-full max-w-xs mx-auto"
        >
          <button
            onClick={handleFinish}
            className="w-full py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
          >
            Start Rallying <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );

  const steps: Record<Step, { render: () => React.ReactNode }> = {
    welcome: { render: renderWelcome },
    phone: { render: renderPhone },
    otp: { render: renderOTP },
    profile: { render: renderProfile },
    interests: { render: renderInterests },
    location: { render: renderLocation },
    done: { render: renderDone },
  };

  return (
    <div className="min-h-screen bg-zinc-50 relative overflow-hidden">
      <ProgressBar />
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="min-h-[calc(100vh-24px)] flex items-center justify-center pb-24"
        >
          {steps[step].render()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
