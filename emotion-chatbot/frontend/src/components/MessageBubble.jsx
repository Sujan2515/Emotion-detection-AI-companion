import React from 'react';

const EMOTION_META = {
  happy:   { emoji: '😊', color: '#f9c846' },
  sad:     { emoji: '😢', color: '#5b9bd5' },
  neutral: { emoji: '😐', color: '#8b8fa8' },
  angry:   { emoji: '😠', color: '#f05e5e' },
};

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const emotionMeta = EMOTION_META[message.emotion] || null;

  return (
    <div className={`bubble-in flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-4`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold select-none
          ${isUser ? 'bg-accent/20 text-accent-soft' : 'bg-white/5 text-gray-300'}`}
        style={isUser && message.emotion
          ? { background: `${(EMOTION_META[message.emotion] || {}).color}22`, color: (EMOTION_META[message.emotion] || {}).color }
          : {}
        }
      >
        {isUser ? (emotionMeta ? emotionMeta.emoji : 'U') : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed font-body
            ${isUser
              ? 'rounded-br-sm text-white'
              : isError
                ? 'rounded-bl-sm bg-red-500/10 border border-red-500/20 text-red-300'
                : 'rounded-bl-sm bg-card border border-border text-gray-200'
            }`}
          style={isUser ? {
            background: message.emotion
              ? `linear-gradient(135deg, ${(EMOTION_META[message.emotion] || {}).color || '#7c6af7'}cc, #7c6af7cc)`
              : 'linear-gradient(135deg, #7c6af7cc, #5b4dd1cc)',
            borderBottom: message.emotion ? `1px solid ${(EMOTION_META[message.emotion] || {}).color}60` : undefined,
          } : {}}
        >
          {message.content}
        </div>

        {/* Timestamp + metadata */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-600 font-mono">{formatTime(message.timestamp)}</span>
          {isUser && message.emotion && (
            <span className="text-xs text-gray-600 font-mono flex items-center gap-1">
              <span>{emotionMeta?.emoji}</span>
              <span>{message.emotion}</span>
            </span>
          )}
          {!isUser && message.emotionUsed && (
            <span className="text-xs text-gray-600 font-mono">
              tuned to {EMOTION_META[message.emotionUsed]?.emoji} {message.emotionUsed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
