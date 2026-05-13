/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Integrations Service — Simulates data from 15 DevOps monitoring tools
 */

export type IntegrationStatus = "connected" | "disconnected" | "degraded" | "configuring";
export type IntegrationCategory = "monitoring" | "logging" | "visualization" | "incident" | "infrastructure";

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  icon: string;       // emoji/symbol for display
  color: string;      // brand color
  version?: string;
  endpoint?: string;
  lastSync?: number;
  metricsCount?: number;
  alertsCount?: number;
  dataPoints?: IntegrationDataPoint[];
  configFields?: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "number";
  placeholder: string;
  required: boolean;
  value?: string;
}

export interface IntegrationDataPoint {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
}

// Tool-specific metric shapes
export interface PrometheusMetric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface NagiosHost {
  name: string;
  status: "UP" | "DOWN" | "UNREACHABLE";
  lastCheck: number;
  services: { name: string; status: "OK" | "WARNING" | "CRITICAL" | "UNKNOWN" }[];
}

export interface ElkLogEntry {
  index: string;
  timestamp: number;
  level: string;
  message: string;
  source: string;
}

export interface GrafanaDashboard {
  uid: string;
  title: string;
  panelCount: number;
  lastViewed: number;
  starred: boolean;
}

export interface PagerDutyIncident {
  id: string;
  title: string;
  status: "triggered" | "acknowledged" | "resolved";
  urgency: "high" | "low";
  assignee: string;
  createdAt: number;
}

// ─── Integration Definitions ────────────────────────────

