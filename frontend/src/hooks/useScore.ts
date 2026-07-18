import { useState, useEffect, useCallback } from 'react';
import type { HealthCard } from '../lib/types';
import { scoringApi } from '../lib/api';

export const useScore = (msmeId: string | null) => {
  const [healthCard, setHealthCard] = useState<HealthCard | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    if (!msmeId) return;
    setLoading(true);
    setError(null);
    try {
      const card = await scoringApi.getHealthCard(msmeId);
      setHealthCard(card);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch financial health card.');
      setHealthCard(null);
    } finally {
      setLoading(false);
    }
  }, [msmeId]);

  useEffect(() => {
    if (msmeId) {
      fetchScore();
    }
  }, [msmeId, fetchScore]);

  return {
    healthCard,
    loading,
    error,
    refetch: fetchScore,
  };
};
