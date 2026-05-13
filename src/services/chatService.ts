/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Primary: .env.local GEMINI_API_KEY | Falls back gracefully if invalid
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;
try {
  if (GEMINI_KEY) ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
} catch { ai = null; }

const SYSTEM_PROMPT = `You are ApexResolve AI — an elite DevOps Operations Assistant built for infrastructure management and incident response.

You have real-time awareness of the following simulated infrastructure:

**Active Containers:**
- auth-service (running, 14d uptime, CPU: 12.3%)
- api-gateway (running, 14d uptime, CPU: 28.7%)
- payment-proxy (FAILED, crashed 5 times, CrashLoopBackOff)
- data-processor (running, 2d uptime, CPU: 45.1%)
- notification-svc (running, 7d uptime, CPU: 5.2%)
- log-aggregator (RESTARTING, 3 restarts)
- redis-cache (running, 30d uptime)
- postgres-db (running, 30d uptime, CPU: 15.6%)

**Active Alerts:**
- CRITICAL: payment-proxy container crash loop (5 restarts in 10 min)
- WARNING: Memory usage at 87.2% on node-3
- WARNING: log-aggregator in restart loop
- INFO: SSL certificate for api.apex.io expiring in 7 days
- WARNING: PostgreSQL connection pool at 92%

**Services Health:**
- Auth API: Healthy (99.99% uptime, 12ms response)
- Payment Gateway: DOWN (0% availability)
- User Database: Healthy (99.99% uptime)
- Redis Cache: Healthy (99.98% uptime)
- Task Queue: Degraded (97.5% uptime, 2.3% error rate)
- API Gateway: Healthy (99.97% uptime)

**Recent Deployments:**
- apex-resolve-ui (main) — SUCCESS, 30min ago
- apex-resolve-api (hotfix/auth-timeout) — FAILED, 1hr ago
- apex-data-lake (develop) — IN PROGRESS
- apex-payment-svc (release/v1.3) — ROLLED BACK, 2hrs ago

**Your Capabilities:**
1. Answer operational queries about infrastructure status, CPU/memory usage, container health
2. Explain why deployments failed with root cause analysis
3. Recommend actions: restart containers, scale services, rollback deployments
4. Analyze logs and identify error patterns
5. Provide incident summaries and remediation steps
6. Show active services and their dependencies
7. Suggest automation workflows for recurring issues

**Response Guidelines:**
- Be concise, professional, and actionable
- Use technical DevOps terminology accurately
- Format responses with clear structure (bullet points, code blocks when appropriate)
- When recommending actions, provide specific commands or steps
- If asked to perform an action (restart, scale, etc.), confirm the action and describe what would happen
- Always consider blast radius and recommend safe approaches
- Provide root cause analysis when discussing failures
- If unsure, say so and recommend investigation steps`;

