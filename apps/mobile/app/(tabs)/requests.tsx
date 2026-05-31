import { ScreenShell } from "@/components/ScreenShell";
import { MobileCard } from "@/components/MobileCard";

export default function RequestsScreen() {
  return (
    <ScreenShell title="Representation Requests">
      <MobileCard title="New request" subtitle="Submit via AI assistant or web portal" />
      <MobileCard title="Pending" subtitle="Track status in real time" />
    </ScreenShell>
  );
}
