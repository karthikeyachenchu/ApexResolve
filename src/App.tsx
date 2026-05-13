/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import Header, { TabKey } from "./components/Header";
import LogSection from "./components/LogSection";
import AnalysisResult from "./components/AnalysisResult";
import Dashboard from "./components/Dashboard";
import PipelineView from "./components/PipelineView";
import ChatAssistant from "./components/ChatAssistant";
import LogAnalysis from "./components/LogAnalysis";
import AutomationEngine from "./components/AutomationEngine";
import IntegrationsHub from "./components/IntegrationsHub";
import AILab from "./components/AILab";
import SiteMonitor, { MonitoredSite } from "./components/SiteMonitor";
import { analyzeLogs } from "./services/geminiService";
import { getMockMetrics, getMockContainers, getMockServices, getMockNetworkActivity, getMockAlerts, generateMockLogEntries } from "./services/monitoringService";
import { getMockDeployments, getMockGitHubRepos, getMockJenkinsBuilds, getMockGitHubEvents, executePipeline, GitHubWebhookEvent } from "./services/pipelineService";
import { getMockWorkflows, getMockQuickActions, simulateAction } from "./services/automationService";
import { getIntegrations, Integration, IntegrationStatus } from "./services/integrationsService";
import { getChatResponse } from "./services/chatService";
import { AnalysisReport, Environment, Metric, Container, Deployment, ServiceInfo, NetworkActivity, Alert, LogEntry, Incident, AutomationWorkflow, AutomationAction } from "./types";
import { Terminal, Shield, Zap } from "lucide-react";

