"use client";

import { lazy, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useMotion } from "@/components/providers/motion-provider";
import { motionEnter } from "@sanson/ui";

const MotionInner = lazy(() =>
  import("./page-transition-inner").then((m) => ({ default: m.PageTransitionInner }))
);

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const { enablePageMotion } = useMotion();

  if (!enablePageMotion) {
    return <div className={motionEnter()}>{children}</div>;
  }

  return (
    <Suspense fallback={<div className={motionEnter()}>{children}</div>}>
      <MotionInner key={pathname}>{children}</MotionInner>
    </Suspense>
  );
}
