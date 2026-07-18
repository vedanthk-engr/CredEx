import React, { useState, useEffect, useMemo } from 'react';
import { useVoice } from '../hooks/useVoice';
import { voiceApi } from '../lib/api';
import type { VoiceDiaryHistory } from '../lib/types';
import { ArrowLeft, Mic, MicOff, Loader2, Award, Calendar, MessageSquare, Volume2, Smile, Frown, Meh, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface VoiceDiaryProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const VoiceDiary: React.FC<VoiceDiaryProps> = ({ msmeId, onNavigate }) => {
  const [history, setHistory] = useState<VoiceDiaryHistory | null>(null);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const {
    isRecording,
    loading: transcribing,
    error: voiceError,
    transcript,
    result,
    startRecording,
    stopRecording,
  } = useVoice(msmeId);

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const data = await voiceApi.getHistory(msmeId);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [msmeId]);

  useEffect(() => {
    if (result) {
      fetchHistory();
    }
  }, [result]);

  const getSentimentIcon = (label?: string) => {
    if (label === 'Positive') return <Smile className="text-white" size={16} />;
    if (label === 'Negative') return <Frown className="text-neutral-500" size={16} />;
    return <Meh className="text-neutral-400" size={16} />;
  };

  const getSentimentClass = (label?: string) => {
    if (label === 'Positive') return 'bg-white/10 border-white/20 text-white';
    if (label === 'Negative') return 'bg-neutral-900 border-white/5 text-neutral-500';
    return 'bg-neutral-800 border-white/10 text-neutral-300';
  };

  // Helper to highlight sentiment-related key terms in transcribed texts
  const highlightTranscript = (text: string) => {
    if (!text) return "";
    const positiveWords = ["growth", "high", "sales", "margins", "profit", "demand", "regular", "increase", "active", "received", "rebound"];
    const negativeWords = ["delay", "shortage", "expenses", "decline", "slowdown", "due", "pending", "default", "loss", "decrease", "drop", "stress"];
    
    const words = text.split(/(\s+)/);
    return words.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (positiveWords.includes(cleanWord)) {
        return <strong key={idx} className="text-white bg-white/10 px-1 rounded font-bold underline decoration-white/30">{word}</strong>;
      }
      if (negativeWords.includes(cleanWord)) {
        return <strong key={idx} className="text-neutral-400 bg-neutral-900 px-1 rounded font-bold line-through decoration-neutral-500 mr-0.5">{word}</strong>;
      }
      return word;
    });
  };

  // Compile historical sentiment scores for chart plotting
  const sentimentChartData = useMemo(() => {
    if (!history || history.history.length === 0) return [];
    
    // Reverse to show oldest first in time-series
    return [...history.history].reverse().map((entry, idx) => {
      let score = 50; // Neutral baseline
      if (entry.sentiment_label === 'Positive') score = 90;
      if (entry.sentiment_label === 'Negative') score = 15;
      
      return {
        checkin: `Wk ${idx + 1}`,
        score
      };
    });
  }, [history]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
          <MessageSquare className="text-white" size={22} />
          Vernacular Voice Check-in
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Provide brief regional language voice inputs to establish behavioral trust matrices
        </p>
      </div>

      <style>{`
        @keyframes audioWave {
          0%, 100% { height: 4px; }
          50% { height: 28px; }
        }
        .audio-wave-bar {
          animation: audioWave 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Recording Panel */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-6">
          
          <div className="p-4 rounded-xl border border-white/5 bg-primary-dark/35 space-y-2 text-xs text-neutral-400 font-semibold leading-relaxed">
            <span className="text-neutral-500 text-[10px] uppercase font-bold block mb-1">
              Please cover these topics in your check-in:
            </span>
            <p>1. Current customer activity levels / weekly trade velocities</p>
            <p>2. Unscheduled cash payments or raw materials supply stress</p>
            <p>3. Active pending buyer receivables status</p>
          </div>

          {/* Recording interface */}
          <div className="flex flex-col items-center justify-center p-8 bg-primary-dark/20 rounded-2xl border border-white/5 relative min-h-[220px]">
            {isRecording && (
              <div className="absolute inset-0 bg-white/[0.02] rounded-2xl animate-pulse pointer-events-none border border-white/20"></div>
            )}
            
            {isRecording && (
              <div className="flex items-end gap-1 h-8 mb-4 select-none">
                {[...Array(14)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 rounded bg-white audio-wave-bar"
                    style={{
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: `${0.6 + Math.sin(i) * 0.4}s`
                    }}
                  />
                ))}
              </div>
            )}

            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={transcribing}
                className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 text-white flex items-center justify-center hover:bg-white/[0.08] hover:border-white/30 transition-all shadow-[0_0_24px_rgba(255,255,255,0.06)] disabled:opacity-50"
              >
                <Mic size={24} />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-neutral-900 border border-white/20 text-neutral-400 flex items-center justify-center hover:bg-neutral-800 transition-all animate-bounce"
              >
                <MicOff size={24} />
              </button>
            )}

            <div className="text-center mt-5">
              <strong className="text-white text-sm block">
                {isRecording ? 'Capturing check-in... Press again to stop.' : 'Ready to record check-in'}
              </strong>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Supports Whisper translation checks (English / Hindi / Regional)
              </span>
            </div>

            {voiceError && (
              <p className="text-neutral-500 text-xs font-bold mt-4 text-center">
                {voiceError}
              </p>
            )}

            {transcribing && (
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 mt-5">
                <Loader2 size={16} className="animate-spin text-white" />
                Whisper transcribing regional speech...
              </div>
            )}
          </div>

          {/* Latest Transcription Output */}
          {transcript && (
            <div className="p-4 rounded-xl border border-white/5 bg-primary-light/10 space-y-2">
              <span className="text-neutral-500 text-[10px] font-bold block uppercase tracking-wider">
                Whisper Decoded Output (Sentiment Highlights)
              </span>
              <p className="text-neutral-300 text-xs leading-relaxed">
                "{highlightTranscript(transcript)}"
              </p>

              {result && (
                <div className="flex flex-wrap gap-2.5 mt-3 pt-3 border-t border-white/5 select-none text-[10px]">
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border font-bold ${getSentimentClass(result.sentiment?.label)}`}>
                    {getSentimentIcon(result.sentiment?.label)}
                    <span>Sentiment: {result.sentiment?.label}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-gray-300 font-semibold">
                    <span>Customers: {result.extracted?.customer_count}</span>
                  </div>

                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border font-semibold ${result.extracted?.unexpected_expense ? 'bg-neutral-900 border-white/5 text-neutral-500' : 'bg-white/10 border-white/20 text-white'}`}>
                    <span>Expenses: {result.extracted?.unexpected_expense ? 'YES' : 'NO'}</span>
                  </div>

                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border font-semibold ${result.extracted?.pending_payments ? 'bg-neutral-900 border-white/5 text-neutral-500' : 'bg-white/10 border-white/20 text-white'}`}>
                    <span>Pending Receivables: {result.extracted?.pending_payments ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Status & Sentiment Timeline Graph */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Committed Borrower Card */}
          <div className="glass-panel p-5 relative overflow-hidden">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
              Committed Borrower Status
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-neutral-500 font-semibold block uppercase">
                  Badge status
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {history?.committed_borrower ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 border border-white/25 text-white text-xs font-bold uppercase tracking-wide">
                      <Award size={14} className="animate-pulse" /> Committed Borrower
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-900 border border-white/10 text-neutral-400 text-xs font-semibold">
                      Needs {8 - (history?.total_checkins || 0)} more check-ins
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                  <span>Progress ({history?.total_checkins || 0}/8)</span>
                  <span>{Math.min(100, ((history?.total_checkins || 0)/8)*100).toFixed(0)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    style={{ width: `${Math.min(100, ((history?.total_checkins || 0)/8)*100)}%` }}
                    className="progress-fill"
                  />
                </div>
              </div>

              <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold">
                Maintaining consecutive weekly voice diaries reduces risk assessment premiums and unlocks lower lending rates.
              </p>
            </div>
          </div>

          {/* Sentiment Trend Time-Series */}
          {sentimentChartData.length > 0 && (
            <div className="glass-panel p-5 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-white" />
                Sentiment Health History
              </h4>
              <div className="h-[90px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentChartData}>
                    <XAxis dataKey="checkin" stroke="#404040" fontSize={8} tickLine={false} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.05)', fontSize: 10 }} />
                    <Line type="monotone" dataKey="score" stroke="#FFFFFF" strokeWidth={2} dot={{ r: 3, fill: '#FFFFFF' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Timeline of Checkins */}
          <div className="glass-panel p-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-white/5 pb-2">
              Weekly diary timeline
            </h4>
            
            {fetchingHistory ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 size={16} className="animate-spin text-white" />
              </div>
            ) : !history || history.history.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500 font-semibold">
                No voice diaries recorded.
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {history.history.map((entry) => (
                  <div key={entry.id} className="p-3 rounded-xl bg-primary-dark/40 border border-white/5 text-xs font-medium space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-500">
                        <Calendar size={12} />
                        {entry.date}
                      </span>
                      
                      <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${getSentimentClass(entry.sentiment_label)}`}>
                        {getSentimentIcon(entry.sentiment_label)}
                        <span>{entry.sentiment_label}</span>
                      </div>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-normal line-clamp-2">
                      "{highlightTranscript(entry.transcript)}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
