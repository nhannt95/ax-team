"use client";

import { Activity, Construction } from "lucide-react";
import { PageWrapper } from "@/components/dashboard/page-wrapper";

export default function MonitoringPage() {
  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Live Monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Health overview, issues, and live logs across all agents.
        </p>
      </div>

      <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-2/10 mb-4">
          <Activity className="h-8 w-8 text-chart-2/50" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Construction className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-muted-foreground">Phase 2</h2>
        </div>
        <p className="text-sm text-muted-foreground/70 max-w-sm">
          AI Supervisor status, health grid (CPU/Memory/Latency/Success per agent), issue detection with one-click fix suggestions, and full-text log viewer.
        </p>
      </div>
    </PageWrapper>
  );
}
