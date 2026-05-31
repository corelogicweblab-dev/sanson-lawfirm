import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";
import { useAuth } from "@/lib/auth-context";

export default function UsersScreen() {
  const { dashboard } = useAuth();
  return (
    <ScreenShell title="Admin Overview">
      <MobileCard title="Total Users" subtitle={String(dashboard?.widgets?.totalUsers ?? "—")} />
      <MobileCard title="Case Monitoring" subtitle="Open web admin for full controls" />
      <MobileCard title="Analytics" subtitle="Search & system metrics on web" />
    </ScreenShell>
  );
}
