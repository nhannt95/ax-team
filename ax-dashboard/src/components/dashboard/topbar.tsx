"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Eye, ExternalLink, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { usePublicMode } from "@/components/dashboard/public-mode-context";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: 1,
    title: "Content Generator has errors",
    time: "12 min ago",
    severity: "high",
  },
  {
    id: 2,
    title: "Deploy v2.4.1 succeeded",
    time: "34 min ago",
    severity: "success",
  },
  {
    id: 3,
    title: "Memory usage climbing on AGT-002",
    time: "1h ago",
    severity: "warn",
  },
];

const severityDot: Record<string, string> = {
  high: "bg-rose-400",
  warn: "bg-amber-400",
  success: "bg-emerald-400",
};

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { enabled: publicMode, toggle: togglePublic } = usePublicMode();

  return (
    <header className="glass-strong sticky top-0 z-30 flex h-12 items-center gap-3 px-5 border-b border-border/40">
      {/* Global Search */}
      <div className="flex-1 max-w-md relative">
        <div className="neon-ring rounded-lg relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search projects, tasks, issues..."
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            className="bg-background/30 border-border/40 pl-9 h-9 focus-visible:ring-0 focus-visible:border-primary/60"
          />
        </div>
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="glass-strong absolute top-11 left-0 right-0 rounded-xl p-2 shadow-xl border border-border/30"
            >
              <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Quick Results
              </p>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs hover:bg-accent/50 cursor-pointer">
                  <span>Customer Support Bot</span>
                  <span className="text-[10px] text-muted-foreground">Agent</span>
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs hover:bg-accent/50 cursor-pointer">
                  <span>Rate limit exceeded on image_gen</span>
                  <span className="text-[10px] text-muted-foreground">Issue</span>
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs hover:bg-accent/50 cursor-pointer">
                  <span>Weekly report generation</span>
                  <span className="text-[10px] text-muted-foreground">Task</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1" />

      {/* Public Mode toggle */}
      <div className="flex items-center gap-2 rounded-xl bg-accent/30 px-3 py-1.5">
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
          Public
        </span>
        <Switch checked={publicMode} onCheckedChange={togglePublic} />
        {publicMode && (
          <Link
            href="/public"
            target="_blank"
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => {
            setBellOpen(!bellOpen);
            setUserOpen(false);
          }}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
        </button>
        <AnimatePresence>
          {bellOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="glass-strong absolute top-11 right-0 w-80 rounded-xl p-3 shadow-xl border border-border/30"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-sm font-semibold">Notifications</h4>
                <button className="text-[11px] text-primary hover:text-primary/80">
                  Mark all read
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 cursor-pointer"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                        severityDot[n.severity]
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme Toggle */}
      <div className="relative">
        <ThemeToggle />
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => {
            setUserOpen(!userOpen);
            setBellOpen(false);
          }}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent/50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-chart-2/60 text-[10px] font-bold text-white">
            AX
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-medium leading-tight">AX Admin</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Project Lead</p>
          </div>
        </button>
        <AnimatePresence>
          {userOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="glass-strong absolute top-11 right-0 w-56 rounded-xl p-2 shadow-xl border border-border/30"
            >
              <div className="px-3 py-2 border-b border-border/30 mb-1">
                <p className="text-xs font-semibold">AX Admin</p>
                <p className="text-[10px] text-muted-foreground">admin@ax-project.local</p>
              </div>
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs hover:bg-accent/50">
                Profile <Check className="h-3 w-3 opacity-0" />
              </button>
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs hover:bg-accent/50">
                Keyboard shortcuts
              </button>
              <Link
                href="/dashboard/settings"
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs hover:bg-accent/50"
                onClick={() => setUserOpen(false)}
              >
                Settings
              </Link>
              <div className="h-px bg-border/40 my-1" />
              <button className="flex w-full items-center rounded-lg px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10">
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
