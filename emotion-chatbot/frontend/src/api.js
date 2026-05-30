const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Predict current emotion from the backend.
 * @param {string|null} frameData - Base64 frame (optional, for future ML use)
 * @returns {Promise<{emotion: string, confidence: number, emoji: string}>}
 */
export async function fetchEmotion(frameData = null) {
  const res = await fetch(`${API_BASE}/predict-emotion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frame_data: frameData }),
  });
  if (!res.ok) throw new Error(`Emotion API error: ${res.status}`);
  return res.json();
}

/**
 * Get emotion trend from list of recent emotions.
 * @param {string[]} emotions
 * @returns {Promise<{trend: string}>}
 */
export async function fetchEmotionTrend(emotions) {
  const res = await fetch(`${API_BASE}/emotion-trend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emotions }),
  });
  if (!res.ok) throw new Error(`Trend API error: ${res.status}`);
  return res.json();
}

/**
 * Send a chat message to the emotion-aware chatbot.
 * @param {string} message
 * @param {string} emotion
 * @param {string} trend
 * @param {Array} history
 * @returns {Promise<{reply: string, emotion_used: string, trend_used: string}>}
 */
export async function sendChatMessage(message, emotion, trend, history = []) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, emotion, trend, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Chat API error: ${res.status}`);
  }
  return res.json();
}
