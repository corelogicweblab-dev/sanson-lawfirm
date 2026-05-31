"use client";

import Link from "next/link";
import { Scale, MessageSquare, Shield, Zap } from "lucide-react";
import { Button, PoweredByCoreLogic } from "@sanson/ui";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-pink-600/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-pink-500/5 blur-3xl" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold">SANSON Legal OS</span>
            <PoweredByCoreLogic className="mt-0.5" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-8 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-sm text-pink-400">
          <Zap className="h-4 w-4" />
          AI-Powered Legal Operating System
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Your Legal Concern,{" "}
          <span className="neon-text bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
            Intelligently Handled
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--muted)]">
          Start with our free AI legal intake assistant. Get your case organized, summarized,
          and qualified — before you formally proceed with legal services.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg">Start Free AI Consultation</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Sign In to Portal
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: MessageSquare,
              title: "AI Legal Intake",
              desc: "Conversational AI gathers your concern, classifies your case, and creates a structured summary.",
            },
            {
              icon: Shield,
              title: "Enterprise Security",
              desc: "Firebase authentication, RBAC, audit logging, and encrypted document storage.",
            },
            {
              icon: Scale,
              title: "Qualified Case Handoff",
              desc: "Lawyers receive only structured, qualified cases when you formally proceed.",
            },
          ].map((feature) => (
            <div key={feature.title} className="glass-card p-6 text-left">
              <feature.icon className="mb-4 h-8 w-8 text-pink-400" />
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-[var(--muted)]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center">
        <PoweredByCoreLogic />
      </footer>
    </div>
  );
}
