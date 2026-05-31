"use client";
import { useState } from "react";
import { PageContainer, SectionHeader, Card, CardContent, Input, Button } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";

export default function RequestRepresentationPage() {
  const [subject,setSubject]=useState(""); const [description,setDescription]=useState(""); const [category,setCategory]=useState("CIVIL"); const [priority,setPriority]=useState("MEDIUM"); const [message,setMessage]=useState("");
  const submit = async (e: React.FormEvent)=>{ e.preventDefault(); const res=await api.createRequest({case_category:category,subject,description,priority}); setMessage(res.message); if(res.success){setSubject("");setDescription("");} };
  return <AuthGuard allowedRoles={["CLIENT"]}><DashboardShell breadcrumbs={[{label:"Dashboard",href:"/dashboard/client"},{label:"Request Representation"}]}><PageContainer><SectionHeader title="Request Legal Representation" description="Submit your legal concern for review and scheduling" /><Card><CardContent className="p-6"><form onSubmit={submit} className="space-y-4"><Input label="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} required /><div className="grid grid-cols-2 gap-3"><Input label="Case Category" value={category} onChange={(e)=>setCategory(e.target.value)} /><Input label="Priority" value={priority} onChange={(e)=>setPriority(e.target.value)} /></div><textarea className="w-full rounded-xl border sanson-panel p-3 text-sm" rows={6} placeholder="Describe your case..." value={description} onChange={(e)=>setDescription(e.target.value)} required /><Button type="submit">Submit Request</Button>{message && <p className="text-sm text-pink-400">{message}</p>}</form></CardContent></Card></PageContainer></DashboardShell></AuthGuard>;
}

