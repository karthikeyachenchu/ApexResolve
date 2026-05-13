/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { getChatResponse } from "../services/chatService";
import { MessageSquare, Send, X, Minimize2, Maximize2, Bot, User, Trash2 } from "lucide-react";

// Simple markdown renderer for chat messages
function renderMarkdown(text: string) {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```\w*\n?/g, '').replace(/```$/g, '').trim();
      return <pre key={i} className="bg-black/40 rounded-lg p-2 my-1 overflow-x-auto font-mono text-[10px] text-emerald-400 border border-[var(--border)]">{code}</pre>;
    }
    // Process inline markdown
    const lines = part.split('\n');
    return lines.map((line, j) => {
      if (!line.trim()) return <br key={`${i}-${j}`} />;
      // Headers
      if (line.startsWith('**') && line.endsWith('**')) return <div key={`${i}-${j}`} className="font-bold text-[var(--accent)] mt-2 mb-1">{line.replace(/\*\*/g, '')}</div>;
      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const content = line.replace(/^\s*[-•]\s*/, '');
        return <div key={`${i}-${j}`} className="flex gap-1.5 ml-1"><span className="text-[var(--accent)] shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-black/30 rounded text-[9px] font-mono text-emerald-400">$1</code>') }} /></div>;
      }
      // Numbered items
      if (/^\d+\.\s/.test(line.trim())) {
        return <div key={`${i}-${j}`} className="flex gap-1.5 ml-1" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-black/30 rounded text-[9px] font-mono text-emerald-400">$1</code>') }} />;
      }
      // Table rows
      if (line.includes('|') && !line.match(/^[\s|:-]+$/)) {
        const cells = line.split('|').filter(c => c.trim());
        if (cells.length > 1) return <div key={`${i}-${j}`} className="flex gap-2 text-[9px] py-0.5 border-b border-[var(--border)]/30">{cells.map((c, k) => <span key={k} className="flex-1" dangerouslySetInnerHTML={{ __html: c.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div>;
      }
      // Regular text with inline formatting
      return <div key={`${i}-${j}`} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-black/30 rounded text-[9px] font-mono text-emerald-400">$1</code>') }} />;
    });
  });
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", role: "assistant", content: "Systems check complete. I am ApexResolve AI. How can I assist with your deployment or diagnostics today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await getChatResponse([...messages, userMsg]);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Operational failure in neural link. Please check connectivity.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-2xl shadow-red-500/40 flex items-center justify-center hover:scale-110 transition-all z-50 group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-full mr-3 bg-[var(--panel)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          AI Ops Assistant
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 w-96 max-h-[600px] flex flex-col bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 transition-all duration-300 ${isMinimized ? 'h-16 overflow-hidden' : 'h-[600px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest">ApexResolve AI</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-[8px] font-bold text-[var(--ink-muted)]">ONLINE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 rounded hover:bg-white/5 transition-colors text-[var(--ink-muted)]">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 rounded hover:bg-white/5 transition-colors text-[var(--ink-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 terminal-scroll">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-[var(--border)] text-[var(--ink-muted)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-[var(--accent)] text-white rounded-tr-none' 
                    : 'bg-white/5 border border-[var(--border)] text-[var(--ink)] rounded-tl-none'
                }`}>
                  {m.role === 'user' ? m.content : renderMarkdown(m.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex gap-1 p-3 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[var(--border)] bg-black/20">
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] group focus-within:border-[var(--accent)] transition-all">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Query system stats or deploy logs..."
                  className="flex-1 bg-transparent border-none outline-none text-xs"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 rounded-lg bg-[var(--accent)] text-white disabled:opacity-30 transition-all hover:brightness-110 shadow-lg shadow-red-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[8px] font-bold text-[var(--ink-muted)] uppercase tracking-widest">Powered by Apex Gen 3</p>
                <button onClick={() => setMessages([messages[0]])} className="flex items-center gap-1 text-[8px] font-bold text-red-400/50 hover:text-red-400 transition-colors uppercase pr-1">
                   <Trash2 className="w-2.5 h-2.5" />
                   Purge Session
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
