import { cn } from "../lib/cn";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
