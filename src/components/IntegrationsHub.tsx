/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import { Integration, IntegrationCategory, IntegrationStatus, PrometheusMetric, NagiosHost, ElkLogEntry, GrafanaDashboard, PagerDutyIncident, GitHubPullRequest, GitHubCommit, JenkinsQueueItem, JenkinsExecutor, JenkinsPipelineConfig, getIntegrationStats, getPrometheusMetrics, getNagiosHosts, getElkLogs, getGrafanaDashboards, getPagerDutyIncidents, getGitHubPullRequests, getGitHubCommits, getJenkinsQueue, getJenkinsExecutors, getJenkinsPipelineConfigs } from "../services/integrationsService";
import { Plug, CheckCircle2, XCircle, AlertTriangle, Settings, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, ExternalLink, Search, Eye, EyeOff, Loader2, Unplug, Zap, Database, BarChart3, Bell, Server, GitPullRequest, GitCommit, GitBranch, Clock, Terminal } from "lucide-react";

interface IntegrationsHubProps {
  integrations: Integration[];
  onUpdateStatus: (id: string, status: IntegrationStatus) => void;
}

const catLabel: Record<IntegrationCategory, string> = { monitoring: "Monitoring", logging: "Log Management", visualization: "Visualization", incident: "Incident Management", infrastructure: "Infrastructure" };
const catIcon: Record<IntegrationCategory, any> = { monitoring: Server, logging: Database, visualization: BarChart3, incident: Bell, infrastructure: Zap };
const statusDot = (s: IntegrationStatus) => s === "connected" ? "bg-emerald-500" : s === "degraded" ? "bg-amber-500 animate-pulse" : s === "configuring" ? "bg-blue-500 animate-pulse" : "bg-zinc-500";
const statusLabel = (s: IntegrationStatus) => s === "connected" ? "Connected" : s === "degraded" ? "Degraded" : s === "configuring" ? "Configuring" : "Disconnected";

