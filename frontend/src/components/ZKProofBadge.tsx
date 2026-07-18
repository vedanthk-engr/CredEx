import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';
import { scoringApi } from '../lib/api';

interface ZKProofBadgeProps {
  token?: string;
  msmeId: string;
}

export const ZKProofBadge: React.FC<ZKProofBadgeProps> = ({ token, msmeId }) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  if (!token) return null;

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await scoringApi.verifyZKProof(token);
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyResult({ valid: false, error: err.response?.data?.detail || 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4 relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple-light border border-purple-light/20">
            <ShieldCheck size={22} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-gray-100 text-sm font-bold flex items-center gap-1.5">
              ZK Proof Attestation
              <span className="px-1.5 py-0.5 rounded bg-purple/25 text-purple-light text-[9px] uppercase tracking-wider font-bold">
                PQC Secured
              </span>
            </h4>
            <p className="text-gray-400 text-xs mt-0.5">
              Score verified · Valid for 30 days · No raw data shared
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1.5 rounded-lg border border-purple-light/30 text-purple-light text-xs font-semibold hover:bg-purple/10 transition-colors"
          >
            {showDetails ? 'Hide details' : 'Inspect'}
          </button>
          
          <a
            href={`http://localhost:8000/api/zk/verify/${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-purple text-white text-xs font-bold hover:bg-purple-light transition-colors flex items-center gap-1 shadow-md shadow-purple/10"
          >
            Verify <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-purple-light/10 text-xs relative z-10">
          <div className="flex items-center justify-between gap-2 mb-2 bg-primary-dark/50 p-2.5 rounded-lg border border-white/5">
            <span className="text-gray-400 font-mono select-all truncate max-w-[250px] sm:max-w-md">
              {token}
            </span>
            <button 
              onClick={copyToken}
              className="text-purple-light hover:text-white p-1 rounded hover:bg-purple/10 transition-colors flex-shrink-0"
              title="Copy token"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <button 
              onClick={handleVerify}
              disabled={verifying}
              className="px-3 py-1.5 rounded bg-primary-light border border-white/5 text-gray-200 text-xs font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying signature...' : 'Run local signature check'}
            </button>

            {verifyResult && (
              <div className={`p-2 rounded border flex-grow ${verifyResult.valid ? 'bg-accent/10 border-accent/20 text-accent-light' : 'bg-danger/10 border-danger/20 text-danger-light'}`}>
                {verifyResult.valid ? (
                  <div>
                    <strong>Valid Certificate:</strong> Band: <span className="font-bold uppercase">{verifyResult.percentile_band}</span> | Cohort: {verifyResult.cohort}
                  </div>
                ) : (
                  <div>
                    <strong>Verification Failed:</strong> {verifyResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
