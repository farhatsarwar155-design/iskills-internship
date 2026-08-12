'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "👋 Hi! I'm Bizloom AI, your ERP assistant. Ask me anything about sales, low stock items, top customers, or financial performance!",
      timestamp: new Date()
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestion questions
  const suggestions = [
    "What's this month's total sales?",
    "Which products are low on stock?",
    "Who are my top 5 customers?",
    "Show financial summary"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMsg('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: text });
      const aiReply: ChatMessage = {
        sender: 'ai',
        text: response.data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (error: any) {
      console.error(error);
      const errorReply: ChatMessage = {
        sender: 'ai',
        text: "❌ Sorry, I encountered an issue querying the database. Please verify the backend is running.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {/* CSS for Subtle Pulsing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subtlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
        }
        .animate-subtle-pulse {
          animation: subtlePulse 2.5s infinite;
        }
      `}} />

      {/* Floating Action Button Bubble */}
      {!isOpen && (
        <button
          id="tour-chatbot"
          onClick={() => setIsOpen(true)}
          className="h-13 w-13 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 animate-subtle-pulse border border-indigo-200/20"
          title="Bizloom AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Slide-up Chat Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[500px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform translate-y-0">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <Sparkles className="h-4.5 w-4.5 text-indigo-200" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight leading-none">Bizloom AI</h3>
                <span className="text-[9px] text-indigo-200 font-bold">Virtual ERP Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[80%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-2xs whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-50 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200 rounded-bl-xs border border-neutral-100 dark:border-neutral-800/40'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-neutral-400 mt-1 px-1">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex flex-col items-start mr-auto max-w-[80%]">
                <div className="bg-slate-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800/40 px-4 py-3 rounded-2xl rounded-bl-xs flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions List */}
          {messages.length === 1 && !loading && (
            <div className="px-4 pb-2 pt-1 border-t border-neutral-50 dark:border-neutral-850 bg-slate-50/50 dark:bg-neutral-900/40 flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 px-2.5 py-1 rounded-full border border-indigo-100/40 dark:border-indigo-900/10 cursor-pointer transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3 bg-slate-50/60 dark:bg-neutral-900/80 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
            <Input
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputMsg)}
              placeholder="Ask me a business query..."
              className="flex-1 h-10 text-xs rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
              disabled={loading}
            />
            <button
              onClick={() => handleSend(inputMsg)}
              disabled={loading || !inputMsg.trim()}
              className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
