import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | null = null;

export async function connectDB() {
  const externalUri = process.env.MONGODB_URI;
  // Try external MongoDB first
  if (externalUri && externalUri !== "mongodb://127.0.0.1:27017/apexresolve") {
    try {
      await mongoose.connect(externalUri);
      console.log("✅ MongoDB connected (external):", externalUri.replace(/\/\/.*@/, "//***@"));
      return true;
    } catch { /* fall through to memory server */ }
  }
  // Fall back to in-memory MongoDB
  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log("✅ MongoDB connected (in-memory):", mongod.getUri());
    return true;
  } catch (err: any) {
    console.error("❌ MongoDB failed:", err.message);
    return false;
  }
}

// ─── Schemas ────────────────────────────────────────────
const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  severity: { type: String, enum: ["critical", "warning", "info"], default: "warning" },
  status: { type: String, enum: ["open", "investigating", "resolved"], default: "open" },
  affectedServices: [String],
  rootCause: String,
  aiSummary: String,
  timeline: [{ timestamp: { type: Date, default: Date.now }, message: String, type: { type: String } }],
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  category: { type: String, required: true },
  user: { type: String, default: "karth" },
  details: String,
  metadata: mongoose.Schema.Types.Mixed,
  severity: { type: String, default: "info" },
  timestamp: { type: Date, default: Date.now },
});

const deploymentRecordSchema = new mongoose.Schema({
  deployId: { type: String, required: true, unique: true },
  repo: String, branch: String,
  status: String, author: String,
  commitMessage: String, commitSha: String,
  duration: String, riskScore: Number, riskReason: String,
  environment: { type: String, default: "production" },
  triggeredBy: { type: String, default: "manual" },
  dnaFingerprint: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

const healthSnapshotSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  healthScore: Number,
  metrics: { cpu: Number, memory: Number, disk: Number, latency: Number, errorRate: Number },
  servicesUp: Number, servicesTotal: Number,
  containersHealthy: Number, containersTotal: Number,
  activeAlerts: Number, anomalies: [String],
});

const postmortemSchema = new mongoose.Schema({
  incidentId: { type: String, required: true },
  title: String,
  content: { type: String, required: true },
  summary: String, rootCause: String, impact: String,
  actionItems: [{ task: String, assignee: String, status: String }],
  createdAt: { type: Date, default: Date.now },
});

const runbookSchema = new mongoose.Schema({
  title: String,
  sourceText: String,
  generatedMarkdown: { type: String, required: true },
  category: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});

const chaosExperimentSchema = new mongoose.Schema({
  experimentId: { type: String, required: true, unique: true },
  name: String, type: String, target: String,
  status: { type: String, default: "pending" },
  hypothesis: String, result: String,
  metrics: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

export const Incident = mongoose.model("Incident", incidentSchema);
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export const DeploymentRecord = mongoose.model("DeploymentRecord", deploymentRecordSchema);
export const HealthSnapshot = mongoose.model("HealthSnapshot", healthSnapshotSchema);
export const Postmortem = mongoose.model("Postmortem", postmortemSchema);
export const Runbook = mongoose.model("Runbook", runbookSchema);
export const ChaosExperiment = mongoose.model("ChaosExperiment", chaosExperimentSchema);
