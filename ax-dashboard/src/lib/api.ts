// API client cho AX backend
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type ApiResponse<T> = { success: boolean; data?: T; message?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json.data as T;
}

// ─── Users ────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  fullName: string;
  department: string;
  departmentId?: string;
  group: string;
  team: string;
  role?: string;
  type: "AI Expert" | "AI Crew";
}

export const usersApi = {
  list: () => request<ApiUser[]>("/api/users"),
  get: (id: string) => request<ApiUser>(`/api/users/${id}`),
  create: (u: ApiUser) => request<ApiUser>("/api/users", { method: "POST", body: JSON.stringify(u) }),
  update: (id: string, u: Partial<ApiUser>) =>
    request<void>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(u) }),
  remove: (id: string) => request<void>(`/api/users/${id}`, { method: "DELETE" }),
};

// ─── Departments ──────────────────────────────────────────────
export interface ApiDepartment { id: string; name: string }

export const departmentsApi = {
  list: () => request<ApiDepartment[]>("/api/departments"),
  create: (name: string) =>
    request<ApiDepartment>("/api/departments", { method: "POST", body: JSON.stringify({ name }) }),
  remove: (id: string) => request<void>(`/api/departments/${id}`, { method: "DELETE" }),
};

// ─── Agents (lookup: cac AI agent co the duoc gan vao project) ───
export interface ApiAgent { id: string; name: string; description?: string }

export const agentsApi = {
  list: () => request<ApiAgent[]>("/api/agents"),
  get: (id: string) => request<ApiAgent>(`/api/agents/${id}`),
  create: (a: ApiAgent) => request<ApiAgent>("/api/agents", { method: "POST", body: JSON.stringify(a) }),
  update: (id: string, a: Partial<ApiAgent>) =>
    request<void>(`/api/agents/${id}`, { method: "PUT", body: JSON.stringify(a) }),
  remove: (id: string) => request<void>(`/api/agents/${id}`, { method: "DELETE" }),
};

// ─── Projects ─────────────────────────────────────────────────
export interface ApiProject {
  id: string;
  name: string;
  status: string;
  model?: string;
  prompt?: string;
  tools: string[];
  lastRun?: string;
  avgLatency?: number;
  successRate?: number;
  description?: string;
  tags: string[];
  createdAt?: string;
  shareLink?: string;
  department?: string;
  departmentId?: string;
  aiExpertId?: string;
  aiExpert?: { name: string; role: string };
  aiCrew?: Array<{ name: string; role: string }>;
  agents?: Array<{ id: string; name: string; description?: string; technologies?: string[] }>;
  aiCrewIds?: string[];
  agentIds?: string[];
  projectAgents?: Array<{ name: string; description: string; technologies?: string[] }>;
  startDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string | null;
  progress?: number;
  plan?: string;
  remarks?: string;
  technologies: string[];
}

export const projectsApi = {
  list: () => request<ApiProject[]>("/api/projects"),
  get: (id: string) => request<ApiProject>(`/api/projects/${id}`),
  create: (p: ApiProject) => request<ApiProject>("/api/projects", { method: "POST", body: JSON.stringify(p) }),
  update: (id: string, p: Partial<ApiProject>) =>
    request<void>(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  remove: (id: string) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
};

// ─── Tasks ────────────────────────────────────────────────────
export interface ApiTask {
  id: string;
  projectId?: string;
  title: string;
  deadline?: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "review" | "done";
}

// ─── Stats ────────────────────────────────────────────────────
export interface WeeklyProgressPoint {
  week: string;
  progress: number;
  completed: number;
  inProgress: number;
  pending: number;
  projects: number;
  total: number;
}

export const statsApi = {
  weeklyProgress: () => request<WeeklyProgressPoint[]>("/api/stats/weekly-progress"),
};

// ─── Logs ─────────────────────────────────────────────────────
export interface ApiLog {
  id: number;
  projectId: string;
  agentId?: string | null;
  taskId?: string | null;
  level: "info" | "warn" | "error" | "success";
  message: string;
  createdAt: string;
}

export const logsApi = {
  list: (projectId?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return request<ApiLog[]>(`/api/logs${qs ? `?${qs}` : ""}`);
  },
  create: (log: Omit<ApiLog, "id" | "createdAt">) =>
    request<ApiLog>("/api/logs", { method: "POST", body: JSON.stringify(log) }),
  clear: (projectId?: string) =>
    request<void>(`/api/logs${projectId ? `?projectId=${projectId}` : ""}`, { method: "DELETE" }),
};

export const tasksApi = {
  list: (projectId?: string) =>
    request<ApiTask[]>(`/api/tasks${projectId ? `?projectId=${projectId}` : ""}`),
  create: (t: ApiTask) => request<ApiTask>("/api/tasks", { method: "POST", body: JSON.stringify(t) }),
  update: (id: string, t: Partial<ApiTask>) =>
    request<void>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(t) }),
  remove: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
};
