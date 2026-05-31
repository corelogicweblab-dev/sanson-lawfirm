import { useEffect, useState } from "react";
import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";
import { api } from "@/lib/api";

export default function ConsultationsScreen() {
  const [items, setItems] = useState<unknown[]>([]);

  useEffect(() => {
    api.listAppointments().then((r) => r.success && Array.isArray(r.data) && setItems(r.data));
  }, []);

  return (
    <ScreenShell title="Consultation Queue">
      {items.map((a, i) => (
        <MobileCard key={i} title="Consultation" subtitle={JSON.stringify(a).slice(0, 80)} />
      ))}
    </ScreenShell>
  );
}
