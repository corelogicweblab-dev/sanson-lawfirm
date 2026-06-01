"use client";

import Link from "next/link";
import { Button } from "@sanson/ui";
import { LawyerCenterPage } from "@/components/lawyer/lawyer-center-page";

export default function LawyerCalendarPage() {
  return (
    <LawyerCenterPage
      title="Legal calendar command center"
      breadcrumb="Calendar"
      description="Day, week, month, and agenda views for hearings, deadlines, consultations, and court appearances."
      features={[
        "Hearings, consultations, appointments, filing deadlines",
        "Drag-and-drop scheduling (roadmap)",
        "Deadline reminders and realtime updates",
        "Calendar sync (roadmap)",
      ]}
    >
      <div className="sanson-panel p-5">
        <p className="mb-4 text-sm text-zinc-300">
          Use paralegal calendar for firm scheduling today. Lawyer calendar views with hearing
          filters are on the roadmap.
        </p>
        <Link href="/dashboard/paralegal/calendar">
          <Button variant="outline">View firm calendar (paralegal)</Button>
        </Link>
      </div>
    </LawyerCenterPage>
  );
}
