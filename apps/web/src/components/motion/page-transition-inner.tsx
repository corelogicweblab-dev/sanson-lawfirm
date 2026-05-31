"use client";

import { motion } from "framer-motion";
import { MOTION_DURATION } from "@sanson/ui";

const transition = {
  duration: MOTION_DURATION.fast / 1000,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

export function PageTransitionInner({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