export function getIntegrations(): Integration[] {
  const now = Date.now();
  return [
    {
      id: "nagios", name: "Nagios", category: "monitoring",
      description: "Enterprise host and service monitoring with alerting",
      status: "connected", icon: "🟢", color: "#000000", version: "4.5.2",
      endpoint: "https://nagios.apex.internal:8080", lastSync: now - 45000,
      metricsCount: 342, alertsCount: 3,
      dataPoints: [
        { label: "Hosts Monitored", value: "24", trend: "stable" },
        { label: "Services Checked", value: "186", trend: "up" },
        { label: "Uptime", value: "99.97%", trend: "stable" },
        { label: "Active Alerts", value: "3", trend: "up" }
      ],
      configFields: [
        { key: "host", label: "Nagios Server URL", type: "url", placeholder: "https://nagios.example.com", required: true, value: "https://nagios.apex.internal:8080" },
        { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter API key", required: true, value: "••••••••••••" }
      ]
    },
    {
      id: "prometheus", name: "Prometheus", category: "monitoring",
      description: "Open-source metrics collection and time-series database",
      status: "connected", icon: "🔥", color: "#E6522C", version: "2.53.0",
      endpoint: "http://prometheus.apex.internal:9090", lastSync: now - 15000,
      metricsCount: 12847, alertsCount: 5,
      dataPoints: [
        { label: "Time Series", value: "12,847", trend: "up" },
        { label: "Scrape Targets", value: "48", trend: "stable" },
        { label: "Retention", value: "30d", trend: "stable" },
        { label: "Query Latency", value: "12ms", trend: "down" }
      ],
      configFields: [
        { key: "host", label: "Prometheus URL", type: "url", placeholder: "http://prometheus:9090", required: true, value: "http://prometheus.apex.internal:9090" },
        { key: "scrapeInterval", label: "Scrape Interval (s)", type: "number", placeholder: "15", required: false, value: "15" }
      ]
    },
    {
      id: "zabbix", name: "Zabbix", category: "monitoring",
      description: "Enterprise-class infrastructure monitoring solution",
      status: "connected", icon: "📊", color: "#D40000", version: "7.0.4",
      endpoint: "https://zabbix.apex.internal/api_jsonrpc.php", lastSync: now - 30000,
      metricsCount: 5621, alertsCount: 8,
      dataPoints: [
        { label: "Monitored Hosts", value: "32", trend: "stable" },
        { label: "Items Tracked", value: "5,621", trend: "up" },
        { label: "Triggers Active", value: "8", trend: "up" },
        { label: "Templates", value: "47", trend: "stable" }
      ],
      configFields: [
        { key: "host", label: "Zabbix API URL", type: "url", placeholder: "https://zabbix.example.com/api_jsonrpc.php", required: true, value: "https://zabbix.apex.internal/api_jsonrpc.php" },
        { key: "user", label: "Username", type: "text", placeholder: "Admin", required: true, value: "apex_admin" },
        { key: "password", label: "Password", type: "password", placeholder: "Password", required: true, value: "••••••••" }
      ]
    },
    {
      id: "datadog", name: "Datadog", category: "monitoring",
      description: "Cloud-scale monitoring and security platform",
      status: "connected", icon: "🐕", color: "#632CA6", version: "Agent 7.55",
      endpoint: "https://api.datadoghq.com", lastSync: now - 20000,
      metricsCount: 28450, alertsCount: 2,
      dataPoints: [
        { label: "Custom Metrics", value: "28,450", trend: "up" },
        { label: "APM Traces/s", value: "4,200", trend: "up" },
        { label: "Log Events/hr", value: "1.2M", trend: "stable" },
        { label: "Monitors Active", value: "67", trend: "stable" }
      ],
      configFields: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter Datadog API key", required: true, value: "••••••••••••" },
        { key: "appKey", label: "Application Key", type: "password", placeholder: "Enter app key", required: true, value: "••••••••••••" },
        { key: "site", label: "Site", type: "text", placeholder: "datadoghq.com", required: false, value: "datadoghq.com" }
      ]
    },
    {
      id: "newrelic", name: "New Relic", category: "monitoring",
      description: "Full-stack observability platform with AI insights",
      status: "connected", icon: "🔮", color: "#008C99", version: "APM v11",
      endpoint: "https://api.newrelic.com/v2", lastSync: now - 25000,
      metricsCount: 15320, alertsCount: 1,
      dataPoints: [
        { label: "Apdex Score", value: "0.94", trend: "stable" },
        { label: "Throughput", value: "8.2K rpm", trend: "up" },
        { label: "Error Rate", value: "0.12%", trend: "down" },
        { label: "Response Time", value: "142ms", trend: "down" }
      ],
      configFields: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "NRAK-...", required: true, value: "••••••••••••" },
        { key: "accountId", label: "Account ID", type: "text", placeholder: "Account ID", required: true, value: "3847291" }
      ]
    },
    {
      id: "elk", name: "ELK Stack", category: "logging",
      description: "Elasticsearch, Logstash, Kibana — log aggregation & search",
      status: "connected", icon: "🦌", color: "#FEC514", version: "8.15.0",
      endpoint: "https://elastic.apex.internal:9200", lastSync: now - 10000,
      metricsCount: 0, alertsCount: 4,
      dataPoints: [
        { label: "Indices", value: "156", trend: "up" },
        { label: "Docs Indexed", value: "84.2M", trend: "up" },
        { label: "Cluster Health", value: "GREEN", trend: "stable" },
        { label: "Shards Active", value: "312", trend: "stable" }
      ],
      configFields: [
        { key: "host", label: "Elasticsearch URL", type: "url", placeholder: "https://elasticsearch:9200", required: true, value: "https://elastic.apex.internal:9200" },
        { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter API key", required: false, value: "••••••••••••" }
      ]
    },
    {
      id: "grafana", name: "Grafana", category: "visualization",
      description: "Open-source analytics and visualization platform",
      status: "connected", icon: "📈", color: "#F46800", version: "11.2.0",
      endpoint: "https://grafana.apex.internal:3000", lastSync: now - 12000,
      metricsCount: 0, alertsCount: 0,
      dataPoints: [
        { label: "Dashboards", value: "34", trend: "up" },
        { label: "Data Sources", value: "8", trend: "stable" },
        { label: "Panels", value: "247", trend: "up" },
        { label: "Alert Rules", value: "23", trend: "stable" }
      ],
      configFields: [
        { key: "host", label: "Grafana URL", type: "url", placeholder: "https://grafana:3000", required: true, value: "https://grafana.apex.internal:3000" },
        { key: "apiKey", label: "Service Account Token", type: "password", placeholder: "glsa_...", required: true, value: "••••••••••••" }
      ]
    },
    {
      id: "splunk", name: "Splunk", category: "logging",
      description: "Enterprise platform for searching, monitoring, and analyzing machine data",
      status: "connected", icon: "🔍", color: "#65A637", version: "9.3.0",
      endpoint: "https://splunk.apex.internal:8089", lastSync: now - 35000,
      metricsCount: 0, alertsCount: 6,
      dataPoints: [
        { label: "Events Indexed/day", value: "42.5M", trend: "up" },
        { label: "Saved Searches", value: "89", trend: "stable" },
        { label: "Forwarders", value: "16", trend: "stable" },
        { label: "License Usage", value: "78%", trend: "up" }
      ],
      configFields: [
        { key: "host", label: "Splunk REST API", type: "url", placeholder: "https://splunk:8089", required: true, value: "https://splunk.apex.internal:8089" },
        { key: "token", label: "HEC Token", type: "password", placeholder: "Token", required: true, value: "••••••••••••" }
      ]
    },
    {
      id: "opsgenie", name: "OpsGenie", category: "incident",
      description: "Modern incident management and alerting platform by Atlassian",
      status: "connected", icon: "🔔", color: "#2684FF", version: "v2 API",
      endpoint: "https://api.opsgenie.com/v2", lastSync: now - 18000,
      metricsCount: 0, alertsCount: 4,
      dataPoints: [
        { label: "Open Alerts", value: "4", trend: "up" },
        { label: "On-Call Teams", value: "3", trend: "stable" },
        { label: "Avg Response", value: "2.4m", trend: "down" },
        { label: "Escalations", value: "1", trend: "stable" }
      ],
      configFields: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter OpsGenie API key", required: true, value: "••••••••••••" },
        { key: "region", label: "Region", type: "text", placeholder: "us or eu", required: false, value: "us" }
      ]
    },
    {
      id: "pagerduty", name: "PagerDuty", category: "incident",
      description: "Digital operations management and incident response",
      status: "connected", icon: "🚨", color: "#06AC38", version: "v2 Events",
      endpoint: "https://api.pagerduty.com", lastSync: now - 22000,
      metricsCount: 0, alertsCount: 2,
      dataPoints: [
        { label: "Active Incidents", value: "2", trend: "up" },
        { label: "Services", value: "12", trend: "stable" },
        { label: "MTTA", value: "1.8m", trend: "down" },
        { label: "MTTR", value: "18m", trend: "down" }
      ],
      configFields: [
        { key: "apiKey", label: "REST API Key", type: "password", placeholder: "Token", required: true, value: "••••••••••••" },
        { key: "routingKey", label: "Routing Key", type: "password", placeholder: "Integration key", required: true, value: "••••••••••••" }
      ]
    },
    {
      id: "dynatrace", name: "Dynatrace", category: "monitoring",
      description: "AI-powered, full-stack, automated performance management",
      status: "connected", icon: "🧠", color: "#1496FF", version: "SaaS",
      endpoint: "https://apex.live.dynatrace.com/api/v2", lastSync: now - 28000,
      metricsCount: 45200, alertsCount: 3,
      dataPoints: [
        { label: "Entities", value: "1,842", trend: "up" },
        { label: "Problems Open", value: "3", trend: "up" },
        { label: "Davis AI Score", value: "96.4", trend: "stable" },
        { label: "Synthetic Tests", value: "24", trend: "stable" }
      ],
      configFields: [
        { key: "host", label: "Environment URL", type: "url", placeholder: "https://xxx.live.dynatrace.com", required: true, value: "https://apex.live.dynatrace.com" },
        { key: "apiToken", label: "API Token", type: "password", placeholder: "dt0c01...", required: true, value: "••••••••••••" }
      ]
    },
    {
      id: "bigpanda", name: "BigPanda", category: "incident",
      description: "AIOps event correlation and automated root cause analysis",
      status: "degraded", icon: "🐼", color: "#FF6B35", version: "v2 API",
      endpoint: "https://api.bigpanda.io", lastSync: now - 90000,
      metricsCount: 0, alertsCount: 7,
      dataPoints: [
        { label: "Correlated Incidents", value: "7", trend: "up" },
        { label: "Alert Reduction", value: "94%", trend: "stable" },
        { label: "Environments", value: "4", trend: "stable" },
        { label: "Integrations", value: "12", trend: "stable" }
      ],
      configFields: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "Bearer token", required: true, value: "••••••••••••" },
        { key: "appKey", label: "App Key", type: "password", placeholder: "Application key", required: true, value: "••••••••••••" }
      ]
    },
    {
      id: "opsview", name: "Opsview", category: "monitoring",
      description: "Unified monitoring with business service views",
      status: "connected", icon: "👁️", color: "#26A9E0", version: "6.9",
      endpoint: "https://opsview.apex.internal/rest", lastSync: now - 40000,
      metricsCount: 3200, alertsCount: 2,
      dataPoints: [
        { label: "Business Services", value: "18", trend: "stable" },
        { label: "Check Results/min", value: "840", trend: "stable" },
        { label: "SLA Compliance", value: "99.8%", trend: "stable" },
        { label: "Downtime Events", value: "2", trend: "up" }
      ],
      configFields: [
        { key: "host", label: "Opsview URL", type: "url", placeholder: "https://opsview.example.com/rest", required: true, value: "https://opsview.apex.internal/rest" },
        { key: "user", label: "Username", type: "text", placeholder: "admin", required: true, value: "apex_admin" },
        { key: "password", label: "Password", type: "password", placeholder: "Password", required: true, value: "••••••••" }
      ]
    },
    {
      id: "spacelift", name: "Spacelift", category: "infrastructure",
      description: "Infrastructure as Code management and orchestration platform",
      status: "connected", icon: "🚀", color: "#4B6EFF", version: "v1 API",
      endpoint: "https://apex.app.spacelift.io/graphql", lastSync: now - 55000,
      metricsCount: 0, alertsCount: 1,
      dataPoints: [
        { label: "Stacks", value: "14", trend: "stable" },
        { label: "Runs Today", value: "23", trend: "up" },
        { label: "Drift Detection", value: "Active", trend: "stable" },
        { label: "Policies", value: "8", trend: "stable" }
      ],
      configFields: [
        { key: "host", label: "Spacelift URL", type: "url", placeholder: "https://xxx.app.spacelift.io", required: true, value: "https://apex.app.spacelift.io" },
        { key: "apiKey", label: "API Key ID", type: "text", placeholder: "Key ID", required: true, value: "apex-cicd-key" },
        { key: "apiSecret", label: "API Key Secret", type: "password", placeholder: "Secret", required: true, value: "••••••••••••" }
      ]
    },
    {
      id: "collectd", name: "Collectd", category: "monitoring",
      description: "System statistics collection daemon for performance monitoring",
      status: "connected", icon: "⚙️", color: "#53833A", version: "5.12.0",
      endpoint: "udp://collectd.apex.internal:25826", lastSync: now - 5000,
      metricsCount: 1840, alertsCount: 0,
      dataPoints: [
        { label: "Plugins Active", value: "18", trend: "stable" },
        { label: "Hosts Reporting", value: "12", trend: "stable" },
        { label: "Values/sec", value: "2,400", trend: "up" },
        { label: "Write Backends", value: "3", trend: "stable" }
      ],
      configFields: [
        { key: "host", label: "Collectd Network", type: "url", placeholder: "udp://collectd:25826", required: true, value: "udp://collectd.apex.internal:25826" },
        { key: "authFile", label: "Auth File Path", type: "text", placeholder: "/etc/collectd/passwd", required: false, value: "/etc/collectd/passwd" }
      ]
    },
    {
      id: "github", name: "GitHub", category: "infrastructure",
      description: "Version control, CI/CD workflows, pull requests, and code collaboration platform",
      status: "connected", icon: "🐙", color: "#24292F", version: "API v4 (GraphQL)",
      endpoint: "https://api.github.com", lastSync: now - 8000,
      metricsCount: 0, alertsCount: 0,
      dataPoints: [
        { label: "Repositories", value: "4", trend: "stable" },
        { label: "Open PRs", value: "11", trend: "up" },
        { label: "Open Issues", value: "32", trend: "up" },
        { label: "Actions Runs", value: "142", trend: "up" }
      ],
      configFields: [
        { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_xxxxxxxxxxxx", required: true, value: "••••••••••••" },
        { key: "org", label: "Organization", type: "text", placeholder: "apex-team", required: true, value: "apex-team" },
        { key: "webhookSecret", label: "Webhook Secret", type: "password", placeholder: "Webhook signing secret", required: false, value: "••••••••••••" },
        { key: "apiUrl", label: "API URL (Enterprise)", type: "url", placeholder: "https://api.github.com", required: false, value: "https://api.github.com" }
      ]
    },
    {
      id: "jenkins", name: "Jenkins", category: "infrastructure",
      description: "Open-source automation server for CI/CD pipeline orchestration and build management",
      status: "connected", icon: "🔨", color: "#D33833", version: "2.452.3 LTS",
      endpoint: "https://jenkins.apex.internal:8443", lastSync: now - 12000,
      metricsCount: 0, alertsCount: 1,
      dataPoints: [
        { label: "Pipeline Jobs", value: "5", trend: "stable" },
        { label: "Builds Today", value: "23", trend: "up" },
        { label: "Success Rate", value: "87%", trend: "stable" },
        { label: "Queue Depth", value: "2", trend: "down" }
      ],
      configFields: [
        { key: "host", label: "Jenkins URL", type: "url", placeholder: "https://jenkins.example.com", required: true, value: "https://jenkins.apex.internal:8443" },
        { key: "user", label: "Username", type: "text", placeholder: "admin", required: true, value: "apex_cicd" },
        { key: "apiToken", label: "API Token", type: "password", placeholder: "Jenkins API token", required: true, value: "••••••••••••" },
        { key: "crumbIssuer", label: "CSRF Crumb", type: "password", placeholder: "Auto-fetched on connect", required: false, value: "••••••••••••" }
      ]
    }
  ];
}

