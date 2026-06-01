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
  BarChart3,
  FileBarChart,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { loadProfilePhotoUrl } from "@/lib/profile-photo";
import { Button } from "@sanson/ui";
import { SearchModal } from "@/components/search/global-search";
import { PrintButton } from "@/components/print/print-button";
import { AppHeaderBrand } from "@/components/layout/app-header-brand";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { performLogoutAndRedirect } from "@/lib/logout";
import { formatUserDisplayName, getUserTitle } from "@sanson/shared";
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
    { label: "My Profile", href: "/dashboard/profile", icon: <UserRound className="h-4 w-4 shrink-0" /> },
  ],
  LAWYER: [
    { label: "Lawyer Dashboard", href: "/dashboard/lawyer", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
    { label: "My Cases", href: "/dashboard/lawyer/cases", icon: <Briefcase className="h-4 w-4 shrink-0" /> },
    { label: "Approvals", href: "/dashboard/lawyer/approvals", icon: <Scale className="h-4 w-4 shrink-0" /> },
    { label: "Documents", href: "/dashboard/lawyer/documents", icon: <FileText className="h-4 w-4 shrink-0" /> },
    { label: "Evidence", href: "/dashboard/lawyer/evidence", icon: <FolderKanban className="h-4 w-4 shrink-0" /> },
    { label: "Calendar", href: "/dashboard/lawyer/calendar", icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
    { label: "Appointments", href: "/dashboard/lawyer/appointments", icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
    { label: "AI Intelligence", href: "/dashboard/lawyer/ai-center", icon: <Sparkles className="h-4 w-4 shrink-0" /> },
    { label: "Tasks", href: "/dashboard/lawyer/tasks", icon: <ListTodo className="h-4 w-4 shrink-0" /> },
    { label: "Team", href: "/dashboard/lawyer/team", icon: <UsersRound className="h-4 w-4 shrink-0" /> },
    { label: "Clients", href: "/dashboard/lawyer/clients", icon: <UserRound className="h-4 w-4 shrink-0" /> },
    { label: "Analytics", href: "/dashboard/lawyer/analytics", icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
    { label: "Reports", href: "/dashboard/lawyer/reports", icon: <FileBarChart className="h-4 w-4 shrink-0" /> },
    { label: "Search", href: "/dashboard/lawyer/search", icon: <Search className="h-4 w-4 shrink-0" /> },
    { label: "Knowledge", href: "/dashboard/lawyer/knowledge", icon: <BookOpen className="h-4 w-4 shrink-0" /> },
    { label: "My Profile", href: "/dashboard/profile", icon: <UserRound className="h-4 w-4 shrink-0" /> },
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
    { label: "My Profile", href: "/dashboard/profile", icon: <UserRound className="h-4 w-4 shrink-0" /> },
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
    { label: "My Profile", href: "/dashboard/profile", icon: <UserRound className="h-4 w-4 shrink-0" /> },
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
  const { user, getRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerPhotoUrl, setHeaderPhotoUrl] = useState<string | null>(null);

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

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setProfileOpen(false);
    await performLogoutAndRedirect();
  };

  const roleHome = role
    ? NAV_BY_ROLE[role][0]?.href ?? "/dashboard"
    : "/dashboard";

  const displayName =
    user?.profile?.nickname?.trim() || formatUserDisplayName(user);
  const profileTitle = getUserTitle(user);

  useEffect(() => {
    if (!user?.id) {
      setHeaderPhotoUrl(null);
      return;
    }
    let cancelled = false;
    loadProfilePhotoUrl(user.id, user.profile).then((url) => {
      if (!cancelled) setHeaderPhotoUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.profile?.profile_photo, user?.profile?.updated_at]);

  const headerTitle =
    breadcrumbs?.length ? breadcrumbs[breadcrumbs.length - 1].label : title;

  useEffect(() => {
    const el = document.querySelector("[data-print-title]");
    if (el) el.textContent = headerTitle ?? title ?? "Dashboard";
  }, [headerTitle, title]);

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
          "sanson-glass-sidebar sanson-no-print fixed inset-y-0 left-0 z-50 flex flex-col safe-top",
          "w-[min(18rem,85vw)] transition-[transform,width] duration-200 ease-out",
          "lg:static lg:z-auto lg:translate-x-0",
          sidebarCollapsed ? "lg:w-[4.5rem]" : "lg:w-64 xl:w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-3 sm:h-16 sm:px-4">
          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden transition-opacity duration-200",
              sidebarCollapsed && "lg:pointer-events-none lg:opacity-0"
            )}
          >
            <AppHeaderBrand href={roleHome} />
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
                "sanson-sidebar-link flex items-center gap-2.5 rounded-xl border border-transparent py-2 text-sm font-medium",
                sidebarCollapsed ? "justify-center px-2 lg:px-2" : "px-3",
                pathname === item.href
                  ? "border-pink-400/55 bg-pink-900/25 text-white shadow-[0_0_28px_rgba(255,79,163,0.3)] backdrop-blur-md"
                  : "text-zinc-300"
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
            disabled={loggingOut}
            title="Sign out"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl py-2.5 text-sm text-zinc-400 transition-colors duration-200 hover:bg-red-500/15 hover:text-red-200 disabled:opacity-50",
              sidebarCollapsed ? "justify-center px-2 lg:px-2" : "px-3"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(sidebarCollapsed && "lg:hidden")}>
              {loggingOut ? "Signing out…" : "Sign Out"}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sanson-dashboard-topbar sanson-glass-header sanson-no-print safe-top sticky top-0 z-30 mx-2 mt-2 flex min-h-14 shrink-0 flex-wrap items-center gap-2 rounded-2xl px-3 py-2 sm:mx-3 sm:min-h-16 sm:gap-3 sm:px-4 lg:px-6">
          <button
            type="button"
            className="sanson-topbar-icon-btn shrink-0 rounded-xl p-2 lg:hidden"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex lg:hidden">
            <AppHeaderBrand href={roleHome} />
          </div>

          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav
              className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-xs sm:text-sm"
              aria-label="Breadcrumb"
            >
              {breadcrumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`} className="flex shrink-0 items-center gap-0.5">
                  {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-pink-400/60" />}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="max-w-[8rem] truncate rounded-md px-1 py-0.5 text-zinc-300 transition hover:bg-white/5 hover:text-white sm:max-w-[12rem]"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="max-w-[10rem] truncate font-semibold text-white sm:max-w-none">
                      {crumb.label}
                    </span>
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

          {role && (
            <span className="sanson-role-pill hidden shrink-0 rounded-full border border-pink-500/30 bg-pink-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pink-200 md:inline">
              {user?.role?.display_name ?? role}
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <PrintButton />
            <Button
              variant="ghost"
              size="icon"
              className="sanson-topbar-icon-btn h-9 w-9 sm:h-10 sm:w-10"
              disabled={!searchEnabled}
              title={searchEnabled ? "Smart Search" : "Search unavailable"}
              onClick={() => searchEnabled && setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sanson-topbar-icon-btn hidden h-9 w-9 sm:flex sm:h-10 sm:w-10"
              disabled
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="sanson-topbar-profile flex items-center gap-2 rounded-xl border border-transparent px-1.5 py-1 transition hover:border-pink-500/25 hover:bg-white/5 sm:px-2"
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-pink-600/40 to-pink-400/30 text-xs font-bold text-pink-100 ring-1 ring-pink-400/30">
                  {headerPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={headerPhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="hidden max-w-[7rem] truncate text-sm font-medium text-zinc-200 lg:block xl:max-w-[10rem]">
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
                    <p className="px-3 pb-2 text-xs text-pink-400">
                      {profileTitle ?? user?.role?.display_name}
                    </p>
                    <Link
                      href="/dashboard/profile"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserRound className="h-4 w-4" />
                      My Profile
                    </Link>
                    <hr className="border-white/10" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-red-500/15 hover:text-red-200 disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? "Signing out…" : "Sign Out"}
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
