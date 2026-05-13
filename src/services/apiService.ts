/**
 * API Service — Connects frontend to Express+MongoDB backend
 * Falls back gracefully if backend is not running
 */

const API_BASE = "http://localhost:3001/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Health ─────────────────────────────────────────────
export async function checkBackendHealth(): Promise<{ status: string; db: boolean } | null> {
  return apiFetch("/health");
}

// ─── Real GitHub ────────────────────────────────────────
export async function fetchRealGitHubRepos() {
  return apiFetch<any[]>("/github/repos");
}

export async function fetchRealGitHubPRs(owner: string, repo: string) {
  return apiFetch<any[]>(`/github/repos/${owner}/${repo}/pulls`);
}

export async function fetchRealGitHubCommits(owner: string, repo: string) {
  return apiFetch<any[]>(`/github/repos/${owner}/${repo}/commits`);
}

// ─── Incidents (MongoDB) ────────────────────────────────
export async function fetchIncidents() {
  return apiFetch<any[]>("/incidents");
}

export async function createIncident(data: { title: string; description: string; severity: string; affectedServices: string[] }) {
  return apiFetch<any>("/incidents", { method: "POST", body: JSON.stringify(data) });
}

export async function updateIncident(id: string, data: Record<string, any>) {
  return apiFetch<any>(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

// ─── Audit Trail (MongoDB) ──────────────────────────────
export async function fetchAuditLogs(limit = 50, category?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (category) params.set("category", category);
  return apiFetch<any[]>(`/audit?${params}`);
}

// ─── Deployments (MongoDB) ──────────────────────────────
export async function recordDeployment(data: Record<string, any>) {
  return apiFetch<any>("/deployments", { method: "POST", body: JSON.stringify(data) });
}

export async function fetchDeploymentHistory() {
  return apiFetch<any[]>("/deployments");
}

// ─── Health Snapshots (MongoDB) ─────────────────────────
export async function recordHealthSnapshot(data: Record<string, any>) {
  return apiFetch<any>("/health-snapshots", { method: "POST", body: JSON.stringify(data) });
}

export async function fetchHealthTimeline(hours = 1) {
  return apiFetch<any[]>(`/health-snapshots?hours=${hours}`);
}

// ─── Postmortems (MongoDB) ──────────────────────────────
export async function savePostmortem(data: Record<string, any>) {
  return apiFetch<any>("/postmortems", { method: "POST", body: JSON.stringify(data) });
}

export async function fetchPostmortems() {
  return apiFetch<any[]>("/postmortems");
}

export async function fetchPostmortemForIncident(incidentId: string) {
  return apiFetch<any>(`/postmortems/${incidentId}`);
}

// ─── Risk Score ─────────────────────────────────────────
export async function getDeploymentRiskScore(data: { repo: string; branch: string; filesChanged?: number; additions?: number; deletions?: number }) {
  return apiFetch<{ score: number; level: string; reasons: string[]; recommendation: string }>("/risk-score", { method: "POST", body: JSON.stringify(data) });
}

// ─── DB Stats ───────────────────────────────────────────
export async function fetchDBStats() {
  return apiFetch<{ connected: boolean; collections?: Record<string, number> }>("/db/stats");
}
