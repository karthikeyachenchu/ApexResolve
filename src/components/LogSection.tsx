/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from "react";
import { Upload, Trash2, Send, Cpu, Globe, Database, Server } from "lucide-react";
import { Environment } from "../types";

interface LogSectionProps {
  onAnalyze: (logs: string, env: Environment) => void;
  isLoading: boolean;
}

export default function LogSection({ onAnalyze, isLoading }: LogSectionProps) {
  const [logs, setLogs] = useState("");
  const [env, setEnv] = useState<Environment>("Production");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (logs.trim()) {
      onAnalyze(logs, env);
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogs(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const envs: { label: Environment; icon: any }[] = [
    { label: "Production", icon: Globe },
    { label: "Staging", icon: Server },
    { label: "Development", icon: Database },
    { label: "Local", icon: Cpu },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-xl">
      <div className="flex flex-col gap-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)] flex items-center gap-2">
          <Server className="w-3 h-3" />
          Target Environment
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {envs.map((item) => (
            <button
              key={item.label}
              onClick={() => setEnv(item.label)}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 px-3 py-3 rounded-xl border text-xs font-semibold transition-all duration-300 group ${
                env === item.label
                  ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg shadow-red-500/20"
                  : "bg-[var(--bg)] border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              <item.icon className={`w-4 h-4 transition-transform duration-300 ${env === item.label ? "scale-110" : "group-hover:scale-110"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Diagnostic Data</label>
          <div className="flex items-center gap-2">
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".log,.txt"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-[var(--border)] hover:border-white/20 text-[10px] font-bold text-[var(--ink-muted)] transition-all uppercase tracking-wider"
            >
              <Upload className="w-3 h-3" />
              Upload LOG
            </button>
            <button 
              onClick={() => setLogs("")}
              className="p-1 px-2 rounded bg-white/5 border border-[var(--border)] hover:border-red-500/50 hover:text-red-400 text-[10px] text-[var(--ink-muted)] transition-all uppercase font-bold"
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="relative">
          <textarea
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            placeholder="Paste system logs or stack traces..."
            className="w-full h-80 p-4 font-mono text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none terminal-scroll"
          />
          {!logs && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <Upload className="w-12 h-12 skew-y-12" />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !logs.trim()}
        className="w-full py-3.5 rounded-lg bg-[var(--accent)] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-30 flex-shrink-0"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            Analyze Diagnostic Data
          </>
        )}
      </button>
    </div>
  );
}
