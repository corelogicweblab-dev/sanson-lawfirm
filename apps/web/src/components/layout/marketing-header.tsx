"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@sanson/ui";
import { PrintButton } from "@/components/print/print-button";
import { AppHeaderBrand } from "@/components/layout/app-header-brand";
import { cn } from "@/lib/utils";
import { LANDING_PATH } from "@/lib/logout";

type MarketingHeaderProps = {
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
        "sanson-glass-header sanson-dashboard-topbar sanson-no-print safe-top sticky top-0 z-30 mx-0 mt-0 w-full rounded-none border-x-0",
        scrolled && "shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6 sm:py-3">
        <AppHeaderBrand onNavigate={() => setMenuOpen(false)} />

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
          {variant === "landing" && (
            <Link href="/register" className="ml-1">
              <Button size="sm" className="gap-1.5">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {variant === "landing" && (
            <Link href="/register" className="shrink-0">
              <Button size="sm" className="px-3 text-xs sm:text-sm">
                Start
              </Button>
            </Link>
          )}
          <button
            type="button"
            className="sanson-topbar-icon-btn rounded-xl p-2.5"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-50 border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <PrintButton showLabel size="sm" variant="outline" className="mt-1 w-full !flex" />
              {variant === "landing" && (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full gap-2">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
