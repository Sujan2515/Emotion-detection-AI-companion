import React, { useState, useCallback, useRef } from 'react';
import { useEmotion } from './hooks/useEmotion';
import { useChat } from './hooks/useChat';
import Webcam from './components/Webcam';
import EmotionPanel from './components/EmotionPanel';
import Chat from './components/Chat';
import FloatingEmoji from './components/FloatingEmoji';

export default function App() {
  const [webcamActive, setWebcamActive] = useState(false);
  const videoElRef = useRef(null);

  const handleVideoReady = useCallback((videoEl) => {
    videoElRef.current = videoEl;
  }, []);

  const {
    currentEmotion, currentEmoji, confidence, trend,
    emotionHistory, isPolling, emojiKey, meta,
    startPolling, stopPolling,
  } = useEmotion();

  const {
    messages, isLoading, sendMessage, clearMessages, messagesEndRef,
  } = useChat();

  const handleTogglePolling = useCallback(() => {
    const getFrameData = () => {
      const video = videoElRef.current;
      if (!video) return null;
      if (video.readyState < 2) return null;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return null;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.7);
    };

    if (isPolling) stopPolling();
    else startPolling(getFrameData);
  }, [isPolling, startPolling, stopPolling]);

  const handleToggleWebcam = () => {
    const next = !webcamActive;
    setWebcamActive(next);
    if (next && !isPolling) {
      // Start polling with frame capture once camera is enabled.
      // If the video element isn't ready yet, the first poll will fall back to null.
      const getFrameData = () => {
        const video = videoElRef.current;
        if (!video) return null;
        if (video.readyState < 2) return null;
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return null;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, w, h);
        return canvas.toDataURL('image/jpeg', 0.7);
      };
      startPolling(getFrameData);
    }
    if (!next && isPolling) stopPolling();
  };

  const handleSend = (text) => {
    sendMessage(text, currentEmotion, trend);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-void text-white font-body flex flex-col">
      {/* Background ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="orb1 absolute w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[80px]"
          style={{
            background: meta.color,
            top: '-100px', left: '-100px',
            transition: 'background 1.5s ease',
          }}
        />
        <div
          className="orb2 absolute w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[80px]"
          style={{
            background: meta.color,
            bottom: '-80px', right: '-80px',
            transition: 'background 1.5s ease',
          }}
        />
      </div>

      {/* Floating emoji overlay */}
      <FloatingEmoji
        emotion={currentEmotion}
        confidence={confidence}
        isPolling={isPolling}
        emojiKey={emojiKey}
      />

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🧠</div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-white tracking-tight">EmoChat</h1>
            <p className="text-xs text-gray-600 font-mono">emotion-aware AI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all duration-500"
            style={{
              borderColor: `${meta.color}40`,
              background: `${meta.color}0d`,
              color: meta.color,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />
            <span>{currentEmoji} {currentEmotion} · {Math.round(confidence * 100)}%</span>
          </div>

          {/* Webcam toggle */}
          <button
            onClick={handleToggleWebcam}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-display font-semibold border transition-all ${
              webcamActive
                ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
          >
            <span>{webcamActive ? '📷 Stop Cam' : '📷 Start Cam'}</span>
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="relative z-10 flex-1 flex gap-4 p-4 min-h-0">
        {/* Left panel: Webcam + Emotion */}
        <aside className="hidden lg:flex flex-col gap-4 w-[320px] flex-shrink-0">
          {/* Webcam */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Live Feed</span>
              {webcamActive && (
                <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  active
                </span>
              )}
            </div>
            <Webcam
              isActive={webcamActive}
              emotionColor={meta.color}
              onVideoReady={handleVideoReady}
              onRequestEnable={() => setWebcamActive(true)}
            />
          </div>

          {/* Emotion Panel */}
          <EmotionPanel
            currentEmotion={currentEmotion}
            confidence={confidence}
            trend={trend}
            emotionHistory={emotionHistory}
            isPolling={isPolling}
            emojiKey={emojiKey}
            onTogglePolling={handleTogglePolling}
          />

          {/* Future ML badge */}
          <div className="rounded-xl border border-dashed border-white/10 p-3 text-center">
            <p className="text-xs text-gray-600 font-mono leading-relaxed">
              🔬 <span className="text-gray-500">ML-ready</span> · Replace{' '}
              <code className="text-accent-soft/80 bg-white/5 px-1 rounded">emotion_service.py</code>{' '}
              with your TensorFlow model
            </p>
          </div>
        </aside>

        {/* Right panel: Chat */}
        <div className="flex-1 min-w-0 min-h-0">
          {/* Mobile emotion bar */}
          <div className="lg:hidden flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentEmoji}</span>
              <div>
                <span className="text-sm font-display font-semibold" style={{ color: meta.color }}>
                  {currentEmotion}
                </span>
                <span className="text-xs text-gray-600 ml-2 font-mono">{Math.round(confidence * 100)}%</span>
              </div>
            </div>
            <button
              onClick={handleTogglePolling}
              className={`text-xs px-3 py-1.5 rounded-xl font-display font-semibold transition-all ${
                isPolling ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
              }`}
            >
              {isPolling ? '⏹ Stop' : '▶ Start'} Sensor
            </button>
          </div>

          <div className="h-full" style={{ height: 'calc(100vh - 8rem)' }}>
            <Chat
              messages={messages}
              isLoading={isLoading}
              onSend={handleSend}
              onClear={clearMessages}
              currentEmotion={currentEmotion}
              trend={trend}
              messagesEndRef={messagesEndRef}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
