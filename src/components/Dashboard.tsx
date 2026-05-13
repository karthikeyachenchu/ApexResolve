/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from "react";
import { Metric, Container, ServiceInfo, NetworkActivity, Alert } from "../types";
import { Activity, Server, Cpu, Layers, Wifi, Bell, AlertTriangle, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, Shield, Clock, ArrowUpRight, ArrowDownRight, Database, Globe, Zap, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from "recharts";

interface DashboardProps {
  metrics: Metric[];
  containers: Container[];
  services: ServiceInfo[];
  networkActivity: NetworkActivity[];
  alerts: Alert[];
  onRestartContainer: (id: string) => void;
  onAcknowledgeAlert: (id: string) => void;
  onResolveAlert: (id: string) => void;
}

const statusColor = (s: string) => s === "running" || s === "healthy" ? "text-emerald-400" : s === "failed" || s === "down" ? "text-red-400" : s === "degraded" || s === "restarting" || s === "warning" ? "text-amber-400" : "text-zinc-400";
const statusBg = (s: string) => s === "running" || s === "healthy" ? "bg-emerald-500/10 border-emerald-500/20" : s === "failed" || s === "down" ? "bg-red-500/10 border-red-500/20" : s === "degraded" || s === "restarting" || s === "warning" ? "bg-amber-500/10 border-amber-500/20" : "bg-zinc-500/10 border-zinc-500/20";
const svcIcon = (t: string) => t === "api" ? Globe : t === "database" ? Database : t === "cache" ? Zap : t === "queue" ? BarChart3 : t === "gateway" ? Shield : Server;

export default function Dashboard({ metrics, containers, services, networkActivity, alerts, onRestartContainer, onAcknowledgeAlert, onResolveAlert }: DashboardProps) {
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const activeAlerts = alerts.filter(a => a.status !== "resolved");
  const displayedAlerts = showAllAlerts ? alerts : activeAlerts.slice(0, 4);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <div key={m.name} className="p-4 rounded-2xl bg-[var(--panel)] border border-[var(--border)] group hover:border-[var(--accent)]/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)] truncate">{m.name}</span>
              <div className={`w-2 h-2 rounded-full ${m.status === "normal" ? "bg-emerald-500" : m.status === "warning" ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-pulse"}`} />
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold">{m.value}</span>
              <span className="text-[10px] text-[var(--ink-muted)]">{m.unit}</span>
            </div>
            <div className="h-12 opacity-40 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={m.history.slice(-15)}>
                  <Area type="monotone" dataKey="value" stroke="var(--accent)" fill="var(--accent-soft)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Services Health Grid */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Service Health</h3>
              </div>
              <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {services.filter(s => s.status === "healthy").length}/{services.length} Healthy
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {services.map(svc => {
                const Icon = svcIcon(svc.type);
                return (
                  <div key={svc.id} className={`p-3 rounded-xl border ${statusBg(svc.status)} transition-all hover:scale-[1.02]`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-3.5 h-3.5 ${statusColor(svc.status)}`} />
                      <span className="text-[10px] font-bold truncate">{svc.name}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-[var(--ink-muted)]">
                      <span>{svc.uptime}% up</span>
                      <span>{svc.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-[var(--ink-muted)] mt-1">
                      <span>{svc.requestsPerMin} req/m</span>
                      <span className={svc.errorRate > 1 ? "text-red-400" : ""}>{svc.errorRate}% err</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Network Activity Chart */}
          <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Network Activity</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={networkActivity.slice(-30)}>
                  <XAxis dataKey="timestamp" tick={false} stroke="var(--border)" />
                  <YAxis tick={{ fontSize: 10, fill: "var(--ink-muted)" }} stroke="var(--border)" width={40} />
                  <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 11 }} />
                  <Area type="monotone" dataKey="inbound" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} name="Inbound KB/s" />
                  <Area type="monotone" dataKey="outbound" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} name="Outbound KB/s" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Container Table */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Container Orchestration</h3>
              </div>
              <span className="text-[9px] text-[var(--ink-muted)]">{containers.length} instances</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-[9px] uppercase tracking-widest font-bold text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-5 py-3">Container</th>
                    <th className="px-5 py-3">Image</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">CPU</th>
                    <th className="px-5 py-3">MEM</th>
                    <th className="px-5 py-3">Uptime</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {containers.map(c => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{c.name}</span>
                          <span className="text-[9px] text-[var(--ink-muted)] font-mono">{c.id}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[10px] font-mono text-[var(--ink-muted)]">{c.image}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusBg(c.status)} ${statusColor(c.status)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${c.status === "running" ? "bg-emerald-500" : c.status === "failed" ? "bg-red-500" : "bg-amber-500 animate-pulse"}`} />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono">{c.cpu}%</td>
                      <td className="px-5 py-3 text-xs font-mono">{c.memory}MB</td>
                      <td className="px-5 py-3 text-xs text-[var(--ink-muted)]">{c.uptime}</td>
                      <td className="px-5 py-3">
                        {(c.status === "failed" || c.status === "restarting") && (
                          <button onClick={() => onRestartContainer(c.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[9px] font-bold uppercase hover:bg-[var(--accent)]/10 transition-all">
                            <RefreshCw className="w-3 h-3" /> Restart
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Alerts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Alerts</h3>
              </div>
              {activeAlerts.length > 0 && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20 animate-pulse">
                  {activeAlerts.length} Active
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto terminal-scroll">
              {displayedAlerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded-xl border ${alert.severity === "critical" ? "border-red-500/30 bg-red-500/5" : alert.severity === "warning" ? "border-amber-500/30 bg-amber-500/5" : "border-blue-500/30 bg-blue-500/5"} ${alert.status === "resolved" ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-2 mb-1">
                    {alert.severity === "critical" ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" /> : alert.severity === "warning" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" /> : <Bell className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-bold leading-tight">{alert.title}</h4>
                      <p className="text-[9px] text-[var(--ink-muted)] mt-1 leading-relaxed">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[8px] text-[var(--ink-muted)]">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        {alert.status === "active" && (
                          <div className="flex gap-1 ml-auto">
                            <button onClick={() => onAcknowledgeAlert(alert.id)} className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-[var(--border)] hover:border-amber-500/50 text-[var(--ink-muted)] hover:text-amber-400 transition-all">ACK</button>
                            <button onClick={() => onResolveAlert(alert.id)} className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-[var(--border)] hover:border-emerald-500/50 text-[var(--ink-muted)] hover:text-emerald-400 transition-all">RESOLVE</button>
                          </div>
                        )}
                        {alert.status === "acknowledged" && <span className="text-[8px] text-amber-400 ml-auto">Acknowledged</span>}
                        {alert.status === "resolved" && <span className="text-[8px] text-emerald-400 ml-auto">Resolved</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {alerts.length > 4 && (
              <button onClick={() => setShowAllAlerts(!showAllAlerts)} className="flex items-center justify-center gap-1 w-full mt-3 py-2 rounded-lg border border-[var(--border)] text-[9px] font-bold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all">
                {showAllAlerts ? <><ChevronUp className="w-3 h-3" /> Show Less</> : <><ChevronDown className="w-3 h-3" /> Show All ({alerts.length})</>}
              </button>
            )}
          </div>

          {/* Cluster Health Summary */}
          <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Cluster Health</h3>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: "API Availability", val: 99.98, status: "stable" },
                { label: "Database Sync", val: 100, status: "stable" },
                { label: "Queue Depth", val: 72, status: "near-capacity" },
                { label: "Cache Hit Rate", val: 94.5, status: "stable" },
                { label: "Auth Latency", val: 12, status: "stable", max: 100 }
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-wide">{item.label}</span>
                    <span className="text-[10px] font-bold">{item.val}{item.max ? "ms" : "%"}</span>
                  </div>
                  <div className="h-1 bg-[var(--bg)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${item.status === "stable" ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(item.val, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
