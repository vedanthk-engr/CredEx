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
    { icon: <BarChart3 className="text-accent" size={24} />, title: "STL Trend Decomposition", desc: "Separates seasonality from underlying revenue growth, ensuring businesses are not penalized for natural trade cycles." },
    { icon: <Share2 className="text-purple-light" size={24} />, title: "Payment Network Graphs", desc: "Constructs directed graphs using NetworkX to map client diversity, buyer concentration, and operational resilience." },
    { icon: <ShieldCheck className="text-accent" size={24} />, title: "Zero-Knowledge Attestation", desc: "Generates signed cryptographic tokens (PQC-ready NaCl box signatures) validating score bands without exposing raw ledger data." },
    { icon: <MessageSquare className="text-purple-light" size={24} />, title: "Vernacular Voice Diaries", desc: "Evaluates weekly check-ins via local OpenAI Whisper audio transcription and NLP sentiment modeling to build behavioral trust." },
    { icon: <Zap className="text-accent" size={24} />, title: "OCEN Marketplace Integration", desc: "Builds structured loan offers using the official OCEN 4.0 format to connect MSMEs directly with competitive lenders." },
    { icon: <CloudLightning className="text-warning-light" size={24} />, title: "Climate Resilience Scorer", desc: "Cross-references IMD climate risk databases, granting antifragility bonuses to businesses that survived and rebounded from weather events." },
    { icon: <Landmark className="text-purple-light" size={24} />, title: "Alternate Signals", desc: "Extracts growth proxies from ONDC seller performance, DISCOM electricity consumption meters, and DigiLocker skills certificates." },
    { icon: <Shield className="text-accent" size={24} />, title: "Drift Monitoring", desc: "Constantly monitors MSME feature drift, identifying UPGRADE opportunities or sending early risk warnings to underwriters." }
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 relative mt-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-xs font-semibold mb-6 animate-pulse-slow">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
          AI-driven credit intelligence for India's invisible sectors
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight font-display mb-6">
          Credit for Every MSME — Based on Who You Are
        </h1>
        <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
          CREDEX bridges the Credit Gap by scoring invisible MSMEs relative to micro-cohorts, utilizing GST/UPI/EPFO streams, climate resilience indices, and alternate trust proxies.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button 
            onClick={() => onNavigate('onboard')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/15 group"
          >
            Check Business Health <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => onNavigate('bank')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary-light border border-white/5 text-gray-200 font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            Bank Underwriter Portal <Landmark size={18} />
          </button>
        </div>
      </section>

      {/* Stats row */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-primary-light/35 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl font-extrabold text-white font-display tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 font-semibold mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            How The Scoring Works
          </h2>
          <p className="text-gray-400 text-sm mt-1.5">
            Empowering credit-invisible merchants in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflow.map((w, idx) => (
            <div key={idx} className="glass-panel p-6 border border-white/5 hover:border-white/10 transition-all duration-300">
              <div className="text-4xl font-extrabold text-accent/25 font-display block mb-3">
                {w.step}
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {w.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {w.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            Platform Capabilities
          </h2>
          <p className="text-gray-400 text-sm mt-1.5">
            Engineered to analyze, verify, and secure credit assessments
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-primary-light/25 hover:bg-primary-light/40 hover:border-white/10 backdrop-blur-sm transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary-dark/50 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 font-display">
                {f.title}
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
