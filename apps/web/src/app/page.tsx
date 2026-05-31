"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, MessageSquare, Shield, Zap, Menu, X } from "lucide-react";
import { Button, PoweredByCoreLogic } from "@sanson/ui";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-x-hidden">
      <nav className="sanson-glass-header safe-top relative z-20 mx-3 mt-3 flex items-center justify-between rounded-2xl px-4 py-4 sm:mx-6 sm:px-8 sm:py-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400 sm:h-10 sm:w-10">
            <Scale className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-base font-bold sm:text-lg">SANSON Legal OS</span>
            <PoweredByCoreLogic className="mt-0.5" />
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 sm:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-6 w-6 text-zinc-300" /> : <Menu className="h-6 w-6 text-zinc-300" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="sanson-glass relative z-20 mx-3 mt-2 px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-2">
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              <Button variant="secondary" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)}>
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-12 text-center sm:px-8 sm:py-24">
        <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1.5 text-xs text-pink-400 sm:mb-6 sm:px-4 sm:text-sm">
          <Zap className="h-4 w-4 shrink-0" />
          <span className="truncate">AI-Powered Legal Operating System</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight sm:mb-6 sm:text-5xl md:text-7xl">
          Your Legal Concern,{" "}
          <span className="neon-text bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
            Intelligently Handled
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-base text-[var(--muted)] sm:mb-10 sm:text-lg">
          Start with our free AI legal intake assistant. Get your case organized, summarized,
          and qualified — before you formally proceed with legal services.
        </p>
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              Start Free AI Consultation
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Sign In to Portal
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:mt-24 sm:gap-6 md:grid-cols-3">
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
            <div key={feature.title} className="glass-card p-5 text-left sm:p-6">
              <feature.icon className="mb-3 h-7 w-7 text-pink-400 sm:mb-4 sm:h-8 sm:w-8" />
              <h3 className="mb-2 text-base font-semibold sm:text-lg">{feature.title}</h3>
              <p className="text-sm text-[var(--muted)]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="safe-bottom relative z-10 border-t border-white/10 py-6 text-center">
        <PoweredByCoreLogic />
      </footer>
    </div>
  );
}