// ─── Tool-specific mock data generators ─────────────────

export function getPrometheusMetrics(): PrometheusMetric[] {
  const now = Date.now();
  return [
    { name: "node_cpu_seconds_total", value: +(Math.random() * 100).toFixed(2), labels: { mode: "idle", instance: "node-1:9100" }, timestamp: now },
    { name: "node_memory_MemAvailable_bytes", value: Math.floor(4e9 + Math.random() * 4e9), labels: { instance: "node-1:9100" }, timestamp: now },
    { name: "container_cpu_usage_seconds_total", value: +(Math.random() * 50).toFixed(2), labels: { container: "api-gateway", pod: "api-gw-7b4d" }, timestamp: now },
    { name: "http_requests_total", value: Math.floor(100000 + Math.random() * 50000), labels: { method: "GET", handler: "/api/v2", code: "200" }, timestamp: now },
    { name: "http_request_duration_seconds", value: +(Math.random() * 0.5).toFixed(4), labels: { handler: "/api/v2/users", quantile: "0.99" }, timestamp: now },
    { name: "up", value: 1, labels: { job: "apex-api", instance: "api:8080" }, timestamp: now },
    { name: "go_goroutines", value: Math.floor(50 + Math.random() * 100), labels: { instance: "api:8080" }, timestamp: now },
    { name: "process_resident_memory_bytes", value: Math.floor(1e8 + Math.random() * 5e8), labels: { instance: "worker:8081" }, timestamp: now },
  ];
}

