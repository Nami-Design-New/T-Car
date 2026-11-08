import { useTranslations } from "next-intl";
import type { InsuranceOption } from "../model";

interface Props {
  option: InsuranceOption;
}

export default function InsuranceOptions({ option }: Props) {
  const t = useTranslations("carDetails.insurance");

  return (
    <section className="details-section border-stroke-light mt-8 border-t pt-6">
      <h3 className="text-text-primary mb-4.5 text-[1.15rem] font-bold">
        {t("title")}
      </h3>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3 rounded-md bg-white px-4 py-3.5">
          <div className="insurance-item-body flex flex-1 flex-col gap-2">
            <span className="insurance-item-title text-text-primary text-base font-bold">
              {option.title}
            </span>
            <span className="insurance-item-subtitle text-text-subtle text-sm leading-[1.7]">
              {option.description}
            </span>
            {option.percentage !== undefined && (
              <span className="text-action-primary mt-1 text-sm font-semibold">
                {option.percentage}%
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
