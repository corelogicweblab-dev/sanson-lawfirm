import { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";
import { api } from "@/lib/api";
import { colors } from "@/theme/colors";

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<Array<{ id?: string; file_name?: string }>>([]);

  useEffect(() => {
    api.listDocuments().then((r) => {
      if (r.success && Array.isArray(r.data)) setDocs(r.data as typeof docs);
    });
  }, []);

  return (
    <ScreenShell title="Documents & Evidence">
      <Text style={styles.hint}>Viewer + upload uses presigned URLs (Phase 4 API).</Text>
      {docs.map((d, i) => (
        <MobileCard key={d.id || i} title={d.file_name || "Document"} subtitle="Tap to open in web viewer" />
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, marginBottom: 12, fontSize: 12 },
});