export function getNagiosHosts(): NagiosHost[] {
  return [
    { name: "web-server-01", status: "UP", lastCheck: Date.now() - 30000, services: [
      { name: "HTTP", status: "OK" }, { name: "HTTPS", status: "OK" }, { name: "SSH", status: "OK" }
    ]},
    { name: "db-primary", status: "UP", lastCheck: Date.now() - 25000, services: [
      { name: "PostgreSQL", status: "OK" }, { name: "Disk Space", status: "WARNING" }, { name: "Load", status: "OK" }
    ]},
    { name: "payment-node", status: "DOWN", lastCheck: Date.now() - 120000, services: [
      { name: "Payment API", status: "CRITICAL" }, { name: "Health Check", status: "CRITICAL" }
    ]},
    { name: "cache-cluster", status: "UP", lastCheck: Date.now() - 15000, services: [
      { name: "Redis", status: "OK" }, { name: "Memory", status: "OK" }
    ]},
  ];
}

export function getElkLogs(): ElkLogEntry[] {
  const msgs = [
    "GET /api/v2/users 200 12ms", "POST /api/v2/auth/login 200 45ms",
    "GET /api/v2/orders 500 1234ms - Internal Server Error",
    "Connection pool exhausted, waiting for available connection",
    "Certificate renewal check: api.apex.io expires in 7 days",
    "Rate limit exceeded for IP 10.0.44.128 - 429 Too Many Requests"
  ];
  return Array.from({ length: 10 }, (_, i) => ({
    index: `apex-logs-2026.05.${13}`,
    timestamp: Date.now() - i * 15000,
    level: i === 2 ? "error" : i === 3 ? "warn" : "info",
    message: msgs[i % msgs.length],
    source: ["api-gateway", "auth-service", "payment-proxy", "data-processor"][i % 4]
  }));
}

