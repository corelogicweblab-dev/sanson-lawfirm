"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { TaskItem } from "@sanson/types";

export default function LawyerTasksPage(){ const [items,setItems]=useState<TaskItem[]>([]); useEffect(()=>{api.listTasks().then(r=>{if(r.success&&r.data)setItems(r.data);});},[]); return <AuthGuard allowedRoles={["LAWYER"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/lawyer"},{label:"Tasks"}]}><PageContainer><SectionHeader title="My Tasks" description="Track pending legal operations tasks" />{items.length===0?<EmptyState title="No tasks" description="No tasks assigned right now."/>:<Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Due</TableHead></TableRow></TableHeader><TableBody>{items.map(t=><TableRow key={t.id}><TableCell>{t.title}</TableCell><TableCell><Badge>{t.status}</Badge></TableCell><TableCell>{t.priority}</TableCell><TableCell>{t.due_date ?? "-"}</TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>; }

