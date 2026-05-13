/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from "react";
import { LogEntry, Incident, LogLevel } from "../types";
import { Search, Filter, AlertTriangle, CheckCircle2, XCircle, Clock, FileText, Brain, Loader2, ChevronDown, Terminal, ArrowDown, Pause, Play, Eye } from "lucide-react";

interface LogAnalysisProps {
  logs: LogEntry[];
  incidents: Incident[];
  onAnalyzeIncident: (incident: Incident) => void;
  isAnalyzing: boolean;
}

const levelColor: Record<LogLevel, string> = {
  INFO: "text-blue-400",
  WARN: "text-amber-400",
  ERROR: "text-red-400",
  DEBUG: "text-zinc-500",
  FATAL: "text-red-500 font-bold"
};

const levelBg: Record<LogLevel, string> = {
  INFO: "bg-blue-500/10 border-blue-500/20",
  WARN: "bg-amber-500/10 border-amber-500/20",
  ERROR: "bg-red-500/10 border-red-500/20",
  DEBUG: "bg-zinc-500/10 border-zinc-500/20",
  FATAL: "bg-red-500/20 border-red-500/30"
};

export default function LogAnalysis({ logs, incidents, onAnalyzeIncident, isAnalyzing }: LogAnalysisProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "ALL">("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const services = Array.from(new Set(logs.map(l => l.service)));

  const filteredLogs = logs.filter(l => {
    if (levelFilter !== "ALL" && l.level !== levelFilter) return false;
    if (serviceFilter !== "ALL" && l.service !== serviceFilter) return false;
    if (searchQuery && !l.message.toLowerCase().includes(searchQuery.toLowerCase()) && !l.service.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const errorCount = logs.filter(l => l.level === "ERROR" || l.level === "FATAL").length;
  const warnCount = logs.filter(l => l.level === "WARN").length;

  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, isStreaming]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Log Analysis & Incidents</h1>
          <p className="text-[var(--ink-muted)] text-sm">Real-time log streaming, error detection, and AI-powered incident analysis.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400">{errorCount} Errors</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-amber-400">{warnCount} Warnings</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Log Stream */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-muted)]" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search logs..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)] transition-all" />
            </div>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value as any)} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)]">
              <option value="ALL">All Levels</option>
              {(["INFO", "WARN", "ERROR", "DEBUG", "FATAL"] as LogLevel[]).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)]">
              <option value="ALL">All Services</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setIsStreaming(!isStreaming)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${isStreaming ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[var(--panel)] border-[var(--border)] text-[var(--ink-muted)]"}`}>
              {isStreaming ? <><Pause className="w-3 h-3" /> Live</> : <><Play className="w-3 h-3" /> Paused</>}
            </button>
          </div>

          {/* Log Entries */}
          <div ref={scrollRef} className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] overflow-hidden max-h-[600px] overflow-y-auto terminal-scroll">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-[var(--panel)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Log Stream</span>
              </div>
              <span className="text-[9px] text-[var(--ink-muted)]">{filteredLogs.length} entries</span>
            </div>
            <div className="font-mono text-[11px] divide-y divide-[var(--border)]/50">
              {filteredLogs.map(entry => (
                <div key={entry.id} className={`px-4 py-2 flex gap-3 hover:bg-white/[0.02] transition-colors ${entry.level === "ERROR" || entry.level === "FATAL" ? "bg-red-500/[0.03]" : ""}`}>
                  <span className="text-[9px] text-[var(--ink-muted)] shrink-0 w-20">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className={`text-[9px] font-bold shrink-0 w-10 ${levelColor[entry.level]}`}>{entry.level}</span>
                  <span className="text-[10px] text-[var(--accent)] shrink-0 w-28 truncate">{entry.service}</span>
                  <span className="text-[10px] text-[var(--ink)] flex-1 break-all">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Incidents Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Detected Incidents</h3>
            </div>
            <div className="flex flex-col gap-3">
              {incidents.map(inc => (
                <div key={inc.id} className={`p-3 rounded-xl border cursor-pointer transition-all ${inc.severity === "critical" ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50" : inc.severity === "warning" ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50" : "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50"} ${selectedIncident?.id === inc.id ? "ring-1 ring-[var(--accent)]" : ""}`} onClick={() => setSelectedIncident(selectedIncident?.id === inc.id ? null : inc)}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-[10px] font-bold leading-tight">{inc.title}</h4>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${inc.status === "open" ? "bg-red-500/10 text-red-400" : inc.status === "investigating" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>{inc.status}</span>
                  </div>
                  <p className="text-[9px] text-[var(--ink-muted)] mb-2">{inc.description}</p>
                  <div className="flex items-center gap-2 text-[8px] text-[var(--ink-muted)]">
                    <Clock className="w-3 h-3" />
                    {new Date(inc.createdAt).toLocaleString()}
                  </div>
                  {inc.affectedServices.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {inc.affectedServices.map(s => <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border)] text-[var(--ink-muted)]">{s}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Incident Analysis */}
          {selectedIncident && (
            <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--accent)]/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">AI Analysis</h3>
                </div>
                {!selectedIncident.aiSummary && (
                  <button onClick={() => onAnalyzeIncident(selectedIncident)} disabled={isAnalyzing} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-[9px] font-bold disabled:opacity-50">
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />} Analyze
                  </button>
                )}
              </div>
              {selectedIncident.aiSummary ? (
                <div className="text-[10px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap bg-white/[0.02] p-3 rounded-lg border border-[var(--border)]">{selectedIncident.aiSummary}</div>
              ) : (
                <p className="text-[10px] text-[var(--ink-muted)] italic">Click "Analyze" for AI-generated root cause analysis and remediation recommendations.</p>
              )}

              {/* Incident Timeline */}
              {selectedIncident.timeline.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)] mb-2">Timeline</h4>
                  <div className="flex flex-col gap-2">
                    {selectedIncident.timeline.map((evt, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${evt.type === "detection" ? "bg-red-500/20 text-red-400" : evt.type === "action" ? "bg-blue-500/20 text-blue-400" : evt.type === "resolution" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          </div>
                          {i < selectedIncident.timeline.length - 1 && <div className="w-px flex-1 bg-[var(--border)]" />}
                        </div>
                        <div className="pb-2">
                          <span className="text-[8px] text-[var(--ink-muted)]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                          <p className="text-[9px] text-[var(--ink)]">{evt.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
