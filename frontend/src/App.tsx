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
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0A1628]/85 border-b border-white/5 backdrop-blur-md transition-all select-none">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => navigateTo('landing')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white border border-accent-light/20 shadow-md shadow-accent/10 transition-transform group-hover:scale-105">
              <Building size={16} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-display">
              Cred<span className="text-accent">Ex</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-gray-400">
            <button 
              onClick={() => navigateTo('landing')}
              className={`hover:text-white transition-colors flex items-center gap-1.5 ${currentPage === 'landing' ? 'text-white' : ''}`}
            >
              <Home size={13} /> Home
            </button>
            
            {msmeId && (
              <>
                <button 
                  onClick={() => navigateTo('dashboard')}
                  className={`hover:text-white transition-colors flex items-center gap-1.5 ${currentPage === 'dashboard' ? 'text-white' : ''}`}
                >
                  <Building size={13} /> Overview
                </button>
                <button 
                  onClick={() => navigateTo('ledger')}
                  className={`hover:text-white transition-colors flex items-center gap-1.5 ${currentPage === 'ledger' ? 'text-white' : ''}`}
                >
                  <BarChart3 size={13} /> GST Trends
                </button>
                <button 
                  onClick={() => navigateTo('signals')}
                  className={`hover:text-white transition-colors flex items-center gap-1.5 ${currentPage === 'signals' ? 'text-white' : ''}`}
                >
                  <Sparkles size={13} /> Signals
                </button>
                <button 
                  onClick={() => navigateTo('network')}
                  className={`hover:text-white transition-colors flex items-center gap-1.5 ${currentPage === 'network' ? 'text-white' : ''}`}
                >
                  <Network size={13} /> Network
                </button>
                <button 
                  onClick={() => navigateTo('voice')}
                  className={`hover:text-white transition-colors flex items-center gap-1.5 ${currentPage === 'voice' ? 'text-white' : ''}`}
                >
                  <MessageSquare size={13} /> Voice Diary
                </button>
                <button 
                  onClick={() => navigateTo('roadmap')}
                  className={`hover:text-white transition-colors flex items-center gap-1.5 ${currentPage === 'roadmap' ? 'text-white' : ''}`}
                >
                  <ClipboardList size={13} /> Roadmap
                </button>
                <button 
                  onClick={() => navigateTo('market')}
                  className={`hover:text-white transition-colors flex items-center gap-1.5 ${currentPage === 'market' ? 'text-white' : ''}`}
                >
                  <Landmark size={13} /> OCEN Marketplace
                </button>
              </>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {currentPage !== 'bank' ? (
              <button 
                onClick={() => navigateTo('bank')}
                className="px-3.5 py-2 rounded-xl bg-primary-light border border-white/5 text-gray-200 text-xs font-bold hover:bg-white/5 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Landmark size={14} /> Underwriter
              </button>
            ) : (
              <button 
                onClick={() => navigateTo(msmeId ? 'dashboard' : 'onboard')}
                className="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-light transition-all flex items-center gap-1.5 shadow-lg shadow-accent/15"
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
      <footer className="border-t border-white/5 py-6 bg-primary-dark/30 text-center text-xs text-gray-500 font-semibold mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CREDEX Technologies. Underwriter-ready credit assessment.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300">Privacy Registry</a>
            <a href="#" className="hover:text-gray-300">AA Terms</a>
            <a href="#" className="hover:text-gray-300">OCEN Sandbox</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
