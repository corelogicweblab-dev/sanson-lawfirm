import { Text, StyleSheet } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/theme/colors";

export default function DashboardScreen() {
  const { dashboard, user } = useAuth();
  const w = dashboard?.widgets;

  return (
    <ScreenShell title={`${user?.role?.display_name || "User"} Dashboard`}>
      {dashboard?.quickActions?.map((a) => (
        <MobileCard key={a.route} title={a.label} subtitle={a.route} />
      ))}
      {w?.pendingRequests !== undefined && (
        <MobileCard title="Pending Requests" subtitle={String(w.pendingRequests)} />
      )}
      {w?.urgentCases !== undefined && (
        <MobileCard title="Urgent Cases" subtitle={String(w.urgentCases)} />
      )}
      {w?.todaysConsultations !== undefined && (
        <MobileCard title="Today's Consultations" subtitle={String(w.todaysConsultations)} />
      )}
      {w?.assignedTasks !== undefined && (
        <MobileCard title="Assigned Tasks" subtitle={String(w.assignedTasks)} />
      )}
      {w?.activeCases?.map((c) => (
        <MobileCard key={c.id} title={c.title} subtitle="Active case" />
      ))}
      {w?.recentNotifications?.map((n) => (
        <MobileCard key={n.id} title={n.title} subtitle={n.body} />
      ))}
      {!dashboard && <Text style={styles.muted}>Loading dashboard…</Text>}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
});
