import { View, Text, StyleSheet, Pressable, type ViewProps } from "react-native";
import { colors } from "@/theme/colors";

export function MobileCard({
  title,
  subtitle,
  onPress,
  children,
}: {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const inner = (
    <>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </>
  );
  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.card}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: "600" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
