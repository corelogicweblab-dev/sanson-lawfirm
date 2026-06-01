"use client";

import { LawyerCenterPage } from "@/components/lawyer/lawyer-center-page";

export default function LawyerNotificationsPage() {
  return (
    <LawyerCenterPage
      title="Notification center"
      breadcrumb="Notifications"
      description="Realtime alerts for new cases, evidence, documents, hearings, deadlines, and approvals."
      features={[
        "New case and evidence uploads",
        "Document and approval requests",
        "Upcoming hearings and deadlines",
        "Appointment and AI analysis complete",
      ]}
    >
      <div className="sanson-panel p-5 text-sm text-zinc-300">
        Push notifications and in-app feed connect to Supabase realtime channels (configured in
        platform). Bell icon in header will surface unread items in a future release.
      </div>
    </LawyerCenterPage>
  );
}
