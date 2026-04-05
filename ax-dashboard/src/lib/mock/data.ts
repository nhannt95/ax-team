// Centralized mock data for the dashboard

export type AgentStatus = "Running" | "Idle" | "Error" | "Deploying" | "Stopped";

export type Department =
  | "Engineering"
  | "Data Science"
  | "Product"
  | "Marketing"
  | "Operations"
  | "Security";

export interface CrewMember {
  name: string;
  role: string;
}

export interface WeeklyUpdate {
  week: string;
  tasks: string;
  status: "pending" | "in-progress" | "completed";
}

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  model: string;
  prompt: string;
  tools: string[];
  lastRun: string;
  avgLatency: number; // ms
  cost24h?: number; // USD (deprecated, local project)
  successRate: number; // 0-100
  cpu?: number; // 0-100 (deprecated)
  memory?: number; // 0-100 (deprecated)
  tokensUsed?: number; // deprecated
  description: string;
  tags: string[];
  createdAt: string;
  shareLink: string;
  department: Department;
  aiExpert: CrewMember;
  aiCrew: CrewMember[];
  startDate: string; // ISO yyyy-mm-dd
  plannedEndDate: string;
  actualEndDate: string | null; // null if not completed
  progress: number; // 0-100 overall project progress
  plan: string; // high-level plan / milestones
  weeklyUpdates: WeeklyUpdate[];
  remarks: string; // difficulties, notes
  technologies: string[];
  agents?: Array<{ name: string; description: string; technologies?: string[] }>;
}

export interface Issue {
  id: string;
  agentId: string;
  agentName: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  detectedAt: string;
  suggestion: string;
}

export interface UserRecord {
  id: string; // Knox ID
  fullName: string;
  department: Department;
  group: string;
  team: string;
  type: "AI Expert" | "AI Crew";
}

