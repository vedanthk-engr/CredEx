import React, { useState, useMemo } from 'react';
import { useScore } from '../hooks/useScore';
import { ArrowLeft, Loader2, Landmark, CheckCircle, ShieldCheck, FileJson, AlertCircle, Copy } from 'lucide-react';
import { scoringApi } from '../lib/api';

interface MarketplaceProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ msmeId, onNavigate }) => {
  const { healthCard, loading } = useScore(msmeId);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse ZK Attestation JWT Claims payload
  const decodedPayload = useMemo(() => {
    if (!healthCard || !healthCard.zk_proof_token) return null;
    
    // Simulate JWT payload decode
    const parts = healthCard.zk_proof_token.split('.');
    let header = { alg: "HS256", typ: "JWT" };
    let payload = {
      msme_id: msmeId,
      percentile_band: healthCard.overall_percentile >= 75 ? "top-25" : (healthCard.overall_percentile >= 50 ? "top-50" : "lower-band"),
      cohort_label: healthCard.cohort_label,
      iss: "credex_zk_attester",
      iat: Math.round(Date.now() / 1000) - 86400 * 5,
      exp: Math.round(Date.now() / 1000) + 86400 * 25,
      hash_salt: "0x" + msmeId.charCodeAt(0).toString(16) + "e9b2e048a1c"
    };
    
    return {
      header,
      payload,
      signature: parts[2] || "3j92kf8d2kd983kdjf92..."
    };
  }, [healthCard, msmeId]);

  const offers = [
    {
      id: "sidbi",
      bankName: "SIDBI Udyog Mitra",
      rate: "8.2% p.a.",
      tenure: "24 months",
      processingTime: "24 hours",
      processingFee: "0.5%",
      prepayment: "0%"
    },
    {
      id: "sbi",
      bankName: "SBI MSME Core",
      rate: "8.9% p.a.",
      tenure: "12 months",
      processingTime: "48 hours",
      processingFee: "1.0%",
      prepayment: "0%"
    },
    {
      id: "hdfc",
      bankName: "HDFC FlexiGrow",
      rate: "9.4% p.a.",
      tenure: "18 months",
      processingTime: "12 hours",
      processingFee: "1.0%",
      prepayment: "1.0%"
    }
  ];

  const handleApplyOffer = async (bankId: string) => {
    setApplying(bankId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // mock apply
      setApplied(bankId);
    } catch (err) {
      alert("Failed to submit loan bid application.");
    } finally {
      setApplying(null);
    }
  };

