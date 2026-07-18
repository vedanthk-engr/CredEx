import axios from 'axios';
import type { 
  HealthCard, 
  RoadmapData, 
  VoiceDiaryHistory, 
  NetworkGraphData, 
  BankPortfolio 
} from './types';

// Setup base URL pointing to FastAPI backend container or local port
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Configure simple mock JWT storage helper for bank underwriters
export const setBankAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const onboardingApi = {
  onboard: async (data: {
    business_name: string;
    nic_code: string;
    district: string;
    state: string;
    vintage_years: number;
    employee_count: number;
  }) => {
    const formData = new FormData();
    formData.append('business_name', data.business_name);
    formData.append('nic_code', data.nic_code);
    formData.append('district', data.district);
    formData.append('state', data.state);
    formData.append('vintage_years', String(data.vintage_years));
    formData.append('employee_count', String(data.employee_count));

    const response = await api.post('/api/onboard', formData);
    return response.data;
  },

  grantAAConsent: async (msmeId: string, granted: boolean) => {
    const formData = new FormData();
    formData.append('msme_id', msmeId);
    formData.append('granted', String(granted));
    const response = await api.post('/api/aa/consent', formData);
    return response.data;
  },
  
  uploadGST: async (msmeId: string, file?: File, rawData?: string) => {
    const formData = new FormData();
    formData.append('msme_id', msmeId);
    if (file) formData.append('file', file);
    if (rawData) formData.append('raw_data', rawData);
    const response = await api.post('/api/ingest/gst', formData);
    return response.data;
  },

  uploadUPI: async (msmeId: string, file?: File) => {
    const formData = new FormData();
    formData.append('msme_id', msmeId);
    if (file) formData.append('file', file);
    const response = await api.post('/api/ingest/upi', formData);
    return response.data;
  },

  uploadEPFO: async (msmeId: string, file?: File) => {
    const formData = new FormData();
    formData.append('msme_id', msmeId);
    if (file) formData.append('file', file);
    const response = await api.post('/api/ingest/epfo', formData);
    return response.data;
  }
};

export const scoringApi = {
  getHealthCard: async (msmeId: string): Promise<HealthCard> => {
    const response = await api.get(`/api/health-card/${msmeId}`);
    return response.data;
  },
  
  getCreditLimit: async (msmeId: string) => {
    const response = await api.get(`/api/limit/${msmeId}`);
    return response.data;
  },

  getZKProof: async (msmeId: string) => {
    const response = await api.get(`/api/zk/proof/${msmeId}`);
    return response.data;
  },

  verifyZKProof: async (token: string) => {
    const response = await api.get(`/api/zk/verify/${token}`);
    return response.data;
  },

  getOcenOffers: async (msmeId: string) => {
    const response = await api.post(`/api/ocen/offer/${msmeId}`);
    return response.data;
  }
};

export const roadmapApi = {
  getRoadmap: async (msmeId: string): Promise<RoadmapData> => {
    const response = await api.get(`/api/roadmap/${msmeId}`);
    return response.data;
  },

  completeAction: async (msmeId: string, actionId: number) => {
    const response = await api.patch(`/api/roadmap/${msmeId}/complete/${actionId}`);
    return response.data;
  },

  regenerateRoadmap: async (msmeId: string): Promise<RoadmapData> => {
    const response = await api.post(`/api/roadmap/${msmeId}`);
    return response.data;
  }
};

export const voiceApi = {
  getHistory: async (msmeId: string): Promise<VoiceDiaryHistory> => {
    const response = await api.get(`/api/voice-diary/${msmeId}`);
    return response.data;
  },

  submitEntry: async (msmeId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'diary_entry.webm');
    const response = await api.post(`/api/voice-diary/${msmeId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export const networkApi = {
  getGraph: async (msmeId: string): Promise<NetworkGraphData> => {
    const response = await api.get(`/api/network/${msmeId}`);
    return response.data;
  }
};

export const signalsApi = {
  connectSkills: async (msmeId: string, skillsString: string) => {
    const formData = new FormData();
    formData.append('msme_id', msmeId);
    formData.append('skills_string', skillsString);
    const response = await api.post('/api/signals/skills', formData);
    return response.data;
  },

  connectElectricity: async (msmeId: string, series: string) => {
    const formData = new FormData();
    formData.append('msme_id', msmeId);
    formData.append('consumption_series', series);
    const response = await api.post('/api/signals/electricity', formData);
    return response.data;
  },

  connectWhatsapp: async (msmeId: string, active: boolean) => {
    const formData = new FormData();
    formData.append('msme_id', msmeId);
    formData.append('active', String(active));
    const response = await api.post('/api/signals/whatsapp', formData);
    return response.data;
  },

  connectONDC: async (msmeId: string, active: boolean) => {
    const formData = new FormData();
    formData.append('msme_id', msmeId);
    formData.append('active', String(active));
    const response = await api.post('/api/signals/ondc', formData);
    return response.data;
  }
};

export const bankApi = {
  getPortfolio: async (): Promise<BankPortfolio> => {
    const response = await api.get('/api/bank/portfolio');
    return response.data;
  },

  rescorePortfolio: async () => {
    const response = await api.post('/api/bank/rescore');
    return response.data;
  },

  getExportUrl: () => {
    return `${API_BASE_URL}/api/bank/export`;
  }
};
