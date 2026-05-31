"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { CaseItem } from "@sanson/types";

export default function AdminCasesPage(){ const [items,setItems]=useState<CaseItem[]>([]); useEffect(()=>{api.listCases().then(r=>{if(r.success&&r.data)setItems(r.data);});},[]); return <AuthGuard allowedRoles={["ADMIN"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/admin"},{label:"Case Monitoring"}]}><PageContainer><SectionHeader title="Case Monitoring" description="Read-only platform view. System administrators do not create or edit legal records." />{items.length===0?<EmptyState title="No cases" description="No cases have been opened yet."/>:<Table><TableHeader><TableRow><TableHead>Case #</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead></TableRow></TableHeader><TableBody>{items.map(c=><TableRow key={c.id}><TableCell>{c.case_number}</TableCell><TableCell>{c.title}</TableCell><TableCell><Badge>{c.status?.display_name ?? "-"}</Badge></TableCell><TableCell>{c.priority}</TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>; }

