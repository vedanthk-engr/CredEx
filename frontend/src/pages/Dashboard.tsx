import React, { useState } from 'react';
import { useScore } from '../hooks/useScore';
import { HealthCard } from '../components/HealthCard';
import { DimensionBars } from '../components/DimensionBars';
import { MetricTile } from '../components/MetricTile';
import { ClimateRisk } from '../components/ClimateRisk';
import { DriftAlert } from '../components/DriftAlert';
import { Loader2, Share2, HelpCircle, ArrowRight, CheckCircle2, MessageSquare, Landmark, Award, Activity } from 'lucide-react';
import { api, scoringApi } from '../lib/api';

interface DashboardProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ msmeId, onNavigate }) => {
  const { healthCard, loading, error, refetch } = useScore(msmeId);
  const [dispatching, setDispatching] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  // Format currency to Indian Numbering System
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDispatchOcen = async () => {
    setDispatching(true);
    try {
      await scoringApi.getOcenOffers(msmeId);
      await new Promise(resolve => setTimeout(resolve, 1500)); // mock delay
      setDispatched(true);
    } catch (err) {
      alert("Failed to compile OCEN payload.");
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-gray-400">
        <Loader2 size={36} className="animate-spin text-accent mb-3" />
        Loading your Credit Health Card...
      </div>
    );
  }

