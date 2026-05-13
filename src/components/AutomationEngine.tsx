/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from "react";
import { AutomationWorkflow, AutomationAction } from "../types";
import { Cog, Play, Pause, CheckCircle2, XCircle, Loader2, RefreshCw, Trash2, Bell, ArrowUpRight, Shield, Clock, ChevronDown, ChevronUp, Zap, RotateCcw, Activity, Server, AlertTriangle } from "lucide-react";

interface AutomationEngineProps {
  workflows: AutomationWorkflow[];
  quickActions: AutomationAction[];
  onRunAction: (action: AutomationAction) => void;
  onToggleWorkflow: (id: string) => void;
}

const typeIcon = (t: AutomationAction["type"]) => {
  if (t === "restart") return <RefreshCw className="w-3.5 h-3.5" />;
  if (t === "scale") return <ArrowUpRight className="w-3.5 h-3.5" />;
  if (t === "clear-logs") return <Trash2 className="w-3.5 h-3.5" />;
  if (t === "alert") return <Bell className="w-3.5 h-3.5" />;
  if (t === "rollback") return <RotateCcw className="w-3.5 h-3.5" />;
  if (t === "health-check") return <Activity className="w-3.5 h-3.5" />;
  return <Cog className="w-3.5 h-3.5" />;
};

const statusStyle = (s: AutomationAction["status"]) => {
  if (s === "completed") return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  if (s === "failed") return "bg-red-500/10 border-red-500/20 text-red-400";
  if (s === "running") return "bg-blue-500/10 border-blue-500/20 text-blue-400";
  return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
};

export default function AutomationEngine({ workflows, quickActions, onRunAction, onToggleWorkflow }: AutomationEngineProps) {
  const [expandedWf, setExpandedWf] = useState<string | null>(workflows[0]?.id || null);
  const [actionTarget, setActionTarget] = useState("");
  const [runningActions, setRunningActions] = useState<Set<string>>(new Set());

  const handleRunAction = (action: AutomationAction) => {
    const a = { ...action, target: actionTarget || action.target || "all-services" };
    setRunningActions(prev => new Set(prev).add(a.id));
    onRunAction(a);
    setTimeout(() => setRunningActions(prev => { const n = new Set(prev); n.delete(a.id); return n; }), 3000);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Automation Engine</h1>
          <p className="text-[var(--ink-muted)] text-sm">Automated workflows, quick actions, and auto-recovery playbooks.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-widest font-bold">
            {workflows.filter(w => w.enabled).length}/{workflows.length} workflows active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Quick Actions</h3>
            </div>
            <div className="mb-3">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)] mb-1 block">Target Service</label>
              <select value={actionTarget} onChange={e => setActionTarget(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)] transition-all">
                <option value="">All Services</option>
                <option value="auth-service">auth-service</option>
                <option value="api-gateway">api-gateway</option>
                <option value="payment-proxy">payment-proxy</option>
                <option value="data-processor">data-processor</option>
                <option value="notification-svc">notification-svc</option>
                <option value="log-aggregator">log-aggregator</option>
                <option value="redis-cache">redis-cache</option>
                <option value="postgres-db">postgres-db</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              {quickActions.map(action => (
                <button key={action.id} onClick={() => handleRunAction(action)} disabled={runningActions.has(action.id)} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all text-left group disabled:opacity-50">
                  <div className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                    {runningActions.has(action.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : typeIcon(action.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-bold">{action.name}</h4>
                    <p className="text-[9px] text-[var(--ink-muted)] truncate">{action.description}</p>
                  </div>
                  <Play className="w-3 h-3 text-[var(--ink-muted)] group-hover:text-[var(--accent)] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workflows */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <Cog className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Automated Workflows</h3>
          </div>
          {workflows.map(wf => (
            <div key={wf.id} className={`rounded-2xl bg-[var(--panel)] border transition-all overflow-hidden ${wf.enabled ? "border-[var(--border)]" : "border-[var(--border)] opacity-60"}`}>
              <div className="p-5 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedWf(expandedWf === wf.id ? null : wf.id)}>
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${wf.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"}`}>
                    <Cog className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm">{wf.name}</h3>
                    <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">{wf.description}</p>
                    <div className="flex gap-3 mt-2 flex-wrap">
                      <span className="text-[9px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--ink-muted)] font-mono">{wf.trigger}: {wf.triggerCondition}</span>
                      <span className="text-[9px] text-[var(--ink-muted)]">Runs: {wf.runCount}</span>
                      {wf.lastRun && <span className="text-[9px] text-[var(--ink-muted)] flex items-center gap-1"><Clock className="w-3 h-3" />Last: {new Date(wf.lastRun).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); onToggleWorkflow(wf.id); }} className={`relative w-10 h-5 rounded-full transition-all ${wf.enabled ? "bg-emerald-500" : "bg-zinc-600"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${wf.enabled ? "left-5.5" : "left-0.5"}`} style={{ left: wf.enabled ? 22 : 2 }} />
                  </button>
                  {expandedWf === wf.id ? <ChevronUp className="w-4 h-4 text-[var(--ink-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--ink-muted)]" />}
                </div>
              </div>

              {expandedWf === wf.id && (
                <div className="px-5 pb-5 border-t border-[var(--border)] pt-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)] mb-3">Execution Steps</div>
                  <div className="flex flex-col gap-2">
                    {wf.steps.map((step, i) => (
                      <div key={step.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${statusStyle(step.status)}`}>
                            {step.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : step.status === "failed" ? <XCircle className="w-3 h-3" /> : step.status === "running" ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-[8px] font-bold">{i + 1}</span>}
                          </div>
                          {i < wf.steps.length - 1 && <div className="w-px h-6 bg-[var(--border)]" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[10px] font-bold">{step.name}</h4>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border ${statusStyle(step.status)} font-bold uppercase`}>{step.status}</span>
                          </div>
                          <p className="text-[9px] text-[var(--ink-muted)] mt-0.5">{step.description}</p>
                          {step.result && <p className="text-[9px] mt-1 font-mono text-[var(--ink)] bg-white/[0.03] px-2 py-1 rounded border border-[var(--border)]">{step.result}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
