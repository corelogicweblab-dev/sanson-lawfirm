import { Tabs } from "expo-router";
import { colors } from "@/theme/colors";
import { useAuth } from "@/lib/auth-context";

export default function TabsLayout() {
  const { user } = useAuth();
  const role = user?.role?.name || "CLIENT";

  const isClient = role === "CLIENT";
  const isLawyer = role === "LAWYER";
  const isParalegal = role === "PARALEGAL";
  const isAdmin = role === "ADMIN";

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#111", borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarLabel: "Home" }} />
      <Tabs.Screen name="ai" options={{ title: "AI", href: isClient ? undefined : null }} />
      <Tabs.Screen name="cases" options={{ title: "Cases" }} />
      <Tabs.Screen name="documents" options={{ title: "Docs", href: isAdmin ? null : undefined }} />
      <Tabs.Screen name="requests" options={{ title: "Requests", href: isClient ? undefined : null }} />
      <Tabs.Screen name="consultations" options={{ title: "Consults", href: isLawyer ? undefined : null }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks", href: isLawyer || isParalegal ? undefined : null }} />
      <Tabs.Screen name="users" options={{ title: "Admin", href: isAdmin ? undefined : null }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
