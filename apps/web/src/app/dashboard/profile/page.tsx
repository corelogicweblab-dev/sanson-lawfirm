"use client";

import { PageContainer, SectionHeader } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserProfileSettings } from "@/components/profile/user-profile-settings";

export default function ProfilePage() {
  return (
    <DashboardShell
      title="My Profile"
      breadcrumbs={[{ label: "My Profile" }]}
    >
      <PageContainer>
        <SectionHeader
          title="My Profile"
          description="Update your photo, personal details, email, and password. Changes apply to your SANSON Legal OS account."
        />
        <UserProfileSettings />
      </PageContainer>
    </DashboardShell>
  );
}
