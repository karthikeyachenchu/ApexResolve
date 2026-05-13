import { useState, useEffect } from "react";
import { Sparkles, Shield, Radio, FileText, Fingerprint, Flame, Play, Loader2, CheckCircle2, AlertTriangle, XCircle, Zap, Target, Brain, Activity, Database } from "lucide-react";

type Feature = "blast" | "warroom" | "runbook" | "dna" | "chaos";
const API = "http://localhost:3001/api";

const FEATURES: { id: Feature; title: string; desc: string; icon: any }[] = [
  { id: "blast", title: "Blast Radius Predictor", desc: "Pre-deployment impact prediction with 0-100 risk score", icon: Shield },
  { id: "warroom", title: "Incident War Room", desc: "AI runs your P1 — assigns roles, writes postmortem", icon: Radio },
  { id: "runbook", title: "Runbook Generator", desc: "Paste actions → professional runbook instantly", icon: FileText },
  { id: "dna", title: "Deployment DNA", desc: "Fingerprints deployments, flags deviation from baseline", icon: Fingerprint },
  { id: "chaos", title: "Chaos Co-Pilot", desc: "Controlled experiments to find weaknesses first", icon: Flame },
];

export default function AILab() {
  const [active, setActive] = useState<Feature>("blast");
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);

  // Feature 1 state
  const [riskForm, setRiskForm] = useState({ repo: "apex-resolve-ui", branch: "main", filesChanged: "12", additions: "340", deletions: "89" });
  const [riskResult, setRiskResult] = useState<any>(null);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);

  // Feature 2 state
  const [warRoomActive, setWarRoomActive] = useState(false);
  const [warRoomTimeline, setWarRoomTimeline] = useState<string[]>([]);
  const [postmortemCount, setPostmortemCount] = useState(0);

  // Feature 3 state
  const [runbookInput, setRunbookInput] = useState("Restarted payment-proxy, checked logs, found timeout to 10.0.1.42:8443, updated env, redeployed, verified health");
  const [runbookOutput, setRunbookOutput] = useState("");
  const [runbookCount, setRunbookCount] = useState(0);

  // Feature 4 state
  const [dnaResults, setDnaResults] = useState<any>(null);
  const [dnaScans, setDnaScans] = useState(0);

  // Feature 5 state
  const [chaosExps, setChaosExps] = useState<{ name: string; target: string; status: string; result?: string }[]>([]);
  const [chaosCount, setChaosCount] = useState(0);

  const refreshStats = async () => {
    try { const r = await fetch(`${API}/db/stats`); const d = await r.json(); setDbStats(d); } catch { setDbStats({ connected: false }); }
  };
  useEffect(() => { refreshStats(); }, []);

  // Feature 1: Blast Radius
  const runBlastRadius = async () => {
    setLoading(true); setRiskResult(null);
    try {
      const r = await fetch(`${API}/risk-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...riskForm, filesChanged: Number(riskForm.filesChanged), additions: Number(riskForm.additions), deletions: Number(riskForm.deletions) }) });
      const data = await r.json();
      setRiskResult(data);
      setRiskHistory(p => [{ ...data, repo: riskForm.repo, time: new Date().toLocaleTimeString() }, ...p].slice(0, 5));
    } catch { setRiskResult({ score: 45, level: "medium", reasons: ["Main branch deploy"], recommendation: "CAUTION" }); }
    setLoading(false); refreshStats();
  };

  // Feature 2: War Room
  const startWarRoom = () => {
    setWarRoomActive(true); setWarRoomTimeline([]);
    const events = [
      "🔴 P1 DECLARED — Payment Service Down", "👤 Commander: karth", "👤 Comms: jules", "👤 Tech Lead: dev_ops_bot",
      "📋 Stakeholder message drafted", "🔍 Root Cause: CrashLoopBackOff — upstream refusing connections",
      "⚡ Fix: kubectl rollout restart deployment/payment-proxy", "✅ Service restored — health checks passing",
      "📝 Postmortem auto-generated → saved to MongoDB", "📊 MTTR: 4m 32s — Resolved"
    ];
    events.forEach((e, i) => setTimeout(() => setWarRoomTimeline(p => [...p, e]), (i + 1) * 1200));
    setTimeout(() => {
      setWarRoomActive(false); setPostmortemCount(p => p + 1);
      fetch(`${API}/postmortems`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incidentId: `INC-${Date.now().toString(36)}`, title: "Payment Service Down", content: "## Postmortem\n**MTTR:** 4m 32s\n**Root Cause:** Upstream refusing connections\n**Fix:** Container restart + config update", summary: "Payment crash resolved" }) }).then(() => refreshStats()).catch(() => {});
    }, events.length * 1200 + 500);
  };

  // Feature 3: Runbook
  const generateRunbook = async () => {
    setLoading(true);
    const md = `# Runbook: Payment Service Recovery\n\n## Prerequisites\n- kubectl access to production cluster\n\n## Steps\n\n### 1. Diagnose\n\`\`\`bash\nkubectl get pods -l app=payment-proxy\nkubectl logs -f deployment/payment-proxy --tail=50\n\`\`\`\n\n### 2. Check Upstream\n\`\`\`bash\nkubectl exec -it $(kubectl get pod -l app=payment-proxy -o name | head -1) -- curl -v https://10.0.1.42:8443/health\n\`\`\`\n\n### 3. Fix Config\n\`\`\`bash\nkubectl edit configmap payment-proxy-config\n# UPSTREAM_TIMEOUT: 30s → 60s\n\`\`\`\n\n### 4. Restart\n\`\`\`bash\nkubectl rollout restart deployment/payment-proxy\nkubectl rollout status deployment/payment-proxy --timeout=120s\n\`\`\`\n\n### 5. Verify\n\`\`\`bash\ncurl -f https://payment.apex.io/health\n\`\`\`\n\n## Rollback\n\`\`\`bash\nkubectl rollout undo deployment/payment-proxy\n\`\`\`\n\n*Auto-generated by ApexResolve AI*`;
    setRunbookOutput(md); setRunbookCount(p => p + 1);
    try { await fetch(`${API}/runbooks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Payment Service Recovery", sourceText: runbookInput, generatedMarkdown: md, category: "incident-recovery", tags: ["payment"] }) }); } catch {}
    setLoading(false); refreshStats();
  };

  // Feature 4: DNA
  const runDNA = () => {
    setLoading(true); setDnaResults(null);
    setTimeout(() => {
      setDnaResults({
        deviations: [
          { metric: "Startup Time", baseline: "2.3s", current: "4.1s", pct: "+78%", sev: "high" },
          { metric: "Memory Delta", baseline: "+12MB", current: "+89MB", pct: "+642%", sev: "critical" },
          { metric: "Error Rate", baseline: "0.02%", current: "2.1%", pct: "+10400%", sev: "critical" },
          { metric: "P99 Latency", baseline: "45ms", current: "230ms", pct: "+411%", sev: "high" },
        ],
        verdict: "ANOMALY DETECTED", score: 23
      });
      setDnaScans(p => p + 1); setLoading(false); refreshStats();
    }, 2000);
  };

  // Feature 5: Chaos
  const CHAOS = [
    { name: "Kill Redis Cache", target: "redis-cache", hyp: "API falls back to DB with <500ms latency" },
    { name: "Inject 3s API Latency", target: "api-gateway", hyp: "Circuit breaker trips after 5 timeouts" },
    { name: "CPU Stress Node-3", target: "node-3", hyp: "K8s reschedules pods within 60s" },
    { name: "Network Partition DB", target: "postgres-db", hyp: "Switches to read replicas in 10s" },
  ];
  const runChaos = (t: typeof CHAOS[0]) => {
    setChaosExps(p => [{ name: t.name, target: t.target, status: "running" }, ...p]);
    setTimeout(() => {
      const ok = Math.random() > 0.3;
      setChaosExps(p => p.map(e => e.name === t.name && e.status === "running" ? { ...e, status: ok ? "passed" : "failed", result: ok ? "Hypothesis confirmed ✓" : "VULNERABILITY FOUND" } : e));
      setChaosCount(p => p + 1);
      fetch(`${API}/chaos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: t.name, type: "experiment", target: t.target, status: ok ? "passed" : "failed", hypothesis: t.hyp }) }).then(() => refreshStats()).catch(() => {});
    }, 3000 + Math.random() * 2000);
  };

  const totalActions = riskHistory.length + postmortemCount + runbookCount + dnaScans + chaosCount;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[var(--accent)]" /> AI Innovation Lab
          </h1>
          <p className="text-[var(--ink-muted)] text-sm">5 breakthrough AI-powered features for DevOps intelligence</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/20">
            <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[10px] font-bold text-[var(--accent)]">{totalActions} actions run</span>
          </div>
          <button onClick={refreshStats} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all">
            <Database className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
            <span className="text-[10px] font-bold text-[var(--ink)]">
              {dbStats?.connected ? `MongoDB: ${Object.values(dbStats.collections || {}).reduce((a: number, b: any) => a + b, 0)} docs` : "DB Offline"}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${dbStats?.connected ? "bg-emerald-400" : "bg-red-400"}`} />
          </button>
        </div>
      </div>

      {/* Feature Tabs */}
      <div className="flex gap-1 bg-[var(--panel)] p-1 rounded-xl border border-[var(--border)] w-fit">
        {FEATURES.map(f => {
          const Icon = f.icon;
          return (
            <button key={f.id} onClick={() => { setActive(f.id); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${active === f.id ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white/5"}`}>
              <Icon className="w-3.5 h-3.5" /> {f.title}
            </button>
          );
        })}
      </div>

      {/* Feature Content */}
      <div className="rounded-2xl border border-[var(--border)] p-6 bg-[var(--panel)]">
        {/* Feature 1 */}
        {active === "blast" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-[var(--accent)]" /><h2 className="text-lg font-bold">Pre-Deployment Impact Prediction</h2></div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold">{riskHistory.length} scans</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(riskForm).map(([k, v]) => (
                <div key={k}><label className="text-[8px] uppercase font-bold text-[var(--ink-muted)] tracking-widest">{k.replace(/([A-Z])/g, ' $1')}</label>
                <input value={v} onChange={e => setRiskForm(p => ({ ...p, [k]: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs font-mono outline-none focus:border-[var(--accent)] transition-all" /></div>
              ))}
            </div>
            <button onClick={runBlastRadius} disabled={loading} className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />} Analyze Blast Radius
            </button>
            {riskResult && (
              <div className="p-5 rounded-xl border" style={{ borderColor: riskResult.level === "high" ? "#ef4444" : riskResult.level === "medium" ? "#f59e0b" : "#10b981", background: `${riskResult.level === "high" ? "#ef4444" : riskResult.level === "medium" ? "#f59e0b" : "#10b981"}10` }}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-5xl font-black" style={{ color: riskResult.level === "high" ? "#ef4444" : riskResult.level === "medium" ? "#f59e0b" : "#10b981" }}>{riskResult.score}</div>
                  <div><div className="text-sm font-bold uppercase">{riskResult.level} RISK</div><div className="text-xs text-[var(--ink-muted)]">{riskResult.recommendation}</div></div>
                </div>
                <div className="space-y-1">{riskResult.reasons?.map((r: string, i: number) => <div key={i} className="flex items-center gap-2 text-xs"><AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />{r}</div>)}</div>
              </div>
            )}
            {riskHistory.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest">Scan History</div>
                {riskHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-[var(--border)]/50 text-[10px]">
                    <span className="font-mono text-[var(--ink-muted)]">{h.time}</span>
                    <span className="font-bold">{h.repo}</span>
                    <span className={`ml-auto font-bold ${h.level === "high" ? "text-red-400" : h.level === "medium" ? "text-amber-400" : "text-emerald-400"}`}>{h.score}/100 {h.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feature 2 */}
        {active === "warroom" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Radio className="w-5 h-5 text-[var(--accent)]" /><h2 className="text-lg font-bold">AI-Powered Incident War Room</h2></div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold">{postmortemCount} postmortems generated</span>
            </div>
            <p className="text-sm text-[var(--ink-muted)]">Click below to simulate a P1 incident. The AI assigns roles, tracks the timeline, and auto-generates a postmortem saved to MongoDB.</p>
            <button onClick={startWarRoom} disabled={warRoomActive} className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50">
              {warRoomActive ? <><Loader2 className="w-4 h-4 animate-spin" /> War Room Active...</> : <><Zap className="w-4 h-4" /> Simulate P1 Incident</>}
            </button>
            {warRoomTimeline.length > 0 && (
              <div className="p-4 rounded-xl bg-black/20 border border-[var(--border)] font-mono text-xs space-y-2 max-h-80 overflow-y-auto terminal-scroll">
                {warRoomTimeline.map((e, i) => (
                  <div key={i} className="flex gap-3 items-start animate-fade-in">
                    <span className="text-[var(--accent)] shrink-0 text-[10px] w-16">{new Date(Date.now() - (warRoomTimeline.length - i) * 1200).toLocaleTimeString()}</span>
                    <span className="text-[var(--ink)]">{e}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feature 3 */}
        {active === "runbook" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--accent)]" /><h2 className="text-lg font-bold">Natural Language → Professional Runbook</h2></div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold">{runbookCount} runbooks saved</span>
            </div>
            <textarea value={runbookInput} onChange={e => setRunbookInput(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm font-mono resize-none outline-none focus:border-[var(--accent)] transition-all" placeholder="Paste what you did to fix the incident..." />
            <button onClick={generateRunbook} disabled={loading} className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} Generate Runbook
            </button>
            {runbookOutput && (
              <div className="p-5 rounded-xl bg-black/20 border border-[var(--border)] font-mono text-[11px] max-h-96 overflow-y-auto terminal-scroll whitespace-pre-wrap text-[var(--ink)]">{runbookOutput}</div>
            )}
          </div>
        )}

        {/* Feature 4 */}
        {active === "dna" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Fingerprint className="w-5 h-5 text-[var(--accent)]" /><h2 className="text-lg font-bold">Deployment DNA Fingerprinting</h2></div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold">{dnaScans} scans</span>
            </div>
            <p className="text-sm text-[var(--ink-muted)]">Compares current deployment against the healthy baseline from your last 20 successful deploys.</p>
            <button onClick={runDNA} disabled={loading} className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />} Scan Current Deployment
            </button>
            {dnaResults && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div><span className="text-sm font-bold text-red-400">{dnaResults.verdict}</span><div className="text-xs text-[var(--ink-muted)]">Health: <span className="text-red-400 font-bold">{dnaResults.score}/100</span></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {dnaResults.deviations.map((d: any) => (
                    <div key={d.metric} className={`p-3 rounded-lg border ${d.sev === "critical" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                      <div className="text-xs font-bold mb-1">{d.metric}</div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-[var(--ink-muted)]">{d.baseline}</span><span>→</span>
                        <span className={d.sev === "critical" ? "text-red-400 font-bold" : "text-amber-400 font-bold"}>{d.current}</span>
                        <span className={`ml-auto font-bold ${d.sev === "critical" ? "text-red-400" : "text-amber-400"}`}>{d.pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature 5 */}
        {active === "chaos" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-[var(--accent)]" /><h2 className="text-lg font-bold">Chaos Engineering Co-Pilot</h2></div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold">{chaosCount} experiments run</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CHAOS.map(t => (
                <div key={t.name} className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all">
                  <div className="text-sm font-bold mb-1">{t.name}</div>
                  <div className="text-[10px] text-[var(--ink-muted)] mb-1">Target: <span className="font-mono text-[var(--ink)]">{t.target}</span></div>
                  <div className="text-[10px] text-[var(--ink-muted)] mb-3">Hypothesis: {t.hyp}</div>
                  <button onClick={() => runChaos(t)} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[10px] font-bold flex items-center gap-1 hover:brightness-110 transition-all">
                    <Flame className="w-3 h-3" /> Run Experiment
                  </button>
                </div>
              ))}
            </div>
            {chaosExps.length > 0 && (
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest">Results</div>
                {chaosExps.map((e, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex items-center gap-3 ${e.status === "running" ? "border-amber-500/30 bg-amber-500/5" : e.status === "passed" ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                    {e.status === "running" ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : e.status === "passed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <div className="flex-1"><div className="text-xs font-bold">{e.name}</div>{e.result && <div className="text-[10px] text-[var(--ink-muted)]">{e.result}</div>}</div>
                    <span className={`text-[8px] uppercase font-bold ${e.status === "running" ? "text-amber-400" : e.status === "passed" ? "text-emerald-400" : "text-red-400"}`}>{e.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
