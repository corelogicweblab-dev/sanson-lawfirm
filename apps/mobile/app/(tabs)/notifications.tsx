import { useEffect, useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";
import { api } from "@/lib/api";
import type { MobileNotification } from "@sanson/types";
import { colors } from "@/theme/colors";

export default function NotificationsScreen() {
  const [items, setItems] = useState<MobileNotification[]>([]);

  useEffect(() => {
    api.listNotifications().then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  return (
    <ScreenShell title="Notification Center">
      {items.map((n) => (
        <Pressable
          key={n.id}
          onPress={() => api.markNotificationRead(n.id).then(() => setItems((prev) => prev.filter((x) => x.id !== n.id)))}
        >
          <MobileCard
            title={n.title}
            subtitle={n.body}
          />
          {!n.isRead && <Text style={styles.unread}>New</Text>}
        </Pressable>
      ))}
      {items.length === 0 && <Text style={styles.muted}>No notifications</Text>}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  unread: { color: colors.accent, fontSize: 11, marginTop: -8, marginBottom: 8 },
  muted: { color: colors.muted },
});
