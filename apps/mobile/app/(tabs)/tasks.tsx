import { useEffect, useState } from "react";
import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";
import { api } from "@/lib/api";

export default function TasksScreen() {
  const [items, setItems] = useState<unknown[]>([]);

  useEffect(() => {
    api.listTasks().then((r) => r.success && Array.isArray(r.data) && setItems(r.data));
  }, []);

  return (
    <ScreenShell title="Tasks">
      {items.map((t, i) => (
        <MobileCard key={i} title="Task" subtitle={JSON.stringify(t).slice(0, 60)} />
      ))}
    </ScreenShell>
  );
}
