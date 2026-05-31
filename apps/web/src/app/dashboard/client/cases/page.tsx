"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { CaseItem } from "@sanson/types";

export default function ClientCasesPage(){ const [items,setItems]=useState<CaseItem[]>([]); useEffect(()=>{api.listCases().then(r=>{if(r.success&&r.data)setItems(r.data);});},[]); return <AuthGuard allowedRoles={["CLIENT"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/client"},{label:"My Cases"}]}><PageContainer><SectionHeader title="My Cases" description="Official legal cases opened after consultation" />{items.length===0?<EmptyState title="No cases yet" description="Cases are opened after lawyer approval."/>:<Table><TableHeader><TableRow><TableHead>Case #</TableHead><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead></TableRow></TableHeader><TableBody>{items.map(c=><TableRow key={c.id}><TableCell>{c.case_number}</TableCell><TableCell>{c.title}</TableCell><TableCell>{c.case_category}</TableCell><TableCell><Badge>{c.status?.display_name ?? "-"}</Badge></TableCell><TableCell>{c.priority}</TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>; }

