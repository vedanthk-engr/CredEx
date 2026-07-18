import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Share2, Shield, MessageSquare, Zap, BarChart3, CloudLightning, Landmark, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';

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

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does cohort-relative scoring solve credit-invisibility?",
      a: "Traditional underwriting evaluates absolute balance sheets, penalizing smaller or rural enterprises. CREDEX benchmarks a business's GSTR-1 cash flow against a specific micro-cohort (e.g. Textile Manufacturing in Coimbatore, TN, of a similar vintage). By measuring performance relative to peers, NTC (New-to-Credit) merchants with consistent cash flow discipline obtain higher ratings than absolute score models allow."
    },
    {
      q: "Is my raw commercial ledger or GSTR file exposed to underwriters?",
      a: "No. Under the Zero-Knowledge (ZK) attestation framework, CREDEX generates cryptographically signed JWT claim proofs containing only score bands (e.g., 'Passed minimum 50th percentile threshold'). Raw banking ledger histories, specific invoice amounts, and trade details are stored locally on the client and never shared or uploaded to credit registries, ensuring complete commercial privacy."
    },
    {
      q: "What is the role of Post-Quantum Cryptography (PQC) in CREDEX?",
      a: "To ensure that credit attestations remain immutable and secure against future quantum decryption, all generated ZK proof tokens are encapsulated using simulated CRYSTALS-Kyber key encapsulation packages and signed with PQC-ready NaCl signatures, protecting claims from retroactive decryption audits."
    },
    {
      q: "How do alternate registries (ONDC, DISCOM, WhatsApp) optimize limits?",
      a: "Alternate registers provide real-time proxies of business activity. A strong ONDC order book velocity or high WhatsApp customer response rate applies positive modifier scores. Conversely, utility monitoring like DISCOM power draws acts as an early warning drift indicator; if power drops by 60% month-over-month, the system triggers a telemetry check for factory shutdowns."
    }
  ];

  return (
    <div className="space-y-32 py-16 overflow-hidden">

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative text-center max-w-4xl mx-auto px-4">
        {/* Ambient radial lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
        />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-bold text-neutral-400 mb-8 tracking-widest uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse" />
          Consent-Based Credit Architecture
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-display text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
        >
          Credit for Every MSME
          <br />
          <span className="text-neutral-500 font-extrabold">Based on Who You Are</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-neutral-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10"
        >
          CREDEX bridges the Credit Gap by scoring invisible MSMEs relative to micro-cohorts,
          utilizing GST/UPI/EPFO streams, climate resilience indices, and alternate trust proxies.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10"
        >
          <button
            onClick={() => onNavigate('onboard')}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-black bg-white transition-all duration-200 shadow-[0_0_32px_rgba(255,255,255,0.2)] hover:shadow-[0_0_52px_rgba(255,255,255,0.35)]"
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
        </motion.div>
      </section>

      {/* ── STATS SECTION ────────────────────────────────────────── */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto px-4"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.06]">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-black py-8 px-6 text-center flex flex-col items-center justify-center gap-1">
              <div className="text-3xl font-black text-white font-display tracking-tight">
                {stat.value}
              </div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center">
          <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Workflow</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
            How The Scoring Works
          </h2>
          <p className="text-neutral-500 text-sm mt-2 max-w-sm mx-auto">
            Consolidated credit evaluation in three simple digital registry connections
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflow.map((w, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="relative p-6 rounded-2xl border border-white/[0.07] bg-[#080808] hover:border-white/[0.15] transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute top-4 right-4 text-6xl font-black font-display text-white/[0.02] leading-none select-none group-hover:text-white/[0.05] transition-all">
                {w.step}
              </div>
              <div className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-3">{w.step}</div>
              <h3 className="text-base font-bold text-white mb-2">{w.title}</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DEEP DIVE: MICRO-COHORT INGESTION MODEL ──────────────── */}
      <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/[0.04] border border-white/10 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
            Module 01 / Ingestion
          </div>
          <h3 className="font-display text-3xl font-extrabold text-white tracking-tight leading-tight">
            Peer Micro-Cohort
            <br />
            Clustering Model
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            By sorting MSMEs relative to micro-cohorts (~800 peer archetypes based on 2-digit NIC code, district tier, vintage, and employee count bounds) across 6 dimensions, CREDEX provides contextual benchmarking.
          </p>
          <div className="space-y-3 font-semibold text-xs text-neutral-300">
            <div className="flex gap-2.5 items-start">
              <Check size={16} className="text-white mt-0.5" />
              <span>Normalizes seasonal variations unique to specific regional trade sectors.</span>
            </div>
            <div className="flex gap-2.5 items-start">
              <Check size={16} className="text-white mt-0.5" />
              <span>Benchmarks cash runways and collection velocities against local competitors.</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="p-6 rounded-2xl border border-white/[0.08] bg-[#050505] space-y-4"
        >
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block border-b border-white/[0.06] pb-2">
            Clustering Telemetry Weights
          </span>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-neutral-900/60 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-neutral-400 font-medium">NIC-Sector Baseline</span>
              <strong className="text-white font-mono">Weight: 40%</strong>
            </div>
            <div className="flex justify-between items-center bg-neutral-900/60 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-neutral-400 font-medium">Location Tier (Tier 1 vs 2)</span>
              <strong className="text-white font-mono">Weight: 25%</strong>
            </div>
            <div className="flex justify-between items-center bg-neutral-900/60 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-neutral-400 font-medium">Business Vintage Bounds</span>
              <strong className="text-white font-mono">Weight: 20%</strong>
            </div>
            <div className="flex justify-between items-center bg-neutral-900/60 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-neutral-400 font-medium">EPFO Employee Headcount</span>
              <strong className="text-white font-mono">Weight: 15%</strong>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center">
          <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Capabilities</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
            Engineered Risk Intelligence
          </h2>
          <p className="text-neutral-500 text-sm mt-2 max-w-sm mx-auto">
            Dynamic data streams compiled to provide verifiable credit limits
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: (idx % 4) * 0.1 }}
              className="p-5 rounded-2xl border border-white/[0.06] bg-[#080808] hover:border-white/[0.14] hover:bg-[#0e0e0e] transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-4 text-white group-hover:bg-white/[0.1] transition-all">
                {f.icon}
              </div>
              <h3 className="text-[13px] font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ SECTION (ACCORDION) ───────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 space-y-10">
        <div className="text-center">
          <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">FAQ</span>
          <h2 className="font-display text-3xl font-extrabold text-white tracking-tight mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-white/[0.06] rounded-xl bg-[#060606] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center p-5 text-left text-xs font-bold text-white focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={14} 
                    className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} 
                  />
                </button>

                {isOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="px-5 pb-5 pt-1 text-[11px] text-neutral-400 leading-relaxed border-t border-white/[0.04]"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 text-center">
        <div className="p-10 rounded-2xl border border-white/[0.08] bg-[#060606] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)' }}
          />
          <h3 className="font-display text-2xl font-extrabold text-white mb-3 tracking-tight">
            Ready to evaluate your business?
          </h3>
          <p className="text-neutral-500 text-xs mb-7">
            Link FIP accounts via Aggregators to generate signed ZK proof compliance cards in minutes.
          </p>
          <button
            onClick={() => onNavigate('onboard')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-black bg-white transition-all duration-200 shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
          >
            Start Free Analysis <ArrowRight size={16} />
          </button>
        </div>
      </section>

    </div>
  );
};
