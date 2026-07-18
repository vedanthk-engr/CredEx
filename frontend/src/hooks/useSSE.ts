import { useState, useCallback, useRef } from 'react';

export interface SSEState {
  step: string;
  message: string;
  progress: number;
  loading: boolean;
  complete: boolean;
  error: string | null;
}

export const useSSE = (msmeId: string) => {
  const [state, setState] = useState<SSEState>({
    step: 'idle',
    message: 'Press start to begin assessment...',
    progress: 0,
    loading: false,
    complete: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback((onComplete?: () => void) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState({
      step: 'validating',
      message: 'Connecting to server...',
      progress: 0,
      loading: true,
      complete: false,
      error: null,
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const source = new EventSource(`${API_BASE_URL}/api/stream/${msmeId}`);
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: data.error,
            message: `Error: ${data.error}`,
          }));
          source.close();
          return;
        }

        const { step, message, progress } = data;

        setState((prev) => ({
          ...prev,
          step,
          message,
          progress,
          complete: step === 'complete',
          loading: step !== 'complete',
        }));

        if (step === 'complete') {
          source.close();
          if (onComplete) onComplete();
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to parse stream data.',
        }));
        source.close();
      }
    };

    source.onerror = () => {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Connection to assessment stream lost.',
      }));
      source.close();
    };
  }, [msmeId]);

  const resetStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState({
      step: 'idle',
      message: 'Press start to begin assessment...',
      progress: 0,
      loading: false,
      complete: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    startStream,
    resetStream,
  };
};