export function getGrafanaDashboards(): GrafanaDashboard[] {
  return [
    { uid: "infra-overview", title: "Infrastructure Overview", panelCount: 12, lastViewed: Date.now() - 300000, starred: true },
    { uid: "api-perf", title: "API Performance", panelCount: 8, lastViewed: Date.now() - 600000, starred: true },
    { uid: "k8s-cluster", title: "Kubernetes Cluster", panelCount: 16, lastViewed: Date.now() - 1200000, starred: false },
    { uid: "db-metrics", title: "Database Metrics", panelCount: 10, lastViewed: Date.now() - 1800000, starred: false },
    { uid: "cicd-pipeline", title: "CI/CD Pipeline", panelCount: 6, lastViewed: Date.now() - 3600000, starred: true },
  ];
}

export function getPagerDutyIncidents(): PagerDutyIncident[] {
  return [
    { id: "PD-4821", title: "Payment Service Unavailable", status: "triggered", urgency: "high", assignee: "karth", createdAt: Date.now() - 300000 },
    { id: "PD-4820", title: "High Error Rate on API Gateway", status: "acknowledged", urgency: "high", assignee: "dev_ops_bot", createdAt: Date.now() - 600000 },
    { id: "PD-4819", title: "SSL Certificate Expiry Warning", status: "resolved", urgency: "low", assignee: "jules", createdAt: Date.now() - 1800000 },
  ];
}

