import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { roadmapApi, scoringApi } from '../lib/api';
import { RoadmapCard } from '../components/RoadmapCard';
import type { RoadmapData } from '../lib/types';
import { ArrowLeft, Loader2, Award, Calendar, CheckSquare, Sparkles } from 'lucide-react';

interface RoadmapProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ msmeId, onNavigate }) => {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  // Simulator state variables
  const [simRunway, setSimRunway] = useState(15);
  const [simGst, setSimGst] = useState(85);
  const [simEpfo, setSimEpfo] = useState(80);

  const simulatedScore = useMemo(() => {
    return Math.min(99, Math.round(42 + (simRunway / 60) * 18 + (simGst / 100) * 22 + (simEpfo / 100) * 16));
  }, [simRunway, simGst, simEpfo]);

  const simulatedLimit = useMemo(() => {
    return Math.round(320000 * (simulatedScore / 45));
  }, [simulatedScore]);


  const fetchRoadmap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roadmapApi.getRoadmap(msmeId);
      setRoadmap(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch roadmap actions.');
    } finally {
      setLoading(false);
    }
  }, [msmeId]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleCompleteAction = async (actionId: number) => {
    setCompletingId(actionId);
    try {
      await roadmapApi.completeAction(msmeId, actionId);
      // Refresh roadmap
      const data = await roadmapApi.getRoadmap(msmeId);
      setRoadmap(data);
    } catch (err) {
      alert("Failed to mark action complete.");
    } finally {
      setCompletingId(null);
    }
  };

  const handleRegenerate = async () => {
    setRecomputing(true);
    try {
      const data = await roadmapApi.regenerateRoadmap(msmeId);
      setRoadmap(data);
    } catch (err) {
      alert("Failed to regenerate roadmap.");
    } finally {
      setRecomputing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-gray-400">
        <Loader2 size={36} className="animate-spin text-accent mb-3" />
        Analysing weak dimensions and generating AI roadmap...
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto mt-12 text-xs font-semibold">
        <h3 className="text-lg font-bold text-danger-light font-display mb-2">
          Unable to Load Roadmap
        </h3>
        <p className="text-gray-400 mb-6 leading-relaxed">
          {error || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light transition-all text-xs"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Calculate percentages
  const progressPercent = (roadmap.actions_completed / roadmap.total_actions) * 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center gap-3 select-none text-xs font-semibold">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
              <Sparkles className="text-warning-light animate-pulse" size={22} />
              Actionable Recovery Roadmap
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              90-day recovery program tailored by CREDEX AI Advisor to boost your credit eligibility
            </p>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={recomputing}
            className="px-4 py-2 rounded-xl bg-primary-light border border-white/5 hover:bg-white/5 text-gray-200 text-xs font-bold transition-all disabled:opacity-50"
          >
            {recomputing ? 'Recalculating...' : 'Regenerate Roadmap'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 mb-8">
          <div className="flex justify-between items-center text-xs font-bold text-gray-300">
            <span className="flex items-center gap-1.5">
              <CheckSquare size={14} className="text-accent" />
              Progress: {roadmap.actions_completed} of {roadmap.total_actions} Completed
            </span>
            <span className="font-mono text-gray-100">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-primary-dark border border-white/5 overflow-hidden">
            <div 
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-accent transition-all duration-500 shadow-sm"
            />
          </div>
        </div>

        {/* Action cards layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List of actions */}
          <div className="lg:col-span-2 space-y-4">
            {roadmap.actions.map((act) => (
              <RoadmapCard
                key={act.id}
                action={act}
                onComplete={handleCompleteAction}
                loading={completingId === act.id}
              />
            ))}
          </div>

          {/* Right sidebar - Interactive Credit limit Simulator */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-2xl border border-white/5 bg-primary-dark/30 backdrop-blur-md space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-white/5">
                Eligible Limit Simulator
              </h3>

              {/* Slider 1: Cash Buffer Days */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-400">Cash Runway:</span>
                  <span className="text-white font-mono">{simRunway} days</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={simRunway}
                  onChange={(e) => setSimRunway(parseInt(e.target.value))}
                  className="w-full h-1 bg-primary-dark rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              {/* Slider 2: GST Timeliness */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-400">GST Filings:</span>
                  <span className="text-white font-mono">{simGst}% on-time</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={simGst}
                  onChange={(e) => setSimGst(parseInt(e.target.value))}
                  className="w-full h-1 bg-primary-dark rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              {/* Slider 3: EPFO Compliance */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-400">EPFO Regularity:</span>
                  <span className="text-white font-mono">{simEpfo}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={simEpfo}
                  onChange={(e) => setSimEpfo(parseInt(e.target.value))}
                  className="w-full h-1 bg-primary-dark rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-purple/10 border border-purple/20 mt-4">
                <div>
                  <span className="text-gray-400 text-[9px] font-bold block uppercase">
                    Projected Limit Offer
                  </span>
                  <strong className="text-purple-light text-lg font-mono font-extrabold block mt-0.5">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(simulatedLimit)}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-[8px] font-bold uppercase block">
                    Target Score
                  </span>
                  <span className="text-purple-light text-sm font-mono font-bold">
                    {simulatedScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Timeframe card */}
            <div className="p-4 rounded-xl border border-white/5 bg-primary-light/10 flex items-start gap-3">
              <Calendar size={18} className="text-accent-light mt-0.5" />
              <div>
                <strong className="text-white text-xs block font-bold">90-Day Implementation</strong>
                <p className="text-gray-400 text-[10px] leading-relaxed mt-0.5">
                  Follow the sequence chronologically. Lenders evaluate consistency trends over 3 consecutive cycles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
