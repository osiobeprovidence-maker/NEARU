import React from 'react';
import PageShell from '../components/PageShell';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <PageShell 
      title="Privacy Policy"
      subtitle="Last updated: August 2026"
      headerAction={
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors inline-flex items-center gap-1 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      }
    >
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 sm:p-8 max-w-3xl mx-auto space-y-6 text-zinc-700 text-sm leading-relaxed pb-12">
        <div className="flex items-center gap-3 pb-6 border-b border-zinc-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Your Privacy is Our Core Standard</h3>
            <p className="text-xs text-zinc-500 font-medium">How we collect, encrypt, and safeguard your personal information.</p>
          </div>
        </div>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">1. Information We Collect</h4>
          <p>
            When you use LALOA, we collect information you provide directly to us:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-600">
            <li><strong className="text-zinc-800">Account Details:</strong> Name, chosen username, email address, phone number, bio, city, and profile photo.</li>
            <li><strong className="text-zinc-800">Identity Verification Data:</strong> When completing NIN verification, your 11-digit NIN and facial check are transmitted over encrypted TLS channels to verify identity with authorized NIMC gateways.</li>
            <li><strong className="text-zinc-800">Activity Data:</strong> RALLYS posted, responses, chat messages, ratings, and earned community badges.</li>
            <li><strong className="text-zinc-800">Location Data:</strong> Approximate neighborhood location used to calculate relative distance to activities.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">2. How We Protect Your National ID (NIN)</h4>
          <p>
            Your privacy and security are paramount. We strictly enforce the following rules regarding National Identification Numbers:
          </p>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs space-y-2 font-medium">
            <p className="flex items-center gap-2 text-zinc-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Your NIN is NEVER shown to other users, hosts, or participants.
            </p>
            <p className="flex items-center gap-2 text-zinc-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Only the verified status badge and date verified are visible publicly.
            </p>
            <p className="flex items-center gap-2 text-zinc-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              We do not sell, rent, or lease your identity records to third parties or marketing brokers.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">3. Location Privacy & Approximation</h4>
          <p>
            LALOA does not publicly expose your live, continuous GPS coordinate path or your private home address. Distance indicators (e.g. "0.7 km away") use randomized approximate neighborhood coordinates. Precise venue locations are only shared when both parties mutually accept a RALLY.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">4. Communications & Messaging Security</h4>
          <p>
            Direct messages between members are encrypted in transit and accessible only by participating accounts. We do not inspect message contents except in flagged cases involving safety violations or scam reports.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">5. Data Retention & Deletion Rights</h4>
          <p>
            You have full sovereignty over your personal data. You may download a copy of your complete data archive or request permanent deletion of your account and all associated records directly from the Privacy Settings page.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">6. Contact Our Privacy Officer</h4>
          <p>
            For privacy inquiries, data subject access requests, or compliance questions, please contact our Data Protection Officer at <span className="font-semibold text-indigo-600">privacy@rallyapp.community</span>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
