import React from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreamProgressProps {
  currentStep: string;
  message: string;
  progress: number;
  loading: boolean;
  complete: boolean;
  error: string | null;
}

export const StreamProgress: React.FC<StreamProgressProps> = ({
  currentStep,
  message,
  progress,
  loading,
  complete,
  error
}) => {
  const stepsList = [
    { key: "validating", label: "Identity Verification" },
    { key: "gst_pull", "label": "GST filing extraction" },
    { key: "upi_analysis", "label": "UPI flow mapping" },
    { key: "epfo_parse", "label": "EPFO payroll analytics" },
    { key: "stl_decompose", "label": "STL Time-Series decomposition" },
    { key: "cashflow", "label": "Cashflow resilience tests" },
    { key: "network_build", "label": "Payment network centrality" },
    { key: "cohort_assign", "label": "Cohort Archetype mapping" },
    { key: "scoring", "label": "Cohort-relative ML scoring" },
    { key: "shap_explain", "label": "SHAP contribution modeling" },
    { key: "zk_proof", "label": "ZK Proof attestation" },
    { key: "roadmap", "label": "AI Roadmap generation" },
  ];

  // Helper to determine step status
  const getStepStatus = (stepKey: string) => {
    if (error) return 'error';
    if (complete) return 'done';
    
    const currentIndex = stepsList.findIndex(s => s.key === currentStep);
    const stepIndex = stepsList.findIndex(s => s.key === stepKey);
    
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="glass-panel p-6 max-w-xl mx-auto w-full relative">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-100 font-display">
          MSME Financial Assessment
        </h3>
        <p className={`text-sm mt-1.5 font-medium ${error ? 'text-danger' : 'text-gray-400'}`}>
          {message}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 rounded-full bg-primary-dark border border-white/5 overflow-hidden mb-6 relative">
        <motion.div 
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          className={`h-full rounded-full ${error ? 'bg-danger' : 'bg-accent'} shadow-sm`}
        />
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-4 max-h-[350px] overflow-y-auto pr-1">
        {stepsList.map((step) => {
          const status = getStepStatus(step.key);
          
          return (
            <div 
              key={step.key} 
              className={`flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 ${
                status === 'active' 
                  ? 'bg-accent/5 border-accent/35 text-accent-light' 
                  : status === 'done'
                    ? 'border-white/5 text-gray-300'
                    : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex-shrink-0">
                {status === 'active' && (
                  <Loader2 size={16} className="animate-spin text-accent" />
                )}
                {status === 'done' && (
                  <CheckCircle2 size={16} className="text-accent fill-accent/10" />
                )}
                {status === 'pending' && (
                  <Circle size={16} className="text-gray-700" />
                )}
                {status === 'error' && (
                  <Circle size={16} className="text-danger" />
                )}
              </div>
              <span className="text-xs font-semibold select-none">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