// ─── GitHub Detail Data ─────────────────────────────────

export interface GitHubPullRequest {
  id: number;
  title: string;
  author: string;
  branch: string;
  baseBranch: string;
  status: "open" | "merged" | "closed";
  reviewStatus: "approved" | "changes_requested" | "pending" | "review_required";
  checks: "passing" | "failing" | "pending";
  additions: number;
  deletions: number;
  files: number;
  createdAt: number;
  labels: string[];
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  timestamp: number;
  branch: string;
  additions: number;
  deletions: number;
}

export function getGitHubPullRequests(): GitHubPullRequest[] {
  const now = Date.now();
  return [
    { id: 47, title: "Fix auth token expiry handling", author: "dev_ops_bot", branch: "hotfix/auth-timeout", baseBranch: "main", status: "open", reviewStatus: "changes_requested", checks: "failing", additions: 142, deletions: 38, files: 5, createdAt: now - 2700000, labels: ["hotfix", "auth"] },
    { id: 46, title: "Add real-time site monitoring dashboard", author: "karth", branch: "feat/site-monitor", baseBranch: "main", status: "merged", reviewStatus: "approved", checks: "passing", additions: 847, deletions: 23, files: 12, createdAt: now - 7200000, labels: ["feature", "monitoring"] },
    { id: 45, title: "Implement data partitioning for query optimization", author: "jules", branch: "feat/partitioning", baseBranch: "develop", status: "open", reviewStatus: "pending", checks: "passing", additions: 523, deletions: 89, files: 8, createdAt: now - 600000, labels: ["feature", "database"] },
    { id: 44, title: "Upgrade payment SDK to v2.1", author: "karth", branch: "chore/payment-sdk-upgrade", baseBranch: "main", status: "open", reviewStatus: "review_required", checks: "pending", additions: 67, deletions: 45, files: 3, createdAt: now - 14400000, labels: ["dependencies", "payment"] },
    { id: 43, title: "Add push notification support", author: "karth", branch: "feat/notifications", baseBranch: "main", status: "merged", reviewStatus: "approved", checks: "passing", additions: 312, deletions: 12, files: 7, createdAt: now - 86400000, labels: ["feature"] },
    { id: 42, title: "Fix rate limiter on /api/v2 endpoints", author: "security-bot", branch: "fix/rate-limiter", baseBranch: "main", status: "open", reviewStatus: "approved", checks: "passing", additions: 28, deletions: 5, files: 2, createdAt: now - 43200000, labels: ["security", "bugfix"] },
  ];
}

