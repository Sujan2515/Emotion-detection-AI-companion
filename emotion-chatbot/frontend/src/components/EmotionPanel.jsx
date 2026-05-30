import React from 'react';

const EMOTION_META = {
  happy:   { emoji: '😊', label: 'Happy',   color: '#f9c846', bg: 'rgba(249,200,70,0.12)'  },
  sad:     { emoji: '😢', label: 'Sad',     color: '#5b9bd5', bg: 'rgba(91,155,213,0.12)' },
  neutral: { emoji: '😐', label: 'Neutral', color: '#8b8fa8', bg: 'rgba(139,143,168,0.12)'},
  angry:   { emoji: '😠', label: 'Angry',   color: '#f05e5e', bg: 'rgba(240,94,94,0.12)'  },
};

function ConfidenceBar({ value, color }) {
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.round(value * 100)}%`, background: color }}
      />
    </div>
  );
}

function EmotionDot({ emotion, isActive }) {
  const meta = EMOTION_META[emotion] || EMOTION_META.neutral;
  return (
    <div
      title={meta.label}
      className={`w-7 h-7 rounded-full flex items-center justify-center text-base transition-all duration-300 ${isActive ? 'scale-110 ring-2' : 'opacity-50 scale-90'}`}
      style={{
        background: isActive ? meta.bg : 'rgba(255,255,255,0.05)',
        ringColor: meta.color,
        boxShadow: isActive ? `0 0 8px ${meta.color}60` : 'none',
      }}
    >
      <span style={{ fontSize: '0.85rem' }}>{meta.emoji}</span>
    </div>
  );
}

export default function EmotionPanel({
  currentEmotion,
  confidence,
  trend,
  emotionHistory,
  isPolling,
  emojiKey,
  onTogglePolling,
}) {
  const meta = EMOTION_META[currentEmotion] || EMOTION_META.neutral;
  const trendMeta = EMOTION_META[trend] || EMOTION_META.neutral;
  const allEmotions = ['happy', 'sad', 'neutral', 'angry'];

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(22,22,31,0.95)',
        borderColor: `${meta.color}40`,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 24px ${meta.color}20`,
        transition: 'border-color 0.8s ease, box-shadow 0.8s ease',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Emotion Sensor</span>
        <button
          onClick={onTogglePolling}
          className={`text-xs px-2.5 py-1 rounded-lg font-display font-semibold transition-all ${
            isPolling
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
        >
          {isPolling ? '⏹ Stop' : '▶ Start'}
        </button>
      </div>

      {/* Main emotion display */}
      <div className="flex items-center gap-4">
        <div
          key={emojiKey}
          className="text-5xl select-none animate-[emojiPop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ filter: `drop-shadow(0 0 12px ${meta.color}80)` }}
        >
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-xl font-display font-bold leading-tight"
            style={{ color: meta.color }}
          >
            {meta.label}
          </div>
          <div className="text-xs text-gray-500 mb-1.5 font-mono">
            {Math.round(confidence * 100)}% confidence
          </div>
          <ConfidenceBar value={confidence} color={meta.color} />
        </div>
      </div>

      {/* Polling countdown indicator */}
      {isPolling && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="typing-dot w-1.5 h-1.5 rounded-full"
                style={{ background: meta.color, display: 'inline-block' }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 font-mono">scanning every 5s</span>
        </div>
      )}

      {/* Emotion selector row */}
      <div>
        <div className="text-xs text-gray-600 font-mono mb-2">All emotions</div>
        <div className="flex gap-2">
          {allEmotions.map(e => (
            <EmotionDot key={e} emotion={e} isActive={e === currentEmotion} />
          ))}
        </div>
      </div>

      {/* Trend */}
      <div
        className="rounded-xl px-3 py-2 flex items-center gap-3"
        style={{ background: `${trendMeta.color}12`, borderLeft: `3px solid ${trendMeta.color}` }}
      >
        <span className="text-lg">{trendMeta.emoji}</span>
        <div>
          <div className="text-xs text-gray-500 font-mono">Recent Trend</div>
          <div className="text-sm font-display font-semibold" style={{ color: trendMeta.color }}>
            {trendMeta.label}
          </div>
        </div>
        <div className="ml-auto flex gap-1">
          {emotionHistory.slice(-5).map((e, i) => {
            const m = EMOTION_META[e] || EMOTION_META.neutral;
            return (
              <span key={i} className="text-sm opacity-70" title={m.label}>{m.emoji}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