export default function IntegrationsHub({ integrations, onUpdateStatus }: IntegrationsHubProps) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<IntegrationCategory | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());

  // Tool detail data
  const [promMetrics, setPromMetrics] = useState<PrometheusMetric[]>([]);
  const [nagiosHosts, setNagiosHosts] = useState<NagiosHost[]>([]);
  const [elkLogs, setElkLogs] = useState<ElkLogEntry[]>([]);
  const [grafanaDash, setGrafanaDash] = useState<GrafanaDashboard[]>([]);
  const [pdIncidents, setPdIncidents] = useState<PagerDutyIncident[]>([]);
  const [ghPRs, setGhPRs] = useState<GitHubPullRequest[]>([]);
  const [ghCommits, setGhCommits] = useState<GitHubCommit[]>([]);
  const [jQueue, setJQueue] = useState<JenkinsQueueItem[]>([]);
  const [jExecutors, setJExecutors] = useState<JenkinsExecutor[]>([]);
  const [jPipelines, setJPipelines] = useState<JenkinsPipelineConfig[]>([]);
  const [showJenkinsfile, setShowJenkinsfile] = useState<string | null>(null);

  useEffect(() => {
    setPromMetrics(getPrometheusMetrics());
    setNagiosHosts(getNagiosHosts());
    setElkLogs(getElkLogs());
    setGrafanaDash(getGrafanaDashboards());
    setPdIncidents(getPagerDutyIncidents());
    setGhPRs(getGitHubPullRequests());
    setGhCommits(getGitHubCommits());
    setJQueue(getJenkinsQueue());
    setJExecutors(getJenkinsExecutors());
    setJPipelines(getJenkinsPipelineConfigs());
  }, []);

  const stats = getIntegrationStats(integrations);
  const filtered = integrations.filter(i => {
    if (catFilter !== "all" && i.category !== catFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = Array.from(new Set(integrations.map(i => i.category)));

  const handleSync = (id: string) => {
    setSyncing(p => new Set(p).add(id));
    setTimeout(() => setSyncing(p => { const n = new Set(p); n.delete(id); return n; }), 2000);
  };

  const handleToggle = (id: string) => {
    const i = integrations.find(x => x.id === id);
    if (i) onUpdateStatus(id, i.status === "disconnected" ? "connected" : "disconnected");
  };

  const trendIcon = (t?: string) => t === "up" ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : t === "down" ? <ArrowDownRight className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-zinc-500" />;

  // Detail panel renderer
  const renderDetail = (id: string) => {
    if (id === "prometheus") return (
      <div className="mt-3 p-3 rounded-lg bg-black/20 border border-[var(--border)] font-mono text-[10px] max-h-48 overflow-y-auto terminal-scroll">
        <div className="text-[9px] font-bold text-[var(--accent)] mb-2 font-sans uppercase tracking-widest">Live PromQL Metrics</div>
        {promMetrics.map((m, i) => (
          <div key={i} className="flex gap-2 py-0.5 border-b border-[var(--border)]/30">
            <span className="text-emerald-400 shrink-0">{m.name}</span>
            <span className="text-zinc-500">{`{${Object.entries(m.labels).map(([k,v]) => `${k}="${v}"`).join(",")}}`}</span>
            <span className="ml-auto text-[var(--ink)] font-bold">{typeof m.value === "number" && m.value > 1000 ? m.value.toLocaleString() : m.value}</span>
          </div>
        ))}
      </div>
    );
    if (id === "nagios") return (
      <div className="mt-3 space-y-2">
        <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">Host Status</div>
        {nagiosHosts.map(h => (
          <div key={h.name} className={`p-2 rounded-lg border ${h.status === "UP" ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold">{h.name}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${h.status === "UP" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{h.status}</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {h.services.map(s => (
                <span key={s.name} className={`text-[8px] px-1.5 py-0.5 rounded border ${s.status === "OK" ? "border-emerald-500/20 text-emerald-400" : s.status === "WARNING" ? "border-amber-500/20 text-amber-400" : "border-red-500/20 text-red-400"}`}>{s.name}: {s.status}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
    if (id === "elk" || id === "splunk") return (
      <div className="mt-3 p-3 rounded-lg bg-black/20 border border-[var(--border)] font-mono text-[10px] max-h-48 overflow-y-auto terminal-scroll">
        <div className="text-[9px] font-bold text-[var(--accent)] mb-2 font-sans uppercase tracking-widest">{id === "elk" ? "Elasticsearch" : "Splunk"} Recent Events</div>
        {elkLogs.map((l, i) => (
          <div key={i} className="flex gap-2 py-0.5 border-b border-[var(--border)]/30">
            <span className="text-zinc-500 shrink-0 w-20">{new Date(l.timestamp).toLocaleTimeString()}</span>
            <span className={`shrink-0 w-10 font-bold ${l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-amber-400" : "text-blue-400"}`}>{l.level.toUpperCase()}</span>
            <span className="text-[var(--accent)] shrink-0 w-24">{l.source}</span>
            <span className="text-[var(--ink)]">{l.message}</span>
          </div>
        ))}
      </div>
    );
    if (id === "grafana") return (
      <div className="mt-3 space-y-2">
        <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">Dashboards</div>
        {grafanaDash.map(d => (
          <div key={d.uid} className="flex items-center gap-3 p-2 rounded-lg border border-[var(--border)] bg-white/[0.02] hover:border-orange-500/30 transition-all">
            <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
            <div className="flex-1">
              <span className="text-[10px] font-bold">{d.title}</span>
              <span className="text-[8px] text-[var(--ink-muted)] ml-2">{d.panelCount} panels</span>
            </div>
            {d.starred && <span className="text-amber-400 text-[10px]">★</span>}
          </div>
        ))}
      </div>
    );
    if (id === "pagerduty" || id === "opsgenie") return (
      <div className="mt-3 space-y-2">
        <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">{id === "pagerduty" ? "PagerDuty" : "OpsGenie"} Incidents</div>
        {pdIncidents.map(inc => (
          <div key={inc.id} className={`p-2 rounded-lg border ${inc.status === "triggered" ? "border-red-500/20 bg-red-500/5" : inc.status === "acknowledged" ? "border-amber-500/20 bg-amber-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold">{inc.title}</span>
              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${inc.status === "triggered" ? "text-red-400" : inc.status === "acknowledged" ? "text-amber-400" : "text-emerald-400"}`}>{inc.status}</span>
            </div>
            <div className="flex gap-3 text-[8px] text-[var(--ink-muted)] mt-1">
              <span>{inc.id}</span><span>→ {inc.assignee}</span><span>{inc.urgency} urgency</span>
            </div>
          </div>
        ))}
      </div>
    );
    if (id === "github") return (
      <div className="mt-3 space-y-3">
        <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">Pull Requests</div>
        {ghPRs.map(pr => (
          <div key={pr.id} className={`p-2.5 rounded-lg border ${pr.status === "merged" ? "border-purple-500/20 bg-purple-500/5" : pr.status === "closed" ? "border-zinc-500/20 bg-zinc-500/5" : pr.checks === "failing" ? "border-red-500/20 bg-red-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
            <div className="flex items-center gap-2 mb-1">
              <GitPullRequest className={`w-3 h-3 ${pr.status === "merged" ? "text-purple-400" : pr.status === "closed" ? "text-zinc-400" : "text-emerald-400"}`} />
              <span className="text-[10px] font-bold flex-1 truncate">#{pr.id} {pr.title}</span>
              <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold uppercase ${pr.status === "merged" ? "text-purple-400 bg-purple-500/20" : pr.status === "open" ? "text-emerald-400 bg-emerald-500/20" : "text-zinc-400 bg-zinc-500/20"}`}>{pr.status}</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] text-[var(--ink-muted)]">
              <span>{pr.author}</span>
              <span>•</span>
              <span className="font-mono">{pr.branch} → {pr.baseBranch}</span>
              <span>•</span>
              <span className="text-emerald-400">+{pr.additions}</span>
              <span className="text-red-400">-{pr.deletions}</span>
              <span>•</span>
              <span>{pr.files} files</span>
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {pr.labels.map(l => <span key={l} className="text-[7px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{l}</span>)}
              <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold ${pr.checks === "passing" ? "bg-emerald-500/10 text-emerald-400" : pr.checks === "failing" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>CI: {pr.checks}</span>
              <span className={`text-[7px] px-1.5 py-0.5 rounded ${pr.reviewStatus === "approved" ? "bg-emerald-500/10 text-emerald-400" : pr.reviewStatus === "changes_requested" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-500/10 text-zinc-400"}`}>{pr.reviewStatus.replace("_", " ")}</span>
            </div>
          </div>
        ))}
        <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest mt-3">Recent Commits</div>
        <div className="p-2 rounded-lg bg-black/20 border border-[var(--border)] font-mono text-[9px] max-h-36 overflow-y-auto terminal-scroll">
          {ghCommits.map(c => (
            <div key={c.sha} className="flex items-start gap-2 py-1 border-b border-[var(--border)]/30">
              <GitCommit className="w-3 h-3 text-[var(--accent)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[var(--ink)] truncate block">{c.message}</span>
                <div className="flex gap-2 text-[var(--ink-muted)]">
                  <span className="text-amber-400">{c.sha}</span>
                  <span>{c.author}</span>
                  <span className="text-emerald-400">+{c.additions}</span>
                  <span className="text-red-400">-{c.deletions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    if (id === "jenkins") return (
      <div className="mt-3 space-y-3">
        <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">Build Executors</div>
        <div className="grid grid-cols-2 gap-2">
          {jExecutors.map(e => (
            <div key={e.id} className={`p-2 rounded-lg border ${e.status === "building" ? "border-blue-500/20 bg-blue-500/5" : e.status === "idle" ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-500/20 bg-zinc-500/5 opacity-60"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${e.status === "building" ? "bg-blue-400 animate-pulse" : e.status === "idle" ? "bg-emerald-400" : "bg-zinc-500"}`} />
                <span className="text-[9px] font-bold">{e.name}</span>
                <span className={`text-[7px] uppercase ml-auto font-bold ${e.status === "building" ? "text-blue-400" : e.status === "idle" ? "text-emerald-400" : "text-zinc-500"}`}>{e.status}</span>
              </div>
              {e.currentBuild && <span className="text-[8px] text-[var(--ink-muted)] font-mono">{e.currentBuild}</span>}
              {e.progress !== undefined && (
                <div className="mt-1 h-1 bg-[var(--bg)] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${e.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">Build Queue ({jQueue.length})</div>
        {jQueue.map(q => (
          <div key={q.id} className="p-2 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
            <Clock className="w-3 h-3 text-amber-400" />
            <div className="flex-1">
              <span className="text-[9px] font-bold">{q.jobName}</span>
              <span className="text-[8px] text-[var(--ink-muted)] block">{q.why}</span>
            </div>
            <span className="text-[8px] text-amber-400">~{q.estimatedDuration}</span>
          </div>
        ))}
        <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">Pipeline Configs</div>
        {jPipelines.map(p => (
          <div key={p.jobName} className="p-2 rounded-lg border border-[var(--border)] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold">{p.jobName}</span>
              <button onClick={() => setShowJenkinsfile(showJenkinsfile === p.jobName ? null : p.jobName)} className="text-[7px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-bold hover:brightness-110">
                {showJenkinsfile === p.jobName ? "Hide" : "View"} Jenkinsfile
              </button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {p.triggers.map(t => <span key={t} className="text-[7px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{t}</span>)}
            </div>
            {showJenkinsfile === p.jobName && (
              <div className="mt-2 p-2 rounded-lg bg-black/40 border border-[var(--border)] font-mono text-[9px] max-h-48 overflow-y-auto terminal-scroll">
                <div className="flex items-center gap-1 mb-1 text-[8px] text-[var(--ink-muted)] font-sans font-bold uppercase"><Terminal className="w-3 h-3" /> Jenkinsfile</div>
                {p.jenkinsfile.split('\n').map((line, i) => (
                  <div key={i} className={`${line.includes("stage(") ? "text-blue-400" : line.includes("sh ") ? "text-emerald-400" : line.includes("post") || line.includes("failure") ? "text-red-400" : "text-zinc-400"}`}>{line || "\u00A0"}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
    return null;
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Integrations Hub</h1>
          <p className="text-[var(--ink-muted)] text-sm">Connect, monitor, and manage all your DevOps tools from a unified control plane.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Plug className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">{stats.connected}/{stats.total} Connected</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
            <BarChart3 className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[10px] font-bold text-[var(--ink)]">{stats.totalMetrics.toLocaleString()} metrics</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-[var(--ink)]">{stats.totalAlerts} alerts</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)] transition-all" />
        </div>
        <div className="flex gap-1 bg-[var(--panel)] p-1 rounded-xl border border-[var(--border)]">
          <button onClick={() => setCatFilter("all")} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${catFilter === "all" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}>All</button>
          {categories.map(c => {
            const Icon = catIcon[c];
            return (
              <button key={c} onClick={() => setCatFilter(c)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${catFilter === c ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}>
                <Icon className="w-3 h-3" />{catLabel[c]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(intg => (
          <div key={intg.id} className={`rounded-2xl bg-[var(--panel)] border transition-all overflow-hidden ${intg.status === "connected" ? "border-[var(--border)] hover:border-emerald-500/30" : intg.status === "degraded" ? "border-amber-500/20 hover:border-amber-500/40" : "border-[var(--border)] opacity-70 hover:opacity-100"}`}>
            {/* Card Header */}
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${intg.color}15`, border: `1px solid ${intg.color}30` }}>
                {intg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{intg.name}</h3>
                  <div className={`w-2 h-2 rounded-full ${statusDot(intg.status)}`} />
                  <span className="text-[8px] text-[var(--ink-muted)] uppercase font-bold ml-auto">{statusLabel(intg.status)}</span>
                </div>
                <p className="text-[9px] text-[var(--ink-muted)] mt-0.5 line-clamp-1">{intg.description}</p>
                {intg.version && <span className="text-[8px] text-[var(--ink-muted)] font-mono">v{intg.version}</span>}
              </div>
            </div>

            {/* Data Points */}
            {intg.dataPoints && intg.status !== "disconnected" && (
              <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                {intg.dataPoints.map(dp => (
                  <div key={dp.label} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.03] border border-[var(--border)]/50">
                    <div>
                      <div className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">{dp.label}</div>
                      <div className="text-[11px] font-bold">{dp.value}</div>
                    </div>
                    {trendIcon(dp.trend)}
                  </div>
                ))}
              </div>
            )}

            {/* Actions Bar */}
            <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
              {intg.lastSync && intg.status !== "disconnected" && (
                <span className="text-[8px] text-[var(--ink-muted)]">Synced {Math.round((Date.now() - intg.lastSync) / 1000)}s ago</span>
              )}
              <div className="flex gap-1 ml-auto">
                {intg.status !== "disconnected" && (
                  <>
                    <button onClick={() => handleSync(intg.id)} disabled={syncing.has(intg.id)} className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all" title="Sync">
                      {syncing.has(intg.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    </button>
                    <button onClick={() => setDetailView(detailView === intg.id ? null : intg.id)} className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-blue-400 hover:border-blue-500/30 transition-all" title="View Data">
                      {detailView === intg.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </>
                )}
                <button onClick={() => setShowConfig(showConfig === intg.id ? null : intg.id)} className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--ink)]/30 transition-all" title="Settings">
                  <Settings className="w-3 h-3" />
                </button>
                <button onClick={() => handleToggle(intg.id)} className={`p-1.5 rounded-lg border transition-all ${intg.status === "disconnected" ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-red-500/30 text-red-400 hover:bg-red-500/10"}`} title={intg.status === "disconnected" ? "Connect" : "Disconnect"}>
                  {intg.status === "disconnected" ? <Plug className="w-3 h-3" /> : <Unplug className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Detail View */}
            {detailView === intg.id && intg.status !== "disconnected" && (
              <div className="px-4 pb-4 border-t border-[var(--border)]">
                {renderDetail(intg.id) || (
                  <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-[var(--border)] text-[10px] text-[var(--ink-muted)]">
                    <div className="text-[9px] font-bold text-[var(--accent)] mb-2 uppercase tracking-widest">Connection Info</div>
                    {intg.endpoint && <div className="flex gap-2 mb-1"><span className="text-zinc-500">Endpoint:</span><span className="font-mono text-[var(--ink)]">{intg.endpoint}</span></div>}
                    {intg.metricsCount !== undefined && intg.metricsCount > 0 && <div className="flex gap-2 mb-1"><span className="text-zinc-500">Metrics:</span><span className="font-mono text-[var(--ink)]">{intg.metricsCount.toLocaleString()}</span></div>}
                    {intg.alertsCount !== undefined && intg.alertsCount > 0 && <div className="flex gap-2"><span className="text-zinc-500">Active Alerts:</span><span className="font-mono text-amber-400">{intg.alertsCount}</span></div>}
                  </div>
                )}
              </div>
            )}

            {/* Config Panel */}
            {showConfig === intg.id && intg.configFields && (
              <div className="px-4 pb-4 border-t border-[var(--border)]">
                <div className="mt-3 space-y-2">
                  <div className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">Configuration</div>
                  {intg.configFields.map(f => (
                    <div key={f.key}>
                      <label className="text-[8px] font-bold text-[var(--ink-muted)] uppercase tracking-wide">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>
                      <input type={f.type} placeholder={f.placeholder} defaultValue={f.value} className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[10px] font-mono outline-none focus:border-[var(--accent)] transition-all" />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[9px] font-bold hover:brightness-110 transition-all">Save & Test</button>
                    <button onClick={() => setShowConfig(null)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[9px] font-bold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
