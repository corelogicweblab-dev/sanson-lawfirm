"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Shield, Scale, Zap } from "lucide-react";
import { Button } from "@sanson/ui";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function HomePage() {
  useEffect(() => {
    const el = document.querySelector("[data-print-title]");
    if (el) el.textContent = "SANSON Legal OS — Home";
  }, []);

  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-x-hidden">
      <MarketingHeader variant="landing" />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12 md:py-16">
        <div className="sanson-hero-panel text-center">
          <div className="sanson-marketing-badge mb-4 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:mb-6 sm:px-4 sm:text-sm">
            <Zap className="h-4 w-4 shrink-0" />
            <span className="truncate">AI-Powered Legal Operating System</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight sm:mb-6 sm:text-5xl md:text-6xl">
            Your Legal Concern,{" "}
            <span className="sanson-hero-accent block sm:inline">Intelligently Handled</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base sm:mb-10 sm:text-lg">
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
        </div>

        <div
          id="features"
          className="mt-12 scroll-mt-24 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-3"
        >
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
            <div key={feature.title} className="sanson-panel p-5 text-left sm:p-6">
              <feature.icon className="mb-3 h-7 w-7 text-pink-300 sm:mb-4 sm:h-8 sm:w-8" />
              <h3 className="mb-2 text-base font-semibold text-white sm:text-lg">{feature.title}</h3>
              <p className="text-sm text-zinc-200">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
