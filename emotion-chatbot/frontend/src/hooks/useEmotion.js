import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchEmotion, fetchEmotionTrend } from '../api';

const HISTORY_SIZE = 5;
const POLL_INTERVAL_MS = 5000;

const EMOTION_META = {
  happy: { emoji: '😊', label: 'Happy', color: '#f9c846', cssClass: 'emotion-happy' },
  sad: { emoji: '😢', label: 'Sad', color: '#5b9bd5', cssClass: 'emotion-sad' },
  neutral: { emoji: '😐', label: 'Neutral', color: '#8b8fa8', cssClass: 'emotion-neutral' },
  angry: { emoji: '😠', label: 'Angry', color: '#f05e5e', cssClass: 'emotion-angry' },
};

export function useEmotion() {
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [currentEmoji, setCurrentEmoji] = useState('😐');
  const [confidence, setConfidence] = useState(0);
  const [trend, setTrend] = useState('neutral');
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [emojiKey, setEmojiKey] = useState(0); // for re-triggering animation
  
  const intervalRef = useRef(null);
  const prevEmotionRef = useRef('neutral');

  const pollEmotion = useCallback(async (getFrameData) => {
    try {
      setError(null);
      const frameData = typeof getFrameData === 'function' ? getFrameData() : null;
      const data = await fetchEmotion(frameData);
      const { emotion, confidence: conf, emoji } = data;

      setCurrentEmotion(emotion);
      setCurrentEmoji(emoji);
      setConfidence(conf);

      // Trigger animation only on change
      if (emotion !== prevEmotionRef.current) {
        setEmojiKey(k => k + 1);
        prevEmotionRef.current = emotion;
      }

      setEmotionHistory(prev => {
        const next = [...prev, emotion].slice(-HISTORY_SIZE);
        return next;
      });

      // Compute trend from updated history
      const historyForTrend = [...emotionHistory, emotion].slice(-HISTORY_SIZE);
      const trendResult = await fetchEmotionTrend(historyForTrend);
      setTrend(trendResult.trend);

    } catch (err) {
      setError(err.message);
      console.warn('Emotion poll failed:', err.message);
    }
  }, [emotionHistory]);

  const startPolling = useCallback((getFrameData) => {
    if (intervalRef.current) return;
    setIsPolling(true);
    pollEmotion(getFrameData); // immediate first call
    intervalRef.current = setInterval(() => pollEmotion(getFrameData), POLL_INTERVAL_MS);
  }, [pollEmotion]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const meta = EMOTION_META[currentEmotion] || EMOTION_META.neutral;

  return {
    currentEmotion,
    currentEmoji,
    confidence,
    trend,
    emotionHistory,
    isPolling,
    error,
    emojiKey,
    meta,
    startPolling,
    stopPolling,
    EMOTION_META,
  };
}
