import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { POWERED_BY } from "@sanson/shared";

export function ScreenShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.powered}>Powered By: {POWERED_BY}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 100 },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
  powered: { color: colors.accent, fontSize: 11, marginBottom: 16, marginTop: 4 },
});
