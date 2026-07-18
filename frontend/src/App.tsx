import React, { useState } from 'react';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Roadmap } from './pages/Roadmap';
import { VoiceDiary } from './pages/VoiceDiary';
import { NetworkGraph } from './pages/NetworkGraph';
import { BankDashboard } from './pages/BankDashboard';
import { LedgerTrends } from './pages/LedgerTrends';
import { SignalHub } from './pages/SignalHub';
import { Marketplace } from './pages/Marketplace';
import { ZkVerifier } from './pages/ZkVerifier';
import { DevConsole } from './pages/DevConsole';
import { 
  Building, Home, BarChart3, Sparkles, Network, MessageSquare, 
  ClipboardList, Landmark, ArrowLeftRight, Menu, X, ChevronDown, 
  Check, ShieldCheck, Activity, LogOut
} from 'lucide-react';

type Page = 'landing' | 'onboard' | 'dashboard' | 'ledger' | 'signals' | 'network' | 'voice' | 'roadmap' | 'market' | 'verifier' | 'developer' | 'bank';

export const DEMO_PROFILES = [
  { id: 'DEMO_01', name: "Priya's Fresh Kitchen", sector: "Food Services & QSR", tier: "Tier 2", location: "Coimbatore, TN", score: 72, risk: "Low", connections: ["GST", "UPI", "EPFO", "WhatsApp"] },
  { id: 'DEMO_02', name: "Ram Auto Parts", sector: "Auto Components", tier: "Tier 2", location: "Surat, Gujarat", score: 58, risk: "Medium", connections: ["GST", "UPI", "EPFO"] },
  { id: 'DEMO_03', name: "Meena Textiles", sector: "Textile Manufacturing", tier: "Tier 2", location: "Tirupur, TN", score: 81, risk: "Low", connections: ["GST", "UPI", "Skills"] },
  { id: 'DEMO_04', name: "Singh Cold Chain", sector: "Cold Storage & Logistics", tier: "Tier 2", location: "Ludhiana, Punjab", score: 34, risk: "High", connections: ["GST", "UPI"] },
  { id: 'DEMO_05', name: "Kavya Diagnostics", sector: "Healthcare Services", tier: "Tier 1", location: "Bangalore, KA", score: 65, risk: "Low", connections: ["GST", "UPI", "EPFO"] },
  { id: 'DEMO_06', name: "Arjun Agro Inputs", sector: "Agri Retail & Inputs", tier: "Tier 2", location: "Nashik, MH", score: 44, risk: "Medium", connections: ["GST", "UPI"] },
  { id: 'DEMO_07', name: "Ravi Electronics Hub", sector: "Electronics Retail", tier: "Tier 1", location: "Chennai, TN", score: 76, risk: "Low", connections: ["GST", "UPI", "ONDC"] },
  { id: 'DEMO_08', name: "Fatima Garments", sector: "Apparel Manufacturing", tier: "Tier 1", location: "Hyderabad, TS", score: 61, risk: "Medium", connections: ["GST", "UPI", "Skills"] },
  { id: 'DEMO_09', name: "Kiran Pharma Depot", sector: "Pharma Wholesale", tier: "Tier 1", location: "Pune, MH", score: 88, risk: "Low", connections: ["GST", "UPI", "EPFO", "WhatsApp"] },
  { id: 'DEMO_10', name: "Suresh Bricks & Tiles", sector: "Construction Materials", tier: "Tier 2", location: "Jaipur, RJ", score: 28, risk: "High", connections: ["GST", "UPI", "EPFO"] },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [msmeId, setMsmeId] = useState<string>('DEMO_01');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOnboardingComplete = (id: string) => {
    setMsmeId(id);
    navigateTo('dashboard');
  };

  const handleInspectMsme = (id: string) => {
    setMsmeId(id);
    navigateTo('dashboard');
  };

  const currentProfile = DEMO_PROFILES.find(p => p.id === msmeId) || DEMO_PROFILES[0];

  const handleCopyZK = () => {
    navigator.clipboard.writeText(`eyJhY2Nlc3MiOiJ6ay1wcm9vZiIsIm1zbWVfaWQiOiI2MzZmMjNlOSIsImhhc2giOiIweDkyYWYzZDU4YSIsImNvbXBsaWFuY2UiOnRydWV9.${msmeId}.credex_attestation_signature_sha256`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onNavigate={(p) => navigateTo(p as Page)} />;
      case 'onboard':
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case 'dashboard':
        return <Dashboard msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'ledger':
        return <LedgerTrends msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'signals':
        return <SignalHub msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'network':
        return <NetworkGraph msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'voice':
        return <VoiceDiary msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'roadmap':
        return <Roadmap msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'market':
        return <Marketplace msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'verifier':
        return <ZkVerifier msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'developer':
        return <DevConsole msmeId={msmeId} onNavigate={(p) => navigateTo(p as Page)} />;
      case 'bank':
        return <BankDashboard onInspect={handleInspectMsme} onNavigate={(p) => navigateTo(p as Page)} />;
      default:
        return <Landing onNavigate={(p) => navigateTo(p as Page)} />;
    }
  };

  // Determine if we should show the Workspace layout
  const isWorkspace = ['dashboard', 'ledger', 'signals', 'network', 'voice', 'roadmap', 'market', 'verifier', 'developer', 'bank'].includes(currentPage);
  const isBankView = currentPage === 'bank';

  // Navigation Links for MSME Workspace
  const msmeNavItems = [
    { page: 'dashboard', label: 'Overview', desc: 'Core Credit Assessment', icon: <Building size={16} /> },
    { page: 'ledger', label: 'GST Trends', desc: 'Decompose seasonality', icon: <BarChart3 size={16} /> },
    { page: 'signals', label: 'Signal Hub', desc: 'Alternative indicators', icon: <Sparkles size={16} /> },
    { page: 'network', label: 'Network Graph', desc: 'Supplier/buyer mapping', icon: <Network size={16} /> },
    { page: 'voice', label: 'Voice Diary', desc: 'Weekly speech check-in', icon: <MessageSquare size={16} /> },
    { page: 'roadmap', label: 'Roadmap & Simulator', desc: 'Metric limits calculator', icon: <ClipboardList size={16} /> },
    { page: 'market', label: 'Marketplace', desc: 'OCEN dynamic loan bids', icon: <Landmark size={16} /> },
    { page: 'verifier', label: 'ZK Verifier', desc: 'Validate attestation claims', icon: <ShieldCheck size={16} /> },
    { page: 'developer', label: 'Dev Console', desc: 'Telemetry & genetic drift', icon: <Activity size={16} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-neutral-100 font-sans antialiased selection:bg-white/10 selection:text-white">
      
      {/* ── TOP NAV BAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-black/80 border-b border-white/[0.06] backdrop-blur-md select-none">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => navigateTo('landing')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] transition-all group-hover:scale-105">
              <Building size={16} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-display">
              Cred<span className="text-white opacity-50">Ex</span>
            </span>
            {isWorkspace && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Portal
              </span>
            )}
          </div>

          {/* Navigation Links for Non-Workspace / Landing */}
          {!isWorkspace && (
            <nav className="flex items-center gap-6 text-xs font-bold text-neutral-400">
              <button onClick={() => navigateTo('landing')} className={`hover:text-white transition-colors ${currentPage === 'landing' ? 'text-white' : ''}`}>
                Home
              </button>
              <button onClick={() => navigateTo('onboard')} className={`hover:text-white transition-colors ${currentPage === 'onboard' ? 'text-white' : ''}`}>
                Link Account
              </button>
            </nav>
          )}

          {/* Mobile Workspace Menu Toggle */}
          {isWorkspace && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white border border-white/10 rounded-xl bg-neutral-900"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          {/* Top Right Action Button */}
          <div className="flex items-center gap-3">
            {!isBankView ? (
              <button 
                onClick={() => navigateTo('bank')}
                className="btn-secondary flex items-center gap-1.5 px-4 py-2 hover:bg-white/[0.06] hover:text-white"
              >
                <Landmark size={14} /> Underwriter Mode
              </button>
            ) : (
              <button 
                onClick={() => navigateTo('dashboard')}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 shadow-glow-sm"
              >
                <ArrowLeftRight size={14} /> MSME Dashboard
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ── WORKSPACE OR GENERAL CONTAINER ───────────────────── */}
      {isWorkspace ? (
        <div className="flex-grow flex w-full max-w-[1400px] mx-auto min-h-[calc(100vh-64px)] relative">
          
          {/* 1. LEFT SIDEBAR NAVIGATION */}
          <aside className={`
            fixed inset-y-16 left-0 z-40 w-68 bg-black border-r border-white/[0.06] flex flex-col justify-between py-6 px-4 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-auto lg:z-auto lg:w-68
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="space-y-6">

              {/* A. WORKSPACE SWITCHER / PROFILE HUD */}
              {!isBankView ? (
                <div className="space-y-4">
                  
                  {/* Dropdown switch Selector */}
                  <div className="relative">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                      Active Business Profile
                    </label>
                    <button 
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c0c0c] hover:bg-[#121212] transition-colors text-left"
                    >
                      <div className="truncate">
                        <strong className="text-xs text-white block truncate">{currentProfile.name}</strong>
                        <span className="text-[10px] text-neutral-500 block truncate">{currentProfile.sector}</span>
                      </div>
                      <ChevronDown size={14} className="text-neutral-500 flex-shrink-0" />
                    </button>

                    {/* Switcher dropdown box */}
                    {profileDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto select-none py-1.5 scrollbar-thin">
                        <div className="px-3 py-1.5 text-[9px] font-bold text-neutral-500 uppercase tracking-wider border-b border-white/[0.06]">Select Account</div>
                        {DEMO_PROFILES.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setMsmeId(p.id);
                              setProfileDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-white/[0.04] transition-colors flex flex-col ${p.id === msmeId ? 'bg-white/[0.03]' : ''}`}
                          >
                            <span className="text-xs font-bold text-white flex items-center justify-between gap-1">
                              {p.name}
                              {p.id === msmeId && <Check size={12} className="text-white" />}
                            </span>
                            <span className="text-[10px] text-neutral-500">{p.sector} · {p.tier}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* HUD Profile details */}
                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#060606] space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-neutral-500 font-semibold">
                      <span>Percentile Rating</span>
                      <span className="text-white font-bold">{currentProfile.score}th</span>
                    </div>
                    {/* Progress score */}
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${currentProfile.score}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-neutral-500">Risk Profile:</span>
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wide
                        ${currentProfile.risk === 'Low' ? 'bg-white/10 text-white' : currentProfile.risk === 'Medium' ? 'bg-neutral-800 text-neutral-300' : 'bg-[#1a1a1a] text-neutral-400 border border-white/10'}
                      `}>
                        {currentProfile.risk}
                      </span>
                    </div>
                    {/* Connected Registry Chips */}
                    <div className="pt-2 flex flex-wrap gap-1">
                      {currentProfile.connections.map((c) => (
                        <span key={c} className="text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-white/15 bg-white/[0.03] text-neutral-400 uppercase">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* B. BANK PORTFOLIO SELECTOR */
                <div className="space-y-4">
                  <div className="pb-1 border-b border-white/[0.06]">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Underwriter Hub</span>
                    <strong className="text-xs text-white block mt-1">Inspecting Portfolio</strong>
                  </div>

                  {/* Portfolio list to fast inspect */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-2 px-1">Registered Borrowers</span>
                    {DEMO_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setMsmeId(p.id);
                          navigateTo('dashboard');
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition-colors hover:bg-white/[0.04] flex items-center justify-between gap-1 border border-transparent ${p.id === msmeId ? 'bg-white/[0.05] border-white/10' : ''}`}
                      >
                        <div className="truncate">
                          <strong className="text-[11px] text-white block truncate font-medium">{p.name}</strong>
                          <span className="text-[9px] text-neutral-500 block truncate">{p.sector}</span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1 rounded flex-shrink-0 ${p.score >= 70 ? 'text-white' : p.score >= 50 ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {p.score}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* C. NAVIGATION LINKS */}
              {!isBankView && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2 px-2">Navigation</span>
                  {msmeNavItems.map((item) => (
                    <button
                      key={item.page}
                      onClick={() => navigateTo(item.page as Page)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group
                        ${currentPage === item.page ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'}
                      `}
                    >
                      <span className={`${currentPage === item.page ? 'text-black' : 'text-neutral-500 group-hover:text-white'} flex-shrink-0`}>
                        {item.icon}
                      </span>
                      <div className="leading-tight">
                        <span className="text-xs block">{item.label}</span>
                        <span className={`text-[9px] block ${currentPage === item.page ? 'text-black/60' : 'text-neutral-500'}`}>
                          {item.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* D. ATTESTATION & ZK STATUS CARD */}
            {!isBankView && (
              <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-3.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-white" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-white">ZK Cryptographic Proof</span>
                  </div>
                  <code className="text-[9px] font-mono text-neutral-500 block truncate">
                    HASH: 0x{msmeId.charCodeAt(0).toString(16)}e9b2e048a1c...
                  </code>
                  <button 
                    onClick={handleCopyZK}
                    className="w-full py-1.5 rounded-lg bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-[10px] font-bold text-neutral-300 transition-colors flex items-center justify-center gap-1"
                  >
                    {copied ? 'Attestation Copied!' : 'Copy ZK Proof Token'}
                  </button>
                </div>

                <button 
                  onClick={() => navigateTo('landing')}
                  className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-neutral-500 hover:text-neutral-300 py-1"
                >
                  <LogOut size={11} /> Return to Home
                </button>
              </div>
            )}
          </aside>

          {/* 2. MAIN WORKSPACE CONTENT */}
          <main className="flex-grow min-w-0 p-4 sm:p-6 lg:p-8 mt-2">
            {renderPage()}
          </main>

        </div>
      ) : (
        /* ── NON-WORKSPACE / FULL WIDTH LAYOUT (Landing & Onboarding) ── */
        <main className="flex-grow">
          {renderPage()}
        </main>
      )}

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-6 bg-black text-center text-xs text-neutral-600 font-semibold mt-auto select-none">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CREDEX Technologies · India's Consent-Based Credit Infrastructure</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-neutral-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">Consent Registry</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">OCEN 4.0 Sandbox</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