// Mock incidents
function getMockIncidents(): Incident[] {
  const now = Date.now();
  return [
    {
      id: "INC-001", title: "Payment Service Crash Loop", description: "payment-proxy container entering CrashLoopBackOff state with 5 restarts in 10 minutes.", severity: "critical", status: "open", createdAt: now - 300000,
      affectedServices: ["payment-proxy", "api-gateway"],
      timeline: [
        { timestamp: now - 600000, message: "Container restart count exceeded threshold (3)", type: "detection" },
        { timestamp: now - 550000, message: "Alert escalated to on-call engineer", type: "escalation" },
        { timestamp: now - 500000, message: "Auto-restart attempt #4 failed", type: "action" },
        { timestamp: now - 300000, message: "Incident opened - requires manual intervention", type: "escalation" }
      ],
      relatedAlerts: ["alt-001"]
    },
    {
      id: "INC-002", title: "High Memory Pressure on Node-3", description: "Memory utilization consistently above 85% threshold, affecting container scheduling.", severity: "warning", status: "investigating", createdAt: now - 900000,
      affectedServices: ["data-processor", "log-aggregator"],
      timeline: [
        { timestamp: now - 1200000, message: "Memory threshold breach detected: 87.2%", type: "detection" },
        { timestamp: now - 900000, message: "Investigating root cause - potential memory leak in data-processor", type: "action" }
      ],
      relatedAlerts: ["alt-002"]
    },
    {
      id: "INC-003", title: "API Deployment Failure", description: "apex-resolve-api hotfix/auth-timeout branch deployment failed at unit test stage.", severity: "warning", status: "open", createdAt: now - 3600000,
      affectedServices: ["apex-resolve-api"],
      timeline: [
        { timestamp: now - 3600000, message: "CI/CD pipeline failure detected", type: "detection" },
        { timestamp: now - 3500000, message: "Unit test failure in PaymentService.processPayment", type: "action" }
      ],
      relatedAlerts: []
    },
    {
      id: "INC-004", title: "SSL Certificate Expiry Warning", description: "SSL certificate for api.apex.io approaching expiration in 7 days.", severity: "info", status: "open", createdAt: now - 1800000,
      affectedServices: ["api-gateway"],
      timeline: [
        { timestamp: now - 1800000, message: "Certificate expiry scan flagged api.apex.io", type: "detection" }
      ],
      relatedAlerts: ["alt-004"]
    }
  ];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('site-monitor');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [networkActivity, setNetworkActivity] = useState<NetworkActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [quickActions] = useState<AutomationAction[]>(getMockQuickActions());
  const [isAnalyzingIncident, setIsAnalyzingIncident] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [monitoredSites, setMonitoredSites] = useState<MonitoredSite[]>([]);
  const [githubEvents, setGithubEvents] = useState<GitHubWebhookEvent[]>([]);

  // Initialize all data
  useEffect(() => {
    setMetrics(getMockMetrics());
    setContainers(getMockContainers());
    setDeployments(getMockDeployments());
    setServices(getMockServices());
    setNetworkActivity(getMockNetworkActivity());
    setAlerts(getMockAlerts());
    setLogEntries(generateMockLogEntries(80));
    setIncidents(getMockIncidents());
    setWorkflows(getMockWorkflows());
    setIntegrations(getIntegrations());
    setGithubEvents(getMockGitHubEvents());

    // Load saved sites from localStorage
    const savedSites = localStorage.getItem("apex_monitored_sites");
    if (savedSites) { try { setMonitoredSites(JSON.parse(savedSites)); } catch {} }

    const saved = localStorage.getItem("apex_resolve_history");
    if (saved) { try { setHistory(JSON.parse(saved)); } catch {} }

    // Real-time updates
    const metricsInterval = setInterval(() => setMetrics(getMockMetrics()), 8000);
    const logsInterval = setInterval(() => {
      setLogEntries(prev => {
        const newEntries = generateMockLogEntries(3);
        return [...newEntries, ...prev].slice(0, 200);
      });
    }, 5000);
    const networkInterval = setInterval(() => {
      setNetworkActivity(prev => {
        const newEntry = {
          timestamp: Date.now(),
          inbound: +(80 + Math.random() * 120).toFixed(1),
          outbound: +(40 + Math.random() * 80).toFixed(1),
          connections: Math.floor(200 + Math.random() * 300),
          errors: Math.floor(Math.random() * 5)
        };
        return [...prev.slice(1), newEntry];
      });
    }, 10000);

    return () => { clearInterval(metricsInterval); clearInterval(logsInterval); clearInterval(networkInterval); };
  }, []);

  // Log analysis handler
  const handleAnalysis = async (logs: string, env: Environment) => {
    setIsLoading(true); setError(null); setReport(null);
    try {
      const result = await analyzeLogs(logs, env);
      setReport(result);
      const newHistory = [result, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem("apex_resolve_history", JSON.stringify(newHistory));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Internal system correlation failure.");
    } finally { setIsLoading(false); }
  };

  // Container restart
  const handleRestartContainer = useCallback((id: string) => {
    setContainers(prev => prev.map(c => c.id === id ? { ...c, status: "restarting" as const, uptime: "0s", restartCount: c.restartCount + 1 } : c));
    setTimeout(() => {
      setContainers(prev => prev.map(c => c.id === id ? { ...c, status: "running" as const, uptime: "0s" } : c));
      setAlerts(prev => [{ id: `alt-${Date.now()}`, title: `Container ${id} Restarted`, message: `Container was manually restarted and is now healthy.`, severity: "info", status: "resolved", source: "Manual Action", timestamp: Date.now(), resolvedAt: Date.now() }, ...prev]);
    }, 3000);
  }, []);

  // Alert actions
  const handleAcknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "acknowledged" as const, acknowledgedBy: "karth" } : a));
  }, []);

  const handleResolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "resolved" as const, resolvedAt: Date.now() } : a));
  }, []);

  // Pipeline actions — live execution with stage-by-stage updates
  const handleTriggerDeploy = useCallback((repo: string) => {
    const deployId = `dpl-${Math.random().toString(36).substring(2, 6)}`;
    const newDeploy: Deployment = {
      id: deployId, repo, branch: "main", status: "in-progress",
      timestamp: Date.now(), author: "karth", commitMessage: `Triggered deployment for ${repo}`,
      pipeline: ["Checkout", "Install Dependencies", "Lint & Type Check", "Unit Tests", "Build", "Deploy", "Health Check"].map(name => ({ name, status: "pending" as const }))
    };
    setDeployments(prev => [newDeploy, ...prev]);
    // Add a GitHub webhook event for this push
    setGithubEvents(prev => [{ id: `gh-${Date.now()}`, type: "push" as const, repo, message: `Triggered deployment on main`, author: "karth", timestamp: Date.now(), ref: "refs/heads/main", sha: Math.random().toString(36).substring(2, 9) }, ...prev]);
    // Execute pipeline with live updates
    executePipeline(
      deployId, repo, "main",
      (id, stages) => setDeployments(prev => prev.map(d => d.id === id ? { ...d, pipeline: stages } : d)),
      (id, finalStatus) => {
        const totalDuration = `${Math.floor(Math.random() * 3 + 2)}m ${Math.floor(Math.random() * 50 + 10)}s`;
        setDeployments(prev => prev.map(d => d.id === id ? { ...d, status: finalStatus, duration: totalDuration } : d));
        setAlerts(prev => [{ id: `alt-${Date.now()}`, title: `Deploy ${repo} ${finalStatus}`, message: finalStatus === "success" ? `${repo} deployed to production successfully.` : `${repo} deployment failed — check pipeline logs.`, severity: finalStatus === "success" ? "info" : "critical", status: finalStatus === "success" ? "resolved" : "active", source: "CI/CD Pipeline", timestamp: Date.now(), resolvedAt: finalStatus === "success" ? Date.now() : undefined }, ...prev]);
      }
    );
  }, []);

  const handleRollback = useCallback((id: string) => {
    setDeployments(prev => prev.map(d => d.id === id ? { ...d, status: "rolled-back" as const } : d));
    setAlerts(prev => [{ id: `alt-${Date.now()}`, title: `Deployment ${id} Rolled Back`, message: `Deployment was manually rolled back to previous version.`, severity: "warning", status: "resolved", source: "Manual Action", timestamp: Date.now(), resolvedAt: Date.now() }, ...prev]);
  }, []);

  const handleRetryBuild = useCallback((id: string) => {
    const deploy = deployments.find(d => d.id === id);
    if (deploy) handleTriggerDeploy(deploy.repo);
  }, [deployments, handleTriggerDeploy]);

  // GitHub PR merge handler
  const handleMergePR = useCallback((prId: number, branchName: string) => {
    setGithubEvents(prev => [
      { id: `gh-${Date.now()}`, type: "pull_request" as const, repo: "apex-resolve-ui", message: `PR #${prId} merged into main`, author: "karth", timestamp: Date.now(), ref: `refs/heads/${branchName}`, sha: Math.random().toString(36).substring(2, 9) },
      { id: `gh-${Date.now() + 1}`, type: "workflow_run" as const, repo: "apex-resolve-ui", message: `CI workflow triggered by PR #${prId} merge`, author: "github-actions", timestamp: Date.now(), sha: Math.random().toString(36).substring(2, 9) },
      ...prev
    ]);
  }, []);

  // Jenkins build trigger handler
  const handleTriggerJenkins = useCallback((jobName: string) => {
    const repoName = jobName.replace("-pipeline", "").replace("apex-", "apex-resolve-");
    setGithubEvents(prev => [
      { id: `gh-${Date.now()}`, type: "workflow_run" as const, repo: repoName || "apex-resolve-ui", message: `Jenkins build triggered for ${jobName}`, author: "jenkins", timestamp: Date.now(), sha: Math.random().toString(36).substring(2, 9) },
      ...prev
    ]);
    handleTriggerDeploy(repoName || "apex-resolve-ui");
  }, [handleTriggerDeploy]);

  // Incident analysis
  const handleAnalyzeIncident = useCallback(async (incident: Incident) => {
    setIsAnalyzingIncident(true);
    try {
      const prompt = `Analyze this DevOps incident and provide a brief root cause analysis with remediation steps:\n\nIncident: ${incident.title}\nDescription: ${incident.description}\nSeverity: ${incident.severity}\nAffected Services: ${incident.affectedServices.join(", ")}\nTimeline: ${incident.timeline.map(e => e.message).join(" -> ")}`;
      const messages = [{ id: "1", role: "user" as const, content: prompt, timestamp: Date.now() }];
      const analysis = await getChatResponse(messages);
      setIncidents(prev => prev.map(i => i.id === incident.id ? { ...i, aiSummary: analysis } : i));
    } catch {
      setIncidents(prev => prev.map(i => i.id === incident.id ? { ...i, aiSummary: "Analysis failed. The AI service is currently unavailable. Please check your API key configuration." } : i));
    } finally { setIsAnalyzingIncident(false); }
  }, []);

  // Automation actions
  const handleRunAction = useCallback(async (action: AutomationAction) => {
    const result = await simulateAction(action);
    setAlerts(prev => [{ id: `alt-${Date.now()}`, title: `Action: ${result.name}`, message: result.result || "Action completed", severity: result.status === "completed" ? "info" : "warning", status: "resolved", source: "Automation Engine", timestamp: Date.now(), resolvedAt: Date.now() }, ...prev]);
    if (action.type === "restart") {
      const container = containers.find(c => c.name === action.target);
      if (container) handleRestartContainer(container.id);
    }
  }, [containers, handleRestartContainer]);

  const handleToggleWorkflow = useCallback((id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  }, []);

  // ─── Site Monitor Handlers ────────────────────────
  const checkSiteHealth = useCallback(async (site: MonitoredSite): Promise<MonitoredSite> => {
    try {
      const start = performance.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let responseTime: number;
      let statusCode: number;
      let sslValid: boolean;
      try {
        const res = await fetch(site.url, { method: "HEAD", mode: "no-cors", signal: controller.signal });
        clearTimeout(timeout);
        responseTime = Math.round(performance.now() - start);
        statusCode = res.status === 0 ? 200 : res.status;
        sslValid = site.url.startsWith("https://");
      } catch (fetchErr: any) {
        clearTimeout(timeout);
        if (fetchErr.name === "AbortError") {
          return { ...site, status: "down", lastCheck: Date.now(), errorMessage: "Request timed out (8s)", checksCount: site.checksCount + 1, failedChecks: site.failedChecks + 1, uptime: Math.max(0, (site.uptime * site.checksCount) / (site.checksCount + 1)), history: [...site.history, { timestamp: Date.now(), status: "down" as const, responseTime: 8000 }].slice(-60) };
        }
        responseTime = Math.round(performance.now() - start);
        statusCode = 200;
        sslValid = site.url.startsWith("https://");
      }
      const newChecks = site.checksCount + 1;
      const newUptime = ((site.uptime * site.checksCount) + 100) / newChecks;
      return { ...site, status: "up", lastCheck: Date.now(), responseTime, statusCode, sslValid, uptime: Math.min(100, newUptime), checksCount: newChecks, failedChecks: site.failedChecks, errorMessage: undefined, history: [...site.history, { timestamp: Date.now(), status: "up" as const, responseTime }].slice(-60) };
    } catch {
      const newChecks = site.checksCount + 1;
      return { ...site, status: "down", lastCheck: Date.now(), responseTime: null, statusCode: null, uptime: Math.max(0, (site.uptime * site.checksCount) / newChecks), checksCount: newChecks, failedChecks: site.failedChecks + 1, errorMessage: "Connection failed", history: [...site.history, { timestamp: Date.now(), status: "down" as const, responseTime: 0 }].slice(-60) };
    }
  }, []);

  const handleAddSite = useCallback(async (url: string, name: string) => {
    const newSite: MonitoredSite = { id: `site-${Date.now()}`, url, name, status: "checking", lastCheck: null, responseTime: null, statusCode: null, sslValid: null, uptime: 100, checksCount: 0, failedChecks: 0, history: [] };
    setMonitoredSites(prev => { const u = [newSite, ...prev]; localStorage.setItem("apex_monitored_sites", JSON.stringify(u)); return u; });
    const checked = await checkSiteHealth(newSite);
    setMonitoredSites(prev => { const u = prev.map(s => s.id === checked.id ? checked : s); localStorage.setItem("apex_monitored_sites", JSON.stringify(u)); return u; });
  }, [checkSiteHealth]);

  const handleRemoveSite = useCallback((id: string) => {
    setMonitoredSites(prev => { const u = prev.filter(s => s.id !== id); localStorage.setItem("apex_monitored_sites", JSON.stringify(u)); return u; });
  }, []);

  const handleCheckSite = useCallback(async (id: string) => {
    setMonitoredSites(prev => prev.map(s => s.id === id ? { ...s, status: "checking" as const } : s));
    const site = monitoredSites.find(s => s.id === id);
    if (!site) return;
    const checked = await checkSiteHealth(site);
    setMonitoredSites(prev => { const u = prev.map(s => s.id === checked.id ? checked : s); localStorage.setItem("apex_monitored_sites", JSON.stringify(u)); return u; });
  }, [monitoredSites, checkSiteHealth]);

  const handleCheckAll = useCallback(async () => {
    for (const site of monitoredSites) {
      setMonitoredSites(prev => prev.map(s => s.id === site.id ? { ...s, status: "checking" as const } : s));
      const checked = await checkSiteHealth(site);
      setMonitoredSites(prev => { const u = prev.map(s => s.id === checked.id ? checked : s); localStorage.setItem("apex_monitored_sites", JSON.stringify(u)); return u; });
    }
  }, [monitoredSites, checkSiteHealth]);

  useEffect(() => {
    if (monitoredSites.length === 0) return;
    const interval = setInterval(handleCheckAll, 60000);
    return () => clearInterval(interval);
  }, [monitoredSites.length, handleCheckAll]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-[1440px]">
        {activeTab === 'site-monitor' && (
          <SiteMonitor sites={monitoredSites} onAddSite={handleAddSite} onRemoveSite={handleRemoveSite} onCheckSite={handleCheckSite} onCheckAll={handleCheckAll} />
        )}

        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Cluster Overview</h1>
                <p className="text-[var(--ink-muted)] text-sm">Real-time infrastructure monitoring, service health, and alert management.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
                  <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="text-[9px] font-bold font-mono text-[var(--ink)]">ENCRYPTED-SRV</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
                  <Zap className="w-3.5 h-3.5 text-[var(--warning)]" />
                  <span className="text-[9px] font-bold font-mono text-[var(--ink)]">0.032ms</span>
                </div>
              </div>
            </div>
            <Dashboard metrics={metrics} containers={containers} services={services} networkActivity={networkActivity} alerts={alerts} onRestartContainer={handleRestartContainer} onAcknowledgeAlert={handleAcknowledgeAlert} onResolveAlert={handleResolveAlert} />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Neural Diagnostics</h1>
              <p className="text-[var(--ink-muted)] text-sm">Stream raw log data to the ApexResolve engine for autonomous remediation planning.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <section className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <Terminal className="w-4 h-4 text-[var(--accent)]" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Ingestion Engine</h2>
                </div>
                <LogSection onAnalyze={handleAnalysis} isLoading={isLoading} />
              </section>
              <section className="lg:col-span-7 flex flex-col gap-4 min-h-[600px]">
                <div className="flex items-center gap-2 px-1">
                  <Shield className="w-4 h-4 text-[var(--success)]" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Neural Output</h2>
                </div>
                <div className="flex-1 bg-[var(--panel)]/30 border border-[var(--border)] rounded-2xl p-6 backdrop-blur-sm">
                  <AnalysisResult report={report} history={history} error={error} onSelectHistory={(h) => setReport(h)} />
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <PipelineView deployments={deployments} githubRepos={getMockGitHubRepos()} jenkinsBuilds={getMockJenkinsBuilds()} githubEvents={githubEvents} onTriggerDeploy={handleTriggerDeploy} onRollback={handleRollback} onRetryBuild={handleRetryBuild} onMergePR={handleMergePR} onTriggerJenkins={handleTriggerJenkins} />
        )}

        {activeTab === 'log-analysis' && (
          <LogAnalysis logs={logEntries} incidents={incidents} onAnalyzeIncident={handleAnalyzeIncident} isAnalyzing={isAnalyzingIncident} />
        )}

        {activeTab === 'automation' && (
          <AutomationEngine workflows={workflows} quickActions={quickActions} onRunAction={handleRunAction} onToggleWorkflow={handleToggleWorkflow} />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsHub integrations={integrations} onUpdateStatus={(id, status) => setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status } : i))} />
        )}

        {activeTab === 'ai-lab' && (
          <AILab />
        )}
      </main>

      <ChatAssistant />

      <footer className="px-6 py-4 border-t border-[var(--border)] flex justify-between items-center text-[9px] font-medium text-[var(--ink-muted)] tracking-wider">
        <div className="flex items-center gap-3">
          <span>© 2026 APEXRESOLVE SYSTEMS</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
          <span>V4.2.1-SECURE</span>
        </div>
        <div className="flex gap-4">
          <button className="hover:text-[var(--ink)] transition-colors">Documentation</button>
          <button className="hover:text-[var(--ink)] transition-colors">API Keys</button>
          <button className="hover:text-[var(--ink)] transition-colors">Support</button>
        </div>
      </footer>
    </div>
  );
}
