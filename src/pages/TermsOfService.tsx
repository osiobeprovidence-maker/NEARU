import React from 'react';
import PageShell from '../components/PageShell';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <PageShell 
      title="Terms of Service"
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">RALLY Community Agreement</h3>
            <p className="text-xs text-zinc-500 font-medium">Please review the rules and legal terms governing our platform.</p>
          </div>
        </div>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">1. Acceptance of Terms</h4>
          <p>
            By creating an account or using the RALLY mobile and web applications, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the RALLY platform.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">2. Eligibility & Identity Verification</h4>
          <p>
            You must be at least 18 years old to create an account on RALLY. To ensure neighborhood safety, RALLY provides optional and required verification channels, including phone verification and National Identification Number (NIN) authentication. Providing false, stolen, or fraudulent identity information is strictly prohibited and grounds for immediate termination and reporting to relevant authorities.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">3. Community Conduct & Prohibited Activities</h4>
          <p>
            RALLY is dedicated to fostering safe, spontaneous, and genuine peer-to-peer neighborhood connections. Users agree NOT to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-600">
            <li>Post illegal, harmful, threatening, abusive, or sexually explicit content or activities.</li>
            <li>Use the platform for financial scams, advance fee fraud, or soliciting unauthorized commercial products.</li>
            <li>Harass, stalk, or intimidate other community members.</li>
            <li>Misrepresent your location or intentions when participating in local RALLYS.</li>
            <li>Bypass or attempt to exploit our verification or security measures.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">4. Peer-to-Peer Agreements & Responsibilities</h4>
          <p>
            RALLY acts solely as a communication and discovery venue facilitating neighborhood interactions. RALLY does not organize, control, or employ individual members. Users are solely responsible for exercising personal safety, verifying meeting spots, and adhering to local laws when meeting in real life.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">5. Payments & Financial Transactions</h4>
          <p>
            Where a RALLY includes cost-sharing, transport splitting, or mutual task assistance, users agree to transparent, fair handling of funds. RALLY is not responsible for off-platform peer payment disputes, though confirmed fraudulent activity will result in permanent account banning and bad-standing records.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">6. Account Termination & Moderation</h4>
          <p>
            RALLY reserves the right to suspend, restrict, or terminate any account that violates our safety principles, terms of service, or community guidelines, with or without prior notice.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-base font-black text-zinc-900">7. Contact Information</h4>
          <p>
            If you have questions or concerns regarding these terms, please contact our legal and safety desk at <span className="font-semibold text-indigo-600">support@rallyapp.community</span>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
