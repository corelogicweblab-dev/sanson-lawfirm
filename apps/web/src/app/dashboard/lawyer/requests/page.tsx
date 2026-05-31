"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { LegalRequest } from "@sanson/types";

export default function LawyerRequestsPage(){ const [items,setItems]=useState<LegalRequest[]>([]); useEffect(()=>{api.listMyRequests().then(r=>{if(r.success&&r.data)setItems(r.data);});},[]); return <AuthGuard allowedRoles={["LAWYER"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/lawyer"},{label:"Assigned Requests"}]}><PageContainer><SectionHeader title="Assigned Requests" description="Legal requests for review and scheduling" />{items.length===0?<EmptyState title="No requests" description="No requests currently assigned."/>:<Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead></TableRow></TableHeader><TableBody>{items.map(r=><TableRow key={r.id}><TableCell>{r.request_reference}</TableCell><TableCell>{r.subject}</TableCell><TableCell><Badge>{r.status}</Badge></TableCell><TableCell>{r.priority}</TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>; }

