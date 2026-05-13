/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Terminal, ShieldAlert, CheckCircle2, Copy, Download, History as HistoryIcon, Clock, ChevronDown, Check, GitBranch } from "lucide-react";
import { AnalysisReport, RiskLevel } from "../types";
import { useState } from "react";

interface AnalysisResultProps {
  report: AnalysisReport | null;
  history: AnalysisReport[];
  error: string | null;
  onSelectHistory: (report: AnalysisReport) => void;
}

export default function AnalysisResult({ report, history, error, onSelectHistory }: AnalysisResultProps) {
  const [showPlan, setShowPlan] = useState(true);

  const getRiskStyles = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.HIGH: return { text: "text-[var(--error)]", bg: "bg-red-500/10", border: "border-red-500/30", icon: ShieldAlert };
      case RiskLevel.MEDIUM: return { text: "text-[var(--warning)]", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: AlertCircle };
      case RiskLevel.LOW: return { text: "text-[var(--success)]", bg: "bg-green-500/10", border: "border-green-500/30", icon: CheckCircle2 };
      default: return { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", icon: Terminal };
    }
  };

  const RiskIcon = report ? getRiskStyles(report.riskLevel).icon : Terminal;
  const riskStyles = report ? getRiskStyles(report.riskLevel) : { text: "", bg: "", border: "" };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadReport = (report: AnalysisReport) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `nexus_report_${report.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/5 flex items-start gap-4"
          >
            <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0" />
            <div>
              <h3 className="font-bold text-[var(--error)] text-sm mb-1 uppercase tracking-tight">Jules Engine Fault</h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{error}</p>
            </div>
          </motion.div>
        ) : !report ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed border-[var(--border)]"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Terminal className="w-6 h-6 text-[var(--ink-muted)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--ink)] mb-1 uppercase tracking-widest">Awaiting ApexResolve Protocol</h3>
            <p className="text-[10px] text-[var(--ink-muted)] text-center max-w-[240px] uppercase tracking-tighter">
              Diagnostic engine is in standby. Stream logs to initiate.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${riskStyles.bg} border ${riskStyles.border}`}>
                  <RiskIcon className={`w-5 h-5 ${riskStyles.text}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{report.id} / <span className={riskStyles.text}>{report.riskLevel} RISK</span></h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] text-[var(--ink-muted)] uppercase font-mono">{report.environment} ENV</span>
                    <span className="text-[9px] text-[var(--ink-muted)] font-mono">•</span>
                    <span className="text-[9px] text-[var(--ink-muted)] font-mono">{new Date(report.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={() => downloadReport(report)}
                  className="p-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--ink-muted)] hover:text-white transition-all"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Root Cause Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                 <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)] flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                   Analysis Summary
                 </div>
                 <div className="p-6 rounded-2xl bg-white/[0.02] border border-[var(--border)] text-lg font-light leading-relaxed">
                   "{report.rootCause}"
                 </div>
              </div>

              {/* Execution Plan (Jules style) */}
              <div className="flex flex-col gap-4">
                <div 
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)] flex items-center justify-between cursor-pointer group"
                  onClick={() => setShowPlan(!showPlan)}
                >
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-3.5 h-3.5" />
                    Proposed Plan
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPlan ? "" : "-rotate-90"}`} />
                </div>
                {showPlan && (
                  <div className="flex flex-col gap-4">
                    {report.plan.map((step, idx) => (
                      <div key={idx} className="flex gap-3 h-full">
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step.status === 'completed' ? 'bg-[var(--success)] text-black' :
                            step.status === 'current' ? 'bg-[var(--accent)] text-white animate-pulse' :
                            'bg-[var(--border)] text-[var(--ink-muted)]'
                          }`}>
                            {step.status === 'completed' ? <Check className="w-3 h-3" /> : idx + 1}
                          </div>
                          {idx !== report.plan.length - 1 && <div className="w-px flex-1 bg-[var(--border)] my-1" />}
                        </div>
                        <div className="pb-4">
                          <h4 className={`text-xs font-bold uppercase mb-1 ${step.status === 'pending' ? 'text-white/40' : 'text-white'}`}>{step.title}</h4>
                          <p className={`text-[10px] leading-normal ${step.status === 'pending' ? 'text-white/30' : 'text-white/90'}`}>{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Code Diff (Jules style) */}
            {report.codeDiff && (
              <div className="flex flex-col gap-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)] flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  Jules Suggested Refactor: {report.codeDiff.filename}
                </div>
                <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-gray-950 font-mono text-xs">
                  <div className="bg-white/5 px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--ink-muted)]">{report.codeDiff.filename}</span>
                    <span className="text-[9px] text-[var(--accent)] uppercase font-bold tracking-widest">Simulated Patch</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-1 overflow-x-auto scrollbar-none">
                    {report.codeDiff.before.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="w-6 text-red-500 opacity-50 text-right select-none">-</span>
                        <span className="bg-red-500/10 text-red-300 px-1">{line}</span>
                      </div>
                    ))}
                    {report.codeDiff.after.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="w-6 text-green-500 opacity-50 text-right select-none">+</span>
                        <span className="bg-green-500/10 text-green-300 px-1">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Final Action */}
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Remediation Script</div>
              <div className="p-4 rounded-xl bg-black border border-[var(--border)] group/cmd flex items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/cmd:opacity-100 transition-opacity" />
                <code className="text-sm font-mono text-[var(--success)] flex-1 overflow-x-auto whitespace-nowrap scrollbar-none relative z-10">
                  <span className="opacity-40 mr-2">$</span>{report.fixCommand}
                </code>
                <button 
                  onClick={() => copyToClipboard(report.fixCommand)}
                  className="p-2.5 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-white transition-all relative z-10"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
         <div className="mt-auto pt-8 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 mb-4">
            <HistoryIcon className="w-4 h-4 text-[var(--ink-muted)]" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Archived Protocols</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectHistory(item)}
                className={`flex-shrink-0 w-52 p-4 rounded-2xl border transition-all text-left group ${
                  report?.id === item.id 
                    ? "bg-[var(--accent-soft)] border-[var(--accent)]" 
                    : "bg-[var(--panel)] border-[var(--border)] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${getRiskStyles(item.riskLevel).text} ${getRiskStyles(item.riskLevel).border}`}>
                    {item.riskLevel}
                  </span>
                  <span className="text-[8px] text-[var(--ink-muted)] font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-[var(--ink)] line-clamp-2 font-medium mb-2 group-hover:text-[var(--accent)] transition-colors">
                  {item.rootCause}
                </p>
                <div className="text-[8px] uppercase tracking-widest text-[var(--ink-muted)] font-mono">
                  {item.environment}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
