import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { StateCard } from "@/shared/ui/StateCard";
import {
  referralCounts,
  referralInviteStatus,
  type ReferralHistory,
  type ReferralInvite,
} from "../model";

interface Props {
  history: ReferralHistory;
}

const DATE_FORMAT = {
  day: "numeric",
  month: "long",
  year: "numeric",
  numberingSystem: "latn",
} as const;

/** "My invites": points earned from invites and each friend's progress. */
export default function ReferralHistoryPage({ history }: Props) {
  const t = useTranslations("account.referrals.history");
  const counts = referralCounts(history.invites);

  return (
    <section className="flex flex-col gap-6">
      <h2 className="m-0 text-xl font-bold">{t("title")}</h2>

      {history.invites.length === 0 ? (
        <StateCard
          icon="gift"
          headingLevel={3}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button asChild>
              <Link href="/account/referrals">{t("inviteAction")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="border-stroke-light flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-[linear-gradient(214deg,#f6faff_0%,#eff6fe_100%)] p-6 max-md:p-5">
            <div className="flex flex-col gap-1">
              <span className="text-text-subtle text-sm">
                {t("totalLabel")}
              </span>
              <strong className="text-action-primary text-[clamp(1.75rem,4vw,2.25rem)] leading-tight font-bold">
                {t("points", { points: history.totalPoints })}
              </strong>
              <span className="text-text-subtle text-sm">
                {t("counts", counts)}
              </span>
            </div>
            <Button asChild variant="outline" className="max-md:w-full">
              <Link href="/account/points">{t("pointsHistory")}</Link>
            </Button>
          </div>

          <div className="border-stroke-light bg-surface-elevated rounded-xl border">
            <h3 className="m-0 px-6 pt-5 pb-3 text-lg font-bold max-md:px-5">
              {t("latest")}
            </h3>
            {/* One list for every width: columns with a header row on desktop, labelled cards on mobile. */}
            <div
              className="text-text-subtle border-stroke-light hidden grid-cols-4 gap-4 border-b px-6 pb-3 text-sm font-semibold md:grid"
              aria-hidden="true"
            >
              <span>{t("columns.friend")}</span>
              <span>{t("columns.joinedAt")}</span>
              <span>{t("columns.firstBookingAt")}</span>
              <span>{t("columns.reward")}</span>
            </div>
            <ul className="m-0 list-none p-0">
              {history.invites.map((invite) => (
                <InviteRow key={invite.id} invite={invite} />
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

function InviteRow({ invite }: { invite: ReferralInvite }) {
  const t = useTranslations("account.referrals.history");
  const format = useFormatter();
  const status = referralInviteStatus(invite);
  const date = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT);

  return (
    <li className="border-stroke-light grid items-center gap-x-4 gap-y-2 border-b px-6 py-4 last:border-b-0 max-md:grid-cols-2 max-md:px-5 md:grid-cols-4">
      <strong className="text-base max-md:col-span-2">
        {invite.friendName}
      </strong>
      <Cell label={t("columns.joinedAt")}>{date(invite.joinedAt)}</Cell>
      <Cell label={t("columns.firstBookingAt")}>
        {invite.firstBookingAt ? date(invite.firstBookingAt) : "—"}
      </Cell>
      <span className="max-md:col-span-2">
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-sm font-semibold",
            status === "rewarded"
              ? "bg-success-100 text-success-700"
              : "text-text-subtle bg-neutral-100",
          )}
        >
          {status === "rewarded"
            ? t("rewarded", { points: invite.rewardPoints ?? 0 })
            : t("pending")}
        </span>
      </span>
    </li>
  );
}

function Cell({ label, children }: { label: string; children: string }) {
  return (
    <span className="flex flex-col gap-0.5 text-sm">
      {/* Shown on mobile; on desktop the header row names the column. */}
      <span className="text-text-subtle text-xs md:sr-only">{label}</span>
      <span>{children}</span>
    </span>
  );
}
