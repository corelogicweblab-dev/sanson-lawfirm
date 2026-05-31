"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale,
  LayoutDashboard,
  Users,
  Shield,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
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
  FileText,
  BookOpen,
  Activity,
  ScrollText,
  Lock,
  Monitor,
  SlidersHorizontal,
  Rocket,
  FolderInput,
  FolderPlus,
  Server,
  Bot,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button, PoweredByCoreLogic } from "@sanson/ui";
import { SearchModal } from "@/components/search/global-search";
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
    { label: "Dashboard", href: "/dashboard/client", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
    { label: "AI Assistant", href: "/dashboard/client/ai-assistant", icon: <Sparkles className="h-4 w-4 shrink-0" /> },
    { label: "My Requests", href: "/dashboard/client/requests", icon: <FilePlus2 className="h-4 w-4 shrink-0" /> },
    { label: "Representation", href: "/dashboard/client/request-representation", icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
    { label: "Appointments", href: "/dashboard/client/appointments", icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
    { label: "My Cases", href: "/dashboard/client/cases", icon: <FolderKanban className="h-4 w-4 shrink-0" /> },
    { label: "Documents", href: "/dashboard/client/documents", icon: <FileText className="h-4 w-4 shrink-0" /> },
  ],
  LAWYER: [
    { label: "Review Hub", href: "/dashboard/lawyer", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
    { label: "Approvals", href: "/dashboard/lawyer/approvals", icon: <Scale className="h-4 w-4 shrink-0" /> },
    { label: "My Cases", href: "/dashboard/lawyer/cases", icon: <Briefcase className="h-4 w-4 shrink-0" /> },
    { label: "Consultations", href: "/dashboard/lawyer/consultations", icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
    { label: "Review Documents", href: "/dashboard/lawyer/documents", icon: <FileText className="h-4 w-4 shrink-0" /> },
    { label: "Legal Notes", href: "/dashboard/lawyer/tasks", icon: <ListTodo className="h-4 w-4 shrink-0" /> },
    { label: "Search", href: "/dashboard/lawyer/search", icon: <Search className="h-4 w-4 shrink-0" /> },
    { label: "Knowledge", href: "/dashboard/lawyer/knowledge", icon: <BookOpen className="h-4 w-4 shrink-0" /> },
  ],
  PARALEGAL: [
    { label: "Operations", href: "/dashboard/paralegal", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
    { label: "Intake Queue", href: "/dashboard/paralegal/intake", icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
    { label: "Case Repository", href: "/dashboard/paralegal/cases", icon: <Briefcase className="h-4 w-4 shrink-0" /> },
    { label: "New Case", href: "/dashboard/paralegal/cases/new", icon: <FolderPlus className="h-4 w-4 shrink-0" /> },
    { label: "Documents & Files", href: "/dashboard/paralegal/documents", icon: <FileText className="h-4 w-4 shrink-0" /> },
    { label: "Calendar", href: "/dashboard/paralegal/calendar", icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
    { label: "Legacy Migration", href: "/dashboard/paralegal/migration-center", icon: <FolderInput className="h-4 w-4 shrink-0" /> },
    { label: "Tasks", href: "/dashboard/paralegal/tasks", icon: <ListTodo className="h-4 w-4 shrink-0" /> },
    { label: "Search", href: "/dashboard/lawyer/search", icon: <Search className="h-4 w-4 shrink-0" /> },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
    { label: "Requests", href: "/dashboard/admin/requests", icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
    { label: "Appointments", href: "/dashboard/admin/appointments", icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
    { label: "Cases", href: "/dashboard/admin/cases", icon: <Briefcase className="h-4 w-4 shrink-0" /> },
    { label: "Case Migration", href: "/dashboard/paralegal/migration-center", icon: <FolderInput className="h-4 w-4 shrink-0" /> },
    { label: "Documents", href: "/dashboard/paralegal/documents", icon: <FileText className="h-4 w-4 shrink-0" /> },
    { label: "Users", href: "/dashboard/admin/users", icon: <Users className="h-4 w-4 shrink-0" /> },
    { label: "Roles", href: "/dashboard/admin/roles", icon: <Shield className="h-4 w-4 shrink-0" /> },
    { label: "System Health", href: "/dashboard/admin/system-health", icon: <Activity className="h-4 w-4 shrink-0" /> },
    { label: "Operations", href: "/dashboard/admin/operations", icon: <Server className="h-4 w-4 shrink-0" /> },
    { label: "Deployment", href: "/dashboard/admin/deployment", icon: <Rocket className="h-4 w-4 shrink-0" /> },
    { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: <ScrollText className="h-4 w-4 shrink-0" /> },
    { label: "Security", href: "/dashboard/admin/security", icon: <Lock className="h-4 w-4 shrink-0" /> },
    { label: "Sessions", href: "/dashboard/admin/sessions", icon: <Monitor className="h-4 w-4 shrink-0" /> },
    { label: "Control Center", href: "/dashboard/admin/control-center", icon: <SlidersHorizontal className="h-4 w-4 shrink-0" /> },
    { label: "AI Operations", href: "/dashboard/admin/ai-operations", icon: <Bot className="h-4 w-4 shrink-0" /> },
    { label: "Search Analytics", href: "/dashboard/admin/search-analytics", icon: <Search className="h-4 w-4 shrink-0" /> },
    { label: "Knowledge", href: "/dashboard/lawyer/knowledge", icon: <BookOpen className="h-4 w-4 shrink-0" /> },
  ],
};

const SEARCH_ENABLED_ROLES: UserRole[] = ["LAWYER", "PARALEGAL", "ADMIN"];

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardShell({ children, title, breadcrumbs }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, getRole, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const role = getRole();
  const searchEnabled = role ? SEARCH_ENABLED_ROLES.includes(role) : false;
  const navItems = role ? NAV_BY_ROLE[role] : [];

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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

  const headerTitle =
    breadcrumbs?.length ? breadcrumbs[breadcrumbs.length - 1].label : title;

  return (
    <div className="flex min-h-screen min-h-[100dvh] overflow-x-hidden bg-transparent">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "sanson-glass-sidebar fixed inset-y-0 left-0 z-50 flex flex-col safe-top",
          "w-[min(18rem,85vw)] transition-[transform,width] duration-200 ease-out",
          "lg:static lg:z-auto lg:translate-x-0",
          sidebarCollapsed ? "lg:w-[4.5rem]" : "lg:w-64 xl:w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-3 sm:h-16 sm:px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden transition-opacity duration-200",
              sidebarCollapsed && "lg:pointer-events-none lg:opacity-0"
            )}
          >
            <p className="truncate text-sm font-bold text-white">SANSON Legal OS</p>
            <PoweredByCoreLogic />
          </div>
          <button
            type="button"
            className="hidden shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white lg:flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((c) => !c)}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2 sm:p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl py-2 text-sm font-medium transition-colors duration-200",
                sidebarCollapsed ? "justify-center px-2 lg:px-2" : "px-3",
                pathname === item.href
                  ? "border border-pink-500/35 bg-pink-500/20 text-white shadow-sm shadow-pink-500/15"
                  : "text-zinc-300 hover:border hover:border-white/10 hover:bg-black/30 hover:text-white"
              )}
            >
              {item.icon}
              <span
                className={cn(
                  "truncate transition-opacity duration-200",
                  sidebarCollapsed && "lg:hidden"
                )}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/10 p-3 safe-bottom sm:p-4">
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl py-2.5 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-white",
              sidebarCollapsed ? "justify-center px-2 lg:px-2" : "px-3"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(sidebarCollapsed && "lg:hidden")}>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sanson-glass-header safe-top sticky top-0 z-30 mx-2 mt-2 flex h-14 shrink-0 items-center gap-2 rounded-2xl px-3 sm:mx-3 sm:h-16 sm:gap-3 sm:px-4 lg:px-6">
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 lg:hidden"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-zinc-400" />
          </button>

          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden text-xs sm:text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-0.5">
                  {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-zinc-600" />}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="truncate text-zinc-400 hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-white">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : (
            headerTitle && (
              <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-white sm:text-lg">
                {headerTitle}
              </h1>
            )
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-400 sm:h-10 sm:w-10"
              disabled={!searchEnabled}
              title={searchEnabled ? "Smart Search" : "Search unavailable"}
              onClick={() => searchEnabled && setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-9 w-9 text-zinc-400 sm:flex sm:h-10 sm:w-10"
              disabled
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-white/5 sm:px-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-bold text-pink-400">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden max-w-[8rem] truncate text-sm text-zinc-300 md:block">
                  {displayName}
                </span>
              </button>
              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="sanson-notification-enter sanson-glass absolute right-0 z-50 mt-2 w-[min(14rem,calc(100vw-2rem))] p-2 shadow-[var(--glow-pink)]">
                    <p className="truncate px-3 py-2 text-sm font-medium text-white">{displayName}</p>
                    <p className="truncate px-3 pb-2 text-xs text-zinc-400">{user?.email}</p>
                    <p className="px-3 pb-2 text-xs text-pink-400">{user?.role?.display_name}</p>
                    <hr className="border-white/10" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="sanson-dashboard-main sanson-dashboard-canvas min-w-0 flex-1 safe-bottom">
          {children}
        </main>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
