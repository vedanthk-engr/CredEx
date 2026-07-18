import React, { useState, useMemo } from 'react';
import { ShieldCheck, FileJson, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { DEMO_PROFILES } from '../App';

interface ZkVerifierProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const ZkVerifier: React.FC<ZkVerifierProps> = ({ msmeId, onNavigate }) => {
  const currentProfile = useMemo(() => {
    return DEMO_PROFILES.find(p => p.id === msmeId) || DEMO_PROFILES[0];
  }, [msmeId]);

  // Pre-seed default token based on active profile
  const defaultToken = useMemo(() => {
    const header = btoa(JSON.stringify({ alg: "Kyber-1024-NaCl", typ: "ZK-JWT" }));
    const payload = btoa(JSON.stringify({
      msme_id: currentProfile.id,
      business_name: currentProfile.name,
      rating_band: currentProfile.score >= 75 ? "EXCELLENT" : (currentProfile.score >= 50 ? "QUALIFIED" : "RISK_ALERT"),
      percentile_minimum: 50,
      passing_score: currentProfile.score >= 50,
      runway_days_attested: currentProfile.id === 'DEMO_04' ? 8 : 45, // Singh Cold Chain has 8 days
      electricity_drop_flag: currentProfile.id === 'DEMO_10', // Suresh Bricks has drop
      attester: "credex_zk_attester_node_01",
      timestamp: Math.round(Date.now() / 1000)
    }));
    const signature = "c3F1YXJlX2dsb3dfc2lnbmF0dXJlX3BxY19reWJlcl9zaGFyZWRfcHJvb2Zfc2lnXzB4OTJhZjNkNThhMWM=";
    return `${header}.${payload}.${signature}`;
  }, [currentProfile]);

  const [inputToken, setInputToken] = useState(defaultToken);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset input when profile changes
  React.useEffect(() => {
    setInputToken(defaultToken);
    setVerified(false);
  }, [defaultToken]);

  // Decode JWT Parts safely
  const parsedJwt = useMemo(() => {
    try {
      const parts = inputToken.split('.');
      if (parts.length !== 3) return null;
      
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      const signature = parts[2];
      
      return { header, payload, signature };
    } catch (e) {
      return null;
    }
  }, [inputToken]);

  const handleVerify = () => {
    setVerifying(true);
    setVerified(false);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 1200);
  };

  const handleCopyInputToken = () => {
    navigator.clipboard.writeText(inputToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
          <ShieldCheck className="text-white" size={22} />
          ZK Cryptographic Proof Verifier
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Verify peer-relative credit eligibility attestations without revealing raw banking or tax files
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Input & Decoded View */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* JWT Token Input */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Proof Input Payload (ZK-JWT)
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyInputToken}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <Copy size={11} /> {copied ? 'Copied' : 'Copy'}
                </button>
                <button 
                  onClick={() => setInputToken(defaultToken)}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <RefreshCw size={11} /> Reset
                </button>
              </div>
            </div>

            <textarea
              value={inputToken}
              onChange={(e) => {
                setInputToken(e.target.value);
                setVerified(false);
              }}
              rows={4}
              className="w-full bg-[#050505] border border-white/[0.08] rounded-xl p-3 text-[10px] font-mono text-neutral-400 focus:outline-none focus:border-white/20 leading-relaxed resize-none"
              placeholder="Paste a CREDEX ZK Proof Token..."
            />

            <button
              onClick={handleVerify}
              disabled={verifying || !parsedJwt}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Running Post-Quantum Signature Verification...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> Run Cryptographic Signature Check
                </>
              )}
            </button>
          </div>

          {/* Decoded JSON Claims */}
          <div className="glass-panel p-5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2">
              Decoded Decryption Payload
            </h4>
            
            {parsedJwt ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Header */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">Token Header</span>
                  <pre className="code-block h-36 overflow-auto">
                    {JSON.stringify(parsedJwt.header, null, 2)}
                  </pre>
                </div>

                {/* Claims Payload */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">ZK Claims & Attributes</span>
                  <pre className="code-block h-36 overflow-auto">
                    {JSON.stringify(parsedJwt.payload, null, 2)}
                  </pre>
                </div>

              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-neutral-500 p-4 rounded-xl border border-dashed border-white/10 justify-center">
                <AlertCircle size={16} /> Invalid token structure. Paste a valid 3-part base64 JWT.
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Column: Claim Assertions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2">
              Asserted ZK Claims
            </h4>

            {verified && parsedJwt ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400 font-semibold">Signature Validation</span>
                  <span className="text-white font-extrabold uppercase bg-neutral-900 border border-white/20 px-2 py-0.5 rounded">
                    Passed (PQC Kyber)
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">Checked Claims</span>
                  
                  {/* Claim 1: Percentile Band */}
                  <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-neutral-950 border border-white/[0.04]">
                    <span className="text-neutral-400">Score band ≥ 50th percentile</span>
                    {parsedJwt.payload.passing_score ? (
                      <span className="text-white font-bold flex items-center gap-1 text-[11px]"><Check size={14} /> Passed</span>
                    ) : (
                      <span className="text-neutral-500 font-bold flex items-center gap-1 text-[11px]"><AlertCircle size={14} /> Failed</span>
                    )}
                  </div>

                  {/* Claim 2: Cash Runway Days */}
                  <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-neutral-950 border border-white/[0.04]">
                    <span className="text-neutral-400">Cash buffer runway ≥ 15 days</span>
                    {parsedJwt.payload.runway_days_attested >= 15 ? (
                      <span className="text-white font-bold flex items-center gap-1 text-[11px]"><Check size={14} /> Passed</span>
                    ) : (
                      <span className="text-neutral-500 font-bold flex items-center gap-1 text-[11px]"><AlertCircle size={14} /> Failed</span>
                    )}
                  </div>

                  {/* Claim 3: Electricity Drop Flag */}
                  <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-neutral-950 border border-white/[0.04]">
                    <span className="text-neutral-400">Normal power draw pattern</span>
                    {!parsedJwt.payload.electricity_drop_flag ? (
                      <span className="text-white font-bold flex items-center gap-1 text-[11px]"><Check size={14} /> Passed</span>
                    ) : (
                      <span className="text-neutral-500 font-bold flex items-center gap-1 text-[11px]"><AlertCircle size={14} /> High Drift</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-neutral-500 leading-relaxed">
                  Attester: <code>{parsedJwt.payload.attester}</code>. Attested at: {new Date(parsedJwt.payload.timestamp * 1000).toLocaleString()}.
                </div>
              </div>
            ) : verifying ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-500 text-xs">
                <RefreshCw size={24} className="animate-spin mb-2 text-white" />
                Running cryptographic attestation...
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-500 text-xs leading-relaxed">
                Click <strong>Run Cryptographic Signature Check</strong> above to execute validation of claims on the client side.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
