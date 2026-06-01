import { AuthProvider } from "@/components/providers/auth-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="relative flex min-h-[100dvh] flex-col">
        <MarketingHeader variant="auth" />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </AuthProvider>
  );
}
