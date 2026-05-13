import express from "express";
import cors from "cors";
import { connectDB, Incident, AuditLog, DeploymentRecord, HealthSnapshot, Postmortem, Runbook, ChaosExperiment } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.API_PORT || 3001;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
let dbConnected = false;

// ─── Health ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok", db: dbConnected, timestamp: Date.now() }));

// ─── GitHub API ─────────────────────────────────────────
async function ghFetch(path: string) {
  const h: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com${path}`, { headers: h });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

app.get("/api/github/repos", async (_req, res) => {
  try {
    const repos = GITHUB_TOKEN ? await ghFetch("/user/repos?sort=updated&per_page=10") : await ghFetch("/users/octocat/repos?per_page=5");
    res.json(repos.map((r: any) => ({ name: r.name, fullName: r.full_name, url: r.html_url, defaultBranch: r.default_branch, lastPush: new Date(r.pushed_at).getTime(), openIssues: r.open_issues_count, stars: r.stargazers_count, language: r.language })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/github/repos/:owner/:repo/commits", async (req, res) => {
  try {
    const c = await ghFetch(`/repos/${req.params.owner}/${req.params.repo}/commits?per_page=10`);
    res.json(c.map((x: any) => ({ sha: x.sha?.substring(0, 7), message: x.commit?.message?.split("\n")[0], author: x.author?.login || x.commit?.author?.name, timestamp: new Date(x.commit?.author?.date).getTime() })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Audit helper ───────────────────────────────────────
async function log(action: string, cat: string, details: string) {
  if (!dbConnected) return;
  try { await AuditLog.create({ action, category: cat, details }); } catch {}
}

// ─── Incidents CRUD ─────────────────────────────────────
app.get("/api/incidents", async (_r, res) => { if (!dbConnected) return res.json([]); res.json(await Incident.find().sort({ createdAt: -1 }).limit(50)); });
app.post("/api/incidents", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "DB offline" });
  const inc = await Incident.create({ incidentId: `INC-${Date.now().toString(36).toUpperCase()}`, ...req.body });
  await log("incident_created", "incident", inc.title);
  res.status(201).json(inc);
});
app.patch("/api/incidents/:id", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "DB offline" });
  const inc = await Incident.findOneAndUpdate({ incidentId: req.params.id }, { ...req.body, updatedAt: new Date() }, { new: true });
  await log("incident_updated", "incident", `${req.params.id}`);
  res.json(inc);
});

// ─── Audit Trail ────────────────────────────────────────
app.get("/api/audit", async (req, res) => {
  if (!dbConnected) return res.json([]);
  const f = req.query.category ? { category: String(req.query.category) } : {};
  res.json(await AuditLog.find(f).sort({ timestamp: -1 }).limit(parseInt(req.query.limit as string) || 50));
});

// ─── Deployments ────────────────────────────────────────
app.post("/api/deployments", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "DB offline" });
  const d = await DeploymentRecord.create(req.body);
  await log("deployment", "deployment", `${d.repo}@${d.branch}`);
  res.status(201).json(d);
});
app.get("/api/deployments", async (_r, res) => { if (!dbConnected) return res.json([]); res.json(await DeploymentRecord.find().sort({ createdAt: -1 }).limit(20)); });

// ─── Health Snapshots ───────────────────────────────────
app.post("/api/health-snapshots", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "DB offline" });
  res.status(201).json(await HealthSnapshot.create(req.body));
});
app.get("/api/health-snapshots", async (req, res) => {
  if (!dbConnected) return res.json([]);
  const since = new Date(Date.now() - (parseInt(req.query.hours as string) || 1) * 3600000);
  res.json(await HealthSnapshot.find({ timestamp: { $gte: since } }).sort({ timestamp: 1 }));
});

// ─── Postmortems ────────────────────────────────────────
app.post("/api/postmortems", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "DB offline" });
  const pm = await Postmortem.create(req.body);
  await log("postmortem_generated", "incident", pm.incidentId);
  res.status(201).json(pm);
});
app.get("/api/postmortems", async (_r, res) => { if (!dbConnected) return res.json([]); res.json(await Postmortem.find().sort({ createdAt: -1 }).limit(10)); });

// ─── Runbooks ───────────────────────────────────────────
app.post("/api/runbooks", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "DB offline" });
  const rb = await Runbook.create(req.body);
  await log("runbook_generated", "automation", rb.title || "Untitled");
  res.status(201).json(rb);
});
app.get("/api/runbooks", async (_r, res) => { if (!dbConnected) return res.json([]); res.json(await Runbook.find().sort({ createdAt: -1 }).limit(10)); });

// ─── Chaos Experiments ──────────────────────────────────
app.post("/api/chaos", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "DB offline" });
  const ex = await ChaosExperiment.create({ experimentId: `CHAOS-${Date.now().toString(36).toUpperCase()}`, ...req.body });
  await log("chaos_experiment", "automation", `${ex.name} → ${ex.target}`);
  res.status(201).json(ex);
});
app.get("/api/chaos", async (_r, res) => { if (!dbConnected) return res.json([]); res.json(await ChaosExperiment.find().sort({ createdAt: -1 }).limit(20)); });
app.patch("/api/chaos/:id", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "DB offline" });
  res.json(await ChaosExperiment.findOneAndUpdate({ experimentId: req.params.id }, req.body, { new: true }));
});

// ─── Risk Score ─────────────────────────────────────────
app.post("/api/risk-score", async (req, res) => {
  const { repo, branch, filesChanged = 0, additions = 0, deletions = 0 } = req.body;
  let score = 20; const reasons: string[] = [];
  if (branch?.includes("main")) { score += 25; reasons.push("Deploying to main branch"); }
  if (branch?.includes("hotfix")) { score += 15; reasons.push("Hotfix deployment"); }
  if (filesChanged > 20) { score += 20; reasons.push(`${filesChanged} files modified`); }
  if (additions + deletions > 500) { score += 15; reasons.push(`+${additions}/-${deletions} code churn`); }
  if (repo?.includes("payment")) { score += 20; reasons.push("Payment service (critical)"); }
  score = Math.min(100, score);
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  await log("risk_assessed", "deployment", `${repo}: ${score}/100`);
  res.json({ score, level, reasons, recommendation: score >= 70 ? "HOLD: Requires approval" : score >= 40 ? "CAUTION: Monitor closely" : "SAFE: Proceed" });
});

// ─── DB Stats ───────────────────────────────────────────
app.get("/api/db/stats", async (_r, res) => {
  if (!dbConnected) return res.json({ connected: false });
  const [incidents, audits, deploys, snapshots, postmortems, runbooks, chaos] = await Promise.all([
    Incident.countDocuments(), AuditLog.countDocuments(), DeploymentRecord.countDocuments(),
    HealthSnapshot.countDocuments(), Postmortem.countDocuments(), Runbook.countDocuments(), ChaosExperiment.countDocuments(),
  ]);
  res.json({ connected: true, collections: { incidents, audits, deploys, snapshots, postmortems, runbooks, chaos } });
});

// ─── Seed ───────────────────────────────────────────────
async function seed() {
  if (!dbConnected || (await Incident.countDocuments()) > 0) return;
  console.log("🌱 Seeding...");
  await Incident.insertMany([
    { incidentId: "INC-001", title: "Payment Service Crash Loop", severity: "critical", status: "open", affectedServices: ["payment-proxy", "api-gateway"], timeline: [{ message: "CrashLoopBackOff detected", type: "detection" }] },
    { incidentId: "INC-002", title: "High Memory on Node-3", severity: "warning", status: "investigating", affectedServices: ["data-processor"], timeline: [{ message: "87.2% memory", type: "detection" }] },
    { incidentId: "INC-003", title: "API Deploy Failure", severity: "warning", status: "open", affectedServices: ["apex-api"], timeline: [{ message: "Unit test failed", type: "detection" }] },
  ]);
  await AuditLog.insertMany([
    { action: "system_started", category: "config", details: "ApexResolve backend initialized" },
    { action: "db_connected", category: "config", details: "MongoDB connected" },
  ]);
  console.log("✅ Seeded");
}

// ─── Start ──────────────────────────────────────────────
(async () => {
  dbConnected = await connectDB();
  if (dbConnected) await seed();
  app.listen(PORT, () => {
    console.log(`\n🚀 ApexResolve API → http://localhost:${PORT}`);
    console.log(`   MongoDB: ${dbConnected ? "✅ Connected" : "❌ Offline"}`);
    console.log(`   GitHub:  ${GITHUB_TOKEN ? "✅ Token set" : "⚠️  Public API only"}\n`);
  });
})();
