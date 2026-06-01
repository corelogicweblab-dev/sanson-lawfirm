"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, Menu, X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@sanson/ui";
import { PrintButton } from "@/components/print/print-button";
import { cn } from "@/lib/utils";
import { LANDING_PATH } from "@/lib/logout";

type MarketingHeaderProps = {
  /** Show compact variant on auth pages */
  variant?: "landing" | "auth";
};

export function MarketingHeader({ variant = "landing" }: MarketingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navLinks =
    variant === "landing"
      ? [
          { href: "#features", label: "Features" },
          { href: "/login", label: "Sign In" },
        ]
      : [{ href: LANDING_PATH, label: "Home" }];

  return (
    <header
      className={cn(
        "sanson-site-header sanson-no-print safe-top sticky top-0 z-30 w-full transition-shadow duration-300",
        scrolled && "sanson-site-header-scrolled"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="sanson-site-header-brand group flex min-w-0 items-center gap-2.5 sm:gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <div className="sanson-site-header-logo flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11">
            <Scale className="h-5 w-5 text-white sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold tracking-tight text-white sm:text-base">
              SANSON Legal OS
            </span>
            <span className="hidden items-center gap-1 text-[11px] text-zinc-300 sm:flex">
              <Sparkles className="h-3 w-3 shrink-0 text-pink-300" />
              AI-Powered Legal Platform
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <PrintButton className="!h-9 !w-9" />
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/register" className="ml-1">
            <Button size="sm" className="gap-1.5 shadow-[0_0_20px_rgba(255,79,163,0.35)]">
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link href="/register" className="shrink-0">
            <Button size="sm" className="px-3 text-xs sm:text-sm">
              Start
            </Button>
          </Link>
          <button
            type="button"
            className="sanson-site-header-menu-btn rounded-xl p-2.5"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="sanson-site-header-drawer relative z-50 border-t border-white/10 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <PrintButton showLabel size="sm" variant="outline" className="mt-1 w-full !flex" />
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="secondary" className="w-full">
                  Sign In to Portal
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button className="w-full gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
