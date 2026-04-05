"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Rocket,
  Trash2,
  Pencil,
  Building2,
  Crown,
  Users,
  Bot,
  Gauge,
  CircleCheck,
  MoreHorizontal,
  CalendarDays,
  Target,
  Wrench,
} from "lucide-react";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AgentDrawer } from "@/components/dashboard/agent-drawer";
import { EditProjectDialog } from "@/components/dashboard/edit-project-dialog";
import { CreateProjectDialog, type EditableFields } from "@/components/dashboard/create-project-dialog";
import {
  type Agent,
  type AgentStatus,
  type Department,
  type CrewMember,
} from "@/lib/mock/data";
import { projectsApi, type ApiProject } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusBadge: Record<AgentStatus, string> = {
  Running: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Idle: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  Error: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  Deploying: "bg-primary/15 text-primary border-primary/20",
  Stopped: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const statusDot: Record<AgentStatus, string> = {
  Running: "bg-emerald-400 animate-pulse",
  Idle: "bg-sky-400",
  Error: "bg-rose-400",
  Deploying: "bg-primary animate-pulse",
  Stopped: "bg-zinc-400",
};

const departmentColor: Record<Department, string> = {
  Engineering: "bg-primary/15 text-primary border-primary/20",
  "Data Science": "bg-chart-2/15 text-chart-2 border-chart-2/20",
  Product: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  Marketing: "bg-chart-4/15 text-chart-4 border-chart-4/20",
  Operations: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  Security: "bg-chart-5/15 text-chart-5 border-chart-5/20",
};

const departmentGradient: Record<Department, string> = {
  Engineering: "from-primary/25 to-primary/5",
  "Data Science": "from-chart-2/25 to-chart-2/5",
  Product: "from-chart-3/25 to-chart-3/5",
  Marketing: "from-chart-4/25 to-chart-4/5",
  Operations: "from-sky-500/25 to-sky-500/5",
  Security: "from-chart-5/25 to-chart-5/5",
};

// ── Avatar ───────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function CrewAvatar({ member, size = "sm" }: { member: CrewMember; size?: "sm" | "md" }) {
  const hue = hashHue(member.name);
  const px = size === "md" ? "h-6 w-6 text-[10px]" : "h-5 w-5 text-[8px]";
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-background",
          px
        )}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
        }}
      >
        {initials(member.name)}
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-[11px]">
          <div className="font-semibold">{member.name}</div>
          <div className="text-muted-foreground">{member.role}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Project Card ─────────────────────────────────────────────────────