  if (error || !healthCard) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto mt-12 text-xs font-semibold">
        <h3 className="text-lg font-bold text-danger-light font-display mb-2">
          Assessment Required
        </h3>
        <p className="text-gray-400 mb-6 leading-relaxed">
          {error || 'No financial records have been analyzed for this business.'}
        </p>
        <button
          onClick={() => onNavigate('onboard')}
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light transition-all text-xs"
        >
          Begin Onboarding
        </button>
      </div>
    );
  }

  const isLowScore = healthCard.overall_percentile < 50;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner alert for Genetic Drift */}
      <DriftAlert 
        driftStatus={healthCard.alternate_signals.earned_antifragility_bonus ? 'NORMAL' : 'DRIFT_ALERT'} 
        driftType={healthCard.overall_percentile < 40 ? 'STRESS' : 'UPGRADE'} 
      />

      {/* Main Health Card Component */}
      <HealthCard
        businessName={healthCard.business_name}
        cohortLabel={healthCard.cohort_label}
        percentile={healthCard.overall_percentile}
        momentum={healthCard.momentum}
        riskLevel={healthCard.risk_level}
        zkProofToken={healthCard.zk_proof_token}
        msmeId={msmeId}
      />

      {/* 3 Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          title="Cash Buffer Days"
          value={`${healthCard.metrics.cash_buffer_days} days`}
          subtitle={healthCard.metrics.cash_buffer_days < 15 ? 'HIGH RISK (below 15d)' : 'STRONG Runway'}
          type={healthCard.metrics.cash_buffer_days < 15 ? 'danger' : 'success'}
        />
        
        <MetricTile
          title="Recommended Limit"
          value={formatINR(healthCard.metrics.recommended_limit)}
          subtitle="Recalculates monthly"
          type="success"
        />

        <MetricTile
          title="Next Assessment Review"
          value={healthCard.metrics.next_review_date}
          subtitle="Auto-updates via AA"
          type="default"
        />
      </div>

      {/* Main Breakdown Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 6 Dimensions */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
              <Activity className="text-accent" size={18} />
              Peer-Relative Score Dimensions
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Your ranking percentiles computed against 800 peer micro-cohorts
            </p>
          </div>

          <DimensionBars dimensions={healthCard.dimensions} />
        </div>

        {/* Right Column - Alternate Signals Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Climate signals */}
          <ClimateRisk
            zone={healthCard.alternate_signals.climate_zone}
            earnedBonus={healthCard.alternate_signals.earned_antifragility_bonus}
          />

          {/* ONDC / Alternate status */}
          <div className="glass-panel p-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-white/5 pb-2">
              Connected alternate channels
            </h4>
            
            <div className="space-y-3 text-xs font-medium">
              <div className="flex justify-between items-center bg-primary-dark/30 p-2.5 rounded-lg border border-white/5">
                <span>ONDC Integration</span>
                {healthCard.alternate_signals.ondc_composite_score ? (
                  <span className="text-accent-light font-bold">
                    Active (Score: {healthCard.alternate_signals.ondc_composite_score}%)
                  </span>
                ) : (
                  <span className="text-gray-500">Not Connected</span>
                )}
              </div>

              <div className="flex justify-between items-center bg-primary-dark/30 p-2.5 rounded-lg border border-white/5">
                <span>WhatsApp Business API</span>
                {healthCard.alternate_signals.whatsapp_metadata ? (
                  <span className="text-accent-light font-bold">
                    Active (Vitality: {healthCard.alternate_signals.whatsapp_metadata.whatsapp_vitality_score}%)
                  </span>
                ) : (
                  <span className="text-gray-500">Not Connected</span>
                )}
              </div>

              <div className="flex justify-between items-center bg-primary-dark/30 p-2.5 rounded-lg border border-white/5">
                <span>DigiLocker Skill Certificates</span>
                {healthCard.alternate_signals.skills_validation?.has_skills ? (
                  <span className="text-accent-light font-bold">
                    +{healthCard.alternate_signals.skills_validation.score_modifier} Modifer Applied
                  </span>
                ) : (
                  <span className="text-gray-500">No Credentials Found</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Graph Preview, Voice Diary, & Roadmap shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Network widget */}
        <div className="glass-panel p-5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Share2 size={16} className="text-accent" />
              Supply Chain Network
            </h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Resilience Score: <strong className="text-gray-200">{healthCard.alternate_signals.network_resilience_score}</strong>. Nodes: {healthCard.alternate_signals.network_nodes_count}.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('network')}
            className="mt-4 w-full py-2.5 rounded-xl bg-primary-light border border-white/5 hover:bg-white/5 text-gray-200 text-xs font-bold transition-all flex items-center justify-center gap-1"
          >
            Open Interactive Graph <ArrowRight size={14} />
          </button>
        </div>

        {/* Voice Diary widget */}
        <div className="glass-panel p-5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <MessageSquare size={16} className="text-purple-light animate-pulse" />
              Vernacular Voice Diary
            </h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              {healthCard.committed_borrower 
                ? 'Committed Borrower Badge unlocked! (8+ checkins completed)' 
                : 'Complete weekly check-ins to build behavioral trust records.'}
            </p>
          </div>
          <button 
            onClick={() => onNavigate('voice')}
            className="mt-4 w-full py-2.5 rounded-xl bg-primary-light border border-white/5 hover:bg-white/5 text-gray-200 text-xs font-bold transition-all flex items-center justify-center gap-1"
          >
            Launch Voice Check-in <ArrowRight size={14} />
          </button>
        </div>

        {/* Roadmap / Improve widget */}
        <div className="glass-panel p-5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Award size={16} className="text-warning-light" />
              Improvement Roadmap
            </h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed font-medium">
              {isLowScore 
                ? 'Your rating is below 50th percentile. A structured 90-day recovery plan is active.' 
                : 'Optimize your operational metrics to unlock wider credit limit offers.'}
            </p>
          </div>
          <button 
            onClick={() => onNavigate('roadmap')}
            className="mt-4 w-full py-2.5 rounded-xl bg-primary-light border border-white/5 hover:bg-white/5 text-gray-200 text-xs font-bold transition-all flex items-center justify-center gap-1"
          >
            View Improvement Action Cards <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* OCEN Lender Marketplace Panel */}
      <div className="glass-panel p-6 border-accent/20 bg-accent/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Landmark size={20} className="text-accent" />
              OCEN Loan Marketplace
            </h3>
            <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
              Based on your verified {healthCard.overall_percentile}% percentile health card, 3 mock lenders are actively competing to service your capital. Submit your ZK Credit proof in one click.
            </p>
          </div>

          {!dispatched ? (
            <button
              onClick={handleDispatchOcen}
              disabled={dispatching}
              className="px-6 py-3 rounded-xl bg-accent text-white font-extrabold hover:bg-accent-light transition-all flex items-center gap-2 shadow-lg shadow-accent/15 flex-shrink-0 disabled:opacity-50 text-xs"
            >
              {dispatching ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Compiling Offer payloads...
                </>
              ) : (
                <>
                  Dispatch ZK Attestation to OCEN
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-accent-light bg-accent/20 border border-accent/40 px-4 py-3 rounded-xl">
              <CheckCircle2 size={18} />
              ZK Attestation dispatched to OCEN lender registry!
            </div>
          )}
        </div>

        {dispatched && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs relative z-10 animate-fadeInUp">
            <div className="p-4 rounded-xl bg-primary-dark/60 border border-white/5">
              <span className="text-gray-400 font-semibold uppercase text-[10px]">Lender Name</span>
              <strong className="text-white block mt-0.5">SBI MSME Core</strong>
              <span className="text-accent-light font-bold block mt-2">Interest: 8.9% FIXED</span>
              <span className="text-gray-400 block mt-1">Tenure: 12 months</span>
            </div>
            
            <div className="p-4 rounded-xl bg-primary-dark/60 border border-white/5">
              <span className="text-gray-400 font-semibold uppercase text-[10px]">Lender Name</span>
              <strong className="text-white block mt-0.5">HDFC FlexiGrow</strong>
              <span className="text-accent-light font-bold block mt-2">Interest: 9.4% FIXED</span>
              <span className="text-gray-400 block mt-1">Tenure: 18 months</span>
            </div>

            <div className="p-4 rounded-xl bg-primary-dark/60 border border-white/5">
              <span className="text-gray-400 font-semibold uppercase text-[10px]">Lender Name</span>
              <strong className="text-white block mt-0.5">SIDBI Udyog Mitra</strong>
              <span className="text-accent-light font-bold block mt-2">Interest: 8.2% FIXED</span>
              <span className="text-gray-400 block mt-1">Tenure: 24 months</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
