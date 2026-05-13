/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Enhanced CI/CD Pipeline View with live execution, GitHub events, Jenkins console
 */
import { useState, useEffect } from "react";
import { Deployment, PipelineStage, GitHubRepo, JenkinsBuild } from "../types";
import { GitHubWebhookEvent, getJenkinsBuildDetail } from "../services/pipelineService";
import { getGitHubPullRequests, GitHubPullRequest } from "../services/integrationsService";
import { GitPullRequest, Clock, User, CheckCircle2, XCircle, Loader2, Play, CornerDownRight, ChevronDown, ChevronUp, RotateCcw, Eye, GitBranch, ExternalLink, AlertCircle, SkipForward, Hammer, Terminal, GitCommit, Webhook, MessageSquare, Tag, Workflow, RefreshCw, GitMerge, ArrowRight, Plug } from "lucide-react";

interface PipelineViewProps {
  deployments: Deployment[];
  githubRepos: GitHubRepo[];
  jenkinsBuilds: JenkinsBuild[];
  githubEvents: GitHubWebhookEvent[];
  onTriggerDeploy: (repo: string) => void;
  onRollback: (id: string) => void;
  onRetryBuild: (id: string) => void;
  onMergePR?: (prId: number, repo: string) => void;
  onTriggerJenkins?: (jobName: string) => void;
}

