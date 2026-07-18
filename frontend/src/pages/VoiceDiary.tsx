import React, { useState, useEffect } from 'react';
import { useVoice } from '../hooks/useVoice';
import { voiceApi } from '../lib/api';
import type { VoiceDiaryHistory } from '../lib/types';
import { ArrowLeft, Mic, MicOff, Loader2, Award, Calendar, MessageSquare, Volume2, Smile, Frown, Meh } from 'lucide-react';

interface VoiceDiaryProps {
  msmeId: string;
  onNavigate: (page: string) => void;
}

export const VoiceDiary: React.FC<VoiceDiaryProps> = ({ msmeId, onNavigate }) => {
  const [history, setHistory] = useState<VoiceDiaryHistory | null>(null);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  // useVoice hook handles navigator.mediaDevices, MediaRecorder, and API submission!
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

  // Refetch history when voice recording result completes
  useEffect(() => {
    if (result) {
      fetchHistory();
    }
  }, [result]);

  const getSentimentIcon = (label?: string) => {
    if (label === 'Positive') return <Smile className="text-accent" size={16} />;
    if (label === 'Negative') return <Frown className="text-danger" size={16} />;
    return <Meh className="text-warning" size={16} />;
  };

  const getSentimentClass = (label?: string) => {
    if (label === 'Positive') return 'bg-accent/10 border-accent/20 text-accent-light';
    if (label === 'Negative') return 'bg-danger/10 border-danger/20 text-danger-light';
    return 'bg-warning/10 border-warning/20 text-warning-light';
  };

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
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
              <MessageSquare className="text-accent" size={22} />
              Vernacular Voice Check-in
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Record a 15-second summary of your weekly operations to verify cash flow sentiment
            </p>
          </div>

          {/* 3 Questions Prompts */}
          <div className="p-4 rounded-xl border border-white/5 bg-primary-dark/35 space-y-2 text-xs text-gray-300 font-semibold leading-relaxed">
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
              Please cover these questions during your check-in:
            </span>
            <p>1. How many customers did you serve today/this week?</p>
            <p>2. Did you have any large unexpected expenses?</p>
            <p>3. Are any payments from customers still pending?</p>
          </div>

          {/* Recording interface */}
          <div className="flex flex-col items-center justify-center p-8 bg-primary-dark/20 rounded-2xl border border-white/5 relative min-h-[220px]">
            {isRecording && (
              <div className="absolute inset-0 bg-accent/5 rounded-2xl animate-pulse pointer-events-none"></div>
            )}
            
            {isRecording && (
              <div className="flex items-end gap-1 h-8 mb-4 select-none">
                {[...Array(14)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 rounded bg-accent audio-wave-bar"
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
                className="w-20 h-20 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center hover:bg-accent/25 hover:border-accent-light hover:text-white transition-all shadow-lg shadow-accent/10 disabled:opacity-50"
              >
                <Mic size={32} />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-danger/15 border border-danger/30 text-danger flex items-center justify-center hover:bg-danger/25 hover:border-danger-light hover:text-white transition-all shadow-lg shadow-danger/10 animate-bounce"
              >
                <MicOff size={32} />
              </button>
            )}

            <div className="text-center mt-5">
              <strong className="text-white text-sm block">
                {isRecording ? 'Listening... Press to stop check-in.' : 'Ready to record check-in'}
              </strong>
              <span className="text-[10px] text-gray-500 mt-1 block">
                Supports English/Hindi vernacular analysis
              </span>
            </div>

            {voiceError && (
              <p className="text-danger text-xs font-bold mt-4 text-center">
                {voiceError}
              </p>
            )}

            {transcribing && (
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-5">
                <Loader2 size={16} className="animate-spin text-accent" />
                Whisper transcribing vernacular speech...
              </div>
            )}
          </div>

          {/* Latest Transcription Output */}
          {transcript && (
            <div className="p-4 rounded-xl border border-white/5 bg-primary-light/10 space-y-2">
              <span className="text-gray-400 text-[10px] font-bold block uppercase tracking-wider">
                Whisper Transcription Output
              </span>
              <p className="text-gray-200 text-xs italic leading-relaxed">
                "{transcript}"
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

                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border font-semibold ${result.extracted?.unexpected_expense ? 'bg-danger/10 border-danger/20 text-danger-light' : 'bg-accent/10 border-accent/20 text-accent-light'}`}>
                    <span>Expenses: {result.extracted?.unexpected_expense ? 'YES' : 'NO'}</span>
                  </div>

                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border font-semibold ${result.extracted?.pending_payments ? 'bg-danger/10 border-danger/20 text-danger-light' : 'bg-accent/10 border-accent/20 text-accent-light'}`}>
                    <span>Pending Receivables: {result.extracted?.pending_payments ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Status / Timeline */}
        <div className="lg:col-span-1 space-y-6">
          {/* Committed Borrower Card */}
          <div className="glass-panel p-5 relative overflow-hidden">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
              Committed Borrower Status
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">
                  Current Badge status
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {history?.committed_borrower ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple/15 border border-purple/25 text-purple-light text-xs font-bold uppercase tracking-wide">
                      <Award size={14} className="animate-bounce" /> Committed Borrower
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-semibold">
                      Needs {8 - (history?.total_checkins || 0)} more checkins
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
                <div className="w-full h-1.5 rounded-full bg-primary-dark border border-white/5 overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, ((history?.total_checkins || 0)/8)*100)}%` }}
                    className="h-full bg-purple rounded-full"
                  />
                </div>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                Maintaining 8 consecutive weekly voice diaries reduces risk premiums, unlocking lower ROI offers.
              </p>
            </div>
          </div>

          {/* Timeline of Checkins */}
          <div className="glass-panel p-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-white/5 pb-2">
              Weekly diary timeline
            </h4>
            
            {fetchingHistory ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 size={16} className="animate-spin text-accent" />
              </div>
            ) : !history || history.history.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500 font-semibold">
                No voice diaries recorded.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {history.history.map((entry) => (
                  <div key={entry.id} className="p-3 rounded-xl bg-primary-dark/40 border border-white/5 text-xs font-medium space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {entry.date}
                      </span>
                      
                      <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${getSentimentClass(entry.sentiment_label)}`}>
                        {getSentimentIcon(entry.sentiment_label)}
                        <span>{entry.sentiment_label}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-normal line-clamp-2">
                      "{entry.transcript}"
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
