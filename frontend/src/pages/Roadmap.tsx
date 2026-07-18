import React, { useState, useEffect, useCallback } from 'react';
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

          {/* Right sidebar - Projected Score Delta */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-2xl border border-white/5 bg-primary-dark/30 backdrop-blur-md">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
                Projected Rating Uplift
              </h3>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-500 font-semibold block uppercase">
                    Committed to Improve status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {roadmap.committed_to_improve ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent-light text-xs font-bold uppercase tracking-wide">
                        <Award size={14} className="animate-bounce" /> Active (2+ completed)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-semibold">
                        Inactive (Need 2 completed)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-purple/10 border border-purple/20">
                  <div>
                    <span className="text-gray-400 text-[10px] font-semibold block uppercase">
                      Cumulative Score Uplift
                    </span>
                    <strong className="text-purple-light text-lg font-display font-extrabold block mt-0.5">
                      {roadmap.projected_percentile_uplift}
                    </strong>
                  </div>
                  <Award size={28} className="text-purple-light/40" />
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                  Completing the designated checklist actions will automatically trigger a scoring model recheck, qualifying your profile for the projected limit increase.
                </p>
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
