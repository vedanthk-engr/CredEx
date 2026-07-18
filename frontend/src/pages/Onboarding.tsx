import React, { useState } from 'react';
import { onboardingApi, signalsApi } from '../lib/api';
import { useSSE } from '../hooks/useSSE';
import { StreamProgress } from '../components/StreamProgress';
import { FileText, ArrowRight, ArrowLeft, ShieldAlert, Sparkles, Building2, UploadCloud, Link } from 'lucide-react';

interface OnboardingProps {
  onComplete: (msmeId: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [msmeId, setMsmeId] = useState<string | null>(null);
  
  // Profile Form state
  const [profile, setProfile] = useState({
    business_name: '',
    nic_code: '47', // default Retail Trade
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    vintage_years: 3.0,
    employee_count: 8,
  });

  // Consent and links state
  const [aaLinked, setAaLinked] = useState(false);
  const [linkingAA, setLinkingAA] = useState(false);
  
  // Interactive FIP / OTP simulator states
  const [fipStep, setFipStep] = useState<'selection' | 'otp'>('selection');
  const [selectedFips, setSelectedFips] = useState<string[]>(["sbi", "gstn"]);
  const [mobileNum, setMobileNum] = useState("9876543210");
  const [otpVal, setOtpVal] = useState("636023");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  // Optional Signals state
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [ondcActive, setOndcActive] = useState(false);
  const [skillsString, setSkillsString] = useState('');
  const [electricityMeter, setElectricityMeter] = useState('');

  // SSE streaming hook
  const { 
    step: streamStep, 
    message: streamMessage, 
    progress: streamProgress, 
    loading: streamLoading, 
    complete: streamComplete, 
    error: streamError,
    startStream 
  } = useSSE(msmeId || '');

  const commonSectors = [
    { code: "01", name: "Agri Retail & Farming" },
    { code: "10", name: "Food Processing" },
    { code: "13", name: "Textile Manufacturing" },
    { code: "14", name: "Apparel Manufacturing" },
    { code: "23", name: "Construction Materials" },
    { code: "29", name: "Auto Components" },
    { code: "46", name: "Pharma Wholesale" },
    { code: "47", name: "Retail Trade & Electronics" },
    { code: "52", name: "Cold Storage & Logistics" },
    { code: "56", name: "Food Services & QSR" },
    { code: "86", name: "Healthcare Services" }
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.business_name) return;

    try {
      const res = await onboardingApi.onboard({
        business_name: profile.business_name,
        nic_code: profile.nic_code,
        district: profile.district,
        state: profile.state,
        vintage_years: profile.vintage_years,
        employee_count: profile.employee_count,
      });
      
      setMsmeId(res.msme_id);
      setStep(2);
    } catch (err) {
      alert("Failed to submit business profile. Check database connection.");
    }
  };

  const handleLinkAA = async () => {
    if (!msmeId) return;
    setLinkingAA(true);
    try {
      // Calls our backend consent simulation which populates mock series data!
      await onboardingApi.grantAAConsent(msmeId, true);
      setAaLinked(true);
      setStep(3);
    } catch (err) {
      alert("Failed to link Account Aggregator.");
    } finally {
      setLinkingAA(false);
    }
  };

  const handleSignalsSubmit = async () => {
    if (!msmeId) return;
    try {
      // Connect alternate signals in backend
      if (whatsappActive) await signalsApi.connectWhatsapp(msmeId, true);
      if (ondcActive) await signalsApi.connectONDC(msmeId, true);
      if (skillsString) await signalsApi.connectSkills(msmeId, skillsString);
      if (electricityMeter) {
        // connect mock DISCOM series
        await signalsApi.connectElectricity(msmeId, "1200,1230,1290,1180,1190,1240,1220,1230,1210,1200,1220,1230");
      }
      setStep(4);
    } catch (err) {
      alert("Failed to register signals.");
    }
  };

