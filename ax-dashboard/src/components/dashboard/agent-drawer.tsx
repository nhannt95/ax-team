"use client";

import { useState, useEffect, useRef } from "react";
import {
  Info,
  Settings2,
  BarChart2,
  Terminal,
  ListChecks,
  AlertTriangle,
  History,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Gauge,
  CircleCheck,
  Hash,
  Building2,
  Crown,
  Users,
  CalendarDays,
  Target,
  Wrench,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type Agent,
  type AgentStatus,
  type LogLine,
  genTasks,
  deployHistory,
  issues as allIssues,
} from "@/lib/mock/data";
import { logsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusBadge: Record<AgentStatus, string> = {
  Running: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Idle: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  Error: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  Deploying: "bg-primary/15 text-primary border-primary/20",
  Stopped: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const logLevelColor: Record<string, string> = {
  info: "text-sky-400",
  warn: "text-amber-400",
  error: "text-rose-400",
  success: "text-emerald-400",
};

const severityBadge: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

const taskStatusBadge: Record<string, string> = {
  todo: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  "in-progress": "bg-primary/15 text-primary border-primary/20",
  review: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const priorityDot: Record<string, string> = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-sky-400",
};

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

function TimelineCell({
  label,
  icon: Icon,
  date,
  color,
}: {
  label: string;
  icon: React.ElementType;
  date: string;
  color: string;
}) {
  return (
    <div>
      <div className={cn("flex items-center gap-1 text-[9px] uppercase tracking-wider mb-1", color)}>
        <Icon className="h-2.5 w-2.5" />
        {label}
      </div>
      <p className="text-xs font-semibold tabular-nums">{date}</p>
    </div>
  );
}

export function AgentDrawer({
  agent,
  open,
  onOpenChange,
}: {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);

  // Load logs cua project tu API, poll moi 5s khi drawer mo
  useEffect(() => {
    if (!open || !agent) return;
    let alive = true;
    const fetchLogs = async () => {
      try {
        const data = await logsApi.list(agent.id, 200);
        if (!alive) return;
        setLogs(
          data
            .slice()
            .reverse()
            .map((l) => ({
              ts: new Date(l.createdAt).toLocaleTimeString(),
              level: l.level,
              message: l.message,
            }))
        );
      } catch { /* DB chưa connect hoặc chưa có log */ }
    };
    fetchLogs();
    const int = setInterval(fetchLogs, 5000);
    return () => { alive = false; clearInterval(int); };
  }, [open, agent]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  if (!agent) return null;

  const agentIssues = allIssues.filter((i) => i.agentId === agent.id);
  const agentTasks = genTasks(agent.id);

  function copyShare() {
    if (!agent) return;
    navigator.clipboard.writeText(agent.shareLink);
    setCopied(true);
    toast.success("Share link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="glass-strong w-full sm:max-w-2xl !max-w-2xl p-0 border-l-border/30 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/30 shrink-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn("text-[10px]", statusBadge[agent.status])}>
                  <span
                    className={cn(
                      "mr-1.5 h-1.5 w-1.5 rounded-full",
                      agent.status === "Running" ? "bg-emerald-400 animate-pulse" : "bg-current opacity-60"
                    )}
                  />
                  {agent.status}
                </Badge>
                <span className="text-[11px] text-muted-foreground font-mono">{agent.id}</span>
              </div>
              <h2 className="text-xl font-semibold truncate">{agent.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Gauge className="h-3.5 w-3.5" />
              Deploy
            </Button>
            <Button size="sm" variant="outline" className="gap-2 border-border/50">
              Restart
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-4 shrink-0 overflow-x-auto">
            <TabsList variant="line" className="h-auto w-full justify-start">
              <TabsTrigger value="general" className="gap-1.5 text-xs">
                <Info className="h-3.5 w-3.5" /> General
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-1.5 text-xs">
                <Settings2 className="h-3.5 w-3.5" /> Agents
              </TabsTrigger>
              <TabsTrigger value="metrics" className="gap-1.5 text-xs">
                <BarChart2 className="h-3.5 w-3.5" /> Metrics
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5 text-xs">
                <Terminal className="h-3.5 w-3.5" /> Logs
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5 text-xs">
                <ListChecks className="h-3.5 w-3.5" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="issues" className="gap-1.5 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" /> Issues
              </TabsTrigger>
              <TabsTrigger value="deploy" className="gap-1.5 text-xs">
                <History className="h-3.5 w-3.5" /> Deploy
              </TabsTrigger>
              <TabsTrigger value="share" className="gap-1.5 text-xs">
                <Share2 className="h-3.5 w-3.5" /> Share
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* GENERAL */}
            <TabsContent value="general" className="mt-0 space-y-4">
              {/* Department */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  <Building2 className="h-3 w-3" /> Department
                </div>
                <p className="text-sm font-semibold">{agent.department}</p>
              </div>

              {/* AI Expert */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  <Crown className="h-3 w-3 text-amber-400" /> AI Expert
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hashHue(agent.aiExpert.name)} 70% 55%), hsl(${(hashHue(agent.aiExpert.name) + 40) % 360} 70% 45%))`,
                    }}
                  >
                    {initials(agent.aiExpert.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{agent.aiExpert.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.aiExpert.role}</p>
                  </div>
                </div>
              </div>

              {/* AI Crew */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3 w-3" /> AI Crew
                  </div>
                  <span className="text-[11px] text-muted-foreground">{agent.aiCrew.length} members</span>
                </div>
                <div className="space-y-2">
                  {agent.aiCrew.map((m) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-white shrink-0"
                        style={{
                          background: `linear-gradient(135deg, hsl(${hashHue(m.name)} 70% 55%), hsl(${(hashHue(m.name) + 40) % 360} 70% 45%))`,
                        }}
                      >
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                  <CalendarDays className="h-3 w-3" /> Timeline
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TimelineCell
                    label="Start"
                    icon={CalendarDays}
                    date={agent.startDate}
                    color="text-sky-400"
                  />
                  <TimelineCell
                    label="Planned End"
                    icon={Target}
                    date={agent.plannedEndDate}
                    color="text-primary"
                  />
                  <TimelineCell
                    label="Actual End"
                    icon={CircleCheck}
                    date={agent.actualEndDate ?? "—"}
                    color={agent.actualEndDate ? "text-emerald-400" : "text-muted-foreground/60"}
                  />
                </div>
              </div>

              {/* Plan */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  <Target className="h-3 w-3" /> Plan
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {agent.plan}
                </p>
              </div>

              {/* Technologies */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  <Wrench className="h-3 w-3" /> Technologies
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.technologies.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-lg bg-accent/50 border border-border/40 px-2 py-0.5 text-[11px]"
                    >
                      <Wrench className="h-2.5 w-2.5 text-primary" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-400 mb-2">
                  <AlertTriangle className="h-3 w-3" /> Remarks
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {agent.remarks}
                </p>
              </div>

            </TabsContent>

            {/* AGENTS */}
            <TabsContent value="agents" className="mt-0 space-y-3">
              {(agent.agents || []).length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-8">
                  No agents assigned to this project.
                </p>
              ) : (
                (agent.agents || []).map((a, i) => (
                  <div key={i} className="glass rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                        <Hash className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold">{a.name}</p>
                    </div>
                    {a.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {a.description}
                      </p>
                    )}
                    {(a.technologies || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(a.technologies || []).map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center gap-1 rounded-md bg-accent/50 border border-border/40 px-1.5 py-0.5 text-[10px]"
                          >
                            <Wrench className="h-2 w-2 text-primary" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* METRICS */}
            <TabsContent value="metrics" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    <CircleCheck className="h-3 w-3" /> Success Rate
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{agent.successRate}%</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    <Gauge className="h-3 w-3" /> Avg Latency
                  </div>
                  <p className="text-xl font-bold">{agent.avgLatency}<span className="text-xs text-muted-foreground ml-1">ms</span></p>
                </div>
              </div>
            </TabsContent>

            {/* LOGS */}
            <TabsContent value="logs" className="mt-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Live Logs</p>
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 gap-1.5 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  STREAMING
                </Badge>
              </div>
              <div
                ref={logsRef}
                className="glass rounded-xl p-4 font-mono text-[11px] leading-relaxed h-[400px] overflow-y-auto"
              >
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-3 py-0.5">
                    <span className="text-muted-foreground/60 shrink-0">{l.ts}</span>
                    <span className={cn("uppercase text-[9px] font-bold shrink-0 w-10 pt-0.5", logLevelColor[l.level])}>
                      {l.level}
                    </span>
                    <span className="text-foreground/80 break-all">{l.message}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TASKS */}
            <TabsContent value="tasks" className="mt-0 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Weekly Progress Tracker</p>
                <div className="flex gap-3">
                   <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-zinc-500" /><span className="text-[10px] text-muted-foreground">Pending</span></div>
                   <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /><span className="text-[10px] text-muted-foreground">In Progress</span></div>
                   <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><span className="text-[10px] text-muted-foreground">Completed</span></div>
                </div>
              </div>

              {!agent.weeklyUpdates || agent.weeklyUpdates.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <ListChecks className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No weekly tasks scheduled</p>
                </div>
              ) : (
                agent.weeklyUpdates.map((wu, i) => (
                  <div key={i} className="glass rounded-xl p-4 flex sm:items-center gap-3">
                    <span className={cn(
                      "h-2 w-2 rounded-full shrink-0", 
                      wu.status === "completed" ? "bg-emerald-400" : wu.status === "in-progress" ? "bg-primary" : "bg-zinc-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{wu.tasks}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{wu.week}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[10px] capitalize",
                      wu.status === "completed" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : wu.status === "in-progress" ? "bg-primary/15 text-primary border-primary/20" : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
                    )}>
                      {wu.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </TabsContent>

            {/* ISSUES */}
            <TabsContent value="issues" className="mt-0 space-y-2">
              {agentIssues.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <CircleCheck className="h-8 w-8 text-emerald-400/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active issues</p>
                </div>
              ) : (
                agentIssues.map((i) => (
                  <div key={i.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium flex-1">{i.title}</p>
                      <Badge variant="outline" className={cn("text-[10px] shrink-0", severityBadge[i.severity])}>
                        {i.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{i.detectedAt}</p>
                    <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-primary font-medium mb-1">
                        Fix Suggestion
                      </p>
                      <p className="text-xs text-foreground/80">{i.suggestion}</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* DEPLOY */}
            <TabsContent value="deploy" className="mt-0">
              <div className="glass rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        Version
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        Deployed
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deployHistory.map((d) => (
                      <TableRow key={d.version} className="border-border/20">
                        <TableCell className="font-mono text-xs">{d.version}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>{d.deployedAt}</div>
                          <div className="text-[10px]">{d.deployer}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              d.status === "success"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                                : d.status === "rolled-back"
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                                  : "bg-rose-500/15 text-rose-400 border-rose-500/20"
                            )}
                          >
                            {d.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* SHARE */}
            <TabsContent value="share" className="mt-0 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Read-only Share Link
                </p>
                <div className="glass rounded-xl p-3 flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-muted-foreground truncate">
                    {agent.shareLink}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyShare}
                    className="gap-1.5 border-border/50 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Anyone with this link can view agent metrics and activity in read-only mode.
                </p>
                <Button size="sm" variant="outline" className="gap-2 border-border/50 w-full">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Public View
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
