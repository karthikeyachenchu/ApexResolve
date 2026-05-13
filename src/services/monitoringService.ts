/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Metric, Container, ServiceInfo, NetworkActivity, Alert, LogEntry, LogLevel } from "../types";

// ─── Helper: Generate realistic time-series data ────────
function generateHistory(base: number, variance: number, count = 30) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: now - (count - i) * 60000,
    value: Math.max(0, +(base + (Math.random() - 0.5) * variance).toFixed(1))
  }));
}

// ─── Metrics (CPU, Memory, Network, Disk) ───────────────
export function getMockMetrics(): Metric[] {
  const cpuBase = 35 + Math.random() * 20;
  const memBase = 60 + Math.random() * 25;
  return [
    {
      name: "CPU Usage",
      value: +cpuBase.toFixed(1),
      unit: "%",
      status: cpuBase > 80 ? "error" : cpuBase > 60 ? "warning" : "normal",
      history: generateHistory(cpuBase, 15)
    },
    {
      name: "Memory Usage",
      value: +memBase.toFixed(1),
      unit: "%",
      status: memBase > 85 ? "error" : memBase > 70 ? "warning" : "normal",
      history: generateHistory(memBase, 8)
    },
    {
      name: "Network I/O",
      value: +(120 + Math.random() * 80).toFixed(0),
      unit: "KB/s",
      status: "normal",
      history: generateHistory(150, 60)
    },
    {
      name: "Disk I/O",
      value: +(200 + Math.random() * 100).toFixed(0),
      unit: "MB/s",
      status: "normal",
      history: generateHistory(220, 50)
    },
    {
      name: "API Latency",
      value: +(8 + Math.random() * 12).toFixed(1),
      unit: "ms",
      status: "normal",
      history: generateHistory(12, 5)
    },
    {
      name: "Error Rate",
      value: +(Math.random() * 3).toFixed(2),
      unit: "%",
      status: Math.random() > 0.7 ? "warning" : "normal",
      history: generateHistory(1.5, 2)
    }
  ];
}

// ─── Containers ─────────────────────────────────────────
export function getMockContainers(): Container[] {
  return [
    { id: "ctr-7a3f", name: "auth-service", status: "running", image: "apex/auth:v2.4.1", uptime: "14d 6h", cpu: 12.3, memory: 256, restartCount: 0 },
    { id: "ctr-9b21", name: "api-gateway", status: "running", image: "apex/gateway:v3.1.0", uptime: "14d 6h", cpu: 28.7, memory: 512, restartCount: 0 },
    { id: "ctr-1c88", name: "payment-proxy", status: "failed", image: "apex/payment:v1.2.0", uptime: "0s", cpu: 0, memory: 0, restartCount: 5 },
    { id: "ctr-4d55", name: "data-processor", status: "running", image: "apex/worker:v4.2.0", uptime: "2d 18h", cpu: 45.1, memory: 1024, restartCount: 1 },
    { id: "ctr-6e92", name: "notification-svc", status: "running", image: "apex/notify:v1.8.3", uptime: "7d 4h", cpu: 5.2, memory: 128, restartCount: 0 },
    { id: "ctr-2f77", name: "log-aggregator", status: "restarting", image: "apex/logger:v2.0.1", uptime: "0s", cpu: 2.1, memory: 64, restartCount: 3 },
    { id: "ctr-8a44", name: "redis-cache", status: "running", image: "redis:7-alpine", uptime: "30d 2h", cpu: 3.8, memory: 384, restartCount: 0 },
    { id: "ctr-5b33", name: "postgres-db", status: "running", image: "postgres:16", uptime: "30d 2h", cpu: 15.6, memory: 2048, restartCount: 0 },
  ];
}

