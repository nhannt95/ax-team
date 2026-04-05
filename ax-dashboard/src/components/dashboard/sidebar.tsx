"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Bot,
  ListTodo,
  Activity,
  BarChart3,
  Settings,
  Cpu,
  Users,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/home", icon: Home, label: "Home" },
  { href: "/dashboard/agents", icon: Bot, label: "Agents" },
  { href: "/dashboard/tasks", icon: ListTodo, label: "Tasks" },
  { href: "/dashboard/monitoring", icon: Activity, label: "Monitoring" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/users", icon: Users, label: "Users" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-strong fixed left-0 top-0 z-40 flex h-full w-[68px] flex-col items-center py-6 gap-2">
      {/* Logo */}
      <Link
        href="/dashboard/home"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 transition-transform hover:scale-105"
      >
        <Cpu className="h-5 w-5 text-primary" />
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={<Link href={item.href} />}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="relative z-10 h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
