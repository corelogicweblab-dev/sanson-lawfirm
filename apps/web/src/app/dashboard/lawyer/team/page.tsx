"use client";

import Link from "next/link";
import { Button } from "@sanson/ui";
import { LawyerCenterPage } from "@/components/lawyer/lawyer-center-page";

export default function LawyerTeamPage() {
  return (
    <LawyerCenterPage
      title="Team collaboration center"
      breadcrumb="Team"
      description="Monitor paralegal activity — uploads, timelines, calendar, tasks, and internal comments."
      features={[
        "Recent paralegal uploads and timeline updates",
        "Calendar and task completion visibility",
        "Comments, mentions, and assignments (roadmap)",
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/paralegal/documents" className="sanson-action-tile !flex-row">
          Paralegal document center
        </Link>
        <Link href="/dashboard/lawyer/tasks" className="sanson-action-tile !flex-row">
          Task management
        </Link>
      </div>
      <p className="mt-4 text-sm text-zinc-400">
        Lawyers supervise; paralegals execute file operations per firm policy.
      </p>
      <Link href="/dashboard/paralegal">
        <Button variant="outline" className="mt-2">
          View paralegal operations
        </Button>
      </Link>
    </LawyerCenterPage>
  );
}