// ─── Services ───────────────────────────────────────────
export function getMockServices(): ServiceInfo[] {
  return [
    {
      id: "svc-1", name: "Auth API", status: "healthy", type: "api",
      endpoint: "https://api.apex.io/auth", uptime: 99.99,
      responseTime: 12, requestsPerMin: 2400, errorRate: 0.01,
      lastHealthCheck: Date.now() - 30000, dependencies: ["redis-cache", "postgres-db"]
    },
    {
      id: "svc-2", name: "Payment Gateway", status: "down", type: "gateway",
      endpoint: "https://api.apex.io/payments", uptime: 94.2,
      responseTime: 0, requestsPerMin: 0, errorRate: 100,
      lastHealthCheck: Date.now() - 120000, dependencies: ["auth-service", "postgres-db"]
    },
    {
      id: "svc-3", name: "User Database", status: "healthy", type: "database",
      endpoint: "postgres://db.apex.io:5432", uptime: 99.99,
      responseTime: 3, requestsPerMin: 8500, errorRate: 0.0,
      lastHealthCheck: Date.now() - 15000, dependencies: []
    },
    {
      id: "svc-4", name: "Redis Cache", status: "healthy", type: "cache",
      endpoint: "redis://cache.apex.io:6379", uptime: 99.98,
      responseTime: 1, requestsPerMin: 45000, errorRate: 0.0,
      lastHealthCheck: Date.now() - 10000, dependencies: []
    },
    {
      id: "svc-5", name: "Task Queue", status: "degraded", type: "queue",
      endpoint: "amqp://queue.apex.io", uptime: 97.5,
      responseTime: 45, requestsPerMin: 1200, errorRate: 2.3,
      lastHealthCheck: Date.now() - 60000, dependencies: ["redis-cache"]
    },
    {
      id: "svc-6", name: "Data Worker", status: "healthy", type: "worker",
      endpoint: "internal://worker-pool", uptime: 99.8,
      responseTime: 0, requestsPerMin: 800, errorRate: 0.1,
      lastHealthCheck: Date.now() - 20000, dependencies: ["postgres-db", "redis-cache"]
    },
    {
      id: "svc-7", name: "Notification API", status: "healthy", type: "api",
      endpoint: "https://api.apex.io/notify", uptime: 99.95,
      responseTime: 18, requestsPerMin: 600, errorRate: 0.05,
      lastHealthCheck: Date.now() - 25000, dependencies: ["auth-service"]
    },
    {
      id: "svc-8", name: "API Gateway", status: "healthy", type: "gateway",
      endpoint: "https://gateway.apex.io", uptime: 99.97,
      responseTime: 8, requestsPerMin: 12000, errorRate: 0.02,
      lastHealthCheck: Date.now() - 5000, dependencies: ["auth-service", "redis-cache"]
    }
  ];
}

// ─── Network Activity ───────────────────────────────────
export function getMockNetworkActivity(): NetworkActivity[] {
  const now = Date.now();
  return Array.from({ length: 60 }, (_, i) => ({
    timestamp: now - (60 - i) * 60000,
    inbound: +(80 + Math.random() * 120).toFixed(1),
    outbound: +(40 + Math.random() * 80).toFixed(1),
    connections: Math.floor(200 + Math.random() * 300),
    errors: Math.floor(Math.random() * 5)
  }));
}

// ─── Alerts ─────────────────────────────────────────────
export function getMockAlerts(): Alert[] {
  const now = Date.now();
  return [
    {
      id: "alt-001", title: "Container Crash Loop Detected",
      message: "payment-proxy has restarted 5 times in the last 10 minutes. CrashLoopBackOff state detected.",
      severity: "critical", status: "active", source: "Container Monitor",
      timestamp: now - 300000
    },
    {
      id: "alt-002", title: "High Memory Usage Warning",
      message: "Memory usage on node-3 has exceeded 85% threshold. Current usage: 87.2%.",
      severity: "warning", status: "active", source: "Resource Monitor",
      timestamp: now - 600000
    },
    {
      id: "alt-003", title: "Log Aggregator Restarting",
      message: "log-aggregator service is in a restart loop. May cause gaps in log collection.",
      severity: "warning", status: "acknowledged", source: "Container Monitor",
      timestamp: now - 900000, acknowledgedBy: "karth"
    },
    {
      id: "alt-004", title: "SSL Certificate Expiring Soon",
      message: "SSL certificate for api.apex.io expires in 7 days. Renewal recommended.",
      severity: "info", status: "active", source: "Security Scanner",
      timestamp: now - 1800000
    },
    {
      id: "alt-005", title: "Database Connection Pool Near Capacity",
      message: "PostgreSQL connection pool at 92% capacity. Consider increasing max_connections.",
      severity: "warning", status: "active", source: "Database Monitor",
      timestamp: now - 2400000
    },
    {
      id: "alt-006", title: "API Deployment Succeeded",
      message: "apex-resolve-ui v2.4.1 deployed successfully to production cluster.",
      severity: "info", status: "resolved", source: "CI/CD Pipeline",
      timestamp: now - 3600000, resolvedAt: now - 3500000
    }
  ];
}

