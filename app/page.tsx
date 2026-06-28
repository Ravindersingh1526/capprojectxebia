'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  guestName: string | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_SYSTEM_MESSAGE: ChatMessage = {
  id: 'system-welcome',
  role: 'system',
  content: 'Hi there! I\'m Sophia from Saltystaz Gurgaon. What\'s your name?',
  timestamp: new Date(),
};

export default function Home() {
  const [state, setState] = useState<ChatState>({
    messages: [INITIAL_SYSTEM_MESSAGE],
    sessionId: null,
    guestName: null,
    isLoading: false,
    error: null,
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const generateId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const resetSession = useCallback(() => {
    setState({
      messages: [
        {
          id: generateId(),
          role: 'system',
          content: 'Conversation has been reset. Hi there! I\'m Sophia from Saltystaz Gurgaon. What\'s your name?',
          timestamp: new Date(),
        },
      ],
      sessionId: null,
      guestName: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const handleSessionExpiry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: generateId(),
          role: 'system',
          content: 'Your previous session has expired. Let\'s start fresh!',
          timestamp: new Date(),
        },
        {
          id: generateId(),
          role: 'system',
          content: 'Hi there! I\'m Sophia from Saltystaz Gurgaon. What\'s your name?',
          timestamp: new Date(),
        },
      ],
      sessionId: null,
      guestName: null,
      error: null,
    }));
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    const lowerMessage = trimmed.toLowerCase();
    if (lowerMessage === 'start over' || lowerMessage === 'reset conversation') {
      resetSession();
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          message: trimmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'system',
          content: data.error || 'Something went wrong. Please try again.',
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isLoading: false,
          error: data.error || 'Network error',
        }));
        return;
      }

      if (data.metadata?.sessionExpired) {
        handleSessionExpiry();
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
        return;
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        sessionId: data.sessionId,
        guestName: prev.guestName ?? trimmed,
        isLoading: false,
        error: null,
      }));
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'system',
        content: 'Unable to connect. Please check your connection and try again.',
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
        error: 'network',
      }));
    }
  }, [state.sessionId, resetSession, handleSessionExpiry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state.isLoading) return;
    const message = input;
    setInput('');
    sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((msg) => msg.role === 'user');

    if (lastUserMessage) {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter(
          (msg) =>
            !(msg.role === 'system' && msg.id !== 'system-welcome' && prev.messages.indexOf(msg) === prev.messages.length - 1)
        ),
        error: null,
      }));
      sendMessage(lastUserMessage.content);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA]">
      {/* Header - Xebia Quantum branded */}
      <header className="bg-gradient-to-r from-[#7B2D8B] to-[#4A1259] text-white px-4 py-3 shadow-lg flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
            aria-hidden="true"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Saltystaz Gurgaon</h1>
            <p className="text-xs text-white/70">Sophia · Concierge</p>
          </div>
          <a
            href="/presentation.html"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-3 py-1.5 text-xs font-medium bg-white/15 hover:bg-white/25 rounded-full transition-colors backdrop-blur-sm border border-white/20"
            aria-label="View presentation"
          >
            📊 PPT
          </a>
        </div>
      </header>

      {/* Messages area */}
      <main
        className="flex-1 overflow-y-auto px-4 py-6"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {state.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {state.isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5" aria-label="Assistant is typing">
                  <span className="w-2 h-2 bg-[#7B2D8B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-[#7B2D8B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-[#7B2D8B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {state.error === 'network' && !state.isLoading && (
            <div className="flex justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 text-sm font-medium text-white bg-[#E91E63] hover:bg-[#C2185B] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:ring-offset-2"
                aria-label="Retry sending message"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Type your message
          </label>
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={state.isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7B2D8B] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoComplete="off"
            aria-label="Message input"
          />
          <button
            type="submit"
            disabled={state.isLoading || !input.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#7B2D8B] text-white hover:bg-[#5C1F6A] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#7B2D8B] focus:ring-offset-2"
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
        {/* Footer branding */}
        <div className="max-w-3xl mx-auto mt-2 text-center text-[0.7rem] text-gray-500 tracking-wide">
          Developed by <span className="font-semibold text-gray-700">Ravinder Singh</span> · <span className="font-semibold text-[#7B2D8B]">Xebia</span> Quantum Shift AI Practitioner+
        </div>
      </footer>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="px-4 py-2 text-sm text-gray-500 italic bg-gray-100 rounded-full max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-to-br from-[#7B2D8B] to-[#5C1F6A] text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-xs sm:max-w-md shadow-sm">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <time className="text-xs text-white/60 mt-1 block">
            {formatTime(message.timestamp)}
          </time>
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-xs sm:max-w-md shadow-sm">
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
        <time className="text-xs text-gray-400 mt-1 block">
          {formatTime(message.timestamp)}
        </time>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