// ─── Offline Fallback Responses ────────────────────────
// When the API key is missing or invalid, the chatbot uses these intelligent pre-built responses
const OFFLINE_RESPONSES: Record<string, string> = {
  "default": `**ApexResolve AI — System Status Report**

Here's the current infrastructure overview:

🔴 **Critical Issues:**
- \`payment-proxy\` is in **CrashLoopBackOff** — 5 restarts in the last 10 minutes
- Root cause: Upstream service at \`10.0.1.42:8443\` refusing connections

⚠️ **Warnings:**
- Memory usage on node-3 at **87.2%** (threshold: 85%)
- \`log-aggregator\` in restart loop (3 restarts)
- PostgreSQL connection pool at **92%** capacity
- SSL certificate for \`api.apex.io\` expiring in 7 days

✅ **Healthy Services:** Auth API, User Database, Redis Cache, API Gateway

**Recommended Actions:**
1. Restart payment-proxy: \`kubectl rollout restart deployment/payment-proxy\`
2. Scale node-3 memory: \`kubectl scale --replicas=3 deployment/data-processor\`
3. Renew SSL: \`certbot renew --domain api.apex.io\``,

  "cpu": `**Current CPU Usage Across Containers:**

| Container | CPU % | Status |
|-----------|-------|--------|
| auth-service | 12.3% | ✅ Normal |
| api-gateway | 28.7% | ✅ Normal |
| payment-proxy | 0% | 🔴 Failed |
| data-processor | 45.1% | ⚠️ Elevated |
| notification-svc | 5.2% | ✅ Normal |
| log-aggregator | — | 🟡 Restarting |
| redis-cache | 8.1% | ✅ Normal |
| postgres-db | 15.6% | ✅ Normal |

**Cluster Average:** ~19.2% CPU utilization
**Recommendation:** data-processor CPU is elevated. Monitor for the next 30 minutes. If it exceeds 60%, consider scaling horizontally.`,

  "memory": `**Current Memory Usage:**

**Cluster Level:** 68.5% average utilization
- Node-1: 62.3% ✅
- Node-2: 55.8% ✅  
- Node-3: 87.2% 🔴 **CRITICAL** (above 85% threshold)

**Per-Container Memory:**
| Container | Memory | Limit | Usage |
|-----------|--------|-------|-------|
| auth-service | 128MB | 256MB | 50% |
| api-gateway | 384MB | 512MB | 75% |
| data-processor | 896MB | 1024MB | 87% ⚠️ |
| postgres-db | 512MB | 1024MB | 50% |

**Action Required for Node-3:**
\`\`\`bash
kubectl top nodes
kubectl describe node node-3 | grep -A 5 "Allocated resources"
# Consider evicting non-critical pods:
kubectl drain node-3 --ignore-daemonsets --delete-emptydir-data
\`\`\``,

  "payment": `**Payment Service Incident Analysis**

**Status:** 🔴 CRITICAL — CrashLoopBackOff
**Container:** payment-proxy
**Image:** apex/payment:v1.3.0
**Restart Count:** 5 in the last 10 minutes

**Root Cause Analysis:**
The payment-proxy container is failing to establish a connection to its upstream service at \`10.0.1.42:8443\`. This correlates with the failed deployment of \`apex-payment-svc\` (release/v1.3) which was rolled back 2 hours ago.

**Timeline:**
1. \`09:40\` — apex-payment-svc v1.3.0 deployed
2. \`09:42\` — Health checks start failing
3. \`09:45\` — Circuit breaker OPEN on api-gateway
4. \`09:48\` — Deployment rolled back to v1.2.8
5. \`09:50\` — payment-proxy still crash-looping on stale config

**Remediation Steps:**
\`\`\`bash
# 1. Force restart with previous config
kubectl rollout restart deployment/payment-proxy
# 2. Verify the rollback took effect
kubectl get pods -l app=payment-proxy -o wide
# 3. Check connection to upstream
kubectl exec -it payment-proxy-xxx -- curl -v https://10.0.1.42:8443/health
# 4. If still failing, manually set image to stable version
kubectl set image deployment/payment-proxy payment-proxy=apex/payment:v1.2.8
\`\`\``,

  "deploy": `**Recent Deployment Summary:**

| Deployment | Branch | Status | Time | Author |
|-----------|--------|--------|------|--------|
| apex-resolve-ui | main | ✅ Success | 30min ago | karth |
| apex-resolve-api | hotfix/auth-timeout | ❌ **Failed** | 1hr ago | dev_ops_bot |
| apex-data-lake | develop | 🔄 In Progress | now | jules |
| apex-payment-svc | release/v1.3 | ⏪ Rolled Back | 2hrs ago | karth |

**Failed Deployment Details (apex-resolve-api):**
- **Stage Failed:** Unit Tests
- **Error:** \`PaymentService.processPayment\` test assertion failed
- **Fix:** The auth token expiry was changed from 1h to 24h, but the test still expects 1h
- **Recommended:** Update test fixture or rollback the hotfix

\`\`\`bash
# Retry with fixed tests:
git checkout hotfix/auth-timeout
npm test -- --updateSnapshot
git push origin hotfix/auth-timeout
\`\`\``,

  "restart": `**Container Restart Procedure:**

To restart a specific container, use one of these methods:

**Method 1: Kubernetes (Recommended)**
\`\`\`bash
# Graceful restart (rolling update, zero downtime)
kubectl rollout restart deployment/payment-proxy

# Force delete pod (Kubernetes auto-recreates)
kubectl delete pod payment-proxy-7b4d8f6 --force --grace-period=0

# Check restart status
kubectl get pods -w
\`\`\`

**Method 2: Docker**
\`\`\`bash
docker restart payment-proxy
docker logs payment-proxy --tail 50
\`\`\`

**Method 3: ApexResolve UI**
1. Go to Infrastructure tab → Container table
2. Find payment-proxy → Click "Restart" button
3. Status will change: restarting → running

⚠️ **Blast Radius Check:** Restarting payment-proxy will temporarily break all payment processing. Estimated downtime: 15-30 seconds.`,

  "services": `**Active Services Overview:**

| Service | Status | Uptime | Response | Requests/min | Error Rate |
|---------|--------|--------|----------|-------------|-----------|
| Auth API | ✅ Healthy | 99.99% | 12ms | 2,400 | 0.01% |
| Payment Gateway | 🔴 **DOWN** | 94.2% | 0ms | 0 | 100% |
| User Database | ✅ Healthy | 99.99% | 3ms | 8,500 | 0% |
| Redis Cache | ✅ Healthy | 99.98% | 1ms | 45,000 | 0% |
| Task Queue | ⚠️ Degraded | 97.5% | 45ms | 1,200 | 2.3% |
| Data Worker | ✅ Healthy | 99.8% | 0ms | 800 | 0.1% |
| Notification API | ✅ Healthy | 99.95% | 18ms | 600 | 0.05% |
| API Gateway | ✅ Healthy | 99.97% | 8ms | 12,000 | 0.02% |

**Summary:** 6/8 services healthy. Payment Gateway is down due to payment-proxy CrashLoopBackOff. Task Queue is degraded with elevated error rate.`,

  "logs": `**Recent Error Logs (Last 15 Minutes):**

\`\`\`
10:23:45 ERROR [payment-proxy] Connection refused: upstream at 10.0.1.42:8443
10:23:46 FATAL [payment-proxy] CrashLoopBackOff: container restarted 5 times
10:23:47 ERROR [api-gateway] Circuit breaker OPEN for payment-proxy - 5 consecutive failures
10:24:12 WARN  [data-processor] Connection pool at 38% - approaching limit
10:24:55 ERROR [log-aggregator] Authentication token validation failed: token expired
10:25:03 WARN  [api-gateway] Connection pool at 49% - approaching limit
10:25:18 ERROR [api-gateway] Circuit breaker OPEN for payment-proxy
10:26:01 FATAL [notification-svc] Unable to bind to port 8443 - address already in use
\`\`\`

**Pattern Detected:** payment-proxy failures are cascading to api-gateway (circuit breaker) and affecting connection pools across services.

**Recommendation:** Resolve payment-proxy first — it's the root cause of cascade failures.`,

  "help": `**ApexResolve AI — Available Commands:**

I can help with these operational queries:

📊 **Infrastructure Monitoring:**
- "Show CPU usage" / "Show memory usage"
- "What's the cluster status?"
- "Show active services"

🔴 **Incident Response:**
- "Why is the payment service down?"
- "Why did the deployment fail?"
- "Show recent error logs"
- "Analyze the crash loop"

🔧 **Actions & Remediation:**
- "Restart payment-proxy container"
- "How do I rollback a deployment?"
- "Scale the API gateway"

📋 **Deployment & CI/CD:**
- "Show deployment history"
- "What's the build status?"
- "Trigger a new deployment"

💡 **Tip:** I have full awareness of all 8 containers, 8 services, 6 deployments, and 5 active alerts. Ask me anything about the infrastructure!`
};

function getOfflineResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("cpu")) return OFFLINE_RESPONSES["cpu"];
  if (q.includes("memory") || q.includes("ram") || q.includes("mem")) return OFFLINE_RESPONSES["memory"];
  if (q.includes("payment") || q.includes("crash") || q.includes("down") || q.includes("fail") || q.includes("why")) return OFFLINE_RESPONSES["payment"];
  if (q.includes("deploy") || q.includes("build") || q.includes("pipeline") || q.includes("cicd") || q.includes("ci/cd")) return OFFLINE_RESPONSES["deploy"];
  if (q.includes("restart") || q.includes("fix") || q.includes("recover")) return OFFLINE_RESPONSES["restart"];
  if (q.includes("service") || q.includes("health") || q.includes("status") || q.includes("active")) return OFFLINE_RESPONSES["services"];
  if (q.includes("log") || q.includes("error") || q.includes("trace")) return OFFLINE_RESPONSES["logs"];
  if (q.includes("help") || q.includes("what can") || q.includes("command")) return OFFLINE_RESPONSES["help"];
  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) return OFFLINE_RESPONSES["default"];
  return OFFLINE_RESPONSES["default"];
}

export async function getChatResponse(messages: ChatMessage[]): Promise<string> {
  const lastMessage = messages[messages.length - 1];

  // Try real AI first
  if (ai) {
    try {
      const formattedMessages = [
        { role: "user" as const, parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model" as const, parts: [{ text: "Understood. I am ApexResolve AI, fully initialized with current infrastructure state. All systems are being monitored. I'm ready to assist with any operational queries, diagnostics, or recommended actions." }] },
        ...messages.map(m => ({
          role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
          parts: [{ text: m.content }]
        }))
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: formattedMessages
      });

      return response.text ?? getOfflineResponse(lastMessage.content);
    } catch (error) {
      console.warn("Gemini API call failed, using offline mode:", error);
      return getOfflineResponse(lastMessage.content);
    }
  }

  // Offline mode — use pre-built intelligent responses
  return getOfflineResponse(lastMessage.content);
}
