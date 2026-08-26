import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { 
  HelpCircle, 
  MessageSquare, 
  Flag, 
  ShieldCheck, 
  FileText, 
  ChevronDown, 
  Mail, 
  Check, 
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    question: 'How do RALLY meetups work?',
    answer: 'Neighbors post casual activities (e.g. 5v5 football, running, study sessions, dining). You can request to join, chat with attendees, and meet safely in verified public spaces.'
  },
  {
    question: 'How does NIN Identity Verification protect me?',
    answer: 'NIN verification confirms that the member is real and legally identified in the national database. Verified members have green badges and undergo automated safety screenings.'
  },
  {
    question: 'What is RALLY+ Premium?',
    answer: 'RALLY+ gives you unlimited activity boosts, advanced neighborhood radius filters, priority search placement, and an exclusive VIP Crown badge on your profile.'
  },
  {
    question: 'What should I do if a meetup feels unsafe?',
    answer: 'You can tap the Emergency SOS button in the Safety tab to instantly alert your trusted emergency contacts with your GPS coordinates, or call national toll-free 112.'
  },
];

export default function HelpSupport() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submittedToast, setSubmittedToast] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactMessage.trim()) {
      setShowContactModal(false);
      setContactSubject('');
      setContactMessage('');
      setSubmittedToast(true);
      setTimeout(() => setSubmittedToast(false), 2500);
    }
  };

  return (
    <PageShell 
      title="Help & Support"
      subtitle="Frequently asked questions, support contacts, and safety guides"
    >
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {submittedToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Support ticket submitted. We will reply via email.
          </div>
        )}

        {/* Unified Continuous Container */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
          
          {/* Section 1: Help Center & FAQs */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-2 pt-1">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index}
                    className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full p-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-zinc-900 hover:bg-zinc-100/70 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-zinc-700' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 text-xs text-zinc-600 font-medium leading-relaxed border-t border-zinc-200/60 bg-white">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Contact Support */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-zinc-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Contact Support
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded ring-1 ring-emerald-200">
                Online 24/7
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900">Need direct assistance?</p>
                <p className="text-[11px] text-zinc-500 font-medium truncate">Reach our community safety and support team directly</p>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors shrink-0 active:scale-95"
              >
                Open Ticket
              </button>
            </div>
          </div>

          {/* Section 3: Report a Problem */}
          <div className="p-4 sm:p-5 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Reporting & Safety
            </h3>

            <div className="space-y-2 pt-1">
              <Link
                to="/report/general"
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 hover:bg-zinc-100/80 border border-zinc-200/70 transition-colors font-bold text-xs sm:text-sm text-zinc-900"
              >
                <div className="flex items-center gap-2.5">
                  <Flag className="w-4 h-4 text-rose-600" />
                  <span>Report a Problem or Incident</span>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Section 4: Community Guidelines & Legal */}
          <div className="p-4 sm:p-5 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Community & Legal
            </h3>

            <div className="space-y-2 pt-1">
              <Link
                to="/safety"
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 hover:bg-zinc-100/80 border border-zinc-200/70 transition-colors font-bold text-xs sm:text-sm text-zinc-900"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Community Safety & Guidelines</span>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </Link>

              <Link
                to="/terms"
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 hover:bg-zinc-100/80 border border-zinc-200/70 transition-colors font-bold text-xs sm:text-sm text-zinc-900"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-zinc-600" />
                  <span>Terms of Service</span>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </Link>

              <Link
                to="/privacy"
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 hover:bg-zinc-100/80 border border-zinc-200/70 transition-colors font-bold text-xs sm:text-sm text-zinc-900"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-zinc-600" />
                  <span>Privacy Policy</span>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Support Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-xl border border-zinc-100 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-black text-base text-zinc-900">Contact Support</h3>
              <button 
                type="button" 
                onClick={() => setShowContactModal(false)}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Account verification issue"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  How can we help?
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue or question in detail..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
