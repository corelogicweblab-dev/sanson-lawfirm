import { useState } from "react";
import { TextInput, Pressable, Text, StyleSheet } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";
import { colors } from "@/theme/colors";

const SUGGESTED = [
  "What documents do I need for labor cases?",
  "How do I request legal representation?",
  "Explain illegal dismissal in the Philippines",
];

export default function AiScreen() {
  const [message, setMessage] = useState("");

  return (
    <ScreenShell title="AI Legal Assistant">
      <Text style={styles.hint}>Continue your intake or ask a legal question.</Text>
      {SUGGESTED.map((q) => (
        <MobileCard key={q} title={q} onPress={() => setMessage(q)} />
      ))}
      <TextInput
        style={styles.input}
        multiline
        placeholder="Type your message…"
        placeholderTextColor={colors.muted}
        value={message}
        onChangeText={setMessage}
      />
      <Pressable style={styles.cta}>
        <Text style={styles.ctaText}>Request Representation</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    minHeight: 100,
    backgroundColor: colors.surface,
  },
  cta: {
    marginTop: 16,
    backgroundColor: colors.accentMuted,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  ctaText: { color: colors.accent, fontWeight: "600" },
});
