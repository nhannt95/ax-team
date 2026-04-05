"use client";

import { BarChart3, Construction } from "lucide-react";
import { PageWrapper } from "@/components/dashboard/page-wrapper";

export default function AnalyticsPage() {
  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics & Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Long-term trends, cost analysis, and exportable reports.
        </p>
      </div>

      <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-3/10 mb-4">
          <BarChart3 className="h-8 w-8 text-chart-3/50" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Construction className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-muted-foreground">Phase 2</h2>
        </div>
        <p className="text-sm text-muted-foreground/70 max-w-sm">
          Date-range picker (7d/30d/90d/custom), cost & success-rate trends, top agents ranking, CSV/PDF export.
        </p>
      </div>
    </PageWrapper>
  );
}
