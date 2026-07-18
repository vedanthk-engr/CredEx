export interface MSME {
  id: string;
  business_name: string;
  nic_code: string;
  district: string;
  state: string;
  district_tier: string;
  vintage_years: number;
  employee_count: number;
  onboarding_date: string;
  aa_consent_granted: boolean;
  aa_consent_timestamp?: string;
  cohort_id?: number;
  last_assessment_date?: string;
  committed_borrower_flag: boolean;
  committed_to_improve_flag: boolean;
}

export interface DimensionScores {
  "Revenue Consistency": number;
  "Cashflow Resilience": number;
  "EPFO Discipline": number;
  "GST Filing Regularity": number;
  "Collection Velocity": number;
  "AA Consent Completeness": number;
}

export interface CashflowMetrics {
  cash_buffer_days: number;
  collection_velocity_days: number;
  recommended_limit: number;
  next_review_date: string;
}

export interface RiskFlags {
  phantom_revenue_flag: boolean;
  payroll_stress_flag: boolean;
}

export interface WhatsappMetadata {
  has_whatsapp: boolean;
  contact_diversity: number;
  response_velocity_minutes: number;
  active_hours_spread: number;
  conversation_volume_trend: number;
  whatsapp_vitality_score: number;
  privacy_note: string;
}

export interface SkillsValidation {
  has_skills: boolean;
  skill_recency_score: number;
  skill_relevance_score: number;
  human_capital_index: number;
  score_modifier: number;
  certificates_analyzed: number;
}

export interface AlternateSignals {
  climate_zone: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  earned_antifragility_bonus: boolean;
  ondc_composite_score?: number;
  whatsapp_metadata?: WhatsappMetadata;
  skills_validation?: SkillsValidation;
  network_nodes_count: number;
  network_resilience_score: number;
}

export interface HealthCard {
  msme_id: string;
  business_name: string;
  cohort_id: number;
  cohort_label: string;
  onboarding_date: string;
  last_assessment_date: string;
  overall_percentile: number;
  momentum: string;
  risk_level: "Low" | "Medium" | "High";
  committed_borrower: boolean;
  committed_to_improve: boolean;
  dimensions: DimensionScores;
  metrics: CashflowMetrics;
  flags: RiskFlags;
  alternate_signals: AlternateSignals;
  zk_proof_token?: string;
  shap_values?: Record<string, number>;
}

export interface RoadmapActionItem {
  id: number;
  action: string;
  why_it_matters: string;
  projected_score_delta: string;
  projected_limit_delta: string;
  timeline_days: number;
  completed: boolean;
  completed_date?: string;
}

export interface RoadmapData {
  msme_id: string;
  actions: RoadmapActionItem[];
  actions_completed: number;
  total_actions: number;
  committed_to_improve: boolean;
  projected_percentile_uplift: string;
}

export interface VoiceDiaryEntryItem {
  id: number;
  date: string;
  transcript: string;
  customer_count?: number;
  unexpected_expense: boolean;
  pending_payments: boolean;
  sentiment_score?: number;
  sentiment_label?: string;
}

export interface VoiceDiaryHistory {
  msme_id: string;
  committed_borrower: boolean;
  total_checkins: number;
  history: VoiceDiaryEntryItem[];
}

export interface NetworkNode {
  id: string;
  label: string;
  group: "center" | "customer" | "supplier" | "other";
  size: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  weight: number;
  frequency: number;
}

export interface NetworkGraphData {
  msme_id: string;
  node_count: number;
  edge_count: number;
  in_degree_centrality: number;
  out_degree_centrality: number;
  customer_concentration: number;
  supplier_concentration: number;
  network_resilience_score: number;
  graph_data: {
    nodes: NetworkNode[];
    links: NetworkLink[];
  };
}

export interface PortfolioItem {
  msme_id: string;
  business_name: string;
  cohort_label: string;
  percentile: number;
  risk_level: "Low" | "Medium" | "High";
  recommended_limit: number;
  momentum: string;
  drift_status: "NORMAL" | "DRIFT_ALERT";
  last_assessment_date: string;
}

export interface BankPortfolio {
  status: string;
  underwriter: string;
  portfolio_size: number;
  msmes: PortfolioItem[];
}
