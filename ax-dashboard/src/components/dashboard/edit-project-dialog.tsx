"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Save,
  X,
  Plus,
  Crown,
  Users,
  Building2,
  CalendarDays,
  Target,
  CheckCircle2,
  Wrench,
  FileText,
  AlertTriangle,
  Trash2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Agent, type AgentStatus, type Department, type CrewMember, type WeeklyUpdate } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const departments: Department[] = [
  "Engineering",
  "Data Science",
  "Product",
  "Marketing",
  "Operations",
  "Security",
];

interface AgentEntry { name: string; description: string; technologies: string[] }

const statusOptions: AgentStatus[] = ["Running", "Idle", "Error", "Deploying", "Stopped"];

interface EditableFields {
  name: string;
  description: string;
  department: Department;
  status: AgentStatus;
  aiExpert: CrewMember;
  aiCrew: CrewMember[];
  agents: AgentEntry[];
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string;
  progress: number;
  plan: string;
  weeklyUpdates: WeeklyUpdate[];
  remarks: string;
  technologies: string[];
}

export function EditProjectDialog({
  agent,
  open,
  onOpenChange,
  onSave,
}: {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (id: string, updated: EditableFields) => void;
}) {
  const [form, setForm] = useState<EditableFields | null>(null);
  const [techInput, setTechInput] = useState("");

  useEffect(() => {
    if (!agent) return;
    const t = setTimeout(() => {
      setForm({
        name: agent.name,
        description: agent.description,
        department: agent.department,
        status: agent.status,
        aiExpert: { ...agent.aiExpert },
        aiCrew: agent.aiCrew.map((m) => ({ ...m })),
        agents: ((agent as Agent & { agents?: Partial<AgentEntry>[] }).agents || []).map((a) => ({
          name: a.name || "",
          description: a.description || "",
          technologies: a.technologies || [],
        })),
        startDate: agent.startDate,
        plannedEndDate: agent.plannedEndDate,
        actualEndDate: agent.actualEndDate || "",
        progress: agent.progress ?? 0,
        plan: agent.plan,
        weeklyUpdates: agent.weeklyUpdates ?? [],
        remarks: agent.remarks,
        technologies: [...agent.technologies],
      });
    }, 0);
    return () => clearTimeout(t);
  }, [agent]);

  if (!agent || !form) return null;

  function update<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateExpert(field: keyof CrewMember, value: string) {
    setForm((prev) =>
      prev ? { ...prev, aiExpert: { ...prev.aiExpert, [field]: value } } : prev
    );
  }

  function updateCrewMember(idx: number, field: keyof CrewMember, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const newCrew = [...prev.aiCrew];
      newCrew[idx] = { ...newCrew[idx], [field]: value };
      return { ...prev, aiCrew: newCrew };
    });
  }

  function addCrewMember() {
    setForm((prev) =>
      prev
        ? { ...prev, aiCrew: [...prev.aiCrew, { name: "", role: "" }] }
        : prev
    );
  }

  function removeCrewMember(idx: number) {
    setForm((prev) =>
      prev
        ? { ...prev, aiCrew: prev.aiCrew.filter((_, i) => i !== idx) }
        : prev
    );
  }

  function updateWeekly(idx: number, field: keyof WeeklyUpdate, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const newUpdates = [...prev.weeklyUpdates];
      newUpdates[idx] = { ...newUpdates[idx], [field]: value };
      return { ...prev, weeklyUpdates: newUpdates };
    });
  }

  function addWeekly() {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            weeklyUpdates: [
              ...prev.weeklyUpdates,
              { week: `Week ${prev.weeklyUpdates.length + 1}`, tasks: "", status: "pending" },
            ],
          }
        : prev
    );
  }

  function removeWeekly(idx: number) {
    setForm((prev) =>
      prev
        ? { ...prev, weeklyUpdates: prev.weeklyUpdates.filter((_, i) => i !== idx) }
        : prev
    );
  }

  function updateAgentEntry(idx: number, field: keyof AgentEntry, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = [...prev.agents];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, agents: next };
    });
  }
  function addAgentEntry() {
    setForm((prev) => prev ? { ...prev, agents: [...prev.agents, { name: "", description: "", technologies: [] }] } : prev);
  }
  function addAgentTech(idx: number, tech: string) {
    const t = tech.trim();
    if (!t) return;
    setForm((prev) => {
      if (!prev) return prev;
      const next = [...prev.agents];
      if (!next[idx].technologies.includes(t)) {
        next[idx] = { ...next[idx], technologies: [...next[idx].technologies, t] };
      }
      return { ...prev, agents: next };
    });
  }
  function removeAgentTech(idx: number, tech: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = [...prev.agents];
      next[idx] = { ...next[idx], technologies: next[idx].technologies.filter((x) => x !== tech) };
      return { ...prev, agents: next };
    });
  }
  function removeAgentEntry(idx: number) {
    setForm((prev) => prev ? { ...prev, agents: prev.agents.filter((_, i) => i !== idx) } : prev);
  }

  function addTechnology() {
    const val = techInput.trim();
    if (!val || !form) return;
    if (form.technologies.includes(val)) {
      setTechInput("");
      return;
    }
    update("technologies", [...form.technologies, val]);
    setTechInput("");
  }

  function removeTechnology(tech: string) {
    if (!form) return;
    update(
      "technologies",
      form.technologies.filter((t) => t !== tech)
    );
  }

  function handleSave() {
    if (!form || !agent) return;
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!form.aiExpert.name.trim()) {
      toast.error("AI Expert name is required");
      return;
    }
    const invalidCrew = form.aiCrew.some((m) => !m.name.trim() || !m.role.trim());
    if (invalidCrew) {
      toast.error("All crew members need a name and role");
      return;
    }
    onSave(agent.id, form);
    toast.success("Project updated", { description: `${form.name} saved.` });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="glass-strong sm:max-w-3xl border-border/30 max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="sticky top-0 z-10 glass-strong p-5 border-b border-border/30 flex-row items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <Pencil className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base">Edit Project</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{agent.id}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* ─── Basic Info ─── */}
          <Section icon={FileText} title="Basic Information">
            <div className="space-y-3">
              <Field label="Project Name">
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={2}
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                />
              </Field>
              <Field label="Department" icon={Building2}>
                <Select
                  value={form.department}
                  onValueChange={(v) => v && update("department", v as Department)}
                >
                  <SelectTrigger className="w-full bg-background/40 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/30">
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onValueChange={(v) => v && update("status", v as AgentStatus)}
                >
                  <SelectTrigger className="w-full bg-background/40 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/30">
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          {/* ─── Progress ─── */}
          <Section icon={Target} title="Progress">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => update("progress", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60 w-24 tabular-nums"
              />
              <div className="flex-1">
                <div className="h-1.5 w-full bg-accent/50 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      form.progress === 100 ? "bg-emerald-400" :
                      form.progress >= 80 ? "bg-purple-400" :
                      form.progress >= 50 ? "bg-sky-400" :
                      "bg-amber-400"
                    )}
                    style={{ width: `${form.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums w-12 text-right">{form.progress}%</span>
            </div>
          </Section>

          {/* ─── Timeline ─── */}
          <Section icon={CalendarDays} title="Timeline">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Start Date" icon={CalendarDays}>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                />
              </Field>
              <Field label="Planned End" icon={Target}>
                <Input
                  type="date"
                  value={form.plannedEndDate}
                  onChange={(e) => update("plannedEndDate", e.target.value)}
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                />
              </Field>
              <Field label="Actual End" icon={CheckCircle2} hint="(leave empty if ongoing)">
                <Input
                  type="date"
                  value={form.actualEndDate}
                  onChange={(e) => update("actualEndDate", e.target.value)}
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                />
              </Field>
            </div>
          </Section>

          {/* ─── Plan & Weekly Progress ─── */}
          <Section 
            icon={Target} 
            title="Weekly Progress"
            trailing={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addWeekly}
                className="h-7 gap-1.5 text-xs border-border/50"
              >
                <Plus className="h-3 w-3" /> Add Week
              </Button>
            }
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">High-Level Plan</Label>
                <Textarea
                  value={form.plan}
                  onChange={(e) => update("plan", e.target.value)}
                  rows={2}
                  placeholder="Milestones, phases, deliverables..."
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60 font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {form.weeklyUpdates.map((wu, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass rounded-xl p-3 space-y-2"
                    >
                      <div className="flex gap-2">
                        <Input
                          value={wu.week}
                          onChange={(e) => updateWeekly(i, "week", e.target.value)}
                          placeholder="e.g. Week 1"
                          className="bg-background/40 border-border/50 h-8 text-xs flex-shrink-0 w-24"
                        />
                        <Input
                          value={wu.tasks}
                          onChange={(e) => updateWeekly(i, "tasks", e.target.value)}
                          placeholder="What will be done this week?"
                          className="bg-background/40 border-border/50 h-8 text-xs flex-1"
                        />
                        <Select
                          value={wu.status}
                          onValueChange={(v) => updateWeekly(i, "status", v as any)}
                        >
                          <SelectTrigger className="bg-background/40 border-border/50 h-8 text-xs w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-strong border-border/30">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => removeWeekly(i)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {form.weeklyUpdates.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    No weekly tasks added.
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* ─── AI Expert ─── */}
          <Section icon={Crown} title="AI Expert" accent="text-amber-400">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name">
                <Input
                  value={form.aiExpert.name}
                  onChange={(e) => updateExpert("name", e.target.value)}
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                />
              </Field>
              <Field label="Role">
                <Input
                  value={form.aiExpert.role}
                  onChange={(e) => updateExpert("role", e.target.value)}
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                />
              </Field>
            </div>
          </Section>

          {/* ─── AI Crew ─── */}
          <Section
            icon={Users}
            title="AI Crew"
            trailing={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCrewMember}
                className="h-7 gap-1.5 text-xs border-border/50"
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            }
          >
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {form.aiCrew.map((m, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={m.name}
                      onChange={(e) => updateCrewMember(i, "name", e.target.value)}
                      placeholder="Name"
                      className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60 flex-1"
                    />
                    <Input
                      value={m.role}
                      onChange={(e) => updateCrewMember(i, "role", e.target.value)}
                      placeholder="Role"
                      className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeCrewMember(i)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {form.aiCrew.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-3">
                  No crew members yet. Click Add to get started.
                </p>
              )}
            </div>
          </Section>

          {/* ─── Agents used ─── */}
          <Section
            icon={Bot}
            title="Agents Used"
            trailing={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addAgentEntry}
                className="h-7 gap-1.5 text-xs border-border/50"
              >
                <Plus className="h-3 w-3" /> Add Agent
              </Button>
            }
          >
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {form.agents.map((a, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="glass rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={a.name}
                        onChange={(e) => updateAgentEntry(i, "name", e.target.value)}
                        placeholder="Agent name (e.g. LangChain Agent)"
                        className="bg-background/40 border-border/50 h-8 text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeAgentEntry(i)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Textarea
                      value={a.description}
                      onChange={(e) => updateAgentEntry(i, "description", e.target.value)}
                      placeholder="Agent description / role..."
                      rows={2}
                      className="bg-background/40 border-border/50 text-xs"
                    />
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Wrench className="h-2.5 w-2.5" /> Technologies
                      </Label>
                      <Input
                        placeholder="Type tech and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const input = e.currentTarget;
                            addAgentTech(i, input.value);
                            input.value = "";
                          }
                        }}
                        className="bg-background/40 border-border/50 h-7 text-xs"
                      />
                      {a.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {a.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center gap-1 rounded-md bg-accent/50 border border-border/40 px-1.5 py-0.5 text-[10px]"
                            >
                              <Wrench className="h-2 w-2 text-primary" />
                              {tech}
                              <button
                                type="button"
                                onClick={() => removeAgentTech(i, tech)}
                                className="ml-0.5 text-muted-foreground/60 hover:text-rose-400 transition-colors"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {form.agents.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-3">
                  No agents added. Click Add Agent to start.
                </p>
              )}
            </div>
          </Section>

          {/* ─── Technologies ─── */}
          <Section icon={Wrench} title="Technologies">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTechnology();
                    }
                  }}
                  placeholder="e.g. PostgreSQL, then press Enter"
                  className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTechnology}
                  className="gap-1.5 border-border/50 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {form.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <AnimatePresence initial={false}>
                    {form.technologies.map((tech) => (
                      <motion.span
                        key={tech}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1 rounded-lg bg-accent/50 border border-border/40 px-2 py-1 text-[11px]"
                      >
                        <Wrench className="h-2.5 w-2.5 text-primary" />
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTechnology(tech)}
                          className="ml-0.5 text-muted-foreground/60 hover:text-rose-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Section>

          {/* ─── Remarks ─── */}
          <Section icon={AlertTriangle} title="Remarks" accent="text-amber-400">
            <Textarea
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
              rows={4}
              placeholder="Difficulties, blockers, important notes..."
              className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60 text-xs"
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 glass-strong p-4 border-t border-border/30 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border/50"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  accent,
  trailing,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", accent ?? "text-primary")} />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  hint,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
        {hint && <span className="text-muted-foreground/50 normal-case tracking-normal lowercase">{hint}</span>}
      </Label>
      <div className="neon-ring rounded-lg">{children}</div>
    </div>
  );
}
