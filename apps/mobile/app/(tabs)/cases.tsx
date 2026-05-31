import { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";
import { api } from "@/lib/api";
import { colors } from "@/theme/colors";

export default function CasesScreen() {
  const [cases, setCases] = useState<Array<{ id?: string; title?: string; case_number?: string }>>([]);

  useEffect(() => {
    api.listCases().then((r) => {
      if (r.success && Array.isArray(r.data)) setCases(r.data as typeof cases);
    });
  }, []);

  return (
    <ScreenShell title="Cases">
      {cases.map((c, i) => (
        <MobileCard key={c.id || i} title={c.title || "Case"} subtitle={c.case_number} />
      ))}
      {cases.length === 0 && <Text style={styles.muted}>No cases</Text>}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({ muted: { color: colors.muted } });