export function getGitHubCommits(): GitHubCommit[] {
  const now = Date.now();
  return [
    { sha: "a3f8c2b", message: "feat: add real-time monitoring dashboard with site health checks", author: "karth", timestamp: now - 1800000, branch: "main", additions: 847, deletions: 23 },
    { sha: "b4e1d33", message: "fix: increase auth token expiry to 24h", author: "dev_ops_bot", timestamp: now - 3600000, branch: "hotfix/auth-timeout", additions: 142, deletions: 38 },
    { sha: "f7d2e91", message: "feat: implement data partitioning for query optimization", author: "jules", timestamp: now - 300000, branch: "develop", additions: 523, deletions: 89 },
    { sha: "c8a4f12", message: "chore: upgrade dependencies & apply security patches", author: "jules", timestamp: now - 172800000, branch: "main", additions: 234, deletions: 178 },
    { sha: "d9e3b67", message: "feat: add push notification support and alert subscriptions", author: "karth", timestamp: now - 86400000, branch: "main", additions: 312, deletions: 12 },
    { sha: "e2f7a89", message: "fix: resolve circuit breaker race condition", author: "karth", timestamp: now - 432000000, branch: "main", additions: 45, deletions: 12 },
  ];
}

// ─── Jenkins Detail Data ────────────────────────────────

export interface JenkinsQueueItem {
  id: number;
  jobName: string;
  why: string;
  inQueueSince: number;
  estimatedDuration: string;
}

export interface JenkinsExecutor {
  id: number;
  name: string;
  status: "idle" | "building" | "offline";
  currentBuild?: string;
  progress?: number;
}

