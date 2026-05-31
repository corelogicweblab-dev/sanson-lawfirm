import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PageTransition } from "@/components/motion/page-transition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <PageTransition>{children}</PageTransition>
      </AuthGuard>
    </AuthProvider>
  );
}

