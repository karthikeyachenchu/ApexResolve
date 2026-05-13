/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AutomationAction, AutomationWorkflow } from "../types";

export function getMockWorkflows(): AutomationWorkflow[] {
  return [
    {
      id: "wf-001",
      name: "Auto-Recovery: Payment Service",
      description: "Automatically restart payment-proxy container when crash loop is detected, verify health, and send alert.",
      trigger: "alert",
      triggerCondition: "Container crash count > 3 in 10 minutes",
      enabled: true,
      lastRun: Date.now() - 300000,
      runCount: 4,
      steps: [
        { id: "act-01a", name: "Stop Container", description: "Gracefully stop payment-proxy container", type: "restart", target: "payment-proxy", status: "completed", triggeredAt: Date.now() - 310000, completedAt: Date.now() - 305000, result: "Container stopped successfully", isAutomatic: true },
        { id: "act-01b", name: "Clear Error Logs", description: "Archive and clear corrupted log segments", type: "clear-logs", target: "payment-proxy", status: "completed", triggeredAt: Date.now() - 305000, completedAt: Date.now() - 303000, result: "1.2GB logs archived", isAutomatic: true },
        { id: "act-01c", name: "Restart Service", description: "Restart payment-proxy with fresh configuration", type: "restart", target: "payment-proxy", status: "completed", triggeredAt: Date.now() - 303000, completedAt: Date.now() - 300000, result: "Container restarted (attempt 1/3)", isAutomatic: true },
        { id: "act-01d", name: "Health Verification", description: "Verify service is responding to health checks", type: "health-check", target: "payment-proxy:8443/health", status: "failed", triggeredAt: Date.now() - 300000, completedAt: Date.now() - 295000, result: "Health check failed - 503 response", isAutomatic: true },
        { id: "act-01e", name: "Send Critical Alert", description: "Notify on-call engineer via PagerDuty", type: "alert", target: "oncall-team", status: "completed", triggeredAt: Date.now() - 295000, completedAt: Date.now() - 294000, result: "Alert sent to karth@apex.io", isAutomatic: true }
      ]
    },
    {
      id: "wf-002",
      name: "Auto-Scale: API Gateway",
      description: "Scale API gateway replicas when request rate exceeds threshold.",
      trigger: "threshold",
      triggerCondition: "Requests/min > 10000 for 5 minutes",
      enabled: true,
      lastRun: Date.now() - 7200000,
      runCount: 12,
      steps: [
        { id: "act-02a", name: "Check Current Load", description: "Query current request rate and resource utilization", type: "health-check", target: "api-gateway", status: "completed", triggeredAt: Date.now() - 7200000, completedAt: Date.now() - 7199000, result: "Load: 11,240 req/min", isAutomatic: true },
        { id: "act-02b", name: "Scale Replicas", description: "Increase api-gateway replicas from 3 to 5", type: "scale", target: "api-gateway", status: "completed", triggeredAt: Date.now() - 7199000, completedAt: Date.now() - 7180000, result: "Scaled to 5 replicas", isAutomatic: true },
        { id: "act-02c", name: "Notify Team", description: "Send Slack notification about auto-scaling event", type: "alert", target: "devops-channel", status: "completed", triggeredAt: Date.now() - 7180000, completedAt: Date.now() - 7179000, result: "Notification sent", isAutomatic: true }
      ]
    },
    {
      id: "wf-003",
      name: "Nightly Log Cleanup",
      description: "Archive logs older than 7 days and clear temporary files.",
      trigger: "schedule",
      triggerCondition: "Every day at 02:00 UTC",
      enabled: true,
      lastRun: Date.now() - 43200000,
      runCount: 30,
      steps: [
        { id: "act-03a", name: "Archive Old Logs", description: "Compress and move logs older than 7 days to cold storage", type: "clear-logs", target: "all-services", status: "completed", result: "4.8GB archived to S3", isAutomatic: true },
        { id: "act-03b", name: "Clear Temp Files", description: "Remove temporary build artifacts and cache", type: "clear-logs", target: "/tmp/apex-*", status: "completed", result: "2.1GB freed", isAutomatic: true },
        { id: "act-03c", name: "Report Summary", description: "Generate and email storage usage report", type: "alert", target: "admin@apex.io", status: "completed", result: "Report sent", isAutomatic: true }
      ]
    },
    {
      id: "wf-004",
      name: "Deployment Rollback Guard",
      description: "Automatically rollback deployment if post-deploy health checks fail.",
      trigger: "alert",
      triggerCondition: "Post-deployment health check failure",
      enabled: true,
      lastRun: Date.now() - 7200000,
      runCount: 2,
      steps: [
        { id: "act-04a", name: "Detect Failure", description: "Monitor health endpoint for 2 minutes post-deploy", type: "health-check", target: "deployed-service", status: "idle", isAutomatic: true },
        { id: "act-04b", name: "Initiate Rollback", description: "Revert to last known good deployment", type: "rollback", target: "deployed-service", status: "idle", isAutomatic: true },
        { id: "act-04c", name: "Verify Rollback", description: "Confirm previous version is healthy", type: "health-check", target: "deployed-service", status: "idle", isAutomatic: true },
        { id: "act-04d", name: "Alert Engineering", description: "Create incident and notify team", type: "alert", target: "engineering-team", status: "idle", isAutomatic: true }
      ]
    },
    {
      id: "wf-005",
      name: "Database Connection Pool Reset",
      description: "Reset connection pools when utilization exceeds 90%.",
      trigger: "threshold",
      triggerCondition: "DB connection pool > 90%",
      enabled: false,
      runCount: 0,
      steps: [
        { id: "act-05a", name: "Drain Connections", description: "Gracefully drain existing DB connections", type: "custom", target: "postgres-db", status: "idle", isAutomatic: true },
        { id: "act-05b", name: "Reset Pool", description: "Reinitialize connection pool with fresh settings", type: "restart", target: "connection-pool", status: "idle", isAutomatic: true },
        { id: "act-05c", name: "Monitor Recovery", description: "Watch connection metrics for 5 minutes", type: "health-check", target: "postgres-db", status: "idle", isAutomatic: true }
      ]
    }
  ];
}