export interface JenkinsPipelineConfig {
  jobName: string;
  jenkinsfile: string;
  triggers: string[];
  parameters: { name: string; type: string; defaultValue: string }[];
}

export function getJenkinsQueue(): JenkinsQueueItem[] {
  return [
    { id: 1, jobName: "apex-data-pipeline", why: "Waiting for executor", inQueueSince: Date.now() - 45000, estimatedDuration: "3m 20s" },
    { id: 2, jobName: "apex-nightly-build", why: "Scheduled build", inQueueSince: Date.now() - 12000, estimatedDuration: "8m 14s" },
  ];
}

export function getJenkinsExecutors(): JenkinsExecutor[] {
  return [
    { id: 1, name: "agent-01", status: "building", currentBuild: "apex-ui-pipeline #142", progress: 72 },
    { id: 2, name: "agent-02", status: "building", currentBuild: "apex-api-pipeline #89", progress: 45 },
    { id: 3, name: "agent-03", status: "idle" },
    { id: 4, name: "agent-04", status: "offline" },
  ];
}

export function getJenkinsPipelineConfigs(): JenkinsPipelineConfig[] {
  return [
    {
      jobName: "apex-ui-pipeline",
      jenkinsfile: `pipeline {
  agent any
  environment {
    NODE_VERSION = '20.x'
    DEPLOY_TARGET = 'apex-prod-us-east1'
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install') {
      steps { sh 'npm ci' }
    }
    stage('Lint & Type Check') {
      steps { sh 'npm run lint && npx tsc --noEmit' }
    }
    stage('Unit Tests') {
      steps { sh 'npm test -- --coverage' }
    }
    stage('Build') {
      steps { sh 'npm run build' }
    }
    stage('Deploy') {
      steps {
        sh 'kubectl apply -f k8s/deployment.yaml'
        sh 'kubectl rollout status deployment/apex-resolve'
      }
    }
    stage('Health Check') {
      steps {
        sh 'curl -f http://\$DEPLOY_TARGET/health || exit 1'
      }
    }
  }
  post {
    failure { slackSend channel: '#devops', message: 'Build FAILED' }
    success { slackSend channel: '#devops', message: 'Deployed ✓' }
  }
}`,
      triggers: ["GitHub Push (main)", "Manual"],
      parameters: [
        { name: "BRANCH", type: "string", defaultValue: "main" },
        { name: "ENVIRONMENT", type: "choice", defaultValue: "production" },
        { name: "DEPLOY_TARGET", type: "string", defaultValue: "apex-prod-us-east1" },
      ]
    },
    {
      jobName: "apex-api-pipeline",
      jenkinsfile: `pipeline {
  agent { label 'docker' }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install') { steps { sh 'npm ci' } }
    stage('Test') { steps { sh 'npm test' } }
    stage('Build Image') {
      steps {
        sh 'docker build -t apex/api:\$BUILD_NUMBER .'
        sh 'docker push apex/api:\$BUILD_NUMBER'
      }
    }
    stage('Deploy') {
      steps {
        sh 'kubectl set image deployment/apex-api api=apex/api:\$BUILD_NUMBER'
      }
    }
  }
}`,
      triggers: ["GitHub Push (main, hotfix/*)", "PR Merge"],
      parameters: [
        { name: "BRANCH", type: "string", defaultValue: "main" },
        { name: "ENVIRONMENT", type: "choice", defaultValue: "production" },
      ]
    },
  ];
}

// Aggregate stats across all integrations
export function getIntegrationStats(integrations: Integration[]) {
  const connected = integrations.filter(i => i.status === "connected").length;
  const totalMetrics = integrations.reduce((s, i) => s + (i.metricsCount || 0), 0);
  const totalAlerts = integrations.reduce((s, i) => s + (i.alertsCount || 0), 0);
  return { connected, total: integrations.length, totalMetrics, totalAlerts };
}