  const handleFinalSubmit = () => {
    // Triggers SSE Streaming progress
    setStep(5);
    startStream(() => {
      // Redirects to dashboard after complete
      setTimeout(() => {
        if (msmeId) onComplete(msmeId);
      }, 1000);
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Steps Indicator */}
      {step < 5 && (
        <div className="flex items-center justify-between mb-8 text-xs font-semibold text-gray-500 border-b border-white/5 pb-4 select-none">
          <span className={step === 1 ? 'text-accent' : step > 1 ? 'text-gray-300' : ''}>1. Profile</span>
          <ArrowRight size={12} />
          <span className={step === 2 ? 'text-accent' : step > 2 ? 'text-gray-300' : ''}>2. Financials</span>
          <ArrowRight size={12} />
          <span className={step === 3 ? 'text-accent' : step > 3 ? 'text-gray-300' : ''}>3. Alternates</span>
          <ArrowRight size={12} />
          <span className={step === 4 ? 'text-accent' : step > 4 ? 'text-gray-300' : ''}>4. Consent</span>
        </div>
      )}

      {/* Step 1: Profile */}
      {step === 1 && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Building2 size={20} className="text-accent" />
              Register Business Profile
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Provide basic profile parameters to build cohort groups
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-300 mb-1">Registered Trade Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya's Fresh Kitchen"
                value={profile.business_name}
                onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                className="w-full bg-primary-dark/60 border border-white/10 rounded-xl py-3 px-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-1">NIC 2-digit Sector</label>
                <select
                  value={profile.nic_code}
                  onChange={(e) => setProfile({ ...profile, nic_code: e.target.value })}
                  className="w-full bg-primary-dark/60 border border-white/10 rounded-xl py-3 px-3 text-gray-300 focus:outline-none focus:border-accent/40 cursor-pointer"
                >
                  {commonSectors.map((sec) => (
                    <option key={sec.code} value={sec.code}>
                      ({sec.code}) {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Vintage (in Years)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={profile.vintage_years}
                  onChange={(e) => setProfile({ ...profile, vintage_years: parseFloat(e.target.value) })}
                  className="w-full bg-primary-dark/60 border border-white/10 rounded-xl py-3 px-4 text-gray-100 focus:outline-none focus:border-accent/40 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-gray-300 mb-1">Total Employees</label>
                <input
                  type="number"
                  required
                  value={profile.employee_count}
                  onChange={(e) => setProfile({ ...profile, employee_count: parseInt(e.target.value) })}
                  className="w-full bg-primary-dark/60 border border-white/10 rounded-xl py-3 px-4 text-gray-100 focus:outline-none focus:border-accent/40 font-mono"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-300 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={profile.district}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                  className="w-full bg-primary-dark/60 border border-white/10 rounded-xl py-3 px-4 text-gray-100 focus:outline-none focus:border-accent/40"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-300 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  className="w-full bg-primary-dark/60 border border-white/10 rounded-xl py-3 px-4 text-gray-100 focus:outline-none focus:border-accent/40"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/15 mt-2"
            >
              Continue to Data Connection <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Financial Ingestion (Interactive Account Aggregator Simulator) */}
      {step === 2 && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <UploadCloud size={20} className="text-white" />
              Consent via Account Aggregator
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Select Financial Information Providers (FIPs) and request OTP authorization
            </p>
          </div>

          {fipStep === 'selection' ? (
            <div className="space-y-4 text-xs">
              
              {/* Grid of FIP options */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Select Registries to Link
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold">
                  {[
                    { id: "sbi", name: "State Bank of India (SBI)", desc: "Primary Trade Cash Flow" },
                    { id: "hdfc", name: "HDFC Bank Ltd", desc: "Secondary Accounts" },
                    { id: "icici", name: "ICICI Bank Ltd", desc: "Corporate Ledger" },
                    { id: "gstn", name: "GSTN Tax Registry", desc: "GSTR-1 & GSTR-3B filings" },
                    { id: "epfo", name: "EPFO Payroll Registry", desc: "Provident Fund / Headcount" }
                  ].map((fip) => {
                    const active = selectedFips.includes(fip.id);
                    return (
                      <button
                        key={fip.id}
                        type="button"
                        onClick={() => {
                          setSelectedFips(prev => 
                            active ? prev.filter(x => x !== fip.id) : [...prev, fip.id]
                          );
                        }}
                        className={`p-3 rounded-xl border text-left transition-colors flex flex-col ${active ? 'bg-white/[0.04] border-white/30 text-white' : 'bg-transparent border-white/[0.08] text-neutral-400'}`}
                      >
                        <span className="text-xs font-bold block">{fip.name}</span>
                        <span className="text-[9px] text-neutral-500 block mt-0.5">{fip.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Input */}
              <div className="space-y-1 pt-1">
                <label className="block text-neutral-400 font-bold">Aggregator Mobile Number</label>
                <input
                  type="text"
                  value={mobileNum}
                  onChange={(e) => setMobileNum(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-xl py-2.5 px-4 text-gray-100 placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <button
                type="button"
                disabled={selectedFips.length === 0 || !mobileNum}
                onClick={() => setFipStep('otp')}
                className="w-full btn-primary disabled:opacity-50 mt-2"
              >
                Request OTP from Aggregator Gateway
              </button>

            </div>
          ) : (
            <div className="space-y-4 text-xs">
              
              <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] text-center space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">OTP Verification SMS Sent</span>
                <p className="text-[11px] text-neutral-500">
                  A verification token has been routed to <strong>+91 {mobileNum}</strong> via your connected FIP nodes.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400 font-bold">Enter OTP Token</label>
                <input
                  type="text"
                  value={otpVal}
                  onChange={(e) => setOtpVal(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-xl py-2.5 px-4 text-gray-100 placeholder-neutral-500 focus:outline-none focus:border-white/30 font-mono text-center tracking-widest text-sm"
                  placeholder="e.g. 636023"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setFipStep('selection')}
                  className="w-1/3 btn-secondary"
                >
                  Change FIPs
                </button>
                <button
                  type="button"
                  disabled={verifyingOtp || !otpVal}
                  onClick={async () => {
                    setVerifyingOtp(true);
                    try {
                      if (msmeId) {
                        await onboardingApi.grantAAConsent(msmeId, true);
                        setAaLinked(true);
                        setStep(3);
                      }
                    } catch (e) {
                      alert("Consent verification failed.");
                    } finally {
                      setVerifyingOtp(false);
                    }
                  }}
                  className="w-2/3 btn-primary disabled:opacity-50"
                >
                  {verifyingOtp ? 'Verifying Consent Certificate...' : 'Verify & Sign Certificate'}
                </button>
              </div>

            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-400 hover:text-white">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={() => setStep(3)} className="flex items-center gap-1 text-gray-400 hover:text-white">
              Skip Integration <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Optional Signals */}
      {step === 3 && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Sparkles size={20} className="text-purple-light" />
              Connect Alternate Signal Sources
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Add non-traditional proxies to optimize risk limits
            </p>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            {/* ONDC */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-primary-dark/25">
              <div>
                <label className="block text-gray-200 font-bold">ONDC Seller Dashboard</label>
                <span className="text-[10px] text-gray-500">Extracts monthly order growth velocities.</span>
              </div>
              <input
                type="checkbox"
                checked={ondcActive}
                onChange={(e) => setOndcActive(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent bg-primary-dark border-white/10"
              />
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-primary-dark/25">
              <div>
                <label className="block text-gray-200 font-bold">WhatsApp Business API Metadata</label>
                <span className="text-[10px] text-gray-500">Evaluates operator engagement and velocities. No text read.</span>
              </div>
              <input
                type="checkbox"
                checked={whatsappActive}
                onChange={(e) => setWhatsappActive(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent bg-primary-dark border-white/10"
              />
            </div>

            {/* Skill credentials */}
            <div>
              <label className="block text-gray-300 mb-1">DigiLocker Skill Certificates</label>
              <input
                type="text"
                placeholder="e.g. NSDC Digital Literacy:NSDC|PMKVY Retail:PMKVY"
                value={skillsString}
                onChange={(e) => setSkillsString(e.target.value)}
                className="w-full bg-primary-dark/60 border border-white/10 rounded-xl py-3 px-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent/40"
              />
              <span className="text-[9px] text-gray-500 mt-1 block">Specify formatted certificate list: Program:Issuer split by pipe (|)</span>
            </div>

            {/* Electricity Meter */}
            <div>
              <label className="block text-gray-300 mb-1">DISCOM Electricity Meter Number</label>
              <input
                type="text"
                placeholder="e.g. ELEC-92019-33"
                value={electricityMeter}
                onChange={(e) => setElectricityMeter(e.target.value)}
                className="w-full bg-primary-dark/60 border border-white/10 rounded-xl py-3 px-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent/40 font-mono"
              />
              <span className="text-[9px] text-gray-500 mt-1 block">Allows verification of production capacity. Highly valued for manufacturing sectors.</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-gray-400 hover:text-white">
              <ArrowLeft size={16} /> Back
            </button>
            
            <button
              onClick={handleSignalsSubmit}
              className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light transition-all flex items-center gap-2"
            >
              Continue to Consent <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Consent & Privacy Agreement */}
      {step === 4 && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <FileText size={20} className="text-accent" />
              Consent & Privacy Disclosures
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Read terms regarding data routing and cryptographical security
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-primary-dark/35 space-y-3 text-xs leading-relaxed text-gray-300 font-medium">
            <p>
              1. <strong>ZK Credit Attestation:</strong> Underwriters will verify your credit health band (e.g. Top 25th percentile) using a Zero-Knowledge Proof token. None of your raw transaction logs or GSTR ledgers will be exposed directly to lenders.
            </p>
            <p>
              2. <strong>Periodic Recalculation:</strong> Your limit recommedations update automatically on a monthly basis when new AA cashflow registries arrive.
            </p>
            <p>
              3. <strong>Data Encryption:</strong> All ingestion registers are secured with CRYSTALS-Kyber PQC simulation packages before database commitment.
            </p>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-warning/5 border border-warning/15">
            <ShieldAlert size={18} className="text-warning-light flex-shrink-0" />
            <span className="text-[10px] font-semibold text-gray-400 leading-normal">
              By submitting, you agree to pull files and register with the Micro-Cohort clustering engine.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold">
            <button onClick={() => setStep(3)} className="flex items-center gap-1 text-gray-400 hover:text-white">
              <ArrowLeft size={16} /> Back
            </button>
            
            <button
              onClick={handleFinalSubmit}
              className="px-6 py-3 rounded-xl bg-accent text-white font-extrabold hover:bg-accent-light transition-all flex items-center gap-2 shadow-lg shadow-accent/15"
            >
              Analyze Business Profile <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: SSE Progress Stream */}
      {step === 5 && (
        <StreamProgress
          currentStep={streamStep}
          message={streamMessage}
          progress={streamProgress}
          loading={streamLoading}
          complete={streamComplete}
          error={streamError}
        />
      )}
    </div>
  );
};
