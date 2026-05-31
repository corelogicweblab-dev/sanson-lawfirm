"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { TaskItem } from "@sanson/types";

export default function ParalegalTasksPage(){ const [items,setItems]=useState<TaskItem[]>([]); useEffect(()=>{api.listTasks().then(r=>{if(r.success&&r.data)setItems(r.data);});},[]); return <AuthGuard allowedRoles={["PARALEGAL"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/paralegal"},{label:"Tasks"}]}><PageContainer><SectionHeader title="Assigned Tasks" description="Case preparation and coordination tasks" />{items.length===0?<EmptyState title="No tasks" description="No tasks assigned currently."/>:<Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead></TableRow></TableHeader><TableBody>{items.map(t=><TableRow key={t.id}><TableCell>{t.title}</TableCell><TableCell><Badge>{t.status}</Badge></TableCell><TableCell>{t.priority}</TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>; }

