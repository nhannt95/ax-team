"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Building2, Crown, Users } from "lucide-react";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type UserRecord, type Department } from "@/lib/mock/data";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const departments: Department[] = [
  "Engineering",
  "Data Science",
  "Product",
  "Marketing",
  "Operations",
  "Security",
];

const departmentColors: Record<Department, string> = {
  Engineering: "bg-primary/10 text-primary border-primary/20",
  "Data Science": "bg-chart-2/10 text-chart-2 border-chart-2/20",
  Product: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  Marketing: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  Operations: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Security: "bg-chart-5/10 text-chart-5 border-chart-5/20",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(data.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        department: (u.department || "Engineering") as Department,
        group: u.group || "",
        team: u.team || "",
        type: u.type || "AI Crew",
      })));
    } catch (e: unknown) {
      toast.error("Load failed", { description: e instanceof Error ? e.message : "Cannot load users" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const [form, setForm] = useState<UserRecord>({
    id: "",
    fullName: "",
    department: "Engineering",
    group: "",
    team: "",
    type: "AI Crew",
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.team.toLowerCase().includes(q)
    );
  });

  function openAddModal() {
    setEditingUser(null);
    setForm({
      id: `KNOX-${Math.floor(100 + Math.random() * 900)}`,
      fullName: "",
      department: "Engineering",
      group: "",
      team: "",
      type: "AI Crew",
    });
    setIsModalOpen(true);
  }

  function openEditModal(user: UserRecord) {
    setEditingUser(user);
    setForm({ ...user });
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await usersApi.remove(id);
      toast.success("User deleted", { description: `User ${id} removed.` });
      await reload();
    } catch (e: unknown) {
      toast.error("Delete failed", { description: e instanceof Error ? e.message : "Cannot delete user" });
    }
  }

  async function handleSave() {
    if (!form.id || !form.fullName || !form.group || !form.team) {
      toast.error("Validation Error", { description: "Please fill in all details." });
      return;
    }
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, form);
        toast.success("User updated", { description: `${form.fullName} has been updated.` });
      } else {
        await usersApi.create(form);
        toast.success("User added", { description: `${form.fullName} has been added.` });
      }
      setIsModalOpen(false);
      await reload();
    } catch (e: unknown) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "Cannot save user" });
    }
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your AI Experts and AI Crew members.
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Toolbar */}
      <div className="glass rounded-2xl p-3 mb-6">
        <div className="neon-ring rounded-lg relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, team..."
            className="bg-background/30 border-border/40 pl-9 focus-visible:ring-0 focus-visible:border-primary/60"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-accent/20">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-semibold px-5">Knox ID</TableHead>
                <TableHead className="font-semibold">Full Name</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Group & Team</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="text-right px-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id} className="border-border/30 hover:bg-accent/30 transition-colors">
                    <TableCell className="font-mono text-xs px-5">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", departmentColors[user.department])}>
                        <Building2 className="h-2.5 w-2.5 mr-1.5" />
                        {user.department}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.team}</span>
                        <span className="text-xs text-muted-foreground">{user.group}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.type === "AI Expert" ? (
                        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                          <Crown className="h-3.5 w-3.5" /> Expert
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                          <Users className="h-3.5 w-3.5" /> Crew
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(user)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-strong sm:max-w-md border-border/30">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id" className="text-right text-xs">
                Knox ID
              </Label>
              <div className="col-span-3 neon-ring rounded-lg">
                <Input
                  id="id"
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  disabled={!!editingUser}
                  className="bg-background/40 border-border/50 font-mono disabled:opacity-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-xs">
                Full Name
              </Label>
              <div className="col-span-3 neon-ring rounded-lg">
                <Input
                  id="name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="bg-background/40 border-border/50"
                  autoFocus
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dept" className="text-right text-xs">
                Department
              </Label>
              <div className="col-span-3">
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v as Department })}>
                  <SelectTrigger className="w-full bg-background/40 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/30">
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right text-xs">
                Group
              </Label>
              <div className="col-span-3 neon-ring rounded-lg">
                <Input
                  id="group"
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  className="bg-background/40 border-border/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team" className="text-right text-xs">
                Team
              </Label>
              <div className="col-span-3 neon-ring rounded-lg">
                <Input
                  id="team"
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                  className="bg-background/40 border-border/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right text-xs">
                Type
              </Label>
              <div className="col-span-3">
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                  <SelectTrigger className="w-full bg-background/40 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/30">
                    <SelectItem value="AI Expert">AI Expert</SelectItem>
                    <SelectItem value="AI Crew">AI Crew</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-border/50">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
