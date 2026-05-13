/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RiskLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export type Environment = "Production" | "Staging" | "Development" | "Local";

export interface AnalysisStep {
  title: string;
  description: string;
  status: "completed" | "pending" | "current";
}

export interface AnalysisReport {
  id: string;
  timestamp: number;
  rootCause: string;
  riskLevel: RiskLevel;
  fixCommand: string;
  environment: Environment;
  plan: AnalysisStep[];
  codeDiff?: {
    filename: string;
    before: string;
    after: string;
  };
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  status: "normal" | "warning" | "error";
  history: { timestamp: number; value: number }[];
}

export interface Container {
  id: string;
  name: string;
  status: "running" | "failed" | "restarting" | "stopped";
  image: string;
  uptime: string;
  cpu: number;
  memory: number;
  restartCount: number;
}

export interface Deployment {
  id: string;
  repo: string;
  branch: string;
  status: "success" | "failed" | "in-progress" | "rolled-back";
  timestamp: number;
  author: string;
  commitMessage?: string;
  duration?: string;
  buildLogs?: string[];
  pipeline?: PipelineStage[];
}

export interface PipelineStage {
  name: string;
  status: "success" | "failed" | "in-progress" | "pending" | "skipped";
  duration?: string;
  logs?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  actionType?: "info" | "action" | "alert" | "chart";
}

// ─── Incident & Alert Types ─────────────────────────────

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: string;
  timestamp: number;
  resolvedAt?: number;
  acknowledgedBy?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: "open" | "investigating" | "resolved";
  createdAt: number;
  resolvedAt?: number;
  affectedServices: string[];
  rootCause?: string;
  aiSummary?: string;
  timeline: IncidentEvent[];
  relatedAlerts: string[];
}

export interface IncidentEvent {
  timestamp: number;
  message: string;
  type: "detection" | "escalation" | "action" | "resolution";
}

// ─── Log Types ──────────────────────────────────────────

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "FATAL";

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, string>;
}

export interface LogStream {
  service: string;
  entries: LogEntry[];
  isStreaming: boolean;
}

// ─── Service & Network Types ────────────────────────────

export interface ServiceInfo {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down" | "maintenance";
  type: "api" | "database" | "cache" | "queue" | "worker" | "gateway";
  endpoint: string;
  uptime: number;         // percentage
  responseTime: number;   // ms
  requestsPerMin: number;
  errorRate: number;      // percentage
  lastHealthCheck: number;
  dependencies: string[];
}

export interface NetworkActivity {
  timestamp: number;
  inbound: number;   // KB/s
  outbound: number;  // KB/s
  connections: number;
  errors: number;
}

// ─── Automation Types ───────────────────────────────────

export type AutomationStatus = "idle" | "running" | "completed" | "failed";

export interface AutomationAction {
  id: string;
  name: string;
  description: string;
  type: "restart" | "scale" | "clear-logs" | "alert" | "rollback" | "health-check" | "custom";
  target: string;
  status: AutomationStatus;
  triggeredAt?: number;
  completedAt?: number;
  result?: string;
  isAutomatic: boolean;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: "manual" | "alert" | "schedule" | "threshold";
  triggerCondition?: string;
  steps: AutomationAction[];
  enabled: boolean;
  lastRun?: number;
  runCount: number;
}

// ─── GitHub/Jenkins Integration ─────────────────────────

export interface GitHubRepo {
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  lastPush: number;
  openPRs: number;
  openIssues: number;
}

export interface JenkinsBuild {
  id: string;
  jobName: string;
  buildNumber: number;
  status: "success" | "failed" | "building" | "aborted";
  timestamp: number;
  duration: string;
  triggeredBy: string;
  changes: string[];
}
