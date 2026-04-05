"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  User,
  Settings as SettingsIcon,
  Loader2,
  CheckCircle2,
  Save,
  Eye,
  EyeOff,
  Server,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import { useSyncExternalStore, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { cn } from "@/lib/utils";

const settingSections = [
  { id: "database", label: "Database", icon: Database },
  { id: "profile", label: "Profile", icon: User },
  { id: "general", label: "General", icon: SettingsIcon },
] as const;

type Section = (typeof settingSections)[number]["id"];

const KEY = "ax-theme";
function subscribeTheme(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("ax-theme-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("ax-theme-change", cb);
  };
}
function getThemeSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(KEY);
  return stored ? stored === "dark" : true;
}
function getServerThemeSnapshot(): boolean {
  return true;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("database");
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);

  const [form, setForm] = useState({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "",
    database: "",
  });

  const isDark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme(checked: boolean) {
    localStorage.setItem(KEY, checked ? "dark" : "light");
    window.dispatchEvent(new Event("ax-theme-change"));
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTestSuccess(false);
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

  // Load config hiện tại từ BE khi mount
  useEffect(() => {
    fetch(`${API_BASE}/api/config/db`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setForm({
            host: d.host || "localhost",
            port: String(d.port || 3306),
            user: d.username || "root",
            password: d.password || "",
            database: d.db_name || "",
          });
        }
      })
      .catch(() => {
        /* BE chưa sẵn sàng, bỏ qua */
      });
  }, [API_BASE]);

  async function handleTestConnection() {
    setTesting(true);
    setTestSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/config/db/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: form.host,
          port: Number(form.port),
          username: form.user,
          password: form.password,
          db_name: form.database,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestSuccess(true);
        toast.success("Connection successful", {
          description: `Connected to ${form.database}@${form.host}:${form.port}`,
        });
      } else {
        toast.error("Connection failed", { description: json.message });
      }
    } catch (e: unknown) {
      toast.error("Connection failed", {
        description: e instanceof Error ? e.message : "Cannot reach backend",
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!form.host || !form.database) {
      toast.error("Save failed", {
        description: "Host and Database Name are required.",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/config/db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: form.host,
          port: Number(form.port),
          username: form.user,
          password: form.password,
          db_name: form.database,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Settings saved", {
          description: autoGenerate
            ? "Config saved. Tables auto-generated."
            : json.message || "Database configuration saved.",
        });
      } else {
        toast.error("Save failed", { description: json.message });
      }
    } catch (e: unknown) {
      toast.error("Save failed", {
        description: e instanceof Error ? e.message : "Cannot reach backend",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace preferences and integrations.
        </p>
      </div>

      <div className="flex gap-6 min-h-[600px]">
        {/* Settings Sidebar */}
        <nav className="glass w-48 shrink-0 rounded-2xl p-3 flex flex-col gap-1">
          {settingSections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="settings-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <section.icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{section.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="glass flex-1 rounded-2xl p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeSection === "database" && (
              <motion.div
                key="database"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Connect to MySQL</h2>
                    <p className="text-sm text-muted-foreground">
                      Configure your database connection for AI project data.
                    </p>
                  </div>
                </div>

                <Separator className="mb-6 bg-border/50" />

                <div className="grid gap-5 max-w-lg">
                  {/* Host + Port */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="host" className="text-sm text-muted-foreground">
                        Host
                      </Label>
                      <div className="neon-ring rounded-lg">
                        <Input
                          id="host"
                          value={form.host}
                          onChange={(e) => updateField("host", e.target.value)}
                          placeholder="localhost"
                          className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port" className="text-sm text-muted-foreground">
                        Port
                      </Label>
                      <div className="neon-ring rounded-lg">
                        <Input
                          id="port"
                          value={form.port}
                          onChange={(e) => updateField("port", e.target.value)}
                          placeholder="3306"
                          className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* User */}
                  <div className="space-y-2">
                    <Label htmlFor="user" className="text-sm text-muted-foreground">
                      Username
                    </Label>
                    <div className="neon-ring rounded-lg">
                      <Input
                        id="user"
                        value={form.user}
                        onChange={(e) => updateField("user", e.target.value)}
                        placeholder="root"
                        className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-muted-foreground">
                      Password
                    </Label>
                    <div className="neon-ring rounded-lg relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="••••••••"
                        className="bg-background/40 border-border/50 pr-10 focus-visible:ring-0 focus-visible:border-primary/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Database Name */}
                  <div className="space-y-2">
                    <Label htmlFor="database" className="text-sm text-muted-foreground">
                      Database Name
                    </Label>
                    <div className="neon-ring rounded-lg">
                      <Input
                        id="database"
                        value={form.database}
                        onChange={(e) => updateField("database", e.target.value)}
                        placeholder="ax_project_db"
                        className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                      />
                    </div>
                  </div>

                  <Separator className="my-1 bg-border/50" />

                  {/* Auto-generate Toggle */}
                  <div className="flex items-center justify-between rounded-xl bg-accent/30 px-4 py-3">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="auto-gen"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Auto-generate Tables
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically create AI schema tables on first run.
                      </p>
                    </div>
                    <Switch
                      id="auto-gen"
                      checked={autoGenerate}
                      onCheckedChange={setAutoGenerate}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="gap-2 border-border/50 hover:bg-accent/50"
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : testSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Database className="h-4 w-4" />
                      )}
                      {testing
                        ? "Testing..."
                        : testSuccess
                          ? "Connected"
                          : "Test Connection"}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-2 bg-primary hover:bg-primary/90"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/15">
                    <User className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Profile</h2>
                    <p className="text-sm text-muted-foreground">
                      Your workspace identity and preferences.
                    </p>
                  </div>
                </div>
                <Separator className="mb-6 bg-border/50" />
                <div className="grid gap-5 max-w-lg">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Display Name</Label>
                    <div className="neon-ring rounded-lg">
                      <Input
                        defaultValue="AX Admin"
                        className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <div className="neon-ring rounded-lg">
                      <Input
                        defaultValue="admin@ax-project.local"
                        className="bg-background/40 border-border/50 focus-visible:ring-0 focus-visible:border-primary/60"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <div className="neon-ring rounded-lg">
                      <Input
                        defaultValue="Project Lead"
                        disabled
                        className="bg-background/40 border-border/50 opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/15">
                    <SettingsIcon className="h-5 w-5 text-chart-3" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">General</h2>
                    <p className="text-sm text-muted-foreground">
                      Global application settings.
                    </p>
                  </div>
                </div>
                <Separator className="mb-6 bg-border/50" />
                <div className="grid gap-4 max-w-lg">
                  <div className="flex items-center justify-between rounded-xl bg-accent/30 px-4 py-3">
                    <div className="flex gap-3 items-center">
                      <div className="p-2 bg-accent rounded-lg text-primary">
                        <Moon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Dark Mode</p>
                        <p className="text-xs text-muted-foreground">
                          Toggle application theme appearance.
                        </p>
                      </div>
                    </div>
                    <Switch checked={isDark} onCheckedChange={toggleTheme} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-accent/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Receive alerts when agents finish tasks.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-accent/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Telemetry</p>
                      <p className="text-xs text-muted-foreground">
                        Send anonymous usage data to improve AX.
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-accent/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Auto-save Reports</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically export reports to disk.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}