// ─── Log Stream ─────────────────────────────────────────
const LOG_SERVICES = ["auth-service", "api-gateway", "payment-proxy", "data-processor", "notification-svc", "log-aggregator"];
const LOG_MESSAGES: Record<LogLevel, string[]> = {
  INFO: [
    "Request processed successfully in {ms}ms",
    "Health check passed - all dependencies responsive",
    "Cache hit ratio: {pct}% - performance optimal",
    "New connection established from {ip}",
    "Scheduled task completed: data aggregation cycle",
    "TLS handshake completed with client {client}",
    "Rate limiter: {n} requests in window, under threshold"
  ],
  WARN: [
    "Response time exceeded threshold: {ms}ms > 500ms",
    "Connection pool utilization at {pct}% - approaching limit",
    "Retry attempt {n}/3 for downstream service call",
    "Deprecated API endpoint accessed: /v1/legacy/users",
    "Memory pressure detected - GC frequency increasing",
    "Slow query detected: {ms}ms on users.findByEmail()"
  ],
  ERROR: [
    "Connection refused to downstream service: payment-proxy:8443",
    "Uncaught exception: NullReferenceError in PaymentHandler.process()",
    "Database query timeout after 30000ms - query killed",
    "Authentication token validation failed: token expired",
    "Circuit breaker OPEN for payment-proxy - 5 consecutive failures",
    "OutOfMemoryError: Java heap space exceeded 2048MB limit"
  ],
  DEBUG: [
    "Entering middleware: rateLimiter for route /api/v2/users",
    "Cache key generated: user:session:{hash}",
    "SQL query plan: Seq Scan on users (cost=0.00..431.00)",
    "WebSocket frame received: PING from client-{id}"
  ],
  FATAL: [
    "FATAL: Unable to bind to port 8443 - address already in use",
    "FATAL: Database migration failed - schema version mismatch",
    "FATAL: Configuration file corrupted - cannot start service"
  ]
};

export function generateMockLogEntries(count = 50): LogEntry[] {
  const now = Date.now();
  const levels: LogLevel[] = ["INFO", "INFO", "INFO", "INFO", "WARN", "WARN", "ERROR", "DEBUG", "DEBUG", "FATAL"];
  return Array.from({ length: count }, (_, i) => {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const messages = LOG_MESSAGES[level];
    let message = messages[Math.floor(Math.random() * messages.length)];
    message = message
      .replace("{ms}", String(Math.floor(Math.random() * 2000)))
      .replace("{pct}", String(Math.floor(Math.random() * 100)))
      .replace("{n}", String(Math.floor(Math.random() * 10)))
      .replace("{ip}", `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`)
      .replace("{client}", `client-${Math.random().toString(36).substring(7)}`)
      .replace("{hash}", Math.random().toString(36).substring(2, 10))
      .replace("{id}", Math.random().toString(36).substring(7));
    return {
      id: `log-${i}-${Math.random().toString(36).substring(7)}`,
      timestamp: now - (count - i) * (3000 + Math.random() * 7000),
      level,
      service: LOG_SERVICES[Math.floor(Math.random() * LOG_SERVICES.length)],
      message
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
}
