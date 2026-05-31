import { cn } from "../lib/cn";
import { motionEnter } from "../motion/classes";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function PageContainer({ children, className, animate = true }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8", animate && motionEnter(), className)}>
      {children}
    </div>
  );
}
