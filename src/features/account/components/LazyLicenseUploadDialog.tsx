"use client";

import dynamic from "next/dynamic";

const LicenseUploadDialog = dynamic(() => import("./LicenseUploadDialog"), {
  ssr: false,
});

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: (licenseUrl: string) => void;
}

/** Keeps the license upload dialog out of the car page bundle until it opens. */
export default function LazyLicenseUploadDialog(props: Props) {
  return <LicenseUploadDialog {...props} />;
}
