import React from 'react';
import { ArrowRight, ShieldCheck, Share2, Shield, MessageSquare, Zap, BarChart3, CloudLightning, Landmark } from 'lucide-react';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  const stats = [
    { label: "Active MSMEs in India", value: "63M+" },
    { label: "Credit Gap Size", value: "₹25L Cr" },
    { label: "NTC Rejection Rate", value: "82%" },
    { label: "Integrations Ready", value: "OCEN & AA" },
  ];

  const workflow = [
    { step: "01", title: "Onboard & Connect", desc: "Link GST, UPI, and EPFO records securely via Account Aggregator in under 2 minutes." },
    { step: "02", title: "Micro-Cohort Analysis", desc: "Get benchmarked relative to 800 granular peer archetypes based on your sector and tier." },
    { step: "03", title: "Unlock Credit Offers", desc: "Generate a ZK Credit Proof and receive dynamic credit limits across the OCEN network." },
  ];

  const features = [
    { icon: <BarChart3 size={18} />, title: "STL Trend Decomposition", desc: "Separates seasonality from underlying revenue growth, ensuring businesses are not penalized for natural trade cycles." },
    { icon: <Share2 size={18} />, title: "Payment Network Graphs", desc: "Constructs directed graphs mapping client diversity, buyer concentration, and operational resilience." },
    { icon: <ShieldCheck size={18} />, title: "Zero-Knowledge Attestation", desc: "Generates signed cryptographic tokens validating score bands without exposing raw ledger data." },
    { icon: <MessageSquare size={18} />, title: "Vernacular Voice Diaries", desc: "Evaluates weekly check-ins via Whisper audio transcription and NLP sentiment modeling to build behavioral trust." },
    { icon: <Zap size={18} />, title: "OCEN Marketplace", desc: "Builds structured loan offers using the OCEN 4.0 format to connect MSMEs directly with competitive lenders." },
    { icon: <CloudLightning size={18} />, title: "Climate Resilience Scorer", desc: "Cross-references IMD climate risk databases, granting antifragility bonuses to businesses that survived weather events." },
    { icon: <Landmark size={18} />, title: "Alternate Signals", desc: "Extracts growth proxies from ONDC seller performance, DISCOM electricity meters, and DigiLocker skills certificates." },
    { icon: <Shield size={18} />, title: "Drift Monitoring", desc: "Monitors MSME feature drift, identifying UPGRADE opportunities or sending early risk warnings to underwriters." },
  ];

  return (
    <div className="space-y-24 py-12">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative text-center max-w-4xl mx-auto px-4">
        {/* Background glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)' }}
        />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-neutral-400 mb-8 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-60 animate-pulse" />
          AI-Driven Credit Intelligence · India's Invisible Sectors
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
          style={{ textShadow: '0 0 80px rgba(255,255,255,0.08)' }}
        >
          Credit for Every MSME
          <br />
          <span className="text-neutral-500">Based on Who You Are</span>
        </h1>

        <p className="text-neutral-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
          CREDEX bridges the Credit Gap by scoring invisible MSMEs relative to micro-cohorts,
          utilizing GST/UPI/EPFO streams, climate resilience indices, and alternate trust proxies.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => onNavigate('onboard')}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-black bg-white transition-all duration-200"
            style={{ boxShadow: '0 0 32px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.5)' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 52px rgba(255,255,255,0.35), 0 4px 16px rgba(0,0,0,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 32px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.5)')}
          >
            Check Business Health
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate('bank')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-neutral-300 border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] hover:text-white transition-all duration-200"
          >
            Bank Underwriter Portal <Landmark size={16} />
          </button>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.06]">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-black py-8 px-6 text-center flex flex-col items-center justify-center gap-1">
              <div className="text-3xl font-black text-white font-display tracking-tight"
                style={{ textShadow: '0 0 24px rgba(255,255,255,0.15)' }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How The Scoring Works
          </h2>
          <p className="text-neutral-500 text-sm mt-2">
            Three steps to credit visibility
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflow.map((w, idx) => (
            <div key={idx}
              className="relative p-6 rounded-2xl border border-white/[0.07] bg-[#080808] hover:border-white/[0.15] transition-all duration-300 overflow-hidden group"
            >
              {/* step number watermark */}
              <div className="absolute top-4 right-4 text-6xl font-black font-display text-white/[0.03] leading-none select-none group-hover:text-white/[0.06] transition-all">
                {w.step}
              </div>
              <div className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-3">{w.step}</div>
              <h3 className="text-base font-bold text-white mb-2">{w.title}</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Platform Capabilities
          </h2>
          <p className="text-neutral-500 text-sm mt-2">
            Engineered to analyze, verify, and secure credit assessments
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, idx) => (
            <div key={idx}
              className="p-5 rounded-2xl border border-white/[0.06] bg-[#080808] hover:border-white/[0.14] hover:bg-[#0e0e0e] transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-4 text-white group-hover:bg-white/[0.1] transition-all">
                {f.icon}
              </div>
              <h3 className="text-[13px] font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 text-center">
        <div className="p-10 rounded-2xl border border-white/[0.08] bg-[#060606] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)' }}
          />
          <h3 className="font-display text-2xl font-extrabold text-white mb-3 tracking-tight">
            Ready to verify your business?
          </h3>
          <p className="text-neutral-500 text-sm mb-7">
            Get your AI-generated MSME financial health card in minutes, not weeks.
          </p>
          <button
            onClick={() => onNavigate('onboard')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-black bg-white transition-all duration-200"
            style={{ boxShadow: '0 0 32px rgba(255,255,255,0.18)' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 52px rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 32px rgba(255,255,255,0.18)')}
          >
            Start Free Analysis <ArrowRight size={16} />
          </button>
        </div>
      </section>

    </div>
  );
};
