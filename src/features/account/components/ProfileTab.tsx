"use client";

import { useState } from "react";
import type { UserProfile } from "../model";
import type { PendingAction } from "./ProfileFlowProps";
import ProfileDetailsSection from "./ProfileDetailsSection";
import PhoneSection from "./PhoneSection";
import LicenseSection from "./LicenseSection";
import DeleteAccountSection from "./DeleteAccountSection";

interface Props {
  profile: UserProfile;
}

export default function ProfileTab({ profile }: Props) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const flow = { pendingAction, setPendingAction };

  return (
    <div className="border-stroke-light bg-surface-elevated flex w-full flex-col rounded-xl border p-6 max-md:p-4">
      <ProfileDetailsSection profile={profile} {...flow}>
        <div className="flex flex-col gap-5">
          <PhoneSection initialPhone={profile.phone} {...flow} />
          <LicenseSection
            initialLicenseUploaded={profile.licenseUploaded}
            initialLicenseUrl={profile.licenseUrl}
            {...flow}
          />
          <DeleteAccountSection {...flow} />
        </div>
      </ProfileDetailsSection>
    </div>
  );
}