const stageIcon = (s: PipelineStage["status"]) => {
  if (s === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (s === "failed") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  if (s === "in-progress") return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
  if (s === "skipped") return <SkipForward className="w-3.5 h-3.5 text-zinc-500" />;
  return <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600" />;
};

const ghEventIcon = (type: GitHubWebhookEvent["type"]) => {
  if (type === "push") return <GitCommit className="w-3.5 h-3.5 text-emerald-400" />;
  if (type === "pull_request") return <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />;
  if (type === "issue") return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
  if (type === "deployment") return <Play className="w-3.5 h-3.5 text-purple-400" />;
  if (type === "workflow_run") return <Workflow className="w-3.5 h-3.5 text-cyan-400" />;
  return <Webhook className="w-3.5 h-3.5 text-zinc-400" />;
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function PipelineView({ deployments, githubRepos, jenkinsBuilds, githubEvents, onTriggerDeploy, onRollback, onRetryBuild, onMergePR, onTriggerJenkins }: PipelineViewProps) {
  const [expandedDeploy, setExpandedDeploy] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"deployments" | "github" | "jenkins">("deployments");
  const [expandedJenkins, setExpandedJenkins] = useState<string | null>(null);
  const [expandedStageLog, setExpandedStageLog] = useState<string | null>(null);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [mergingPR, setMergingPR] = useState<number | null>(null);

  useEffect(() => {
    setPullRequests(getGitHubPullRequests());
  }, []);

  const handleMergePR = (pr: GitHubPullRequest) => {
    setMergingPR(pr.id);
    setTimeout(() => {
      setPullRequests(prev => prev.map(p => p.id === pr.id ? { ...p, status: "merged" as const, reviewStatus: "approved" as const, checks: "passing" as const } : p));
      setMergingPR(null);
      if (onMergePR) onMergePR(pr.id, pr.branch.split('/').pop() || pr.branch);
      // Auto-trigger deploy from merge
      const repo = githubRepos.find(r => pr.baseBranch === r.defaultBranch);
      if (repo) onTriggerDeploy(repo.name);
    }, 2000);
  };

  const successCount = deployments.filter(d => d.status === "success").length;
  const failedCount = deployments.filter(d => d.status === "failed").length;
  const inProgressCount = deployments.filter(d => d.status === "in-progress").length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">CI/CD Pipeline</h1>
          <p className="text-[var(--ink-muted)] text-sm">Deployment management, build monitoring, and version control integration.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">{successCount} passed</span>
            {failedCount > 0 && <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400">{failedCount} failed</span>}
            {inProgressCount > 0 && <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400"><Loader2 className="w-3 h-3 animate-spin" />{inProgressCount} running</span>}
          </div>
          <button onClick={() => onTriggerDeploy("apex-resolve-ui")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-red-500/20 shrink-0">
            <Play className="w-3.5 h-3.5 fill-current" /> Trigger Build
          </button>
        </div>
      </div>

      {/* Integration Connection Status Banner */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-400 uppercase">Connected</span>
        </div>
        <div className="flex items-center gap-2 ml-3 text-[9px] text-[var(--ink-muted)]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-[var(--border)]"><Plug className="w-3 h-3" /> GitHub</span>
          <ArrowRight className="w-3 h-3 text-[var(--accent)]" />
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-[var(--border)]"><Hammer className="w-3 h-3" /> Jenkins</span>
          <ArrowRight className="w-3 h-3 text-[var(--accent)]" />
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-[var(--border)]"><Play className="w-3 h-3" /> Deploy</span>
        </div>
        <span className="ml-auto text-[8px] text-[var(--ink-muted)]">Webhook: Active • Last event: {githubEvents[0] ? timeAgo(githubEvents[0].timestamp) : 'N/A'}</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-[var(--panel)] p-1 rounded-xl border border-[var(--border)] w-fit">
        {(["deployments", "github", "jenkins"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveSubTab(tab)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${activeSubTab === tab ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}>
            {tab === "github" ? "GitHub" : tab === "jenkins" ? "Jenkins" : "Deployments"}
          </button>
        ))}
      </div>

      {/* ─── Deployments Tab ─── */}
      {activeSubTab === "deployments" && (
        <div className="flex flex-col gap-4">
          {deployments.map(d => (
            <div key={d.id} className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${d.status === "success" ? "bg-emerald-500/10 text-emerald-400" : d.status === "failed" ? "bg-red-500/10 text-red-400" : d.status === "rolled-back" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>
                    {d.status === "success" ? <CheckCircle2 className="w-5 h-5" /> : d.status === "failed" ? <XCircle className="w-5 h-5" /> : d.status === "rolled-back" ? <RotateCcw className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm flex items-center gap-1.5"><GitPullRequest className="w-3.5 h-3.5 text-[var(--accent)]" />{d.repo}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-[var(--border)] text-[var(--ink-muted)] font-mono">{d.id}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${d.status === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : d.status === "failed" ? "bg-red-500/10 border border-red-500/20 text-red-400" : d.status === "rolled-back" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-blue-500/10 border border-blue-500/20 text-blue-400"}`}>{d.status}</span>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)] flex items-center gap-1"><CornerDownRight className="w-3 h-3" /><span className="font-mono text-[var(--ink)]">{d.branch}</span></p>
                    {d.commitMessage && <p className="text-[10px] text-[var(--ink-muted)] mt-1 italic">"{d.commitMessage}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1.5 text-xs"><User className="w-3 h-3 text-[var(--ink-muted)]" />{d.author}</div>
                    <div className="text-[9px] text-[var(--ink-muted)] flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(d.timestamp)}</div>
                    {d.duration && <span className="text-[9px] text-[var(--ink-muted)]">Duration: {d.duration}</span>}
                  </div>
                  <div className="flex gap-2">
                    {d.status === "failed" && <button onClick={() => onRollback(d.id)} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-[9px] font-bold uppercase hover:bg-red-500/10 transition-all">Rollback</button>}
                    {d.status === "failed" && <button onClick={() => onRetryBuild(d.id)} className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase hover:bg-blue-500/10 transition-all flex items-center gap-1"><RefreshCw className="w-3 h-3" />Retry</button>}
                    {d.pipeline && (
                      <button onClick={() => setExpandedDeploy(expandedDeploy === d.id ? null : d.id)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[9px] font-bold uppercase hover:border-[var(--ink)] transition-all flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Pipeline {expandedDeploy === d.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Pipeline Stages */}
              {expandedDeploy === d.id && d.pipeline && (
                <div className="px-5 pb-5 border-t border-[var(--border)] pt-4">
                  {/* Stage flow */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-3">
                    {d.pipeline.map((stage, i) => (
                      <div key={i} className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setExpandedStageLog(expandedStageLog === `${d.id}-${i}` ? null : `${d.id}-${i}`)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer hover:brightness-110 transition-all ${stage.status === "success" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : stage.status === "failed" ? "bg-red-500/5 border-red-500/20 text-red-400" : stage.status === "in-progress" ? "bg-blue-500/5 border-blue-500/20 text-blue-400" : stage.status === "skipped" ? "bg-zinc-500/5 border-zinc-500/20 text-zinc-500" : "bg-white/[0.02] border-[var(--border)] text-[var(--ink-muted)]"}`}>
                          {stageIcon(stage.status)}
                          <span>{stage.name}</span>
                          {stage.duration && <span className="text-[8px] opacity-60">{stage.duration}</span>}
                        </button>
                        {i < d.pipeline!.length - 1 && <div className="w-4 h-px bg-[var(--border)]" />}
                      </div>
                    ))}
                  </div>
                  {/* Stage logs — clickable per stage */}
                  {d.pipeline.map((stage, i) => (
                    expandedStageLog === `${d.id}-${i}` && stage.logs && (
                      <div key={i} className="mt-2 p-3 rounded-lg bg-black/40 border border-[var(--border)] font-mono text-[10px] max-h-48 overflow-y-auto terminal-scroll">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] text-[var(--ink-muted)] font-bold uppercase flex items-center gap-1"><Terminal className="w-3 h-3" /> {stage.name} Output</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${stage.status === "success" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>{stage.status}</span>
                        </div>
                        {stage.logs.map((line, j) => (
                          <div key={j} className={`${line.startsWith("FAIL") || line.startsWith("✗") || line.startsWith("POST-DEPLOY") || line.startsWith("ERROR") || line.includes("failed") ? "text-red-400 font-bold" : line.startsWith("PASS") || line.startsWith("✓") || line.includes("success") || line.includes("passed") ? "text-emerald-400" : "text-zinc-400"}`}>{line || "\u00A0"}</div>
                        ))}
                      </div>
                    )
                  ))}
                </div>
              )}

              {d.status === "in-progress" && (
                <div className="mx-5 mb-5 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${Math.min(95, (d.pipeline?.filter(s => s.status === "success").length || 0) / 7 * 100)}%`, transition: "width 0.5s ease" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── GitHub Tab ─── */}
      {activeSubTab === "github" && (
        <div className="flex flex-col gap-6">
          {/* Pull Requests Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitPullRequest className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Pull Requests</h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">{pullRequests.filter(p => p.status === "open").length} open</span>
            </div>
            <div className="flex flex-col gap-2">
              {pullRequests.map(pr => (
                <div key={pr.id} className={`p-4 rounded-xl border transition-all ${pr.status === "merged" ? "bg-purple-500/5 border-purple-500/20" : pr.status === "closed" ? "bg-zinc-500/5 border-zinc-500/20 opacity-60" : pr.checks === "failing" ? "bg-red-500/5 border-red-500/20" : "bg-[var(--panel)] border-[var(--border)] hover:border-emerald-500/30"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg mt-0.5 ${pr.status === "merged" ? "bg-purple-500/10" : pr.status === "open" ? "bg-emerald-500/10" : "bg-zinc-500/10"}`}>
                      {pr.status === "merged" ? <GitMerge className="w-4 h-4 text-purple-400" /> : <GitPullRequest className={`w-4 h-4 ${pr.status === "open" ? "text-emerald-400" : "text-zinc-400"}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold">#{pr.id} {pr.title}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${pr.status === "merged" ? "text-purple-400 bg-purple-500/20" : pr.status === "open" ? "text-emerald-400 bg-emerald-500/20" : "text-zinc-400 bg-zinc-500/20"}`}>{pr.status}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-[var(--ink-muted)] mb-2">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{pr.author}</span>
                        <span>•</span>
                        <span className="font-mono flex items-center gap-1"><GitBranch className="w-3 h-3" />{pr.branch} → {pr.baseBranch}</span>
                        <span>•</span>
                        <span className="text-emerald-400">+{pr.additions}</span>
                        <span className="text-red-400">-{pr.deletions}</span>
                        <span>•</span>
                        <span>{pr.files} files</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {pr.labels.map(l => <span key={l} className="text-[8px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{l}</span>)}
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold border ${pr.checks === "passing" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : pr.checks === "failing" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                          {pr.checks === "passing" ? "✓" : pr.checks === "failing" ? "✗" : "○"} CI {pr.checks}
                        </span>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full border ${pr.reviewStatus === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : pr.reviewStatus === "changes_requested" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                          {pr.reviewStatus.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    {pr.status === "open" && (
                      <div className="flex gap-2 shrink-0">
                        {pr.checks === "passing" && pr.reviewStatus === "approved" && (
                          <button onClick={() => handleMergePR(pr)} disabled={mergingPR === pr.id} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[9px] font-bold hover:brightness-110 transition-all flex items-center gap-1 disabled:opacity-50">
                            {mergingPR === pr.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Merging...</> : <><GitMerge className="w-3 h-3" /> Merge</>}
                          </button>
                        )}
                        <button onClick={() => onTriggerDeploy(githubRepos[0]?.name || "apex-resolve-ui")} className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-[9px] font-bold hover:bg-blue-500/10 transition-all flex items-center gap-1">
                          <Play className="w-3 h-3" /> Run CI
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Repos */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {githubRepos.map(repo => (
                <div key={repo.name} className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-white/5"><GitBranch className="w-4 h-4 text-[var(--accent)]" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate">{repo.name}</h3>
                      <p className="text-[9px] text-[var(--ink-muted)] font-mono truncate">{repo.fullName}</p>
                    </div>
                    <a href={repo.url} target="_blank" rel="noopener" className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--ink-muted)]"><ExternalLink className="w-3.5 h-3.5" /></a>
                  </div>
                  <div className="flex gap-4 text-[10px] text-[var(--ink-muted)]">
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{repo.defaultBranch}</span>
                    <span className="flex items-center gap-1"><GitPullRequest className="w-3 h-3 text-blue-400" />{repo.openPRs} PRs</span>
                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-400" />{repo.openIssues} Issues</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                    <span className="text-[9px] text-[var(--ink-muted)]">Last push: {timeAgo(repo.lastPush)}</span>
                    <button onClick={() => onTriggerDeploy(repo.name)} className="px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-[9px] font-bold hover:brightness-110 transition-all flex items-center gap-1"><Play className="w-3 h-3" /> Deploy</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Webhook Event Feed */}
            <div className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] p-4 flex flex-col max-h-[600px]">
              <div className="flex items-center gap-2 mb-4">
                <Webhook className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Webhook Events</h3>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 terminal-scroll">
                {githubEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-[var(--border)]/50 hover:border-[var(--accent)]/20 transition-all">
                    <div className="mt-0.5 shrink-0">{ghEventIcon(event.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate">{event.message}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[8px] text-[var(--ink-muted)]">
                        <span className="font-mono">{event.repo}</span>
                        <span>•</span>
                        <span>{event.author}</span>
                        <span>•</span>
                        <span>{timeAgo(event.timestamp)}</span>
                      </div>
                      {event.sha && <span className="text-[8px] font-mono text-[var(--accent)]/60">{event.sha}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Jenkins Tab ─── */}
      {activeSubTab === "jenkins" && (
        <div className="flex flex-col gap-3">
          {/* Jenkins trigger bar */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
            <Hammer className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Jenkins Build Server</span>
            <div className="flex items-center gap-1 ml-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[8px] text-emerald-400 font-bold">Online</span>
            </div>
            <span className="text-[8px] text-[var(--ink-muted)] ml-auto">v2.452.3 LTS • 4 executors • 2 idle</span>
            {onTriggerJenkins && (
              <button onClick={() => onTriggerJenkins("apex-ui-pipeline")} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[9px] font-bold hover:brightness-110 transition-all flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" /> New Build
              </button>
            )}
          </div>
          {jenkinsBuilds.map(build => {
            const detail = expandedJenkins === build.id ? getJenkinsBuildDetail(build.id) : null;
            return (
              <div key={build.id} className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedJenkins(expandedJenkins === build.id ? null : build.id)}>
                  <div className={`p-2 rounded-lg ${build.status === "success" ? "bg-emerald-500/10 text-emerald-400" : build.status === "failed" ? "bg-red-500/10 text-red-400" : build.status === "building" ? "bg-blue-500/10 text-blue-400" : "bg-zinc-500/10 text-zinc-400"}`}>
                    {build.status === "success" ? <CheckCircle2 className="w-4 h-4" /> : build.status === "failed" ? <XCircle className="w-4 h-4" /> : build.status === "building" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{build.jobName}</span>
                      <span className="text-[9px] font-mono text-[var(--ink-muted)]">#{build.buildNumber}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${build.status === "success" ? "text-emerald-400 bg-emerald-500/10" : build.status === "failed" ? "text-red-400 bg-red-500/10" : build.status === "building" ? "text-blue-400 bg-blue-500/10" : "text-zinc-400 bg-zinc-500/10"}`}>{build.status}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-[9px] text-[var(--ink-muted)]">
                      <span className="flex items-center gap-1"><Hammer className="w-3 h-3" />{build.triggeredBy}</span>
                      <span>{build.duration}</span>
                      <span>{timeAgo(build.timestamp)}</span>
                    </div>
                    {build.changes.length > 0 && <div className="flex gap-1 mt-1.5 flex-wrap">{build.changes.map((c, i) => <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border)]/50 text-[var(--ink-muted)]">{c}</span>)}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {build.status === "failed" && <button onClick={e => { e.stopPropagation(); onRetryBuild(build.id); }} className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-[9px] font-bold hover:bg-blue-500/10 transition-all flex items-center gap-1"><RefreshCw className="w-3 h-3" />Retry</button>}
                    {expandedJenkins === build.id ? <ChevronUp className="w-4 h-4 text-[var(--ink-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--ink-muted)]" />}
                  </div>
                </div>

                {/* Expanded Jenkins Detail */}
                {detail && (
                  <div className="border-t border-[var(--border)]">
                    {/* Parameters */}
                    {detail.parameters && (
                      <div className="px-4 py-3 border-b border-[var(--border)] bg-white/[0.01]">
                        <div className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest mb-2">Build Parameters</div>
                        <div className="flex flex-wrap gap-2">{Object.entries(detail.parameters).map(([k, v]) => <span key={k} className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-[var(--border)] font-mono"><span className="text-[var(--accent)]">{k}</span>=<span className="text-emerald-400">{v}</span></span>)}</div>
                      </div>
                    )}
                    {/* Console Output */}
                    <div className="p-4">
                      <div className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest mb-2 flex items-center gap-1"><Terminal className="w-3 h-3" /> Console Output</div>
                      <div className="p-3 rounded-lg bg-black/40 border border-[var(--border)] font-mono text-[10px] max-h-60 overflow-y-auto terminal-scroll">
                        {detail.consoleOutput.map((line, i) => (
                          <div key={i} className={`${line.includes("FAILURE") || line.includes("failed") ? "text-red-400 font-bold" : line.includes("SUCCESS") || line.includes("passed") || line.includes("rolled out") ? "text-emerald-400" : line.startsWith("[Pipeline]") ? "text-blue-400" : "text-zinc-400"}`}>{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