export function getMockQuickActions(): AutomationAction[] {
  return [
    { id: "qa-01", name: "Restart Container", description: "Restart a specific container by name", type: "restart", target: "", status: "idle", isAutomatic: false },
    { id: "qa-02", name: "Scale Service", description: "Scale a service up or down", type: "scale", target: "", status: "idle", isAutomatic: false },
    { id: "qa-03", name: "Clear Service Logs", description: "Archive and clear logs for a service", type: "clear-logs", target: "", status: "idle", isAutomatic: false },
    { id: "qa-04", name: "Send Test Alert", description: "Send a test alert to verify notification channels", type: "alert", target: "", status: "idle", isAutomatic: false },
    { id: "qa-05", name: "Force Health Check", description: "Run immediate health check on all services", type: "health-check", target: "all-services", status: "idle", isAutomatic: false },
    { id: "qa-06", name: "Rollback Deployment", description: "Rollback the latest deployment to previous version", type: "rollback", target: "", status: "idle", isAutomatic: false }
  ];
}

// Simulates running an automation action
export function simulateAction(action: AutomationAction): Promise<AutomationAction> {
  return new Promise((resolve) => {
    const duration = 1500 + Math.random() * 3000;
    setTimeout(() => {
      const success = Math.random() > 0.15;
      resolve({
        ...action,
        status: success ? "completed" : "failed",
        triggeredAt: Date.now() - duration,
        completedAt: Date.now(),
        result: success
          ? `${action.name} executed successfully on ${action.target || "target service"}`
          : `${action.name} failed: Connection timeout to ${action.target || "target service"}`
      });
    }, duration);
  });
}
