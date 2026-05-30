import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const EMOTION_META = {
  happy:   { emoji: '😊', color: '#f9c846' },
  sad:     { emoji: '😢', color: '#5b9bd5' },
  neutral: { emoji: '😐', color: '#8b8fa8' },
  angry:   { emoji: '😠', color: '#f05e5e' },
};

const QUICK_REPLIES = {
  happy:   ['Tell me something fun!', "What's a good challenge for today?", 'Recommend something exciting 🎉'],
  sad:     ["I need some encouragement", "Can we talk?", "Help me feel better"],
  angry:   ["Help me calm down", "I need to vent", "What should I do?"],
  neutral: ["How can you help me?", "Tell me something interesting", "What can we talk about?"],
};

export default function Chat({ messages, isLoading, onSend, onClear, currentEmotion, trend, messagesEndRef }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const emotionMeta = EMOTION_META[currentEmotion] || EMOTION_META.neutral;
  const suggestions = QUICK_REPLIES[currentEmotion] || QUICK_REPLIES.neutral;

  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, messagesEndRef]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (text) => {
    onSend(text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border overflow-hidden"
      style={{
        background: 'rgba(17,17,24,0.97)',
        borderColor: `${emotionMeta.color}30`,
        boxShadow: `0 0 30px ${emotionMeta.color}10`,
        transition: 'border-color 0.8s ease, box-shadow 0.8s ease',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: `${emotionMeta.color}20`, background: 'rgba(22,22,31,0.8)' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
              style={{ background: `${emotionMeta.color}18` }}>
              🤖
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface"
              style={{ background: '#4ade80' }} />
          </div>
          <div>
            <div className="text-sm font-display font-semibold text-white">EmoChat AI</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>Tuned to</span>
              <span>{emotionMeta.emoji}</span>
              <span style={{ color: emotionMeta.color }}>{currentEmotion}</span>
              {trend !== currentEmotion && (
                <span className="text-gray-600">· trend: {EMOTION_META[trend]?.emoji} {trend}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-600 hover:text-gray-400 font-mono transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator emotion={currentEmotion} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      {!isLoading && messages.length < 4 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-gray-600 font-mono mb-2">Quick replies</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(s)}
                className="text-xs px-3 py-1.5 rounded-full border font-body transition-all hover:scale-105 active:scale-95"
                style={{
                  borderColor: `${emotionMeta.color}40`,
                  color: emotionMeta.color,
                  background: `${emotionMeta.color}0d`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2"
        style={{ borderTop: `1px solid ${emotionMeta.color}15` }}
      >
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              disabled={isLoading}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm font-body text-gray-200 placeholder-gray-600 outline-none border transition-all disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: input ? `${emotionMeta.color}50` : 'rgba(255,255,255,0.08)',
                boxShadow: input ? `0 0 0 1px ${emotionMeta.color}25` : 'none',
                maxHeight: '120px',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !isLoading
                ? `linear-gradient(135deg, ${emotionMeta.color}cc, ${emotionMeta.color}88)`
                : 'rgba(255,255,255,0.06)',
              boxShadow: input.trim() && !isLoading ? `0 4px 16px ${emotionMeta.color}40` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-2 font-mono text-center">
          Shift+Enter for new line · responses adapt to your detected emotion
        </p>
      </div>
    </div>
  );
}
