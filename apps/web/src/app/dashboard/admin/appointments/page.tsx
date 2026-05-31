"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { Appointment } from "@sanson/types";

export default function AdminAppointmentsPage(){ const [items,setItems]=useState<Appointment[]>([]); useEffect(()=>{api.listAppointments().then(r=>{if(r.success&&r.data)setItems(r.data);});},[]); return <AuthGuard allowedRoles={["ADMIN"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/admin"},{label:"Appointment Management"}]}><PageContainer><SectionHeader title="Appointment Management" description="Track and update consultation schedules" />{items.length===0?<EmptyState title="No appointments" description="No consultations scheduled yet."/>:<Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{items.map(a=><TableRow key={a.id}><TableCell>{a.appointment_date}</TableCell><TableCell>{a.appointment_time}</TableCell><TableCell>{a.consultation_type}</TableCell><TableCell><Badge>{a.status}</Badge></TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>; }

