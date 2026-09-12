import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import BrandLogo from '../components/BrandLogo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  AlertCircle, 
  Heart, 
  Users, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  ArrowRight,
  Star,
  ChevronRight,
  CheckCircle2,
  Download,
  Smartphone,
  History,
  Calendar,
  Sparkles,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const FALLBACK_RELEASE = {
  version: '1.0.0',
  buildNumber: 100,
  releaseDate: 'September 12, 2026',
  apkUrl: 'https://github.com/osiobeprovidence-maker/NEARU/releases/latest',
  apkSize: '24.5 MB',
  releaseNotes: [
    'Endless TikTok/Reels vertical video scroll experience with smart entry preservation',
    'Anti-download video security and double-tap heart animations',
    'Real-time Cycles (24h Stories) bar & story creation',
    'Direct messaging with voice notes and instant attachments',
    'Convex Cloud live backend integration',
  ],
  minAndroidVersion: 'Android 8.0+',
  isLatest: true,
};

interface ReleaseData {
  version: string;
  buildNumber?: number;
  releaseDate: string;
  apkUrl: string;
  apkSize?: string;
  releaseNotes: string[];
  minAndroidVersion?: string;
  isLatest?: boolean;
}

function DownloadHubContent({ 
  release, 
  history 
}: { 
  release: ReleaseData; 
  history: ReleaseData[] 
}) {
  return (
    <section id="download" className="max-w-6xl mx-auto px-5 py-16 md:py-24">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
        className="text-center mb-12"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full mb-3">
            <Smartphone className="w-3.5 h-3.5" />
            Official Android Release
          </span>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tight"
        >
          Get Lalao for Android
        </motion.h2>
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-3 text-sm sm:text-base text-zinc-500 max-w-lg mx-auto leading-relaxed"
        >
          Download the latest verified Android release directly to your device. Always fast, virus-free, and up to date.
        </motion.p>
      </motion.div>

      {/* Latest Release Featured Card */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-zinc-200/50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                    Lalao for Android
                  </h3>
                  <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    Latest
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-0.5 flex items-center gap-2">
                  <span className="font-bold text-zinc-800">v{release.version}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    {release.releaseDate}
                  </span>
                  {release.apkSize && (
                    <>
                      <span>•</span>
                      <span>{release.apkSize}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
                {release.minAndroidVersion || 'Android 8.0+'}
              </span>
            </div>
          </div>

          <div className="py-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              What's new in this release
            </h4>
            <ul className="space-y-2.5">
              {release.releaseNotes.map((note: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="leading-snug">{note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <a
              href={release.apkUrl}
              download={`lalao-v${release.version}.apk`}
              className="px-8 py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2.5 group"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Download APK</span>
              <span className="text-xs text-zinc-400 font-normal ml-1">
                (v{release.version})
              </span>
            </a>

            <div className="flex items-center justify-center sm:justify-end gap-3 text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Verified Safe
              </span>
              <span>•</span>
              <span>Direct Install</span>
              <span>•</span>
              <span>No Store Login</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Version History */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-3xl mx-auto mt-8"
      >
        <div className="bg-zinc-100/70 border border-zinc-200/80 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-500" />
              <h4 className="text-sm font-black uppercase tracking-wider text-zinc-700">
                Version History
              </h4>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              {history.length} {history.length === 1 ? 'release' : 'releases'} available
            </span>
          </div>

          <div className="space-y-3">
            {history.map((rel: any, idx: number) => (
              <div
                key={rel.version || idx}
                className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-zinc-900">
                      v{rel.version}
                    </span>
                    {rel.isLatest && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                        Latest
                      </span>
                    )}
                    <span className="text-xs text-zinc-400">
                      • {rel.releaseDate}
                    </span>
                    {rel.apkSize && (
                      <span className="text-xs text-zinc-400">
                        • {rel.apkSize}
                      </span>
                    )}
                  </div>
                  {rel.releaseNotes && rel.releaseNotes.length > 0 && (
                    <p className="text-xs text-zinc-500 line-clamp-1">
                      {rel.releaseNotes.join(' • ')}
                    </p>
                  )}
                </div>

                <a
                  href={rel.apkUrl}
                  download={`lalao-v${rel.version}.apk`}
                  className="self-start sm:self-center px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl border border-zinc-200 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-600" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DownloadHubQuery() {
  const latestRelease = useQuery(api.releases.getLatestRelease);
  const versionHistory = useQuery(api.releases.getVersionHistory);

  const activeRelease = latestRelease || FALLBACK_RELEASE;
  const historyList = (versionHistory && versionHistory.length > 0)
    ? (versionHistory as ReleaseData[])
    : [activeRelease];

  return <DownloadHubContent release={activeRelease} history={historyList} />;
}

class DownloadErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn('DownloadHub fallback used:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <DownloadHubContent 
          release={FALLBACK_RELEASE} 
          history={[FALLBACK_RELEASE]} 
        />
      );
    }
    return this.props.children;
  }
}

export default function Landing() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const path = window.location.pathname.replace(/^\/+/, '');
    if (path === 'download' || path === 'features' || path === 'about') {
      const el = document.getElementById(path);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const handleGetStarted = () => {
    navigate('/login?mode=signup');
  };

  const handleLogin = () => {
    navigate('/login?mode=signin');
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2">
              <BrandLogo boxClassName="w-8 h-8" rounded="rounded-lg" nameClassName="text-xl" fallbackLetter="l" />
            </a>
            <div className="hidden md:flex items-center gap-6 text-xs font-bold text-zinc-500">
              <a href="/features" className="hover:text-zinc-900 transition-colors">Features</a>
              <a href="/about" className="hover:text-zinc-900 transition-colors">About</a>
              <a href="/download" className="hover:text-zinc-900 transition-colors">Download</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/download"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download APK
            </a>
            <button
              onClick={handleLogin}
              className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={handleGetStarted}
              className="px-5 py-2 bg-zinc-900 text-white text-sm font-bold rounded-full hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-zinc-50 to-zinc-50" />
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 md:pt-32 md:pb-40 text-center">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full mb-2">
                <Zap className="w-3.5 h-3.5" />
                Now live across Nigeria
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter leading-[1.05] max-w-4xl mx-auto">
              Your community,
              <br />
              <span className="text-indigo-600">one rally away.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
              Need help? Offering a ride? Looking for company? lalao connects you 
              with verified people around you — fast, safe, and local.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
              >
                Start Rallying
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#download"
                className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 font-bold text-sm rounded-2xl border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                Download for Android
              </a>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                NIN Verified
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Free to join
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                No spam
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* OFFICIAL LALAO ANDROID DOWNLOAD HUB */}
      {/* ------------------------------------------------------------- */}
      <DownloadErrorBoundary>
        <DownloadHubQuery />
      </DownloadErrorBoundary>

      {/* Three Pillars: ASK / HELP / JOIN */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-20 md:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tighter"
          >
            Three ways to rally your people
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-3 text-sm sm:text-base text-zinc-500 max-w-lg mx-auto"
          >
            Every post on lalao falls into one of three categories. 
            Pick what fits — your community will show up.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="grid sm:grid-cols-3 gap-5"
        >
          {/* ASK */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="group bg-white border border-zinc-200 rounded-3xl p-7 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-50 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5 group-hover:bg-rose-100 transition-colors">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-2">ASK</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Need a ride to the airport? Looking for a plumber? 
              Put it out there and let your community respond.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-rose-600">
              <span>I need something</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* HELP */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group bg-white border border-zinc-200 rounded-3xl p-7 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
              <Heart className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-2">HELP</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Have extra seats? Free this weekend? 
              Offer your time, skills, or resources to someone nearby.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-600">
              <span>I can help</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* JOIN */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group bg-white border border-zinc-200 rounded-3xl p-7 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-2">JOIN</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Football tonight? Road trip to Ibadan? 
              Find people heading the same direction and go together.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-indigo-600">
              <span>I want company</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tighter"
            >
              Up and running in 60 seconds
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mt-3 text-sm sm:text-base text-zinc-500 max-w-lg mx-auto"
            >
              No lengthy forms. No waiting days for approval.
              Just sign up and you're in.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-8 md:gap-12"
          >
            {[
              {
                step: '1',
                title: 'Sign up in seconds',
                desc: 'Create an account with your email or phone. Quick and secure.',
                color: 'bg-indigo-600',
              },
              {
                step: '2',
                title: 'Verify your identity',
                desc: 'Link your NIN or valid ID so people know you\'re real.',
                color: 'bg-emerald-600',
              },
              {
                step: '3',
                title: 'Post or respond',
                desc: 'Create a RALLY or jump on one near you. Start chatting instantly.',
                color: 'bg-zinc-900',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`w-10 h-10 rounded-full ${item.color} text-white font-black text-sm flex items-center justify-center mx-auto mb-4`}>
                  {item.step}
                </div>
                <h3 className="text-base font-black text-zinc-900 tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Safety */}
      <section className="max-w-6xl mx-auto px-5 py-20 md:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Trust & Safety
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
              Built for trust.
              <br />
              Designed for safety.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-500 leading-relaxed max-w-md">
              Every member is NIN or ID verified. You control who sees your 
              profile, your location, and who can message you.
            </p>
            <div className="mt-8 space-y-4">
              {[
                'NIN / ID verification before interacting',
                'Location precision controls (exact, approximate, city only)',
                'Trusted contacts for emergencies',
                'Block & report any user instantly',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-zinc-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl shadow-zinc-200/40">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Identity Verified</p>
                  <p className="text-xs text-zinc-500">NIN matched • Nigeria</p>
                </div>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-zinc-700 ml-1">4.9</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  "Very reliable. Helped me move apartments on short notice. 
                  Would definitely rally with them again!"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs font-bold text-zinc-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  12 replies
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  2.1 km away
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-100 rounded-full blur-2xl opacity-60" />
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-emerald-100 rounded-full blur-2xl opacity-60" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="bg-zinc-900">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '10K+', label: 'Verified users' },
              { value: '25K+', label: 'RALLYS created' },
              { value: '85%', label: 'Response rate' },
              { value: '4.8', label: 'Average rating' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-medium">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-5 py-20 md:py-28 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tighter leading-tight max-w-2xl mx-auto"
          >
            Stop scrolling.
            <br />
            Start rallying.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-4 text-sm sm:text-base text-zinc-500 max-w-md mx-auto"
          >
            Join thousands of verified Nigerians already using lalao 
            to connect, help, and do things together.
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8"
          >
            <button
              onClick={handleGetStarted}
              className="px-10 py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 inline-flex items-center gap-2"
            >
              Join lalao for free
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BrandLogo boxClassName="w-7 h-7" rounded="rounded-lg" nameClassName="text-lg" fallbackLetter="l" />
              </div>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                A Nigerian-first community app where people can ASK, HELP, or JOIN — safely and locally.
              </p>
            </div>
            <div className="flex gap-8 text-xs font-bold text-zinc-500">
              <a href="/terms" className="hover:text-zinc-900 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy</a>
              <a href="/help" className="hover:text-zinc-900 transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-100 text-[11px] text-zinc-400 font-medium">
            &copy; {new Date().getFullYear()} lalao. All rights reserved. Made in Nigeria.
          </div>
        </div>
      </footer>
    </div>
  );
}
