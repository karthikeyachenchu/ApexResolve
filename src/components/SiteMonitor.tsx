/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Site Monitor — Enter a URL, get real health checks + performance data
 */
import { useState, useEffect, useCallback } from "react";
import { Globe, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, ArrowUpRight, AlertTriangle, Loader2, Link2, Shield, Zap, Wifi, WifiOff, ExternalLink, BarChart3, Activity } from "lucide-react";

export interface MonitoredSite {
  id: string;
  url: string;
  name: string;
  status: "up" | "down" | "checking" | "unknown";
  lastCheck: number | null;
  responseTime: number | null;
  statusCode: number | null;
  sslValid: boolean | null;
  uptime: number;       // percentage
  checksCount: number;
  failedChecks: number;
  history: { timestamp: number; status: "up" | "down"; responseTime: number }[];
  headers?: Record<string, string>;
  errorMessage?: string;
}

interface SiteMonitorProps {
  sites: MonitoredSite[];
  onAddSite: (url: string, name: string) => void;
  onRemoveSite: (id: string) => void;
  onCheckSite: (id: string) => void;
  onCheckAll: () => void;
}

export default function SiteMonitor({ sites, onAddSite, onRemoveSite, onCheckSite, onCheckAll }: SiteMonitorProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    const name = newName.trim() || new URL(url).hostname;
    onAddSite(url, name);
    setNewUrl("");
    setNewName("");
    setShowAdd(false);
  };

  const totalUp = sites.filter(s => s.status === "up").length;
  const totalDown = sites.filter(s => s.status === "down").length;
  const avgResponseTime = sites.filter(s => s.responseTime).reduce((s, site) => s + (site.responseTime || 0), 0) / Math.max(sites.filter(s => s.responseTime).length, 1);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Site Monitor</h1>
          <p className="text-[var(--ink-muted)] text-sm">Add websites and applications to monitor their health, uptime, SSL status, and response times.</p>
        </div>
        <div className="flex gap-3">
          {sites.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">{totalUp} Up</span>
              </div>
              {totalDown > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400">{totalDown} Down</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
                <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[10px] font-bold text-[var(--ink)]">{avgResponseTime.toFixed(0)}ms avg</span>
              </div>
            </>
          )}
          <button onClick={() => sites.length > 0 ? onCheckAll() : setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-red-500/20">
            {sites.length > 0 ? <><RefreshCw className="w-3.5 h-3.5" /> Check All</> : <><Plus className="w-3.5 h-3.5" /> Add Site</>}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sites.length === 0 && !showAdd && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="w-24 h-24 rounded-3xl bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center">
            <Globe className="w-12 h-12 text-[var(--ink-muted)]" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-2">No Sites Monitored Yet</h2>
            <p className="text-sm text-[var(--ink-muted)] mb-6">Add your website, API endpoint, or application URL to start monitoring its health, response time, SSL certificate status, and uptime.</p>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-red-500/20 mx-auto">
              <Plus className="w-4 h-4" /> Add Your First Site
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
            {[
              { icon: Activity, title: "Health Monitoring", desc: "Real-time HTTP health checks with status code tracking" },
              { icon: Zap, title: "Response Time", desc: "Measure load speed and track performance over time" },
              { icon: Shield, title: "SSL & Security", desc: "Verify SSL certificate validity and HTTPS enforcement" }
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[var(--panel)] border border-[var(--border)] text-center">
                <f.icon className="w-6 h-6 text-[var(--accent)] mx-auto mb-2" />
                <h3 className="text-xs font-bold mb-1">{f.title}</h3>
                <p className="text-[9px] text-[var(--ink-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Site Form */}
      {showAdd && (
        <div className="p-6 rounded-2xl bg-[var(--panel)] border border-[var(--accent)]/30 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Add Site to Monitor</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest mb-1 block">Website URL <span className="text-red-400">*</span></label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus-within:border-[var(--accent)] transition-all">
                <Link2 className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
                <input value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="https://example.com or api.myapp.com/health" className="flex-1 bg-transparent outline-none text-xs" autoFocus />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest mb-1 block">Display Name <span className="text-[var(--ink-muted)]">(optional)</span></label>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="My Production Site" className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)] transition-all" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleAdd} disabled={!newUrl.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold disabled:opacity-30 hover:brightness-110 transition-all">
                <Plus className="w-3.5 h-3.5" /> Start Monitoring
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all">Cancel</button>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-[var(--border)]">
            <div className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest mb-2">Quick Examples</div>
            <div className="flex flex-wrap gap-2">
              {["https://google.com", "https://github.com", "https://api.github.com", "https://httpstat.us/200", "https://httpstat.us/500"].map(url => (
                <button key={url} onClick={() => { setNewUrl(url); setNewName(""); }} className="text-[9px] px-2 py-1 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all font-mono">{url.replace("https://", "")}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Site Cards */}
      {sites.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Monitored Sites</h3>
            </div>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[10px] font-bold text-[var(--ink-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all">
              <Plus className="w-3 h-3" /> Add Site
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sites.map(site => (
              <div key={site.id} className={`rounded-2xl bg-[var(--panel)] border overflow-hidden transition-all cursor-pointer ${site.status === "up" ? "border-[var(--border)] hover:border-emerald-500/30" : site.status === "down" ? "border-red-500/20 hover:border-red-500/40" : "border-[var(--border)]"} ${selectedSite === site.id ? "ring-1 ring-[var(--accent)]" : ""}`} onClick={() => setSelectedSite(selectedSite === site.id ? null : site.id)}>
                <div className="p-4">
                  {/* Status & Name */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${site.status === "up" ? "bg-emerald-500/10" : site.status === "down" ? "bg-red-500/10" : "bg-zinc-500/10"}`}>
                        {site.status === "checking" ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : site.status === "up" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : site.status === "down" ? <XCircle className="w-5 h-5 text-red-400" /> : <Globe className="w-5 h-5 text-zinc-400" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{site.name}</h3>
                        <p className="text-[9px] text-[var(--ink-muted)] font-mono truncate max-w-[200px]">{site.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={site.url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--ink-muted)]"><ExternalLink className="w-3 h-3" /></a>
                      <button onClick={e => { e.stopPropagation(); onCheckSite(site.id); }} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--ink-muted)] hover:text-[var(--accent)]"><RefreshCw className={`w-3 h-3 ${site.status === "checking" ? "animate-spin" : ""}`} /></button>
                      <button onClick={e => { e.stopPropagation(); onRemoveSite(site.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--ink-muted)] hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-[var(--border)]/50">
                      <div className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">Response</div>
                      <div className="text-sm font-bold">{site.responseTime !== null ? `${site.responseTime}ms` : "—"}</div>
                    </div>
                    <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-[var(--border)]/50">
                      <div className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">Status</div>
                      <div className={`text-sm font-bold ${site.statusCode && site.statusCode < 400 ? "text-emerald-400" : site.statusCode ? "text-red-400" : ""}`}>{site.statusCode || "—"}</div>
                    </div>
                    <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-[var(--border)]/50">
                      <div className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">Uptime</div>
                      <div className={`text-sm font-bold ${site.uptime >= 99 ? "text-emerald-400" : site.uptime >= 95 ? "text-amber-400" : "text-red-400"}`}>{site.uptime.toFixed(1)}%</div>
                    </div>
                    <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-[var(--border)]/50">
                      <div className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">SSL</div>
                      <div className="text-sm font-bold">{site.sslValid === null ? "—" : site.sslValid ? <span className="text-emerald-400">Valid</span> : <span className="text-red-400">Invalid</span>}</div>
                    </div>
                  </div>

                  {/* Last check */}
                  {site.lastCheck && (
                    <div className="flex items-center gap-1 mt-3 text-[8px] text-[var(--ink-muted)]">
                      <Clock className="w-3 h-3" />
                      Last checked: {new Date(site.lastCheck).toLocaleTimeString()} • {site.checksCount} checks, {site.failedChecks} failed
                    </div>
                  )}

                  {/* Error message */}
                  {site.errorMessage && (
                    <div className="mt-2 px-2 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-[9px] text-red-400 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      {site.errorMessage}
                    </div>
                  )}
                </div>

                {/* Expanded: Response History */}
                {selectedSite === site.id && site.history.length > 0 && (
                  <div className="px-4 pb-4 border-t border-[var(--border)] pt-3">
                    <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Check History</div>
                    <div className="flex items-end gap-[2px] h-12">
                      {site.history.slice(-40).map((h, i) => (
                        <div key={i} className={`flex-1 rounded-t-sm min-w-[3px] transition-all ${h.status === "up" ? "bg-emerald-500/60" : "bg-red-500/60"}`} style={{ height: `${Math.min(100, Math.max(10, (h.responseTime / 10)))}%` }} title={`${h.responseTime}ms at ${new Date(h.timestamp).toLocaleTimeString()}`} />
                      ))}
                    </div>
                    <div className="flex justify-between text-[7px] text-[var(--ink-muted)] mt-1">
                      <span>Oldest</span>
                      <span>Response time (height = speed)</span>
                      <span>Latest</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
