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

      {/* Step 2: Financial Ingestion */}
      {step === 2 && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <UploadCloud size={20} className="text-accent" />
              Connect Financial Ledgers
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Link primary trade bank channels using automated Account Aggregator
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-accent/20 bg-accent/5 text-center">
            <h4 className="text-sm font-bold text-accent-light flex items-center justify-center gap-2">
              <Link size={16} />
              Consent via Account Aggregator (Recommended)
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed mt-2 max-w-sm mx-auto">
              Safely pulls 24 months of GSTR-1 filings, GSTIN turnover registers, and primary bank statements instantly.
            </p>

            <button
              onClick={handleLinkAA}
              disabled={linkingAA}
              className="mt-4 px-6 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light transition-all shadow-md shadow-accent/10 disabled:opacity-50 inline-flex items-center gap-2 text-xs"
            >
              {linkingAA ? 'Connecting to AA Gateway...' : 'Link via Account Aggregator'}
            </button>
          </div>

          <div className="relative flex py-2 items-center justify-center select-none text-[10px] text-gray-500 uppercase font-bold">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4">Or manually upload statements</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <div className="space-y-3 text-xs font-semibold">
            <div>
              <label className="block text-gray-400 mb-1">GSTR-3B filings / GST Ledger (PDF / JSON)</label>
              <input type="file" className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-gray-300 hover:file:bg-white/5 cursor-pointer" />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Bank Statement (CSV / PDF)</label>
              <input type="file" className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-gray-300 hover:file:bg-white/5 cursor-pointer" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-400 hover:text-white">
              <ArrowLeft size={16} /> Back
            </button>
            
            <button onClick={() => setStep(3)} className="flex items-center gap-1 text-gray-400 hover:text-white">
              Skip Manual <ArrowRight size={16} />
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
