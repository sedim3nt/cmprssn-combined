'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const accent = '#8b5cf6';

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: accent }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg text-white flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Open CMPRSSN Interpreter"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden" style={{ maxHeight: '500px', background: '#0a0a1a' }}>
          <div style={{ backgroundColor: accent }} className="px-4 py-3 text-white flex items-center justify-between shrink-0">
            <span className="font-semibold text-sm">🧠 CMPRSSN Interpreter</span>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]" style={{ maxHeight: '370px' }}>
            {messages.length === 0 && (
              <div className="text-sm text-gray-400 italic">
                Share your combined diagnostic + survey results and I&apos;ll interpret your compression pattern.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user' ? 'text-white' : 'text-gray-200'
                  }`}
                  style={{ backgroundColor: m.role === 'user' ? accent : '#1a1a2e' }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl px-3 py-2 text-sm text-gray-400 animate-pulse" style={{ background: '#1a1a2e' }}>
                  Analyzing patterns...
                </div>
              </div>
            )}
            {error && <div className="text-xs text-red-400 text-center">Something went wrong. Please try again.</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="px-3 py-2 border-t border-white/10 shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Paste your results or ask a question..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{ backgroundColor: accent }}
                className="px-3 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
