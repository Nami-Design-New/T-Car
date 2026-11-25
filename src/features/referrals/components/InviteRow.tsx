import { cn } from "@/shared/lib/cn";
import { useFormatter, useTranslations } from "next-intl";
import { ReferralInvite, referralInviteStatus } from "../model";
import Cell from "./Cell";

const DATE_FORMAT = {
  day: "numeric",
  month: "long",
  year: "numeric",
  numberingSystem: "latn",
} as const;

export default function InviteRow({ invite }: { invite: ReferralInvite }) {
  const t = useTranslations("account.referrals.history");
  const format = useFormatter();
  const status = referralInviteStatus(invite);
  const date = (value: string) =>
    format.dateTime(new Date(value.replace(" ", "T")), DATE_FORMAT);

  return (
    <li className="bg-surface-elevated p-ds-5 flex flex-col gap-y-1.5 rounded-lg">
      <p className="text-sm font-semibold">{invite.friendName}</p>
      <Cell label={t("columns.joinedAt")}>{date(invite.joinedAt)}</Cell>
      <Cell label={t("columns.firstBookingAt")}>
        {invite.firstBookingAt ? date(invite.firstBookingAt) : t("pending")}
      </Cell>
      <span className="max-md:col-span-2">
        {status === "rewarded" && invite.rewardPoints !== null && (
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-sm font-semibold",
              "bg-success-100 text-success-700",
            )}
          >
            {t("rewarded", { points: invite.rewardPoints })}
          </span>
        )}
      </span>
    </li>
  );
}
