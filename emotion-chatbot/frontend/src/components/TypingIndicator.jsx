import React from 'react';

export default function TypingIndicator({ emotion = 'neutral' }) {
  const COLORS = {
    happy: '#f9c846', sad: '#5b9bd5', neutral: '#7c6af7', angry: '#f05e5e',
  };
  const color = COLORS[emotion] || COLORS.neutral;

  return (
    <div className="bubble-in flex gap-3 items-end mb-4">
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm select-none">
        🤖
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="typing-dot w-2 h-2 rounded-full inline-block"
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
