"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Play,
  AlertTriangle,
  Square,
  Loader2,
  RefreshCw,
  Plus,
  Rocket,
  Eye,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectsApi, statsApi, type ApiProject, type WeeklyProgressPoint } from "@/lib/api";
import { issues } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const severityBadge: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

type StatusKey = "Running" | "Deploying" | "Idle" | "Stopped" | "Error";
const statusKeys: StatusKey[] = ["Running", "Deploying", "Idle", "Stopped", "Error"];
const statusColor: Record<StatusKey, string> = {
  Running: "oklch(0.75 0.17 150)",   // emerald
  Deploying: "oklch(0.75 0.15 280)", // primary purple
  Idle: "oklch(0.75 0.10 230)",      // sky
  Stopped: "oklch(0.65 0.02 260)",   // zinc
  Error: "oklch(0.65 0.20 25)",      // rose
};

export default function HomePage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const [projs, weekly] = await Promise.all([
        projectsApi.list(),
        statsApi.weeklyProgress().catch(() => [] as WeeklyProgressPoint[]),
      ]);
      setProjects(projs);
      setWeeklyProgress(weekly);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      /* BE chưa sẵn sàng */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // KPIs
  const kpis = useMemo(() => {
    const total = projects.length;
    const count = (s: StatusKey) => projects.filter((p) => p.status === s).length;
    return {
      total,
      running: count("Running"),
      stopped: count("Stopped") + count("Idle"),
      pending: count("Deploying"),
      error: count("Error"),
    };
  }, [projects]);

  // Chart 1: status breakdown by department
  const statusByDept = useMemo(() => {
    const map = new Map<string, Record<StatusKey, number> & { department: string }>();
    for (const p of projects) {
      const dept = p.department || "Unknown";
      if (!map.has(dept)) {
        map.set(dept, { department: dept, Running: 0, Deploying: 0, Idle: 0, Stopped: 0, Error: 0 });
      }
      const entry = map.get(dept)!;
      const s = p.status as StatusKey;
      if (statusKeys.includes(s)) entry[s] += 1;
    }
    return Array.from(map.values());
  }, [projects]);

  // Chart 2: average progress by department
  const progressByDept = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const p of projects) {
      const dept = p.department || "Unknown";
      if (!map.has(dept)) map.set(dept, { sum: 0, count: 0 });
      const e = map.get(dept)!;
      e.sum += p.progress || 0;
      e.count += 1;
    }
    return Array.from(map.entries()).map(([department, { sum, count }]) => ({
      department,
      progress: count ? Math.round(sum / count) : 0,
      projects: count,
    }));
  }, [projects]);

  const kpiCards = [
    { label: "Total Projects", value: kpis.total, icon: FolderKanban, color: "text-primary", bg: "bg-primary/15" },
    { label: "Running", value: kpis.running, icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/15" },
    { label: "Pending", value: kpis.pending, icon: Loader2, color: "text-sky-400", bg: "bg-sky-500/15" },
    { label: "Stopped", value: kpis.stopped, icon: Square, color: "text-zinc-400", bg: "bg-zinc-500/15" },
    { label: "Error", value: kpis.error, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/15" },
  ];

  const chartTooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    backdropFilter: "blur(12px)",
    fontSize: 12,
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading..." : `Last updated ${lastUpdated || "—"}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 border-border/50">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
        {kpiCards.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass group rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5"
          >
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl mb-3", k.bg)}>
              <k.icon className={cn("h-4 w-4", k.color)} />
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{k.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Total projects per department */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Projects by Department</h2>
            <p className="text-xs text-muted-foreground">Tổng số project ở mỗi phòng ban</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="department" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="projects" name="Projects" fill="oklch(0.75 0.12 210)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status by department */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Status by Department</h2>
            <p className="text-xs text-muted-foreground">Số lượng project theo trạng thái ở từng phòng ban</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="department" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {statusKeys.map((s) => (
                  <Bar key={s} dataKey={s} stackId="a" fill={statusColor[s]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress by department */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Average Progress by Department</h2>
            <p className="text-xs text-muted-foreground">Tiến độ trung bình các project theo phòng ban (%)</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="department" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `${v}%`} />
                <Bar dataKey="progress" name="Avg Progress" fill="oklch(0.75 0.15 280)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly progress line chart */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Weekly Progress Trend</h2>
          <p className="text-xs text-muted-foreground">Tiến độ trung bình của các project theo từng tuần (%)</p>
        </div>
        <div className="h-[260px]">
          {weeklyProgress.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Chưa có weekly updates nào.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `${v}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line
                  type="monotone"
                  dataKey="progress"
                  name="Avg Progress %"
                  stroke="oklch(0.75 0.15 280)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row: Issues (60%) + Quick Actions (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Issues */}
        <div className="glass rounded-2xl p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent Issues</h2>
              <p className="text-xs text-muted-foreground">Detected by AI Supervisor</p>
            </div>
            <Link href="/dashboard/monitoring" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {issues.slice(0, 5).map((issue) => (
              <Link
                key={issue.id}
                href="/dashboard/monitoring"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/40 cursor-pointer"
              >
                <Badge variant="outline" className={cn("text-[10px] shrink-0 w-16 justify-center", severityBadge[issue.severity])}>
                  {issue.severity}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight truncate">{issue.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{issue.agentName} · {issue.detectedAt}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h2 className="text-base font-semibold mb-1">Quick Actions</h2>
          <Link
            href="/dashboard/agents"
            className="glass group rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 flex items-center gap-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 group-hover:bg-primary/25 transition-colors">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Create New Project</p>
              <p className="text-xs text-muted-foreground">Configure and track a new AI project</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>

          <button className="glass group rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 flex items-center gap-4 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/15 group-hover:bg-chart-2/25 transition-colors">
              <Rocket className="h-5 w-5 text-chart-2" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Deploy All</p>
              <p className="text-xs text-muted-foreground">Trigger deploy for all pending projects</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-chart-2 transition-colors" />
          </button>

          <Link
            href="/public"
            target="_blank"
            className="glass group rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 flex items-center gap-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/15 group-hover:bg-chart-3/25 transition-colors">
              <Eye className="h-5 w-5 text-chart-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">View Public Dashboard</p>
              <p className="text-xs text-muted-foreground">Read-only view for external stakeholders</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-chart-3 transition-colors" />
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
