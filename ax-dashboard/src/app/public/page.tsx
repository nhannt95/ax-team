"use client";

import { Cpu, Eye, Bot, Play, AlertTriangle, DollarSign, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { agents, getKpis, type AgentStatus } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

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

export default function PublicDashboard() {
  const kpis = getKpis();

  const kpiCards = [
    { label: "Total Agents", value: kpis.totalAgents, icon: Bot, color: "text-primary", bg: "bg-primary/15" },
    { label: "Running", value: kpis.runningAgents, icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/15" },
    { label: "Error Rate", value: `${kpis.errorRate}%`, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/15" },
    { label: "Cost Today", value: `$${kpis.costToday}`, icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/15" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <header className="glass-strong sticky top-0 z-30 border-b border-border/40">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">AX Public Dashboard</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Read-only view</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-400 border-amber-500/20 gap-1.5"
          >
            <Lock className="h-3 w-3" /> Read-only
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Public View
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Operations Status</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live snapshot of our AI agent fleet.
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-8">
          {kpiCards.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl mb-3",
                  k.bg
                )}
              >
                <k.icon className={cn("h-4 w-4", k.color)} />
              </div>
              <p className="text-2xl font-bold tracking-tight">{k.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{k.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Agent List (simplified) */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-4">Active Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/40 shrink-0">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {a.department} · {a.model}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", statusBadge[a.status])}>
                  <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", statusDot[a.status])} />
                  {a.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8">
          Powered by AX · Auto-refreshes periodically
        </p>
      </main>
    </div>
  );
}