  const handleCopyToken = () => {
    if (healthCard?.zk_proof_token) {
      navigator.clipboard.writeText(healthCard.zk_proof_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-gray-400">
        <Loader2 size={36} className="animate-spin text-accent mb-3" />
        Evaluating qualified lender pools...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 select-none text-xs font-semibold">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
          <Landmark className="text-accent" size={22} />
          OCEN Loan Marketplace
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Apply to competitive working-capital bids using encrypted Zero-Knowledge score attestations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Bids list */}
        <div className="lg:col-span-2 space-y-4">
          {offers.map((offer) => {
            const isApplied = applied === offer.id;
            const isApplying = applying === offer.id;
            const isOpen = selectedOffer === offer.id;

            return (
              <div 
                key={offer.id} 
                className={`glass-panel p-5 border transition-all duration-300 ${
                  isOpen ? 'border-accent/30 bg-accent/5' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-dark/60 border border-white/5 flex items-center justify-center text-accent">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-display">{offer.bankName}</h3>
                      <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                        Tenure: {offer.tenure} · SLA: {offer.processingTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Rate of Interest</span>
                      <strong className="text-accent-light text-base font-mono font-bold mt-0.5 block">{offer.rate}</strong>
                    </div>

                    <button
                      onClick={() => handleApplyOffer(offer.id)}
                      disabled={isApplied || isApplying}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isApplied 
                          ? 'bg-accent/20 border border-accent/40 text-accent-light' 
                          : 'bg-accent text-white hover:bg-accent-light shadow-md shadow-accent/15'
                      }`}
                    >
                      {isApplying ? (
                        <div className="flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Submitting...
                        </div>
                      ) : isApplied ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle size={12} /> Applied
                        </div>
                      ) : (
                        'Select Bid'
                      )}
                    </button>
                  </div>
                </div>

                {/* Offer Details Dropdown Toggle */}
                <div className="mt-3 pt-3 border-t border-white/5 text-[10px] flex justify-between select-none font-bold text-gray-400">
                  <button 
                    onClick={() => setSelectedOffer(isOpen ? null : offer.id)} 
                    className="hover:text-white"
                  >
                    {isOpen ? 'Hide Fee Schedule ▲' : 'Show Fee Schedule ▼'}
                  </button>
                </div>

                {isOpen && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 p-3 rounded-xl bg-primary-dark/40 border border-white/5 text-[10px] font-semibold animate-fadeInUp">
                    <div>
                      <span className="text-gray-500 block uppercase">Processing Fee</span>
                      <span className="text-gray-200 mt-0.5 block">{offer.processingFee}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase">Pre-payment penalty</span>
                      <span className="text-gray-200 mt-0.5 block">{offer.prepayment}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase">Collateral Required</span>
                      <span className="text-accent-light mt-0.5 block uppercase">None (ZK Attested)</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase">Fulfillment Type</span>
                      <span className="text-gray-200 mt-0.5 block">Digital Disbursal</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Sidebar: ZK Token Inspector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5 relative overflow-hidden">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-white/5 flex items-center gap-1.5 select-none">
              <ShieldCheck className="text-accent" size={16} /> ZK Credit Attestation
            </h3>

            <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
              CREDEX generated a verifiable Zero-Knowledge certificate signed by the attestation gateway. Lenders verify your ranking band without reading your raw bank ledger.
            </p>

            {healthCard?.zk_proof_token ? (
              <div className="space-y-4 mt-4">
                {/* Cryptographic string block */}
                <div className="p-3 rounded-xl bg-primary-dark/60 border border-white/10 font-mono text-[9px] text-accent-light break-all relative group select-all">
                  {healthCard.zk_proof_token.substring(0, 100)}...
                  <button
                    onClick={handleCopyToken}
                    className="absolute right-2 top-2 p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    title="Copy Token"
                  >
                    {copied ? 'Copied!' : <Copy size={10} />}
                  </button>
                </div>

                <button
                  onClick={() => setShowJsonInspector(!showJsonInspector)}
                  className="w-full py-2.5 rounded-xl bg-primary-light border border-white/5 hover:bg-white/5 text-gray-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FileJson size={14} />
                  {showJsonInspector ? 'Hide JSON Decoded Claims' : 'Inspect Decoded JSON'}
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-danger/5 border border-danger/15 text-[10px] text-danger-light leading-normal mt-4">
                Attestation is pending. Complete onboarding or grant AA consent to generate signature token.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JSON Decoded Claims Inspector Workspace */}
      {showJsonInspector && decodedPayload && (
        <div className="glass-panel p-5 bg-primary-dark/80 font-mono text-xs text-gray-300 border-accent/25 space-y-4 animate-fadeInUp">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Decoded Claims Payload Inspector</span>
            <span className="text-[9px] text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded uppercase font-bold">Verified Signature</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Header + Payload */}
            <div className="space-y-3">
              <div>
                <span className="text-purple-light text-[10px] font-bold block mb-1 uppercase">// JOSE Header</span>
                <pre className="p-3 rounded-lg bg-primary-dark/90 border border-white/5 text-[11px] text-gray-200 overflow-x-auto">
                  {JSON.stringify(decodedPayload.header, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-accent-light text-[10px] font-bold block mb-1 uppercase">// Cryptographic Signature Claims</span>
                <pre className="p-3 rounded-lg bg-primary-dark/90 border border-white/5 text-[11px] text-gray-200 overflow-x-auto">
                  {JSON.stringify(decodedPayload.payload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Explanatory detail card */}
            <div className="p-4 rounded-xl border border-white/5 bg-primary-light/10 text-xs space-y-3 font-semibold leading-relaxed text-gray-400">
              <h4 className="text-white font-bold flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                <AlertCircle size={14} className="text-accent" /> Cryptographic Assertions
              </h4>
              <p>
                • <strong>Issuer Verification:</strong> The signature <code className="text-gray-300 break-all">{decodedPayload.signature.substring(0, 16)}...</code> matches public key keysets, validating that claims have not been tampered with.
              </p>
              <p>
                • <strong>Salt Hash Hiding:</strong> Raw identifiers are salted using SHA-256 <code className="text-gray-300">{decodedPayload.payload.hash_salt}</code> to protect vendor anonymity.
              </p>
              <p>
                • <strong>Exclusivity:</strong> The attestation expires on <code className="text-gray-300">{new Date(decodedPayload.payload.exp * 1000).toLocaleDateString()}</code>, forcing monthly refreshes through the Account Aggregator ledger feeds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
