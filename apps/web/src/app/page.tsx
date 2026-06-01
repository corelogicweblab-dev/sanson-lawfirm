"use client";

import Image from "next/image";
import Link from "next/link";
import { Globe, HeartHandshake, Lock, Zap } from "lucide-react";
import { Button } from "@sanson/ui";
import { MarketingHeader } from "@/components/layout/marketing-header";

const LANDING_FEATURES = [
  {
    icon: Globe,
    title: "Speak in Your Language",
    desc: "Share your concern in English, Filipino, Cebuano, or mixed language. The assistant listens and replies in the same voice—no need to translate yourself.",
    highlight: "Free AI intake · No obligation",
  },
  {
    icon: Lock,
    title: "Your Story Stays Private",
    desc: "What you share is kept confidential within the firm. Secure sign-in and controlled access mean only your legal team reviews your intake and files.",
    highlight: "Confidential · Firm-controlled access",
  },
  {
    icon: HeartHandshake,
    title: "Attorney-Ready Handoff",
    desc: "When you choose to move forward, attorneys receive a clear summary of your situation—so you spend less time repeating details and more time getting answers.",
    highlight: "Structured summary · Faster review",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-x-hidden">
      <MarketingHeader variant="landing" />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12 md:py-16">
        <div className="sanson-hero-panel sanson-hero-split">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
            <div className="order-2 text-center lg:order-1 lg:text-left">
              <div className="sanson-marketing-badge mb-4 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:mb-6 sm:px-4 sm:text-sm">
                <Zap className="h-4 w-4 shrink-0" />
                <span className="truncate">AI-Powered Legal Operating System</span>
              </div>
              <h1 className="mb-4 text-3xl font-bold leading-[1.15] tracking-tight sm:mb-5 sm:text-4xl md:text-5xl lg:text-[2.75rem]">
                Your Legal Concern,{" "}
                <span className="sanson-hero-accent block lg:inline">Intelligently Handled</span>
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-zinc-300 sm:mb-9 sm:text-lg lg:mx-0">
                Start with our free AI legal intake assistant. Get your case organized, summarized,
                and qualified — before you formally proceed with legal services.
              </p>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full shadow-lg shadow-pink-500/20 sm:w-auto">
                    Start Free AI Consultation
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Sign In to Portal
                  </Button>
                </Link>
              </div>
              <p className="mt-6 hidden text-xs tracking-wide text-zinc-500 lg:block">
                Confidential intake · Multilingual AI · Secure document handling
              </p>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mx-auto w-full max-w-md lg:max-w-none">
                <div className="sanson-hero-portrait aspect-[4/5] max-h-[min(70vh,520px)] sm:aspect-[3/4] lg:max-h-[480px]">
                  <Image
                    src="/attybelle.png"
                    alt="Attorney representing SANSON Law Firm"
                    width={640}
                    height={800}
                    priority
                    className="h-full min-h-[280px] w-full object-cover object-[center_12%]"
                  />
                </div>
                <div className="mt-4 border-t border-white/10 pt-4 text-center lg:text-left">
                  <p className="text-sm font-semibold tracking-wide text-white">Atty. Belle</p>
                  <p className="mt-0.5 text-xs text-zinc-400">SANSON Law Firm</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="mt-14 scroll-mt-24 sm:mt-20">
          <div className="mb-8 text-center sm:mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
              Why clients start here
            </p>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Clear path from concern to counsel
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              SANSON Legal OS helps you explain your situation once—then connects you with attorneys
              who already understand the essentials.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {LANDING_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="sanson-panel group flex flex-col p-5 text-left transition hover:border-pink-500/35 sm:p-6"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-pink-500/25 bg-pink-500/10 text-pink-300 transition group-hover:border-pink-400/40 group-hover:bg-pink-500/15">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white sm:text-lg">{feature.title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-zinc-300">{feature.desc}</p>
                <p className="mt-4 border-t border-white/10 pt-3 text-xs font-medium text-pink-200/90">
                  {feature.highlight}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 shadow-lg shadow-pink-500/15">
                Begin your free intake
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
