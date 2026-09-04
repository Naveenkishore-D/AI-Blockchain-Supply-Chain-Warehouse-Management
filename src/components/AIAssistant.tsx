import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Settings, 
  Send, 
  MessageSquare, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  Database,
  Cpu,
  BrainCircuit,
  CornerDownLeft,
  Terminal,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatInput: string;
  setChatInput: (val: string) => void;
  sendChatMessage: (e?: React.FormEvent) => void;
  generatePredictions: () => void;
  predictLoading: boolean;
  predictions: any[];
  aiProvider: 'gemini' | 'openai' | 'ollama';
  setAiProvider: (val: 'gemini' | 'openai' | 'ollama') => void;
  aiApiKey: string;
  setAiApiKey: (val: string) => void;
  aiModelName: string;
  setAiModelName: (val: string) => void;
  aiRagEnabled: boolean;
  setAiRagEnabled: (val: boolean) => void;
  aiToolsEnabled: boolean;
  setAiToolsEnabled: (val: boolean) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  chatMessages,
  chatLoading,
  chatInput,
  setChatInput,
  sendChatMessage,
  generatePredictions,
  predictLoading,
  predictions,
  aiProvider,
  setAiProvider,
  aiApiKey,
  setAiApiKey,
  aiModelName,
  setAiModelName,
  aiRagEnabled,
  setAiRagEnabled,
  aiToolsEnabled,
  setAiToolsEnabled
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Suggested Actions chips
  const suggestedActions = [
    { label: 'Check Shortage', query: 'List all items with quantities under their reorder threshold and suggest supplier procurement.' },
    { label: 'Predict Demand', query: 'Run inventory demand forecasting analysis for our India warehouses based on current logistics trends.' },
    { label: 'Audit Logs', query: 'Show me the latest published blocks in the SCM blockchain and verify their hash integrity.' }
  ];

  const handleChipClick = (query: string) => {
    setChatInput(query);
  };

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden rounded-3xl" id="ai-intelligence-panel">
      {/* Panel Header */}
      <div className="p-4 bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600/20 to-emerald-500/20 flex items-center justify-center border border-blue-500/30">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">AI Sentinel Agent</span>
            <p className="text-[8px] text-slate-500 font-mono tracking-wide uppercase">Gemini Neural Link V4.1</p>
          </div>
        </div>

        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ${isConfigOpen ? 'rotate-90 text-blue-600 dark:text-blue-400' : ''}`}
          title="Neural Link Tuning Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced AI Tuning Configuration Sheet */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 p-4 space-y-4 text-xs font-mono overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Provider Core</label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-[10px] text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="gemini">Google Gemini AI</option>
                  <option value="openai">OpenAI (Proxy)</option>
                  <option value="ollama">Ollama Local (Offline)</option>
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Target Model Name</label>
                <input
                  type="text"
                  value={aiModelName}
                  onChange={(e) => setAiModelName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-[10px] text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="gemini-2.5-flash"
                />
              </div>
            </div>

            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Secure API Keys (Proxied Server-Side)</label>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-[10px] text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="••••••••••••••••"
              />
              <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-tight">Leave blank to use default server configuration.</p>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={aiRagEnabled} 
                  onChange={(e) => setAiRagEnabled(e.target.checked)}
                  className="rounded border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-blue-500 focus:ring-0"
                />
                Active RAG Pipeline
              </label>
              <label className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={aiToolsEnabled} 
                  onChange={(e) => setAiToolsEnabled(e.target.checked)}
                  className="rounded border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-blue-500 focus:ring-0"
                />
                Agent Function Tool Calling
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Thread list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[300px]">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8 space-y-4 text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-600 animate-float" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em]">Neural Link Established. Awaiting biometric query input...</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1 px-1">
                {msg.role === 'user' ? 'OPERATOR' : 'SENTINEL AGENT'}
              </span>
              <div 
                className={`max-w-[85%] p-3.5 rounded-2xl text-[11px] font-sans leading-relaxed shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none font-sans'
                }`}
              >
                {/* Clean inline rendering of responses */}
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {chatLoading && (
          <div className="flex flex-col items-start">
            <span className="text-[8px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 px-1">Thinking...</span>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-lg">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Actions list */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Suggested Operations</span>
        <div className="flex flex-wrap gap-2">
          {suggestedActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(action.query)}
              className="text-[9px] font-mono bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white px-2.5 py-1.5 rounded-lg transition-all duration-250 cursor-pointer"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Message Entry Form */}
      <div className="p-4 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800/60">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            sendChatMessage();
          }} 
          className="relative flex items-center"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type neural query..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-12 text-xs font-sans text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="absolute right-2.5 w-8.5 h-8.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center hover:from-blue-700 hover:to-blue-600 hover:scale-105 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