export interface LogLine {
  ts: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

export interface Task {
  id: string;
  title: string;
  agentId: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "review" | "done";
}

export interface DeployEntry {
  version: string;
  deployedAt: string;
  deployer: string;
  status: "success" | "rolled-back" | "failed";
  notes: string;
}

// ── Agents ──────────────────────────────────────────────────────────

export const agents: Agent[] = [
  {
    id: "AGT-001",
    name: "Customer Support Bot",
    status: "Running",
    model: "gpt-4o-mini",
    prompt: "You are a helpful customer support assistant. Respond politely and resolve issues quickly.",
    tools: ["web_search", "knowledge_base", "ticket_create"],
    lastRun: "2 min ago",
    avgLatency: 342,
    cost24h: 12.47,
    successRate: 98.2,
    cpu: 23,
    memory: 41,
    tokensUsed: 1284500,
    description: "Handles tier-1 customer queries with RAG over product docs.",
    tags: ["support", "production", "rag"],
    createdAt: "2026-02-14",
    shareLink: "https://ax.local/share/agt-001",
    department: "Operations",
    aiExpert: { name: "Dr. Elena Vasquez", role: "Senior AI Architect" },
    aiCrew: [
      { name: "Marcus Chen", role: "ML Engineer" },
      { name: "Priya Sharma", role: "Prompt Engineer" },
      { name: "Tom Reeves", role: "QA Lead" },
    ],
    startDate: "2026-02-14",
    plannedEndDate: "2026-05-30",
    actualEndDate: null,
    progress: 75,
    plan: "Phase 1: Build RAG pipeline over product docs.\nPhase 2: Integrate ticket_create tool.\nPhase 3: A/B test against human baseline.",
    weeklyUpdates: [
      { week: "Week 1", tasks: "Build out Pinecone logic", status: "completed" },
    ],
    remarks: "Initial vector DB indexing is slow on large PDFs. Considering chunked streaming ingestion.",
    technologies: ["LangChain", "Pinecone", "Next.js", "Redis"],
  },
  {
    id: "AGT-002",
    name: "Code Review Assistant",
    status: "Running",
    model: "claude-sonnet-4",
    prompt: "Review pull requests for bugs, style issues, and security vulnerabilities.",
    tools: ["github_api", "ast_parser", "sec_scanner"],
    lastRun: "5 min ago",
    avgLatency: 1820,
    cost24h: 28.15,
    successRate: 94.7,
    cpu: 67,
    memory: 72,
    tokensUsed: 2847300,
    description: "Automated code review agent integrated with GitHub PRs.",
    tags: ["devtools", "github", "security"],
    createdAt: "2026-01-08",
    shareLink: "https://ax.local/share/agt-002",
    department: "Engineering",
    aiExpert: { name: "James O'Brien", role: "Principal ML Engineer" },
    aiCrew: [
      { name: "Sofia Lindqvist", role: "Security Researcher" },
      { name: "Raj Patel", role: "DevOps Engineer" },
    ],
    startDate: "2026-01-08",
    plannedEndDate: "2026-04-15",
    actualEndDate: null,
    progress: 40,
    plan: "MVP: basic PR review.\nv2: security vulnerability scanning.\nv3: auto-fix suggestions.",
    weeklyUpdates: [],
    remarks: "AST parser memory spikes on large monorepos. Need to optimize before rollout to org-wide.",
    technologies: ["GitHub API", "Tree-sitter", "Semgrep", "Node.js"],
  },
  {
    id: "AGT-003",
    name: "Data Analyst",
    status: "Idle",
    model: "gpt-4o",
    prompt: "Analyze datasets and generate insights with SQL and charts.",
    tools: ["sql_query", "chart_gen", "python_exec"],
    lastRun: "1h ago",
    avgLatency: 2450,
    cost24h: 5.32,
    successRate: 96.1,
    cpu: 8,
    memory: 18,
    tokensUsed: 412800,
    description: "On-demand analytics agent for ad-hoc business questions.",
    tags: ["analytics", "sql"],
    createdAt: "2026-02-22",
    shareLink: "https://ax.local/share/agt-003",
    department: "Data Science",
    aiExpert: { name: "Dr. Hana Kim", role: "Lead Data Scientist" },
    aiCrew: [
      { name: "Oliver Bennett", role: "Data Engineer" },
      { name: "Mei Wong", role: "Analytics Engineer" },
      { name: "Lucas Moreau", role: "BI Specialist" },
    ],
    startDate: "2026-02-22",
    plannedEndDate: "2026-06-01",
    actualEndDate: null,
    progress: 20,
    plan: "Natural-language to SQL → chart generation → insight summary. Ship read-only first.",
    weeklyUpdates: [],
    remarks: "SQL generation on complex joins is unreliable. Investigating function-calling with typed schema.",
    technologies: ["DuckDB", "Plotly", "Python", "pandas"],
  },
  {
    id: "AGT-004",
    name: "Content Generator",
    status: "Error",
    model: "claude-opus-4",
    prompt: "Generate marketing content, blog posts, and social media updates.",
    tools: ["image_gen", "seo_check", "grammar"],
    lastRun: "23 min ago",
    avgLatency: 3200,
    cost24h: 18.92,
    successRate: 72.3,
    cpu: 45,
    memory: 58,
    tokensUsed: 1847200,
    description: "Multi-modal content creation for marketing campaigns.",
    tags: ["marketing", "content"],
    createdAt: "2026-01-30",
    shareLink: "https://ax.local/share/agt-004",
    department: "Marketing",
    aiExpert: { name: "Isabella Romano", role: "Creative AI Director" },
    aiCrew: [
      { name: "Noah Fischer", role: "Content Strategist" },
      { name: "Yuki Tanaka", role: "Visual Designer" },
    ],
    startDate: "2026-01-30",
    plannedEndDate: "2026-04-30",
    actualEndDate: null,
    progress: 80,
    plan: "Blog posts → social copy → image generation. Integrate with CMS.",
    weeklyUpdates: [],
    remarks: "Currently blocked by image_gen rate limits. Success rate dropped to 72% — investigating prompt regressions.",
    technologies: ["DALL-E 3", "WordPress API", "Buffer", "React"],
  },
  {
    id: "AGT-005",
    name: "Email Triage",
    status: "Running",
    model: "gpt-4o-mini",
    prompt: "Categorize incoming emails and route to appropriate departments.",
    tools: ["email_api", "classifier"],
    lastRun: "30s ago",
    avgLatency: 180,
    cost24h: 3.14,
    successRate: 99.1,
    cpu: 12,
    memory: 22,
    tokensUsed: 247800,
    description: "High-volume email classification and routing service.",
    tags: ["email", "automation"],
    createdAt: "2026-03-01",
    shareLink: "https://ax.local/share/agt-005",
    department: "Operations",
    aiExpert: { name: "Alex Petrov", role: "Automation Lead" },
    aiCrew: [
      { name: "Kira Novak", role: "Workflow Engineer" },
    ],
    startDate: "2023-09-01",
    plannedEndDate: "2023-12-15",
    actualEndDate: "2023-12-20",
    progress: 100,
    plan: "1. Component library generation. 2. Theme tokens engine. 3. Integration with Figma.",
    weeklyUpdates: [],
    remarks: "Finished 5 days late due to scope creep in Figma integration.",
    technologies: ["React", "TailwindCSS", "Framer Motion", "Shadcn"],
  },
  {
    id: "AGT-006",
    name: "Deploy Supervisor",
    status: "Deploying",
    model: "claude-sonnet-4",
    prompt: "Supervise deployment pipelines and rollback on failures.",
    tools: ["ci_api", "k8s_ctl", "slack_notify"],
    lastRun: "just now",
    avgLatency: 890,
    cost24h: 7.68,
    successRate: 97.8,
    cpu: 34,
    memory: 47,
    tokensUsed: 518600,
    description: "Autonomous deployment orchestrator with self-healing.",
    tags: ["devops", "k8s"],
    createdAt: "2026-02-05",
    shareLink: "https://ax.local/share/agt-006",
    department: "Engineering",
    aiExpert: { name: "Dmitri Volkov", role: "Staff SRE" },
    aiCrew: [
      { name: "Aisha Khan", role: "Platform Engineer" },
      { name: "Ben Carter", role: "DevOps Engineer" },
      { name: "Lena Schulz", role: "Release Manager" },
    ],
    startDate: "2024-01-10",
    plannedEndDate: "2024-05-15",
    actualEndDate: null,
    progress: 20,
    plan: "1. Data collection from legacy systems. 2. Establish ML pipeline. 3. Backtest on Q4 data.",
    weeklyUpdates: [],
    remarks: "Waiting on compliance clearance for sensitive customer data.",
    technologies: ["Python", "Spark", "PostgreSQL", "React"],
  },
  {
    id: "AGT-007",
    name: "Research Assistant",
    status: "Idle",
    model: "gpt-4o",
    prompt: "Research topics deeply and produce structured summaries with citations.",
    tools: ["web_search", "arxiv", "pdf_parse"],
    lastRun: "2h ago",
    avgLatency: 4120,
    cost24h: 2.47,
    successRate: 91.5,
    cpu: 6,
    memory: 14,
    tokensUsed: 184200,
    description: "Deep-research agent that produces cited reports.",
    tags: ["research", "knowledge"],
    createdAt: "2026-03-15",
    shareLink: "https://ax.local/share/agt-007",
    department: "Product",
    aiExpert: { name: "Dr. Samira Haddad", role: "Research Lead" },
    aiCrew: [
      { name: "Felix Wagner", role: "Knowledge Engineer" },
      { name: "Emma Santos", role: "Content Curator" },
    ],
    startDate: "2023-11-01",
    plannedEndDate: "2024-03-01",
    actualEndDate: null,
    progress: 85,
    plan: "Phase 1: Knowledge ingestion. Phase 2: Response generation API. Phase 3: Human fallback.",
    weeklyUpdates: [
      { week: "Week 1", tasks: "Initial setup & schema design", status: "completed" },
      { week: "Week 2", tasks: "Knowledge pipeline ingestion", status: "completed" },
      { week: "Week 3", tasks: "Fine-tuning QA model", status: "in-progress" },
    ],
    remarks: "Blocked mildly by API rate limits from third-party vendor.",
    technologies: ["Next.js", "FastAPI", "Pinecone", "LangChain"],
  },
  {
    id: "AGT-008",
    name: "Log Monitor",
    status: "Stopped",
    model: "gpt-4o-mini",
    prompt: "Watch production logs for anomalies and alert on critical events.",
    tools: ["log_api", "alert_slack", "metrics"],
    lastRun: "1d ago",
    avgLatency: 92,
    cost24h: 0,
    successRate: 95.4,
    cpu: 0,
    memory: 0,
    tokensUsed: 0,
    description: "Continuous log surveillance with anomaly detection.",
    tags: ["monitoring", "alerts"],
    createdAt: "2025-12-12",
    shareLink: "https://ax.local/share/agt-008",
    department: "Security",
    aiExpert: { name: "Chen Wei", role: "Security Architect" },
    aiCrew: [
      { name: "Zara Ali", role: "SOC Analyst" },
      { name: "Ryan Murphy", role: "Threat Hunter" },
    ],
    startDate: "2025-12-12",
    plannedEndDate: "2026-03-01",
    actualEndDate: null,
    progress: 100,
    plan: "Log ingestion → anomaly detection → Slack alerts. Scale to 5TB/day.",
    weeklyUpdates: [],
    remarks: "Stopped temporarily — waiting on budget approval for larger ingestion tier.",
    technologies: ["Elasticsearch", "Kafka", "Python", "Slack API"],
  },
];

// ── Users ──────────────────────────────────────────────────────────

export const mockUsers: UserRecord[] = [
  { id: "KNOX-001", fullName: "Dr. Elena Vasquez", department: "Operations", group: "Customer Ops", team: "Support AI", type: "AI Expert" },
  { id: "KNOX-002", fullName: "Marcus Chen", department: "Engineering", group: "Platform", team: "ML Infra", type: "AI Crew" },
  { id: "KNOX-003", fullName: "James O'Brien", department: "Engineering", group: "Developer Experience", team: "Code Intelligence", type: "AI Expert" },
  { id: "KNOX-004", fullName: "Dr. Hana Kim", department: "Data Science", group: "Analytics", team: "Business Intelligence", type: "AI Expert" },
  { id: "KNOX-005", fullName: "Isabella Romano", department: "Marketing", group: "Creative", team: "Content Gen", type: "AI Expert" },
  { id: "KNOX-006", fullName: "Priya Sharma", department: "Operations", group: "Customer Ops", team: "Prompt Engineering", type: "AI Crew" },
];

// ── Issues ──────────────────────────────────────────────────────────

export const issues: Issue[] = [
  {
    id: "ISS-001",
    agentId: "AGT-004",
    agentName: "Content Generator",
    severity: "high",
    title: "Rate limit exceeded on image_gen tool",
    detectedAt: "12 min ago",
    suggestion: "Increase API quota or add exponential backoff to the retry logic.",
  },
  {
    id: "ISS-002",
    agentId: "AGT-002",
    agentName: "Code Review Assistant",
    severity: "medium",
    title: "High memory usage (72%) trending upward",
    detectedAt: "34 min ago",
    suggestion: "Restart agent or investigate memory leak in ast_parser tool.",
  },
  {
    id: "ISS-003",
    agentId: "AGT-008",
    agentName: "Log Monitor",
    severity: "critical",
    title: "Agent has been stopped for 24 hours",
    detectedAt: "1h ago",
    suggestion: "Restart the agent to resume log surveillance. Review last error.",
  },
  {
    id: "ISS-004",
    agentId: "AGT-004",
    agentName: "Content Generator",
    severity: "low",
    title: "Success rate below 80% threshold",
    detectedAt: "2h ago",
    suggestion: "Review recent prompt changes and tool failures.",
  },
  {
    id: "ISS-005",
    agentId: "AGT-007",
    agentName: "Research Assistant",
    severity: "low",
    title: "Latency p99 exceeded 5000ms",
    detectedAt: "3h ago",
    suggestion: "Consider caching frequent queries or optimizing pdf_parse.",
  },
];

// ── Logs (for specific agent) ───────────────────────────────────────

export function genLogs(agentId: string): LogLine[] {
  const base: LogLine[] = [
    { ts: "14:32:18", level: "info", message: `[${agentId}] Request received from client` },
    { ts: "14:32:18", level: "info", message: `[${agentId}] Calling tool: web_search` },
    { ts: "14:32:19", level: "success", message: `[${agentId}] Tool returned 12 results in 420ms` },
    { ts: "14:32:20", level: "info", message: `[${agentId}] Generating response (1284 tokens)` },
    { ts: "14:32:22", level: "success", message: `[${agentId}] Response sent (status: 200)` },
    { ts: "14:32:45", level: "info", message: `[${agentId}] New request received` },
    { ts: "14:32:46", level: "warn", message: `[${agentId}] Slow response from tool (1820ms)` },
    { ts: "14:32:48", level: "success", message: `[${agentId}] Request completed` },
    { ts: "14:33:01", level: "info", message: `[${agentId}] Heartbeat OK` },
    { ts: "14:33:15", level: "error", message: `[${agentId}] Tool failure: knowledge_base timeout` },
    { ts: "14:33:16", level: "info", message: `[${agentId}] Retrying with exponential backoff` },
    { ts: "14:33:18", level: "success", message: `[${agentId}] Retry succeeded` },
  ];
  return base;
}

// ── Tasks (per agent) ───────────────────────────────────────────────

export function genTasks(agentId: string): Task[] {
  return [
    {
      id: "T-001",
      title: "Process customer queue (batch 42)",
      agentId,
      deadline: "Today 18:00",
      priority: "high",
      status: "in-progress",
    },
    {
      id: "T-002",
      title: "Weekly report generation",
      agentId,
      deadline: "Fri",
      priority: "medium",
      status: "todo",
    },
    {
      id: "T-003",
      title: "Knowledge base refresh",
      agentId,
      deadline: "Mon",
      priority: "low",
      status: "review",
    },
  ];
}

// ── Deploy history ──────────────────────────────────────────────────

export const deployHistory: DeployEntry[] = [
  {
    version: "v2.4.1",
    deployedAt: "2026-04-04 09:12",
    deployer: "alice@ax.local",
    status: "success",
    notes: "Prompt refinements + new knowledge_base tool",
  },
  {
    version: "v2.4.0",
    deployedAt: "2026-04-02 14:38",
    deployer: "bob@ax.local",
    status: "success",
    notes: "Model upgrade to gpt-4o-mini",
  },
  {
    version: "v2.3.8",
    deployedAt: "2026-03-30 11:02",
    deployer: "alice@ax.local",
    status: "rolled-back",
    notes: "Caused 20% drop in success rate — reverted",
  },
  {
    version: "v2.3.7",
    deployedAt: "2026-03-28 16:45",
    deployer: "charlie@ax.local",
    status: "success",
    notes: "Added web_search tool",
  },
];

// ── KPIs (Home) ─────────────────────────────────────────────────────

export function getKpis() {
  const running = agents.filter((a) => a.status === "Running").length;
  const errors = agents.filter((a) => a.status === "Error").length;
  const totalCost = agents.reduce((s, a) => s + (a.cost24h ?? 0), 0);
  const errorRate = (errors / agents.length) * 100;

  return {
    totalAgents: agents.length,
    runningAgents: running,
    errorRate: errorRate.toFixed(1),
    costToday: totalCost.toFixed(2),
  };
}

// ── Realtime chart data ─────────────────────────────────────────────

export interface ChartPoint {
  t: string;
  running: number;
  error: number;
  cost: number;
}

export function genChartSeed(): ChartPoint[] {
  const now = Date.now();
  const points: ChartPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 10_000);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    points.push({
      t: `${hh}:${mm}:${ss}`,
      running: 4 + Math.round(Math.random() * 3),
      error: Math.round(Math.random() * 2),
      cost: +(0.2 + Math.random() * 0.6).toFixed(2),
    });
  }
  return points;
}

export function genChartTick(): ChartPoint {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  return {
    t: `${hh}:${mm}:${ss}`,
    running: 4 + Math.round(Math.random() * 3),
    error: Math.round(Math.random() * 2),
    cost: +(0.2 + Math.random() * 0.6).toFixed(2),
  };
}
