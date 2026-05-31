"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale,
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  ClipboardList,
  CalendarDays,
  FolderKanban,
  FilePlus2,
  Briefcase,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button, PoweredByCoreLogic } from "@sanson/ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { signOut } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import type { UserRole } from "@sanson/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  CLIENT: [
    { label: "Dashboard", href: "/dashboard/client", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "AI Legal Assistant", href: "/dashboard/client/ai-assistant", icon: <Sparkles className="h-4 w-4" /> },
    { label: "My Requests", href: "/dashboard/client/requests", icon: <FilePlus2 className="h-4 w-4" /> },
    { label: "Request Representation", href: "/dashboard/client/request-representation", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Appointment History", href: "/dashboard/client/appointments", icon: <CalendarDays className="h-4 w-4" /> },
    { label: "My Cases", href: "/dashboard/client/cases", icon: <FolderKanban className="h-4 w-4" /> },
  ],
  LAWYER: [
    { label: "Dashboard", href: "/dashboard/lawyer", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Assigned Requests", href: "/dashboard/lawyer/requests", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Consultation Queue", href: "/dashboard/lawyer/consultations", icon: <CalendarDays className="h-4 w-4" /> },
    { label: "Active Cases", href: "/dashboard/lawyer/cases", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Tasks", href: "/dashboard/lawyer/tasks", icon: <ListTodo className="h-4 w-4" /> },
  ],
  PARALEGAL: [
    { label: "Dashboard", href: "/dashboard/paralegal", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Assigned Cases", href: "/dashboard/paralegal/cases", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Tasks", href: "/dashboard/paralegal/tasks", icon: <ListTodo className="h-4 w-4" /> },
    { label: "Coordination", href: "/dashboard/paralegal/coordination", icon: <Users className="h-4 w-4" /> },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Requests Management", href: "/dashboard/admin/requests", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Appointments", href: "/dashboard/admin/appointments", icon: <CalendarDays className="h-4 w-4" /> },
    { label: "Case Monitoring", href: "/dashboard/admin/cases", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Users", href: "/dashboard/admin/users", icon: <Users className="h-4 w-4" /> },
    { label: "Roles", href: "/dashboard/admin/roles", icon: <Shield className="h-4 w-4" /> },
    { label: "Settings", href: "/dashboard/admin/settings", icon: <Settings className="h-4 w-4" /> },
  ],
};

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardShell({ children, title, breadcrumbs }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, getRole, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const role = getRole();
  const navItems = role ? NAV_BY_ROLE[role] : [];

  const handleLogout = async () => {
    await logout();
    if (isFirebaseConfigured()) {
      await signOut(getFirebaseAuth());
    }
    window.location.href = "/login";
  };

  const displayName = user?.profile
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : user?.email ?? "User";

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-zinc-950/95 backdrop-blur-xl",
          "transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">SANSON Legal OS</p>
            <PoweredByCoreLogic />
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5 text-zinc-400" /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href ? "bg-pink-500/15 text-pink-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-zinc-950/80 px-4 backdrop-blur-xl sm:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-zinc-400" /></button>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-zinc-600" />}
                  {crumb.href ? <Link href={crumb.href} className="text-zinc-400 hover:text-white">{crumb.label}</Link> : <span className="text-white">{crumb.label}</span>}
                </span>
              ))}
            </nav>
          ) : title && <h1 className="text-lg font-semibold text-white">{title}</h1>}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-zinc-400" disabled title="Search (Phase 3)"><Search className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="text-zinc-400" disabled title="Notifications (Phase 3)"><Bell className="h-4 w-4" /></Button>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-bold text-pink-400">{displayName.charAt(0).toUpperCase()}</div>
                <span className="hidden text-sm text-zinc-300 sm:block">{displayName}</span>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-xl">
                    <p className="px-3 py-2 text-sm font-medium text-white">{displayName}</p>
                    <p className="px-3 pb-2 text-xs text-zinc-400">{user?.email}</p>
                    <p className="px-3 pb-2 text-xs text-pink-400">{user?.role?.display_name}</p>
                    <hr className="border-white/10" />
                    <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

