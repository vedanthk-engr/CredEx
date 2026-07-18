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
import { Landmark, ArrowLeftRight, Building, Home, Network, MessageSquare, ClipboardList, BarChart3, Sparkles } from 'lucide-react';

type Page = 'landing' | 'onboard' | 'dashboard' | 'ledger' | 'signals' | 'network' | 'voice' | 'roadmap' | 'market' | 'bank';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [msmeId, setMsmeId] = useState<string | null>(null);

  const navigateTo = (page: any) => {
    setCurrentPage(page);
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

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onNavigate={navigateTo} />;
      case 'onboard':
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case 'dashboard':
        return <Dashboard msmeId={msmeId || 'DEMO_01'} onNavigate={navigateTo} />;
      case 'ledger':
        return <LedgerTrends msmeId={msmeId || 'DEMO_01'} onNavigate={navigateTo} />;
      case 'signals':
        return <SignalHub msmeId={msmeId || 'DEMO_01'} onNavigate={navigateTo} />;
      case 'network':
        return <NetworkGraph msmeId={msmeId || 'DEMO_01'} onNavigate={navigateTo} />;
      case 'voice':
        return <VoiceDiary msmeId={msmeId || 'DEMO_09'} onNavigate={navigateTo} />;
      case 'roadmap':
        return <Roadmap msmeId={msmeId || 'DEMO_04'} onNavigate={navigateTo} />;
      case 'market':
        return <Marketplace msmeId={msmeId || 'DEMO_01'} onNavigate={navigateTo} />;
      case 'bank':
        return <BankDashboard onInspect={handleInspectMsme} onNavigate={navigateTo} />;
      default:
        return <Landing onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-black/90 border-b border-white/[0.06] backdrop-blur-xl transition-all select-none">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => navigateTo('landing')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] transition-all group-hover:shadow-[0_0_32px_rgba(255,255,255,0.4)] group-hover:scale-105">
              <Building size={16} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-display">
              Cred<span className="text-white opacity-60">Ex</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button onClick={() => navigateTo('landing')} className={`nav-item ${currentPage === 'landing' ? 'active' : ''}`}>
              <Home size={13} /> Home
            </button>
            {msmeId && (
              <>
                <button onClick={() => navigateTo('dashboard')} className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}>
                  <Building size={13} /> Overview
                </button>
                <button onClick={() => navigateTo('ledger')} className={`nav-item ${currentPage === 'ledger' ? 'active' : ''}`}>
                  <BarChart3 size={13} /> GST Trends
                </button>
                <button onClick={() => navigateTo('signals')} className={`nav-item ${currentPage === 'signals' ? 'active' : ''}`}>
                  <Sparkles size={13} /> Signals
                </button>
                <button onClick={() => navigateTo('network')} className={`nav-item ${currentPage === 'network' ? 'active' : ''}`}>
                  <Network size={13} /> Network
                </button>
                <button onClick={() => navigateTo('voice')} className={`nav-item ${currentPage === 'voice' ? 'active' : ''}`}>
                  <MessageSquare size={13} /> Voice Diary
                </button>
                <button onClick={() => navigateTo('roadmap')} className={`nav-item ${currentPage === 'roadmap' ? 'active' : ''}`}>
                  <ClipboardList size={13} /> Roadmap
                </button>
                <button onClick={() => navigateTo('market')} className={`nav-item ${currentPage === 'market' ? 'active' : ''}`}>
                  <Landmark size={13} /> Marketplace
                </button>
              </>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {currentPage !== 'bank' ? (
              <button 
                onClick={() => navigateTo('bank')}
                className="btn-secondary flex items-center gap-1.5"
              >
                <Landmark size={14} /> Underwriter
              </button>
            ) : (
              <button 
                onClick={() => navigateTo(msmeId ? 'dashboard' : 'onboard')}
                className="btn-primary flex items-center gap-1.5"
              >
                <ArrowLeftRight size={14} /> MSME Mode
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 mt-6">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-6 bg-black text-center text-xs text-neutral-600 font-semibold mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CREDEX Technologies · Underwriter-ready credit intelligence</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-neutral-400 transition-colors">Privacy Registry</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">AA Terms</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">OCEN Sandbox</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
