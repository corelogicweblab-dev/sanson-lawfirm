"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { CaseItem } from "@sanson/types";

export default function ParalegalCasesPage(){ const [items,setItems]=useState<CaseItem[]>([]); useEffect(()=>{api.listCases().then(r=>{if(r.success&&r.data)setItems(r.data);});},[]); return <AuthGuard allowedRoles={["PARALEGAL"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/paralegal"},{label:"Assigned Cases"}]}><PageContainer><SectionHeader title="Assigned Cases" description="Cases you are supporting" />{items.length===0?<EmptyState title="No assigned cases" description="Assignments will appear here."/>:<Table><TableHeader><TableRow><TableHead>Case #</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{items.map(c=><TableRow key={c.id}><TableCell>{c.case_number}</TableCell><TableCell>{c.title}</TableCell><TableCell><Badge>{c.status?.display_name ?? "-"}</Badge></TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>; }

