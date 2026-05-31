"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { LegalRequest } from "@sanson/types";

export default function ClientRequestsPage() {
  const [items, setItems] = useState<LegalRequest[]>([]);
  useEffect(() => { api.listMyRequests().then((r)=>{ if(r.success && r.data) setItems(r.data); }); }, []);
  return <AuthGuard allowedRoles={["CLIENT"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/client"},{label:"My Requests"}]}><PageContainer><SectionHeader title="My Requests" description="Representation requests you submitted" />{items.length===0?<EmptyState title="No requests" description="Submit a request to get started."/>:<Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Subject</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead></TableRow></TableHeader><TableBody>{items.map((r)=><TableRow key={r.id}><TableCell>{r.request_reference}</TableCell><TableCell>{r.subject}</TableCell><TableCell>{r.case_category}</TableCell><TableCell><Badge>{r.status}</Badge></TableCell><TableCell>{r.priority}</TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>;
}