function ProjectCard({
  agent,
  index,
  onOpen,
  onEdit,
  onDelete,
  onDeploy,
}: {
  agent: Agent;
  index: number;
  onOpen: (a: Agent) => void;
  onEdit: (a: Agent) => void;
  onDelete: (a: Agent) => void;
  onDeploy: (a: Agent) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={() => onOpen(agent)}
      className="glass group relative rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01] flex flex-col cursor-pointer"
    >
      {/* Menu button */}
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:text-foreground hover:bg-accent/50"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-strong absolute right-0 top-8 z-20 w-36 rounded-xl p-1.5 shadow-xl border border-border/30"
            >
              <button
                onClick={() => {
                  onOpen(agent);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <Bot className="h-3 w-3" /> View Details
              </button>
              <button
                onClick={() => {
                  onEdit(agent);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <Pencil className="h-3 w-3" /> Edit Project
              </button>
              <button
                onClick={() => {
                  onDeploy(agent);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Rocket className="h-3 w-3" /> Deploy
              </button>
              <button
                onClick={() => {
                  onDelete(agent);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Title row */}
      <div className="flex items-start gap-2 mb-2 pr-7">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-1">
          {agent.name}
        </h3>
      </div>

      {/* Status + Dept + ID */}
      <div className="flex items-center flex-wrap gap-2 mb-2">
        <Badge
          variant="outline"
          className={cn("text-[10px]", statusBadge[agent.status])}
        >
          <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", statusDot[agent.status])} />
          {agent.status}
        </Badge>
        <Badge
          variant="outline"
          className={cn("text-[10px]", departmentColor[agent.department])}
        >
          <Building2 className="h-2.5 w-2.5 mr-1" />
          {agent.department}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">{agent.id}</span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
        {agent.description}
      </p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
          <span>Overall Progress</span>
          <span className={cn(
            agent.progress === 100 ? "text-emerald-400" :
            (agent.progress ?? 0) >= 80 ? "text-purple-400" :
            (agent.progress ?? 0) >= 50 ? "text-sky-400" :
            "text-amber-400"
          )}>{agent.progress ?? 0}%</span>
        </div>
        <div className="h-1.5 w-full bg-accent/50 overflow-hidden rounded-full font-sans">
          <motion.div
            className={cn(
              "h-full",
              agent.progress === 100 ? "bg-emerald-400" :
              (agent.progress ?? 0) >= 80 ? "bg-purple-400" :
              (agent.progress ?? 0) >= 50 ? "bg-sky-400" :
              "bg-amber-400"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${agent.progress ?? 0}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* AI Expert */}
      <div className="mb-2 rounded-xl bg-accent/30 p-2.5">
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">
          <Crown className="h-2.5 w-2.5 text-amber-400" />
          AI Expert
        </div>
        <div className="flex items-center gap-2">
          <CrewAvatar member={agent.aiExpert} size="md" />
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{agent.aiExpert.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{agent.aiExpert.role}</p>
          </div>
        </div>
      </div>

      {/* AI Crew */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
            <Users className="h-2.5 w-2.5" />
            AI Crew
          </div>
          <span className="text-[10px] text-muted-foreground">{agent.aiCrew.length} members</span>
        </div>
        <div className="flex -space-x-2">
          {agent.aiCrew.slice(0, 5).map((m) => (
            <CrewAvatar key={m.name} member={m} />
          ))}
          {agent.aiCrew.length > 5 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[8px] font-semibold text-muted-foreground ring-2 ring-background">
              +{agent.aiCrew.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-3 flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <CalendarDays className="h-2.5 w-2.5 text-sky-400" />
          <span className="tabular-nums">{agent.startDate}</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
        <div className="flex items-center gap-1 text-muted-foreground">
          {agent.actualEndDate ? (
            <>
              <CircleCheck className="h-2.5 w-2.5 text-emerald-400" />
              <span className="tabular-nums text-emerald-400">{agent.actualEndDate}</span>
            </>
          ) : (
            <>
              <Target className="h-2.5 w-2.5 text-primary" />
              <span className="tabular-nums">{agent.plannedEndDate}</span>
            </>
          )}
        </div>
      </div>

      {/* Technologies preview */}
      {agent.technologies.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {agent.technologies.slice(0, 3).map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-0.5 rounded-md bg-accent/40 px-1.5 py-0.5 text-[9px] text-muted-foreground"
            >
              <Wrench className="h-2 w-2 text-primary/70" />
              {t}
            </span>
          ))}
          {agent.technologies.length > 3 && (
            <span className="rounded-md bg-accent/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
              +{agent.technologies.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metrics footer */}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
            <CircleCheck className="h-2.5 w-2.5" />
            Success
          </div>
          <p className="text-xs font-semibold text-emerald-400 tabular-nums">
            {agent.successRate}%
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
            <Gauge className="h-2.5 w-2.5" />
            Latency
          </div>
          <p className="text-xs font-semibold tabular-nums">
            {agent.avgLatency}<span className="text-[10px] text-muted-foreground ml-0.5">ms</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Map API shape -> FE Agent shape (fill defaults for fields BE không lưu)
  function toAgent(a: ApiProject): Agent {
    return {
      id: a.id,
      name: a.name,
      status: (a.status || "Idle") as AgentStatus,
      model: a.model || "",
      prompt: a.prompt || "",
      tools: a.tools || [],
      lastRun: a.lastRun || "",
      avgLatency: a.avgLatency || 0,
      successRate: a.successRate || 0,
      description: a.description || "",
      tags: a.tags || [],
      createdAt: a.createdAt || "",
      shareLink: a.shareLink || "",
      department: (a.department || "Engineering") as Department,
      aiExpert: (a as ApiProject & { aiExpert?: CrewMember }).aiExpert || { name: "", role: "" },
      aiCrew: (a as ApiProject & { aiCrew?: CrewMember[] }).aiCrew || [],
      agents: (a.agents || []).map((ag) => ({ name: ag.name, description: ag.description || "", technologies: (ag as { technologies?: string[] }).technologies || [] })),
      startDate: a.startDate || "",
      plannedEndDate: a.plannedEndDate || "",
      actualEndDate: a.actualEndDate || null,
      progress: a.progress || 0,
      plan: a.plan || "",
      weeklyUpdates: [],
      remarks: a.remarks || "",
      technologies: a.technologies || [],
    };
  }

  async function reload() {
    setLoading(true);
    try {
      const data = await projectsApi.list();
      setAgents(data.map(toAgent));
    } catch (e: unknown) {
      toast.error("Load failed", { description: e instanceof Error ? e.message : "Cannot load agents" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [completionFilter, setCompletionFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<Department | "all">("all");
  const [selected, setSelected] = useState<Agent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Agent | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const models = useMemo(() => Array.from(new Set(agents.map((a) => a.model))), [agents]);
  const departments = useMemo(
    () => Array.from(new Set(agents.map((a) => a.department))),
    [agents]
  );

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { all: agents.length };
    for (const a of agents) {
      counts[a.department] = (counts[a.department] || 0) + 1;
    }
    return counts;
  }, [agents]);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.aiExpert.name.toLowerCase().includes(q) ||
        a.aiCrew.some((m) => m.name.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesModel = modelFilter === "all" || a.model === modelFilter;
      const matchesDept = deptFilter === "all" || a.department === deptFilter;
      const p = a.progress ?? 0;
      const matchesCompletion =
        completionFilter === "all" ||
        (completionFilter === "completed" ? p === 100 : p < 100);
      return matchesSearch && matchesStatus && matchesModel && matchesDept && matchesCompletion;
    });
  }, [agents, search, statusFilter, modelFilter, deptFilter, completionFilter]);

  function openDetail(agent: Agent) {
    setSelected(agent);
    setDrawerOpen(true);
  }

  function openEdit(agent: Agent) {
    setEditTarget(agent);
    setEditOpen(true);
  }

  async function handleSaveEdit(
    id: string,
    updated: {
      name: string;
      description: string;
      department: Department;
      status: AgentStatus;
      aiExpert: { name: string; role: string };
      aiCrew: Array<{ name: string; role: string }>;
      agents: Array<{ name: string; description: string; technologies: string[] }>;
      startDate: string;
      plannedEndDate: string;
      actualEndDate: string;
      progress: number;
      plan: string;
      remarks: string;
      technologies: string[];
    }
  ) {
    try {
      const existing = agents.find((a) => a.id === id);
      await projectsApi.update(id, {
        name: updated.name,
        description: updated.description,
        department: updated.department,
        aiExpert: updated.aiExpert,
        aiCrew: updated.aiCrew,
        startDate: updated.startDate,
        plannedEndDate: updated.plannedEndDate,
        actualEndDate: updated.actualEndDate || null,
        progress: updated.progress,
        plan: updated.plan,
        remarks: updated.remarks,
        technologies: updated.technologies,
        status: updated.status,
        model: existing?.model,
        tools: existing?.tools || [],
        tags: existing?.tags || [],
        projectAgents: updated.agents,
      });
      toast.success("Project updated", { description: updated.name });
      await reload();
    } catch (e: unknown) {
      toast.error("Update failed", { description: e instanceof Error ? e.message : "Cannot update project" });
    }
  }

  async function handleDelete(agent: Agent) {
    try {
      await projectsApi.remove(agent.id);
      toast.success("Project deleted", { description: `${agent.name} removed.` });
      await reload();
    } catch (e: unknown) {
      toast.error("Delete failed", { description: e instanceof Error ? e.message : "Cannot delete project" });
    }
  }

  function handleDeploy(agent: Agent) {
    toast.success("Deploy triggered", { description: `Deploying ${agent.name}...` });
  }

  async function handleCreateProject(form: EditableFields) {
    try {
      await projectsApi.create({
        id: `AX-${Math.floor(Math.random() * 900) + 100}`,
        name: form.name,
        description: form.description,
        status: "Deploying",
        model: "gpt-4o",
        department: form.department,
        aiExpert: form.aiExpert,
        aiCrew: form.aiCrew,
        startDate: form.startDate,
        plannedEndDate: form.plannedEndDate,
        actualEndDate: form.actualEndDate || null,
        progress: form.progress,
        plan: form.plan,
        remarks: form.remarks,
        technologies: form.technologies,
        tools: [],
        tags: ["new"],
        createdAt: new Date().toISOString().slice(0, 10),
        projectAgents: form.agents,
      });
      toast.success("Project created", { description: form.name });
      await reload();
    } catch (e: unknown) {
      toast.error("Create failed", { description: e instanceof Error ? e.message : "Cannot create project" });
    }
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading projects..." : `${filtered.length} of ${agents.length} projects · Manage departments, experts, and crews`}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Department filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setDeptFilter("all")}
          className={cn(
            "relative rounded-xl px-3 py-1.5 text-xs font-medium transition-colors duration-200",
            deptFilter === "all"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          {deptFilter === "all" && (
            <motion.div
              layoutId="dept-filter"
              className="absolute inset-0 rounded-xl bg-primary/10"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            All Departments
            <span className="text-[10px] text-muted-foreground/70">
              {deptCounts.all}
            </span>
          </span>
        </button>
        {departments.map((dept) => {
          const active = deptFilter === dept;
          return (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={cn(
                "relative rounded-xl px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {active && (
                <motion.div
                  layoutId="dept-filter"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Building2 className="h-3 w-3" />
                {dept}
                <span className="text-[10px] text-muted-foreground/70">
                  {deptCounts[dept]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters row */}
      <div className="glass rounded-2xl p-3 mb-6 flex flex-wrap items-center gap-2">
        <div className="neon-ring rounded-lg relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, expert, crew..."
            className="bg-background/30 border-border/40 pl-9 focus-visible:ring-0 focus-visible:border-primary/60"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="bg-background/30 border-border/40 min-w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-border/30">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Running">Running</SelectItem>
            <SelectItem value="Idle">Idle</SelectItem>
            <SelectItem value="Error">Error</SelectItem>
            <SelectItem value="Deploying">Deploying</SelectItem>
            <SelectItem value="Stopped">Stopped</SelectItem>
          </SelectContent>
        </Select>
        <Select value={modelFilter} onValueChange={(v) => setModelFilter(v ?? "all")}>
          <SelectTrigger className="bg-background/30 border-border/40 min-w-[160px]">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-border/30">
            <SelectItem value="all">All Models</SelectItem>
            {models.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={completionFilter} onValueChange={(v) => setCompletionFilter(v ?? "all")}>
          <SelectTrigger className="bg-background/30 border-border/40 min-w-[140px]">
            <SelectValue placeholder="Completion" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-border/30">
            <SelectItem value="all">All Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">In Progress</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${deptFilter}-${statusFilter}-${modelFilter}-${search}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full glass rounded-2xl p-12 flex flex-col items-center justify-center text-center"
            >
              <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No projects match your filters
              </p>
            </motion.div>
          ) : (
            filtered.map((a, i) => (
              <ProjectCard
                key={a.id}
                agent={a}
                index={i}
                onOpen={openDetail}
                onEdit={openEdit}
                onDelete={handleDelete}
                onDeploy={handleDeploy}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Detail Drawer */}
      <AgentDrawer agent={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Edit Dialog */}
      <EditProjectDialog
        agent={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSaveEdit}
      />

      {/* Create Dialog */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateProject}
      />
    </PageWrapper>
  );
}
