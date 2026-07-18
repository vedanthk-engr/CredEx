import { useState, useRef, useCallback } from 'react';
import { voiceApi } from '../lib/api';

export const useVoice = (msmeId: string) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    setResult(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all audio tracks from stream to release mic
        stream.getTracks().forEach(track => track.stop());

        // Upload to backend
        setLoading(true);
        try {
          const res = await voiceApi.submitEntry(msmeId, audioBlob);
          setTranscript(res.transcript);
          setResult(res);
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to process voice recording.');
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError('Microphone access denied or not supported.');
      setIsRecording(false);
    }
  }, [msmeId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    loading,
    error,
    transcript,
    result,
    startRecording,
    stopRecording,
  };
};
