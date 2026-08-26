import { motion } from 'motion/react';
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
  CheckCircle2
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function Landing() {
  const handleGetStarted = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-lg tracking-tighter">R</span>
            </div>
            <span className="font-black text-xl tracking-tighter text-zinc-900">RALLY</span>
          </div>
          <button
            onClick={handleGetStarted}
            className="px-5 py-2 bg-zinc-900 text-white text-sm font-bold rounded-full hover:bg-zinc-800 active:scale-95 transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-zinc-50 to-zinc-50" />
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 md:pt-32 md:pb-40 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" />
                Now live in Lagos, Abuja & Port Harcourt
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter leading-[1.05] max-w-4xl mx-auto"
            >
              Your community,
              <br />
              <span className="text-indigo-600">one rally away.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-base sm:text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed"
            >
              Need help? Offering a ride? Looking for company? RALLY connects you 
              with verified people around you — fast, safe, and local.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white font-bold text-sm rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
              >
                Start Rallying
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 font-bold text-sm rounded-2xl border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                I have an account
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-400 font-medium"
            >
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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Three Pillars: ASK / HELP / JOIN */}
      <section className="max-w-6xl mx-auto px-5 py-20 md:py-28">
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
            Every post on RALLY falls into one of three categories. 
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
              Just your phone number and you're in.
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
                title: 'Sign up with your phone',
                desc: 'Enter your number, verify with an OTP. Done in seconds.',
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
                  <p className="text-xs text-zinc-500">NIN matched • Lagos, Nigeria</p>
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
            Join thousands of verified Nigerians already using RALLY 
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
              Join RALLY for free
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
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-black text-sm tracking-tighter">R</span>
                </div>
                <span className="font-black text-lg tracking-tighter text-zinc-900">RALLY</span>
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
            &copy; {new Date().getFullYear()} RALLY. All rights reserved. Made in Nigeria.
          </div>
        </div>
      </footer>
    </div>
  );
}
