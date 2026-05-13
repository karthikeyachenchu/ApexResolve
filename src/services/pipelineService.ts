/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Enhanced Pipeline Service — interactive pipelines with live execution simulation
 */

import { Deployment, PipelineStage, GitHubRepo, JenkinsBuild } from "../types";

// ─── Pipeline Stage Definitions ─────────────────────────
const PIPELINE_STAGES = ["Checkout", "Install Dependencies", "Lint & Type Check", "Unit Tests", "Build", "Deploy", "Health Check"] as const;

const STAGE_DURATIONS: Record<string, { min: number; max: number }> = {
  "Checkout": { min: 2, max: 5 },
  "Install Dependencies": { min: 30, max: 60 },
  "Lint & Type Check": { min: 8, max: 18 },
  "Unit Tests": { min: 40, max: 90 },
  "Build": { min: 20, max: 45 },
  "Deploy": { min: 30, max: 70 },
  "Health Check": { min: 5, max: 15 },
};

function randomDuration(stage: string): string {
  const range = STAGE_DURATIONS[stage] || { min: 5, max: 20 };
  const sec = Math.floor(Math.random() * (range.max - range.min) + range.min);
  return sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`;
}

// ─── Realistic Log Generators ───────────────────────────
const CHECKOUT_LOGS = [
  "Cloning into 'workspace'...",
  "remote: Enumerating objects: 1847, done.",
  "remote: Counting objects: 100% (1847/1847), done.",
  "Receiving objects: 100% (1847/1847), 4.2 MiB | 12.3 MiB/s, done.",
  "Resolving deltas: 100% (892/892), done.",
  "HEAD is now at a3f8c2b",
];

const INSTALL_LOGS = [
  "npm warn deprecated inflight@1.0.6: This module is not supported",
  "added 847 packages in 42s",
  "143 packages are looking for funding",
  "  run `npm fund` for details",
];

const LINT_LOGS_PASS = [
  "✓ ESLint: 0 errors, 0 warnings (124 files checked)",
  "✓ TypeScript: no type errors found (89 source files)",
  "✓ Prettier: all files formatted correctly",
];

const LINT_LOGS_FAIL = [
  "✗ ESLint found 3 errors:",
  "  src/services/payment.ts:42:5 - error: Unexpected 'any' type (@typescript-eslint/no-explicit-any)",
  "  src/services/payment.ts:67:1 - error: Missing return type on function",
  "  src/utils/logger.ts:12:10 - error: 'console.log' is not allowed (no-console)",
];

const TEST_LOGS_PASS = [
  "PASS src/services/auth.test.ts (1.2s)",
  "  ✓ AuthService > login > should authenticate valid credentials (45ms)",
  "  ✓ AuthService > login > should reject invalid password (12ms)",
  "  ✓ AuthService > token > should generate valid JWT (8ms)",
  "PASS src/services/api.test.ts (0.8s)",
  "  ✓ APIGateway > routing > should route to correct service (15ms)",
  "  ✓ APIGateway > middleware > should apply rate limiting (23ms)",
  "PASS src/services/cache.test.ts (0.4s)",
  "  ✓ CacheService > redis > should set and get values (5ms)",
  "",
  "Test Suites: 15 passed, 15 total",
  "Tests: 89 passed, 89 total",
  "Snapshots: 12 passed, 12 total",
  "Time: 8.234s",
];

const TEST_LOGS_FAIL = [
  "PASS src/services/auth.test.ts (1.2s)",
  "PASS src/services/api.test.ts (0.8s)",
  "FAIL src/services/payment.test.ts (1.6s)",
  "  ● PaymentService > processPayment > should handle timeout",
  "    Expected: 'timeout_error'",
  "    Received: undefined",
  "",
  "    at Object.<anonymous> (src/services/payment.test.ts:42:18)",
  "",
  "  ● PaymentService > refund > should validate refund amount",
  "    Expected: true",
  "    Received: false",
  "",
  "Test Suites: 1 failed, 14 passed, 15 total",
  "Tests: 2 failed, 87 passed, 89 total",
  "Time: 6.891s",
];

const BUILD_LOGS_PASS = [
  "vite v6.4.2 building for production...",
  "✓ 247 modules transformed.",
  "dist/index.html                  0.46 kB │ gzip: 0.30 kB",
  "dist/assets/index-Da3k7x.css    28.12 kB │ gzip: 5.89 kB",
  "dist/assets/index-Bf2xk9.js    142.87 kB │ gzip: 45.23 kB",
  "dist/assets/vendor-Cx8dR1.js   384.21 kB │ gzip: 124.56 kB",
  "✓ built in 12.4s",
];

const DEPLOY_LOGS_PASS = [
  "Connecting to Kubernetes cluster apex-prod-us-east1...",
  "kubectl apply -f k8s/deployment.yaml",
  "  deployment.apps/apex-resolve configured",
  "  service/apex-resolve-svc unchanged",
  "  ingress.networking.k8s.io/apex-resolve configured",
  "Rolling update: 0/3 replicas updated...",
  "Rolling update: 1/3 replicas updated...",
  "Rolling update: 2/3 replicas updated...",
  "Rolling update: 3/3 replicas updated...",
  "Deployment 'apex-resolve' successfully rolled out.",
  "All 3 replicas are ready and serving traffic.",
];

const HEALTHCHECK_LOGS_PASS = [
  "Running post-deploy health checks...",
  "  GET /health → 200 OK (12ms)",
  "  GET /api/v2/status → 200 OK (28ms)",
  "  GET /api/v2/metrics → 200 OK (15ms)",
  "  POST /api/v2/test-write → 201 Created (45ms)",
  "All health checks passed ✓",
];

const HEALTHCHECK_LOGS_FAIL = [
  "Running post-deploy health checks...",
  "  GET /health → 200 OK (12ms)",
  "  GET /api/v2/status → 503 Service Unavailable (5012ms)",
  "  GET /api/v2/status → 503 Service Unavailable (5008ms) [retry 1]",
  "  GET /api/v2/status → 503 Service Unavailable (5003ms) [retry 2]",
  "POST-DEPLOY HEALTH CHECK FAILED",
  "Endpoint /api/v2/status returned 503 after 3 retries.",
  "Auto-rollback initiated → reverting to previous version.",
];

// ─── Generate Static Pipelines ──────────────────────────
function generatePipeline(status: Deployment["status"]): PipelineStage[] {
  if (status === "success") {
    return [
      { name: "Checkout", status: "success", duration: randomDuration("Checkout"), logs: CHECKOUT_LOGS },
      { name: "Install Dependencies", status: "success", duration: randomDuration("Install Dependencies"), logs: INSTALL_LOGS },
      { name: "Lint & Type Check", status: "success", duration: randomDuration("Lint & Type Check"), logs: LINT_LOGS_PASS },
      { name: "Unit Tests", status: "success", duration: randomDuration("Unit Tests"), logs: TEST_LOGS_PASS },
      { name: "Build", status: "success", duration: randomDuration("Build"), logs: BUILD_LOGS_PASS },
      { name: "Deploy", status: "success", duration: randomDuration("Deploy"), logs: DEPLOY_LOGS_PASS },
      { name: "Health Check", status: "success", duration: randomDuration("Health Check"), logs: HEALTHCHECK_LOGS_PASS },
    ];
  }
  if (status === "failed") {
    return [
      { name: "Checkout", status: "success", duration: randomDuration("Checkout"), logs: CHECKOUT_LOGS },
      { name: "Install Dependencies", status: "success", duration: randomDuration("Install Dependencies"), logs: INSTALL_LOGS },
      { name: "Lint & Type Check", status: "success", duration: randomDuration("Lint & Type Check"), logs: LINT_LOGS_PASS },
      { name: "Unit Tests", status: "failed", duration: randomDuration("Unit Tests"), logs: TEST_LOGS_FAIL },
      { name: "Build", status: "skipped" },
      { name: "Deploy", status: "skipped" },
      { name: "Health Check", status: "skipped" },
    ];
  }
  if (status === "rolled-back") {
    return [
      { name: "Checkout", status: "success", duration: randomDuration("Checkout"), logs: CHECKOUT_LOGS },
      { name: "Install Dependencies", status: "success", duration: randomDuration("Install Dependencies"), logs: INSTALL_LOGS },
      { name: "Lint & Type Check", status: "success", duration: randomDuration("Lint & Type Check"), logs: LINT_LOGS_PASS },
      { name: "Unit Tests", status: "success", duration: randomDuration("Unit Tests"), logs: TEST_LOGS_PASS },
      { name: "Build", status: "success", duration: randomDuration("Build"), logs: BUILD_LOGS_PASS },
      { name: "Deploy", status: "success", duration: randomDuration("Deploy"), logs: DEPLOY_LOGS_PASS },
      { name: "Health Check", status: "failed", duration: "2m 15s", logs: HEALTHCHECK_LOGS_FAIL },
    ];
  }
  // in-progress
  return [
    { name: "Checkout", status: "success", duration: randomDuration("Checkout"), logs: CHECKOUT_LOGS },
    { name: "Install Dependencies", status: "success", duration: randomDuration("Install Dependencies"), logs: INSTALL_LOGS },
    { name: "Lint & Type Check", status: "success", duration: randomDuration("Lint & Type Check"), logs: LINT_LOGS_PASS },
    { name: "Unit Tests", status: "in-progress" },
    { name: "Build", status: "pending" },
    { name: "Deploy", status: "pending" },
    { name: "Health Check", status: "pending" },
  ];
}

// ─── Live Pipeline Executor ─────────────────────────────
// Simulates a real pipeline running stage-by-stage with real-time updates
export function executePipeline(
  deployId: string,
  repo: string,
  branch: string,
  onStageUpdate: (deployId: string, stages: PipelineStage[]) => void,
  onComplete: (deployId: string, finalStatus: "success" | "failed" | "rolled-back") => void
) {
  const stages: PipelineStage[] = PIPELINE_STAGES.map(name => ({ name, status: "pending" as const }));

  // Determine if this build will fail (20% chance)
  const willFail = Math.random() < 0.2;
  const failAtStage = willFail ? Math.floor(Math.random() * 4) + 2 : -1; // fail between stage 2-5

  let currentStage = 0;

  function advanceStage() {
    if (currentStage >= stages.length) {
      // All stages done — run final health check
      onComplete(deployId, "success");
      return;
    }

    // Mark current stage as in-progress
    stages[currentStage] = { ...stages[currentStage], status: "in-progress" };
    onStageUpdate(deployId, [...stages]);

    // Calculate duration for this stage
    const stageName = stages[currentStage].name;
    const range = STAGE_DURATIONS[stageName] || { min: 5, max: 15 };
    const durationMs = (Math.random() * (range.max - range.min) + range.min) * 50; // speed up for demo (50ms per sec)

    setTimeout(() => {
      if (currentStage === failAtStage) {
        // This stage fails
        const failLogs = currentStage === 2 ? LINT_LOGS_FAIL :
                         currentStage === 3 ? TEST_LOGS_FAIL :
                         currentStage === 4 ? ["ERROR: Build failed with exit code 1", "Module not found: 'payment-sdk'", "Build terminated."] :
                         currentStage === 5 ? ["kubectl apply failed:", "Error: ImagePullBackOff for apex/" + repo + ":latest", "Deployment aborted."] :
                         ["Stage failed with unknown error"];

        stages[currentStage] = { ...stages[currentStage], status: "failed", duration: randomDuration(stageName), logs: failLogs };
        // Skip remaining stages
        for (let i = currentStage + 1; i < stages.length; i++) {
          stages[i] = { ...stages[i], status: "skipped" };
        }
        onStageUpdate(deployId, [...stages]);
        onComplete(deployId, "failed");
        return;
      }

      // Stage succeeds
      const successLogs = currentStage === 0 ? CHECKOUT_LOGS :
                          currentStage === 1 ? INSTALL_LOGS :
                          currentStage === 2 ? LINT_LOGS_PASS :
                          currentStage === 3 ? TEST_LOGS_PASS :
                          currentStage === 4 ? BUILD_LOGS_PASS :
                          currentStage === 5 ? DEPLOY_LOGS_PASS :
                          HEALTHCHECK_LOGS_PASS;

      stages[currentStage] = { ...stages[currentStage], status: "success", duration: randomDuration(stageName), logs: successLogs };
      onStageUpdate(deployId, [...stages]);
      currentStage++;
      advanceStage();
    }, durationMs);
  }

  advanceStage();
}

// ─── Deployments ────────────────────────────────────────
export function getMockDeployments(): Deployment[] {
  const now = Date.now();
  return [
    {
      id: "dpl-7a3f", repo: "apex-resolve-ui", branch: "main", status: "success",
      timestamp: now - 1800000, author: "karth",
      commitMessage: "feat: add real-time monitoring dashboard with site health checks",
      duration: "3m 26s",
      pipeline: generatePipeline("success")
    },
    {
      id: "dpl-9b21", repo: "apex-resolve-api", branch: "hotfix/auth-timeout", status: "failed",
      timestamp: now - 3600000, author: "dev_ops_bot",
      commitMessage: "fix: increase auth token expiry to 24h",
      duration: "2m 59s",
      pipeline: generatePipeline("failed")
    },
    {
      id: "dpl-1c88", repo: "apex-data-lake", branch: "develop", status: "in-progress",
      timestamp: now - 300000, author: "jules",
      commitMessage: "feat: implement data partitioning for query optimization",
      pipeline: generatePipeline("in-progress")
    },
    {
      id: "dpl-4d55", repo: "apex-payment-svc", branch: "release/v1.3", status: "rolled-back",
      timestamp: now - 7200000, author: "karth",
      commitMessage: "release: payment service v1.3.0 with new refund flow",
      duration: "5m 48s",
      pipeline: generatePipeline("rolled-back")
    },
    {
      id: "dpl-6e92", repo: "apex-resolve-ui", branch: "feat/notifications", status: "success",
      timestamp: now - 86400000, author: "karth",
      commitMessage: "feat: add push notification support and alert subscriptions",
      duration: "3m 12s",
      pipeline: generatePipeline("success")
    },
    {
      id: "dpl-2f77", repo: "apex-resolve-api", branch: "main", status: "success",
      timestamp: now - 172800000, author: "jules",
      commitMessage: "chore: upgrade dependencies & apply security patches",
      duration: "4m 1s",
      pipeline: generatePipeline("success")
    }
  ];
}

// ─── GitHub Repos (Enhanced) ────────────────────────────
export interface GitHubWebhookEvent {
  id: string;
  type: "push" | "pull_request" | "issue" | "deployment" | "workflow_run";
  repo: string;
  message: string;
  author: string;
  timestamp: number;
  ref?: string;
  sha?: string;
}

export function getMockGitHubRepos(): GitHubRepo[] {
  return [
    { name: "apex-resolve-ui", fullName: "apex-team/apex-resolve-ui", url: "https://github.com/apex-team/apex-resolve-ui", defaultBranch: "main", lastPush: Date.now() - 1800000, openPRs: 3, openIssues: 7 },
    { name: "apex-resolve-api", fullName: "apex-team/apex-resolve-api", url: "https://github.com/apex-team/apex-resolve-api", defaultBranch: "main", lastPush: Date.now() - 3600000, openPRs: 5, openIssues: 12 },
    { name: "apex-data-lake", fullName: "apex-team/apex-data-lake", url: "https://github.com/apex-team/apex-data-lake", defaultBranch: "develop", lastPush: Date.now() - 300000, openPRs: 1, openIssues: 4 },
    { name: "apex-payment-svc", fullName: "apex-team/apex-payment-svc", url: "https://github.com/apex-team/apex-payment-svc", defaultBranch: "main", lastPush: Date.now() - 7200000, openPRs: 2, openIssues: 9 }
  ];
}

export function getMockGitHubEvents(): GitHubWebhookEvent[] {
  const now = Date.now();
  return [
    { id: "gh-1", type: "push", repo: "apex-resolve-ui", message: "Pushed 3 commits to main", author: "karth", timestamp: now - 1800000, ref: "refs/heads/main", sha: "a3f8c2b" },
    { id: "gh-2", type: "pull_request", repo: "apex-resolve-api", message: "PR #47: Fix auth token expiry handling", author: "dev_ops_bot", timestamp: now - 2700000, ref: "hotfix/auth-timeout" },
    { id: "gh-3", type: "workflow_run", repo: "apex-resolve-ui", message: "CI workflow completed successfully", author: "github-actions", timestamp: now - 1900000, sha: "a3f8c2b" },
    { id: "gh-4", type: "push", repo: "apex-data-lake", message: "Pushed 1 commit to develop", author: "jules", timestamp: now - 300000, ref: "refs/heads/develop", sha: "f7d2e91" },
    { id: "gh-5", type: "issue", repo: "apex-payment-svc", message: "Issue #23: Payment timeout in production", author: "karth", timestamp: now - 5400000 },
    { id: "gh-6", type: "deployment", repo: "apex-resolve-ui", message: "Deployment to production succeeded", author: "github-actions", timestamp: now - 1850000, sha: "a3f8c2b" },
    { id: "gh-7", type: "pull_request", repo: "apex-data-lake", message: "PR #12: Add data partitioning module", author: "jules", timestamp: now - 600000, ref: "feat/partitioning" },
    { id: "gh-8", type: "push", repo: "apex-resolve-api", message: "Pushed 1 commit to hotfix/auth-timeout", author: "dev_ops_bot", timestamp: now - 3600000, ref: "refs/heads/hotfix/auth-timeout", sha: "b4e1d33" },
    { id: "gh-9", type: "workflow_run", repo: "apex-resolve-api", message: "CI workflow failed — unit test failure", author: "github-actions", timestamp: now - 3500000, sha: "b4e1d33" },
    { id: "gh-10", type: "issue", repo: "apex-resolve-api", message: "Issue #51: Rate limiter not working on /api/v2", author: "security-bot", timestamp: now - 14400000 },
  ];
}

// ─── Jenkins Builds (Enhanced with console output) ──────
export interface JenkinsBuildDetail extends JenkinsBuild {
  consoleOutput: string[];
  stages: PipelineStage[];
  parameters?: Record<string, string>;
}

export function getMockJenkinsBuilds(): JenkinsBuild[] {
  const now = Date.now();
  return [
    { id: "jnk-01", jobName: "apex-ui-pipeline", buildNumber: 142, status: "success", timestamp: now - 1800000, duration: "3m 26s", triggeredBy: "GitHub Push (main)", changes: ["Added site monitoring component", "Fixed CSS grid layout", "Updated dashboard metrics"] },
    { id: "jnk-02", jobName: "apex-api-pipeline", buildNumber: 89, status: "failed", timestamp: now - 3600000, duration: "2m 59s", triggeredBy: "GitHub Push (hotfix/auth-timeout)", changes: ["Auth timeout fix", "Updated middleware chain", "Modified JWT validation"] },
    { id: "jnk-03", jobName: "apex-data-pipeline", buildNumber: 56, status: "building", timestamp: now - 300000, duration: "--", triggeredBy: "Manual Trigger", changes: ["Data partitioning implementation", "Query optimizer v2"] },
    { id: "jnk-04", jobName: "apex-nightly-build", buildNumber: 201, status: "success", timestamp: now - 43200000, duration: "8m 14s", triggeredBy: "Scheduled (cron: 0 2 * * *)", changes: ["Nightly integration tests", "Security vulnerability scan", "License compliance check"] },
    { id: "jnk-05", jobName: "apex-payment-pipeline", buildNumber: 33, status: "aborted", timestamp: now - 7200000, duration: "1m 22s", triggeredBy: "GitHub Push (release/v1.3)", changes: ["Payment v1.3 release candidate"] }
  ];
}

export function getJenkinsBuildDetail(id: string): JenkinsBuildDetail | null {
  const builds = getMockJenkinsBuilds();
  const build = builds.find(b => b.id === id);
  if (!build) return null;

  const successConsole = [
    `Started by ${build.triggeredBy}`,
    `[Pipeline] Start of Pipeline`,
    `[Pipeline] node`,
    `Running on Jenkins agent-01 in /workspace/${build.jobName}`,
    `[Pipeline] {`,
    `[Pipeline] stage (Checkout)`,
    `> git checkout ${build.changes[0] || "main"}`,
    `Cloning repository https://github.com/apex-team/${build.jobName.replace("-pipeline", "")}`,
    `> git rev-parse HEAD → a3f8c2b`,
    `[Pipeline] stage (Install)`,
    `> npm ci`,
    `added 847 packages in 38s`,
    `[Pipeline] stage (Test)`,
    build.status === "failed" ? `FAILURE: 2 tests failed` : `> npm test — 89 tests passed`,
    `[Pipeline] stage (Build)`,
    build.status === "failed" ? `Skipped due to test failure` : `> npm run build — completed in 12.4s`,
    `[Pipeline] stage (Deploy)`,
    build.status === "success" ? `> kubectl apply -f k8s/ — deployment rolled out` : `Skipped`,
    `[Pipeline] End of Pipeline`,
    build.status === "success" ? `Finished: SUCCESS` : build.status === "failed" ? `Finished: FAILURE` : `Finished: ABORTED`,
  ];

  return {
    ...build,
    consoleOutput: successConsole,
    stages: generatePipeline(build.status === "building" ? "in-progress" : build.status === "aborted" ? "failed" : build.status),
    parameters: {
      BRANCH: build.status === "success" ? "main" : "hotfix/auth-timeout",
      ENVIRONMENT: "production",
      DEPLOY_TARGET: "apex-prod-us-east1",
      NODE_VERSION: "20.x",
    }
  };
}
