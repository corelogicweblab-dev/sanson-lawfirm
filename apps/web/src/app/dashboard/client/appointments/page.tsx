"use client";
import { useEffect, useState } from "react";
import { PageContainer, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Badge } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { Appointment } from "@sanson/types";

export default function ClientAppointmentsPage(){ const [items,setItems]=useState<Appointment[]>([]); useEffect(()=>{api.listAppointments().then(r=>{if(r.success&&r.data)setItems(r.data);});},[]); return <AuthGuard allowedRoles={["CLIENT"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/client"},{label:"Appointment History"}]}><PageContainer><SectionHeader title="Appointment History" description="Consultation appointments related to your requests" />{items.length===0?<EmptyState title="No appointments" description="Appointments will appear after scheduling."/>:<Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{items.map(a=><TableRow key={a.id}><TableCell>{a.appointment_date}</TableCell><TableCell>{a.appointment_time}</TableCell><TableCell>{a.consultation_type}</TableCell><TableCell><Badge>{a.status}</Badge></TableCell></TableRow>)}</TableBody></Table>}</PageContainer></DashboardShell></AuthGuard>; }

