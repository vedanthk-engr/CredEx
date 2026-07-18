import React, { useState, useEffect, useMemo } from 'react';
import { Activity, ShieldAlert, FileText, Settings, Play, RefreshCw, Cpu, Database } from 'lucide-react';
import { DEMO_PROFILES } from '../App';

interface DevConsoleProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const DevConsole: React.FC<DevConsoleProps> = ({ msmeId, onNavigate }) => {
  const currentProfile = useMemo(() => {
    return DEMO_PROFILES.find(p => p.id === msmeId) || DEMO_PROFILES[0];
  }, [msmeId]);

  const [logs, setLogs] = useState<string[]>([]);
  const [driftStatus, setDriftStatus] = useState<'Normal' | 'Drift Detected' | 'Upgrade Opportunity'>('Normal');
  const [psiScore, setPsiScore] = useState(0.08); // Population Stability Index
  const [kyberDecrypted, setKyberDecrypted] = useState(false);

  // Generate random system metrics based on active profile
  const metrics = useMemo(() => {
    let baseTime = 12 + (msmeId.charCodeAt(msmeId.length - 1) % 5) * 3;
    return {
      apiLatency: `${baseTime}ms`,
      dbQuery: `${(baseTime * 0.4).toFixed(1)}ms`,
      pqcOverhead: `0.78ms`,
      driftKs: currentProfile.score < 40 ? 0.38 : 0.12, // High drift for low scores
    };
  }, [msmeId, currentProfile]);

  // Handle active logs additions
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Simulate logs streaming
  useEffect(() => {
    addLog(`INIT: Dev console listening on telemetry feed.`);
    addLog(`LOAD: Selected profile "${currentProfile.name}" (ID: ${msmeId}).`);
    addLog(`PQC: Loaded Kyber-1024 simulation keyrings.`);
    
    const interval = setInterval(() => {
      const actions = [
        `TELEMETRY: Recalculated KS statistic for micro-cohort cluster [KS=${(0.05 + Math.random() * 0.1).toFixed(3)}].`,
        `DB: Executed async pg query to fetch alternate signals in ${metrics.dbQuery}.`,
        `ML: Scikit-learn scoring engine pipeline execution successful.`,
        `REDIS: Cached score matrices for msme_id=${msmeId} (TTL: 3600s).`,
        `PQC: Decrypted Kyber envelope signature for ZK validation.`,
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      addLog(randomAction);
    }, 4000);

    return () => clearInterval(interval);
  }, [msmeId, currentProfile, metrics]);

  // Adjust telemetry metrics when profile changes
  useEffect(() => {
    if (currentProfile.score < 40) {
      setDriftStatus('Drift Detected');
      setPsiScore(0.24); // High PSI drift
      addLog(`WARNING: Detected genetic features drift! PSI score has crossed warning threshold [PSI=0.24].`);
    } else if (currentProfile.score >= 75) {
      setDriftStatus('Upgrade Opportunity');
      setPsiScore(0.04);
      addLog(`INFO: Score is in top 25th percentile. Generating promotional OCEN limit upgrade path.`);
    } else {
      setDriftStatus('Normal');
      setPsiScore(0.08);
      addLog(`INFO: Stable scoring telemetry. Current drift metric within bounds.`);
    }
  }, [currentProfile]);

  const handleTestDrift = () => {
    setDriftStatus('Drift Detected');
    setPsiScore(0.35);
    addLog(`MANUAL TRIGGER: Simulated high-drift stress event. Alerting underwriter portals.`);
  };

  const handleVerifyKyber = () => {
    setKyberDecrypted(true);
    addLog(`PQC SECURITY: Validated Kyber-1024 cryptographic encapsulation bounds against issuer node.`);
    setTimeout(() => setKyberDecrypted(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
          <Activity className="text-white animate-pulse" size={22} />
          Developer & Underwriter Drift Console
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Monitor Population Stability Index (PSI) drift indicators and platform security telemetry
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Telemetry KPI Cards */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Telemetry metrics */}
          <div className="glass-panel p-5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2">
              System Telemetry
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-neutral-950 border border-white/[0.04] text-xs">
                <span className="text-neutral-500 font-semibold flex items-center gap-1"><Cpu size={12} /> API Latency</span>
                <strong className="text-white font-mono">{metrics.apiLatency}</strong>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-neutral-950 border border-white/[0.04] text-xs">
                <span className="text-neutral-500 font-semibold flex items-center gap-1"><Database size={12} /> DB Query Time</span>
                <strong className="text-white font-mono">{metrics.dbQuery}</strong>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-neutral-950 border border-white/[0.04] text-xs">
                <span className="text-neutral-500 font-semibold flex items-center gap-1"><Activity size={12} /> PSI Score</span>
                <strong className={`font-mono ${psiScore >= 0.2 ? 'text-white underline' : 'text-neutral-400'}`}>{psiScore.toFixed(2)}</strong>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-neutral-950 border border-white/[0.04] text-xs">
                <span className="text-neutral-500 font-semibold flex items-center gap-1"><Settings size={12} /> KS Statistic</span>
                <strong className="text-white font-mono">{metrics.driftKs.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Platform controls */}
          <div className="glass-panel p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2">
              Interactive Test Console
            </h4>

            <button
              onClick={handleTestDrift}
              className="w-full text-xs font-bold py-2.5 px-4 rounded-xl border border-white/10 bg-[#0c0c0c] hover:bg-[#151515] text-neutral-300 transition-colors flex items-center justify-center gap-2"
            >
              <Play size={13} /> Trigger Mock Drift Event
            </button>

            <button
              onClick={handleVerifyKyber}
              disabled={kyberDecrypted}
              className="w-full text-xs font-bold py-2.5 px-4 rounded-xl border border-white/10 bg-[#0c0c0c] hover:bg-[#151515] text-neutral-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={13} className={kyberDecrypted ? 'animate-spin' : ''} />
              {kyberDecrypted ? 'Kyber Bounds Attested!' : 'Verify Kyber-1024 PQC'}
            </button>
          </div>

        </div>

        {/* Right 2 Columns: Live telemetry log streams */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5 space-y-4 flex flex-col h-[350px]">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Audit Logs (Telemetry Streams)
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                ${driftStatus === 'Normal' ? 'bg-white/10 text-white border-white/20' : driftStatus === 'Drift Detected' ? 'bg-neutral-800 text-neutral-400 border-white/10' : 'bg-white/15 text-white border-white/30'}
              `}>
                Drift Status: {driftStatus}
              </span>
            </div>

            <div className="flex-grow overflow-auto bg-[#030303] border border-white/[0.06] rounded-xl p-4 font-mono text-[10px] text-neutral-400 space-y-1.5 scrollbar-thin">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed hover:bg-white/[0.02] py-0.5 rounded">
                  {log.includes('WARNING') ? (
                    <span className="text-white bg-neutral-900 border border-white/20 px-1 py-0.5 rounded mr-1">WARNING</span>
                  ) : log.includes('INFO') ? (
                    <span className="text-neutral-500 font-bold mr-1">INFO</span>
                  ) : null}
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
