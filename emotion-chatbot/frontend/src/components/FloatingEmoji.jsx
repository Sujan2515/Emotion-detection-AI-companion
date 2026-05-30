import React from 'react';

const EMOTION_META = {
  happy:   { emoji: '😊', label: 'Happy',   color: '#f9c846' },
  sad:     { emoji: '😢', label: 'Sad',     color: '#5b9bd5' },
  neutral: { emoji: '😐', label: 'Neutral', color: '#8b8fa8' },
  angry:   { emoji: '😠', label: 'Angry',   color: '#f05e5e' },
};

export default function FloatingEmoji({ emotion, confidence, isPolling, emojiKey }) {
  const meta = EMOTION_META[emotion] || EMOTION_META.neutral;

  return (
    <div
      className="fixed top-5 right-5 z-50 flex flex-col items-center gap-1 select-none pointer-events-none"
      style={{ filter: `drop-shadow(0 4px 16px ${meta.color}60)` }}
    >
      {/* Main floating emoji */}
      <div
        key={emojiKey}
        className="text-5xl animate-[emojiPop_0.4s_cubic-bezier(0.34,1.56,0.64,1)] animate-[float_3s_ease-in-out_infinite]"
        style={{ animation: 'emojiPop 0.4s cubic-bezier(0.34,1.56,0.64,1), float 3s ease-in-out 0.4s infinite' }}
      >
        {meta.emoji}
      </div>

      {/* Label pill */}
      <div
        className="text-xs font-display font-semibold px-2.5 py-0.5 rounded-full"
        style={{
          background: `${meta.color}22`,
          color: meta.color,
          border: `1px solid ${meta.color}44`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {meta.label}
      </div>

      {/* Confidence mini-bar */}
      <div className="w-12 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.round(confidence * 100)}%`, background: meta.color }}
        />
      </div>

      {/* Polling dot */}
      {isPolling && (
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: meta.color }}
        />
      )}
    </div>
  );
}
