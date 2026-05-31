import { Pressable, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScreenShell title="Profile">
      <Text style={styles.label}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role?.display_name}</Text>
      <Text style={styles.note}>Biometric unlock ready (integrate expo-local-authentication)</Text>
      <Pressable
        style={styles.logout}
        onPress={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontSize: 16 },
  role: { color: colors.accent, marginBottom: 16 },
  note: { color: colors.muted, fontSize: 12, marginBottom: 24 },
  logout: { backgroundColor: colors.accentMuted, padding: 14, borderRadius: 12, alignItems: "center" },
  logoutText: { color: colors.accent, fontWeight: "600" },
});
