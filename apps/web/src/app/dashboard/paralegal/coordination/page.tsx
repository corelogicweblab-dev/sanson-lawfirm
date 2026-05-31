"use client";
import { PageContainer, SectionHeader, EmptyState } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function CoordinationPage(){ return <AuthGuard allowedRoles={["PARALEGAL"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/paralegal"},{label:"Coordination Dashboard"}]}><PageContainer><SectionHeader title="Coordination Dashboard" description="Internal coordination board for paralegal workflow" /><EmptyState title="Coordination tools" description="Coordination board enhancements are planned within Phase 2 iterations." /></PageContainer></DashboardShell></AuthGuard>; }

